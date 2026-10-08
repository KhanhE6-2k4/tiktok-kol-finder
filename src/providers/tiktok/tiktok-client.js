// Chịu trách nhiệm giao tieeos với Scrape provider trên apify

import { ApifyClient } from 'apify-client';

const ACTOR_ID = 'poidata/tiktok-scraper';

export class TikTokClient {
  constructor({ apiToken }) {
    if (!apiToken) {
      throw new Error('APIFY_API_TOKEN is required');
    }

    this.client = new ApifyClient({ token: apiToken });
  }

  async scrapeHashtags({
    hashtags,
    dateFrom,
    dateTo,
    limit = 10,
    sortBy = 'relevance'
  }) {
    if (!Array.isArray(hashtags) || hashtags.length === 0) {
      throw new Error('hashtags must be a non-mepty array');
    }

    const input = {
      hashtags,
      maxItems: limit,
      maxItemsPerQuery: Math.ceil(limit / hashtags.length),
      sortBy,
      uniqueAuthors: false
    }

    if (dateFrom) {
      input.dateFrom = dateFrom;
    }
    if (dateTo) {
      input.dateTo = dateTo;
    }

    console.log('Poidata input:');
    console.log(JSON.stringify(input, null, 2));

    return this.#runActor(input);
  }

  async scrapeKeywords({
    queries,
    dateFrom,
    dateTo,
    limit = 10,
    sortBy = 'relevance'
  }) {
    if (!Array.isArray(queries) || queries.length === 0) {
      throw new Error('queries must be a non-mepty array');
    }

    const input = {
      searchQueries: queries,
      maxItems: limit,
      maxItemsPerQuery: Math.ceil(limit / queries.length),
      sortBy,
      uniqueAuthors: false
    }

    if (dateFrom) {
      input.dateFrom = dateFrom;
    }
    if (dateTo) {
      input.dateTo = dateTo;
    }

    console.log('Poidata input:');
    console.log(JSON.stringify(input, null, 2));

    return this.#runActor(input);
  }

  async #runActor(input) {
    const run = await this.client.actor(ACTOR_ID).call(input);

    const { items } = await this.client.dataset(run.defaultDatasetId).listItems();

    console.log(`Poidata returned ${items.length} videos`);
    return items;
  }
}
