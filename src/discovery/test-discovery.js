// import fs from 'fs';
// import { discoverTikTokVideos } from './tiktok-discovery.js';
// import { getYesterdayVN } from '../utils/date.js';
// import { validateDiscoveredVideos } from './filter.js';

// // const hashtags = [
// //   '#xuhuong',
// //   '#phổbiến'
// // ];

// const queries = [
//     'tự học IELTS',
//     'du học IELTS',
//     'tự học toán, lý, anh',
// ];

// const yesterday = getYesterdayVN();

// console.log(`Searching tiktok videos in ${yesterday}`);
// console.log(`Hashtags: ${queries.join('\n')}`);

// const videos = await discoverTikTokVideos({
//   queries,
//   // dateFrom: yesterday,
//   // dateTo: yesterday,
//   limit: 30,
//   sortBy: 'relevance',

//   // Không truyền nếu muốn tìm không giới hạn ngày
//   dateFrom: undefined,
//   dateTo: undefined,
// });

// console.log('=== TikTok Discovery ===');

// console.log(`Queries: ${config.queries.length}`);
// console.log(`Limit: ${config.limit}`);
// console.log(`Sort: ${config.sortBy}`);

// if (config.dateFrom || config.dateTo) {
//     console.log(
//         `Date: ${config.dateFrom ?? '...'} → ${config.dateTo ?? '...'}`
//     );
// } else {
//     console.log('Date: all');
// }

// fs.mkdir(
//   "data",
//   { recursive: true },
//   (err) => {
//     if (err) throw err;
//     console.log("Directory created!");
//   }
// );

// const invalid = validateDiscoveredVideos(videos);

// if (invalid.length > 0) {
//     console.warn(
//         `Warning: ${invalid.length} invalid videos`
//     );

//     console.warn(
//         JSON.stringify(invalid, null, 2)
//     );
// }

// fs.writeFile(
//   "data/discovered.json",
//   JSON.stringify(videos, null, 2),
//   "utf8",
//   (err) => {
//     if (err) throw err;
//     console.log("File saved!");
//   }
// );

// console.log(`Saved ${videos.length} videos to data/discovered.json`);


import fs from 'fs/promises';

import { discoveryService } from '../app.js';
import { validateSocialContent } from './filter.js';
import { getYesterdayVN } from '../utils/date.js';


const queries = [
    'tự học IELTS',
    'du học IELTS',
    'tự học toán, lý, anh',
];


const config = {
    platform: 'tiktok',

    queries,

    searchType: 'keyword',

    limit: 30,

    sortBy: 'relevance',

    dateFrom: undefined,

    dateTo: undefined,

    filters: {
        followers: {},
        likes: {},
        videoCount: {},
        verified: 'any',
    },
};


console.log('=== TikTok Discovery Test ===');

console.log(
    `Queries: ${config.queries.length}`
);

console.log(
    config.queries.join('\n')
);

console.log(
    `Limit: ${config.limit}`
);

console.log(
    `Sort: ${config.sortBy}`
);


if (config.dateFrom || config.dateTo) {
    console.log(
        `Date: ${config.dateFrom ?? '...'} → ${config.dateTo ?? '...'}`
    );
} else {
    console.log('Date: all');
}


const videos =
    await discoveryService.discover(config);


console.log(
    `Discovered ${videos.length} videos`
);


const invalid =
    validateSocialContent(videos);


if (invalid.length > 0) {
    console.warn(
        `Warning: ${invalid.length} invalid videos`
    );

    console.warn(
        JSON.stringify(
            invalid,
            null,
            2
        )
    );
}


await fs.mkdir(
    'data',
    { recursive: true }
);


await fs.writeFile(
    'data/discovered.json',
    JSON.stringify(
        videos,
        null,
        2
    ),
    'utf8'
);


console.log(
    'File saved: data/discovered.json'
);
