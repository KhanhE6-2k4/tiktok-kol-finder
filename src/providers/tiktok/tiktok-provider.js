import { SocialPlatformProvider } from "../contracts/social-platform-provider.js";
import { normalizeTikTokVideo } from "./tiktok-normalizer.js";

export class TikTokProvider extends SocialPlatformProvider {
  constructor({ client }) {
    super();
    this.client = client;
  }

  getPlatform() {
    return 'tiktok';
  }

  async discover(criteria) {
    const {
      queries,
      searchType,
      dateFrom,
      dateTo,
      limit = 10,
      sortBy = 'relevance'
    } = criteria;

    if (searchType === 'hashtag') {
      return this.client.scrapeHashtags({
        hashtags: queries,
        dateFrom,
        dateTo,
        limit,
        sortBy
      });
    }

    if (searchType === 'keyword') {
      return this.client.scrapeKeywords({
        queries,
        dateFrom,
        dateTo,
        limit,
        sortBy
      });
    }

    throw new Error(
      `Unsupported TikTok search type: ${searchType}`
    );
  }

  normalize(item, context = {}) {
    return normalizeTikTokVideo(item, context.keyword ?? item.searchQuery ?? '');
  }
}
