import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { google } from 'googleapis';

import { query } from '../db/index.js';


const CREDENTIALS_PATH = path.join(
    process.cwd(),
    'credentials',
    'google-oauth.json'
);


const SCOPES = [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/spreadsheets'
];


async function loadCredentials() {
    let credentials;
    if (process.env.GOOGLE_OAUTH_JSON) {
        credentials = JSON.parse(
            process.env.GOOGLE_OAUTH_JSON
        );
    } else {
        try {
            await fs.access(CREDENTIALS_PATH);
        } catch {
            throw new Error(
                'Không tìm thấy credentials/google-oauth.json'
            );
        }

        credentials = JSON.parse(
            await fs.readFile(
                CREDENTIALS_PATH,
                'utf8'
            )
        );
    }

    if (!credentials.web) {
        throw new Error(
            'google-oauth.json không chứa cấu hình web OAuth.'
        );
    }

    return credentials.web;
}


export async function createOAuthClient() {

    const credentials =
        await loadCredentials();

    return new google.auth.OAuth2(
        credentials.client_id,
        credentials.client_secret,
        process.env.GOOGLE_OAUTH_REDIRECT_URI
    );
}


export async function getGoogleAuthorizationUrl(req) {

    const oauth2Client =
        await createOAuthClient();

    const state = crypto
        .randomBytes(32)
        .toString('hex');

    req.session.googleOAuthState = state;

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: SCOPES,
        include_granted_scopes: true,
        state
    });
}


export async function handleGoogleCallback(req) {

    const { code, state } = req.query;

    if (!code) {
        throw new Error(
            'Google không trả về authorization code.'
        );
    }

    if (
        !state ||
        state !== req.session.googleOAuthState
    ) {
        throw new Error(
            'OAuth state không hợp lệ.'
        );
    }

    const oauth2Client =
        await createOAuthClient();

    const { tokens } =
        await oauth2Client.getToken(code);

    oauth2Client.setCredentials(tokens);


    /*
     * Lấy thông tin Google account
     */
    const oauth2 =
        google.oauth2({
            version: 'v2',
            auth: oauth2Client
        });

    const { data: googleUser } =
        await oauth2.userinfo.get();


    if (!googleUser.id) {
        throw new Error(
            'Không lấy được Google user ID.'
        );
    }

    if (!googleUser.email) {
        throw new Error(
            'Không lấy được email Google.'
        );
    }


    /*
     * Tạo hoặc lấy application user
     */
    const userResult =
        await query(
            `
            INSERT INTO users (
                email,
                name
            )
            VALUES ($1, $2)

            ON CONFLICT (email)
            DO UPDATE SET
                name = EXCLUDED.name,
                updated_at = NOW()

            RETURNING id
            `,
            [
                googleUser.email,
                googleUser.name || ''
            ]
        );


    const userId =
        userResult.rows[0].id;


    /*
     * Lưu Google OAuth token
     */
    await query(
        `
        INSERT INTO google_accounts (
            user_id,
            google_user_id,
            google_email,
            access_token,
            refresh_token,
            token_type,
            scope,
            expiry_date
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8
        )

        ON CONFLICT (user_id)
        DO UPDATE SET

            google_user_id =
                EXCLUDED.google_user_id,

            google_email =
                EXCLUDED.google_email,

            access_token =
                EXCLUDED.access_token,

            refresh_token =
                COALESCE(
                    EXCLUDED.refresh_token,
                    google_accounts.refresh_token
                ),

            token_type =
                EXCLUDED.token_type,

            scope =
                EXCLUDED.scope,

            expiry_date =
                EXCLUDED.expiry_date,

            updated_at =
                NOW()
        `,
        [
            userId,
            googleUser.id,
            googleUser.email,
            tokens.access_token || null,
            tokens.refresh_token || null,
            tokens.token_type || null,
            tokens.scope || null,
            tokens.expiry_date || null
        ]
    );


    /*
     * Lưu application user vào session
     */
    req.session.userId =
        Number(userId);


    /*
     * OAuth state chỉ dùng một lần
     */
    delete req.session.googleOAuthState;


    return {
        userId: Number(userId),
        googleUserId: googleUser.id,
        email: googleUser.email,
        name: googleUser.name || ''
    };
}


