import fs from 'fs';
import { discoverTikTokVideos } from './tiktok-discovery.js';
import { getYesterdayVN } from '../utils/date.js';
import { validateDiscoveredVideos } from '../utils/validate-discovered.js';

// const hashtags = [
//   '#xuhuong',
//   '#phổbiến'
// ];

const queries = [
    'tự học IELTS',
    'du học IELTS',
    'tự học toán, lý, anh',
];

const yesterday = getYesterdayVN();

console.log(`Searching tiktok videos in ${yesterday}`);
console.log(`Hashtags: ${queries.join('\n')}`);

const videos = await discoverTikTokVideos({
  queries,
  // dateFrom: yesterday,
  // dateTo: yesterday,
  limit: 30,
  sortBy: 'relevance',

  // Không truyền nếu muốn tìm không giới hạn ngày
  dateFrom: undefined,
  dateTo: undefined,
});

console.log('=== TikTok Discovery ===');

console.log(`Queries: ${config.queries.length}`);
console.log(`Limit: ${config.limit}`);
console.log(`Sort: ${config.sortBy}`);

if (config.dateFrom || config.dateTo) {
    console.log(
        `Date: ${config.dateFrom ?? '...'} → ${config.dateTo ?? '...'}`
    );
} else {
    console.log('Date: all');
}

fs.mkdir(
  "data",
  { recursive: true },
  (err) => {
    if (err) throw err;
    console.log("Directory created!");
  }
);

const invalid = validateDiscoveredVideos(videos);

if (invalid.length > 0) {
    console.warn(
        `Warning: ${invalid.length} invalid videos`
    );

    console.warn(
        JSON.stringify(invalid, null, 2)
    );
}

fs.writeFile(
  "data/discovered.json",
  JSON.stringify(videos, null, 2),
  "utf8",
  (err) => {
    if (err) throw err;
    console.log("File saved!");
  }
);

console.log(`Saved ${videos.length} videos to data/discovered.json`);
