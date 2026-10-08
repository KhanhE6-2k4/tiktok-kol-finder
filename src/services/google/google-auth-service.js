import crypto from 'crypto';
import {
	google
} from 'googleapis';

import {
	createGoogleOAuthClient,
	getGoogleOAuthScopes,
} from '../../integrations/google/google-oauth-client.js';

import {
	query
} from '../../db/index.js';

export class GoogleAuthService {

	async createAuthorizationUrl(req) {
		const oauth2Client = await createGoogleOAuthClient();

		const state = crypto
			.randomBytes(32)
			.toString('hex');

		req.session.googleOAuthState = state;

		return oauth2Client.generateAuthUrl({
			access_type: 'offline',
			prompt: 'consent',
			scope: getGoogleOAuthScopes(),
			include_granted_scopes: true,
			state,
		});
	}

	async handleCallback(req) {
		const {
			code,
			state
		} = req.query;

		if (!code) {
			throw new Error('Google không trả về authorization code.');
		}

		if (!state || state !== req.session.googleOAuthState) {
			throw new Error('OAuth state không hợp lệ.');
		}

		const oauth2Client = await createGoogleOAuthClient();

		const {
			tokens
		} = await oauth2Client.getToken(code);

		oauth2Client.setCredentials(tokens);

		const oauth2 = google.oauth2({
			version: 'v2',
			auth: oauth2Client,
		});

		const {
			data: googleUser
		} = await oauth2.userinfo.get();

		if (!googleUser.id) {
			throw new Error('Không lấy được Google user ID.');
		}

		if (!googleUser.email) {
			throw new Error('Không lấy được email Google.');
		}

		const userResult = await query(
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
				googleUser.name || '',
			]
		);

		const userId =
			userResult.rows[0].id;

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
				tokens.expiry_date || null,
			]
		);

		req.session.userId = Number(userId);

		delete req.session.googleOAuthState;

		return {
			userId: Number(userId),
			googleUserId: googleUser.id,
			email: googleUser.email,
			name: googleUser.name || '',
		};
	}

	async getAuthenticatedClient(userId) {
		if (!userId) {
			throw new Error('Chưa đăng nhập.');
		}

		const result = await query(
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
			throw new Error('Tài khoản Google chưa được kết nối.');
		}

		const account = result.rows[0];

		const oauth2Client = await createGoogleOAuthClient();

		oauth2Client.setCredentials({
			access_token: account.access_token,
			refresh_token: account.refresh_token,
			token_type: account.token_type,
			scope: account.scope,
			expiry_date: account.expiry_date,
		});

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
							userId,
						]
					);
				} catch (error) {
					console.error('Không thể cập nhật Google token:', error);
				}
			}
		);

		return oauth2Client;
	}
}