export async function getAuthenticatedClient(
    userId
) {

    if (!userId) {
        throw new Error(
            'Chưa đăng nhập.'
        );
    }


    const result =
        await query(
            `
            SELECT
                access_token,
                refresh_token,
                token_type,
                scope,
                expiry_date
            FROM google_accounts
            WHERE user_id = $1
            `,
            [userId]
        );


    if (result.rows.length === 0) {
        throw new Error(
            'Tài khoản Google chưa được kết nối.'
        );
    }


    const account =
        result.rows[0];


    const oauth2Client =
        await createOAuthClient();


    oauth2Client.setCredentials({
        access_token:
            account.access_token,

        refresh_token:
            account.refresh_token,

        token_type:
            account.token_type,

        scope:
            account.scope,

        expiry_date:
            account.expiry_date
    });


    /*
     * Google có thể cấp access token mới
     * khi refresh token hết hạn.
     *
     * Lưu token mới lại vào database.
     */
    oauth2Client.on(
        'tokens',
        async tokens => {

            try {

                await query(
                    `
                    UPDATE google_accounts

                    SET
                        access_token =
                            COALESCE(
                                $1,
                                access_token
                            ),

                        refresh_token =
                            COALESCE(
                                $2,
                                refresh_token
                            ),

                        token_type =
                            COALESCE(
                                $3,
                                token_type
                            ),

                        scope =
                            COALESCE(
                                $4,
                                scope
                            ),

                        expiry_date =
                            COALESCE(
                                $5,
                                expiry_date
                            ),

                        updated_at =
                            NOW()

                    WHERE user_id = $6
                    `,
                    [
                        tokens.access_token || null,
                        tokens.refresh_token || null,
                        tokens.token_type || null,
                        tokens.scope || null,
                        tokens.expiry_date || null,
                        userId
                    ]
                );

            } catch (error) {

                console.error(
                    'Không thể cập nhật Google token:',
                    error
                );
            }
        }
    );


    return oauth2Client;
}


function extractSpreadsheetId(
    spreadsheetUrl
) {

    try {

        const url =
            new URL(spreadsheetUrl);

        const match =
            url.pathname.match(
                /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
            );

        if (!match) {
            throw new Error(
                'URL Google Sheet không hợp lệ.'
            );
        }

        return match[1];

    } catch {

        throw new Error(
            'URL Google Sheet không hợp lệ.'
        );
    }
}


async function createSheetsClient(
    userId
) {

    const auth =
        await getAuthenticatedClient(
            userId
        );

    return google.sheets({
        version: 'v4',
        auth
    });
}


export async function validateGoogleSheet(
    userId,
    spreadsheetUrl
) {

    const spreadsheetId =
        extractSpreadsheetId(
            spreadsheetUrl
        );

    const sheets =
        await createSheetsClient(
            userId
        );


    try {

        const response =
            await sheets.spreadsheets.get({
                spreadsheetId,

                fields:
                    'spreadsheetId,properties.title'
            });


        return {
            valid: true,

            spreadsheetId,

            title:
                response.data
                    .properties?.title || ''
        };

    } catch (error) {

        if (error.code === 401) {

            throw new Error(
                'Google token không hợp lệ hoặc đã hết hạn. Hãy kết nối lại Google.'
            );
        }

        if (error.code === 403) {

            throw new Error(
                'Bạn không có quyền truy cập Google Sheet này.'
            );
        }

        if (error.code === 404) {

            throw new Error(
                'Không tìm thấy Google Sheet. Hãy kiểm tra lại URL.'
            );
        }

        throw new Error(
            'Không thể truy cập Google Sheet.'
        );
    }
}


// function createSheetTitle() {

//     const now =
//         new Date();

//     const pad =
//         value =>
//             String(value)
//                 .padStart(2, '0');

//     return [
//         now.getFullYear(),
//         pad(now.getMonth() + 1),
//         pad(now.getDate())
//     ].join('-') + '_' + [
//         pad(now.getHours()),
//         pad(now.getMinutes()),
//         pad(now.getSeconds())
//     ].join('-');
// }

function createSheetTitle() {
    const now = new Date();

    const formatter = new Intl.DateTimeFormat(
        'en-CA',
        {
            timeZone: 'Asia/Ho_Chi_Minh',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23'
        }
    );

    const parts = formatter.formatToParts(now);

    const values = Object.fromEntries(
        parts.map(part => [
            part.type,
            part.value
        ])
    );

    return `${values.year}-${values.month}-${values.day}_${values.hour}-${values.minute}-${values.second}`;
}


export async function writeCreatorsToGoogleSheet(
    userId,
    spreadsheetUrl,
    rows
) {

    const spreadsheetId =
        extractSpreadsheetId(
            spreadsheetUrl
        );


    const sheets =
        await createSheetsClient(
            userId
        );


    const sheetTitle =
        createSheetTitle();


    /*
     * 1. Tạo tab mới
     */
    const createResponse =
        await sheets.spreadsheets.batchUpdate({

            spreadsheetId,

            requestBody: {

                requests: [

                    {
                        addSheet: {

                            properties: {
                                title: sheetTitle
                            }

                        }
                    }

                ]

            }

        });


    const createdSheet =
        createResponse
            .data
            .replies?.[0]
            ?.addSheet;


    const sheetId =
        createdSheet
            ?.properties
            ?.sheetId;


    if (sheetId === undefined) {

        throw new Error(
            'Không thể tạo tab mới trong Google Sheet.'
        );
    }


    /*
     * 2. Ghi dữ liệu
     */
    await sheets.spreadsheets.values.update({

        spreadsheetId,

        range:
            `'${sheetTitle}'!A1`,

        valueInputOption:
            'USER_ENTERED',

        requestBody: {
            values: rows
        }

    });


    return {

        spreadsheetId,

        sheetId,

        sheetTitle,

        rowCount:
            rows.length
    };
}
