import 'dotenv/config';
import fs from 'fs';
import express from 'express';
import path from 'path';
import { exportCreatorsCsv } from './src/export/export-creators-csv.js';

import { discoverTikTokVideos } from './src/discovery/tiktok-discovery.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

app.post('/api/discover', async (req, res) => {
  try {
    const {
      queries,
      searchType,
      limit = 30,
      sortBy = 'relevance',
      dateFrom,
      dateTo,
      minFollowers,
      maxFollowers,
      minLikes,
      maxLikes
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
      minFollowers,
      maxFollowers,
      minLikes,
      maxLikes
    });

    // =========================
    // Save JSON
    // =========================

    fs.mkdirSync(
      'data',
      {
        recursive: true,
      },
    );

    const jsonPath = path.join(
      'data',
      'results.json'
    );

    fs.writeFileSync(
      jsonPath,
      JSON.stringify(videos, null, 2),
      "utf8"
    );

    // Save Creator CSV
    const csvPath = path.join(
      'data',
      'results.csv'
    );

    const csvResult = exportCreatorsCsv(
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

app.get('/download/:file', (req, res) => {
  const allowedFiles = {
    'results.json': 'results.json',
    'results.csv': 'results.csv',
  }

  const fileName = allowedFiles[req.params.file];

  if (!fileName) {
    return res.status(400).send('File not found!');
  }

  const filePath = path.join(
    process.cwd(),
    'data',
    fileName
  );

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found!');
  }

  res.download(filePath, fileName);

});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
})
