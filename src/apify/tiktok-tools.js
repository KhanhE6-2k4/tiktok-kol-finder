// Chịu trách nhiệm giao tieeos với Scrape provider trên apify

import { ApifyClient } from 'apify-client';
import dotenv from 'dotenv';

dotenv.config();

const ACTOR_ID = 'poidata/tiktok-scraper';

console.log(Boolean(process.env.APIFY_API_TOKEN));

const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

/**
 * Scrape TikTok videos theo hashtag và khoảng ngày.
 *
 * @param {Object} options
 * @param {string[]} options.hashtags
 * @param {string} options.dateFrom
 * @param {string} options.dateTo
 * @param {number} options.limit
 *
 * @returns {Promise<Array>}
 */
export async function scrapeTikTokHashtags({
    hashtags,
    dateFrom,
    dateTo,
    limit = 100,
    sortBy = 'relevance',
    // minFollowers,
    // maxFollowers,
    // minLikes,
    // maxLikes
}) {
    if (!Array.isArray(hashtags) || hashtags.length === 0) {
        throw new Error('hashtags must be a non-empty array');
    }

    const input = {
        hashtags,

        // Tổng số video tối đa trả về
        maxItems: limit,

        // Giới hạn cho từng hashtag
        maxItemsPerQuery: Math.ceil(limit / hashtags.length),

        // Video mới nhất trước
        sortBy,

        // Chỉ lấy video trong khoảng ngày
        // dateFrom,
        // dateTo,

        // Enrich profile của creator
        // enrichProfiles: true,

        // Giữ tất cả video, không giới hạn 1 video/creator
        uniqueAuthors: false,
    };

    if (dateFrom) {
        input.dateFrom = dateFrom;
    }

    if (dateTo) {
        input.dateTo = dateTo;
    }

    // if (minFollowers !== undefined) {
    //     input.minFollowers = minFollowers;
    // }

    // if (maxFollowers !== undefined) {
    //     input.maxFollowers = maxFollowers;
    // }

    // if (minLikes !== undefined) {
    //     input.minLikes = minLikes;
    // }

    // if (maxLikes !== undefined) {
    //     input.maxLikes = maxLikes;
    // }

    console.log('Poidata input:');
    console.log(JSON.stringify(input, null, 2));

    const run = await client.actor(ACTOR_ID).call(input);

    const { items } = await client
        .dataset(run.defaultDatasetId)
        .listItems();

    console.log(`Poidata returned ${items.length} videos`);

    return items;
}

export async function searchTikTokKeywords({
    queries,
    dateFrom,
    dateTo,
    limit = 100,
    sortBy = 'relevance',
    // minFollowers,
    // maxFollowers,
    // minLikes,
    // maxLikes
}) {
    if (!Array.isArray(queries) || queries.length === 0) {
        throw new Error('queries must be a non-empty array');
    }


    const input = {
        searchQueries: queries,

        // Tổng số video tối đa
        maxItems: limit,

        // Chia quota tương đối đều cho các query
        maxItemsPerQuery: Math.ceil(limit / queries.length),

        // Search theo relevance của TikTok
        sortBy,

        // Chỉ lấy video trong khoảng ngày
        // dateFrom,
        // dateTo,

        // Sử dụng khi tìm kiếm theo creator profile
        // enrichProfiles: true,

        // Giữ nhiều video của cùng một creator
        uniqueAuthors: false,
    };

     if (dateFrom) {
        input.dateFrom = dateFrom;
    }

    if (dateTo) {
        input.dateTo = dateTo;
    }

    // if (minFollowers !== undefined) {
    //     input.minFollowers = minFollowers;
    // }

    // if (maxFollowers !== undefined) {
    //     input.maxFollowers = maxFollowers;
    // }

    // if (minLikes !== undefined) {
    //     input.minLikes = minLikes;
    // }

    // if (maxLikes !== undefined) {
    //     input.maxLikes = maxLikes;
    // }

    console.log('\n=== Poidata Input ===');
    console.log(JSON.stringify(input, null, 2));

    const run = await client.actor(ACTOR_ID).call(input);

    const { items } = await client
        .dataset(run.defaultDatasetId)
        .listItems();

    console.log(`Poidata returned ${items.length} videos`);

    return items;
}
