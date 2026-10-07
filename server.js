import 'dotenv/config';
import fs from 'fs/promises';
import express from 'express';
import path from 'path';

import { exportCreatorsCsv } from './src/export/export-creators-csv.js';

import { discoverTikTokVideos } from './src/discovery/tiktok-discovery.js';

import session from 'express-session';

import {
    getGoogleAuthorizationUrl,
    handleGoogleCallback,
    validateGoogleSheet,
    writeCreatorsToGoogleSheet
} from './src/integrations/google-sheets.js';

import { initializeDatabase } from './src/db/index.js';


const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

app.set('trust proxy', 1);

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        }
    })
);

// app.use(
//     session({
//         secret: process.env.SESSION_SECRET,
//         resave: false,
//         saveUninitialized: false,
//         cookie: {
//             httpOnly: true,
//             secure: false,
//             sameSite: 'lax'
//         }
//     })
// );

app.get(
    '/auth/google',
    async (req, res) => {

        try {

            const authorizationUrl =
                await getGoogleAuthorizationUrl(
                    req
                );

            res.redirect(
                authorizationUrl
            );

        } catch (error) {

            console.error(error);

            res.status(500).send(
                'Không thể bắt đầu đăng nhập Google.'
            );
        }
    }
);

app.get(
    '/auth/google/callback',
    async (req, res) => {
        try {
            await handleGoogleCallback(req);

            res.redirect(
                '/?googleAuth=success'
            );

        } catch (error) {
            console.error(error);

            res.redirect(
                '/?googleAuth=error'
            );
        }
    }
);

app.post(
    '/api/google-sheets/validate',
    async (req, res) => {

        try {

            const {
                spreadsheetUrl
            } = req.body;


            /*
             * Người dùng phải đăng nhập Google
             */
            if (!req.session.userId) {

                return res.status(401).json({
                    success: false,
                    error:
                        'Bạn chưa kết nối Google.'
                });
            }


            if (!spreadsheetUrl) {

                return res.status(400).json({
                    success: false,
                    error:
                        'Vui lòng nhập URL Google Sheet.'
                });
            }


            const result =
                await validateGoogleSheet(
                    req.session.userId,
                    spreadsheetUrl
                );


            res.json({
                success: true,
                message:
                    'Google Sheet có thể truy cập.',
                ...result
            });


        } catch (error) {

            console.error(
                'Google Sheet validation error:',
                error
            );


            res.status(400).json({
                success: false,
                error:
                    error.message
            });
        }
    }
);

app.post(
    '/api/google-sheets/export',
    async (req, res) => {

        try {

            const {
                spreadsheetUrl
            } = req.body;


            /*
             * Kiểm tra đăng nhập Google
             */
            if (!req.session.userId) {

                return res.status(401).json({
                    success: false,
                    error:
                        'Bạn chưa kết nối Google.'
                });
            }


            if (!spreadsheetUrl) {

                return res.status(400).json({
                    success: false,
                    error:
                        'Vui lòng nhập URL Google Sheet.'
                });
            }


            /*
             * Lấy kết quả discovery
             */
            const jsonPath = path.join(
                process.cwd(),
                'data',
                'users',
                String(req.session.userId),
                'results.json'
            );

            try {
                await fs.access(jsonPath);
            } catch {
                return res.status(400).json({
                    success: false,
                    error: 'Chưa có dữ liệu discovery để export.'
                });
            }

            const videos = JSON.parse(
                await fs.readFile(
                    jsonPath,
                    'utf8'
                )
            );


            /*
             * Chuyển video → creator rows
             */
            const {
                rows,
                creatorCount
            } = await exportCreatorsCsv(
                videos
            );


            /*
             * Export bằng Google account
             * của user hiện tại
             */
            const result =
                await writeCreatorsToGoogleSheet(
                    req.session.userId,
                    spreadsheetUrl,
                    rows
                );


            res.json({

                success: true,

                message:
                    'Đã export dữ liệu vào Google Sheet.',

                creatorCount,

                ...result

            });


        } catch (error) {

            console.error(
                'Google Sheet export error:',
                error
            );


            let message =
                error.message ||
                'Không thể ghi dữ liệu vào Google Sheet.';


            if (error.code === 403) {

                message =
                    'Bạn không có quyền chỉnh sửa Google Sheet này.';
            }


            if (error.code === 404) {

                message =
                    'Không tìm thấy Google Sheet.';
            }


            if (error.code === 401) {

                message =
                    'Google token không hợp lệ. Hãy kết nối lại Google.';
            }


            res.status(400).json({
                success: false,
                error: message
            });
        }
    }
);

app.post('/api/discover', async (req, res) => {
  try {

    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        error: 'Bạn chưa kết nối Google.',
      });
    }
    const {
      queries,
      searchType,
      limit = 30,
      sortBy = 'relevance',
      dateFrom,
      dateTo,

      isFilteredByFollowers = false,
      minFollowers,
      maxFollowers,

      isFilteredByLikes = false,
      minLikes,
      maxLikes,

      isFilteredByVideoCount = false,
      minVideoCount
    } = req.body;

    if (!Array.isArray(queries) || queries.length === 0) {
      return res.status(400).json({
        error: 'queries must not be empty',
      });
    }

    if (minFollowers !== undefined && maxFollowers !== undefined && minFollowers > maxFollowers) {
      return res.status(400).json({
        error: 'minFollowers must be less than or equal to maxFollowers',
      });
    }

    if (minLikes !== undefined && maxLikes !== undefined && minLikes > maxLikes) {
      return res.status(400).json({
        error: 'minLikes must be less than or equal to maxLikes',
      });
    }

    console.log('Starting discovery...');

    const videos = await discoverTikTokVideos({
      queries,
      searchType,
      limit,
      sortBy,
      dateFrom,
      dateTo,

      isFilteredByFollowers,
      minFollowers,
      maxFollowers,

      isFilteredByLikes,
      minLikes,
      maxLikes,

      isFilteredByVideoCount,
      minVideoCount
    });

    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({
            success: false,
            error: 'Bạn chưa đăng nhập.'
        });
    }

    const userDataDir = path.join(
        process.cwd(),
        'data',
        'users',
        String(userId)
    );

    // =========================
    // Save JSON
    // =========================

    await fs.mkdir(
        userDataDir,
        {
            recursive: true
        }
    );

    const jsonPath = path.join(
        userDataDir,
        'results.json'
    );

    await fs.writeFile(
        jsonPath,
        JSON.stringify(videos, null, 2),
        'utf8'
    );

    // Save Creator CSV
    const csvPath = path.join(
        userDataDir,
        'results.csv'
    );

    const csvResult =
        await exportCreatorsCsv(
            videos,
            csvPath
        );

    console.log(
      `Saved ${videos.length} videos to ${jsonPath} and ${csvPath}`
    )


    res.json({
      success: true,
      count: videos.length,
      creatorCount: csvResult.creatorCount,
      downloads: {
        json: '/download/results.json',
        csv: '/download/results.csv',
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/download/:file', async (req, res) => {
  const allowedFiles = {
    'results.json': 'results.json',
    'results.csv': 'results.csv',
  }

  const fileName = allowedFiles[req.params.file];

  if (!fileName) {
    return res.status(400).send('File not found!');
  }

  if (!req.session.userId) {
    return res
        .status(401)
        .send('Bạn chưa đăng nhập.');
  }

  const filePath = path.join(
    process.cwd(),
    'data',
    'users',
    String(req.session.userId),
    fileName
  );

  try {
      await fs.access(filePath);
  } catch {
      return res
          .status(404)
          .send('File not found!');
  }

  res.download(
      filePath,
      fileName
  );

});

async function startServer() {

    await initializeDatabase();

    app.listen(port, () => {
        console.log(
            `Server running on port ${port}`
        );
    });
}

startServer();
