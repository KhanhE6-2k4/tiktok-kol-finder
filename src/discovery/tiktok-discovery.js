// Business logic của việc thực hiện, không cần biết Apify hoạt động thế nào

import { scrapeTikTokHashtags, searchTikTokKeywords } from '../apify/tiktok-tools.js';
import { normalizeTikTokVideo } from '../apify/normalize-tiktok.js';
import { deduplicateVideos } from '../utils/deduplicate.js';

export async function discoverTikTokVideos({
  queries,
  searchType,
  dateFrom,
  dateTo,
  limit = 100,
  sortBy = 'relevance',
  minFollowers,
  maxFollowers,
  minLikes,
  maxLikes,
}) {
  let items = [];

  if (searchType == 'hashtag') {
    items = await scrapeTikTokHashtags({
      queries,
      dateFrom,
      dateTo,
      limit,
      minFollowers,
      maxFollowers,
      minLikes,
      maxLikes,
    });
  } else if (searchType == 'keyword') {
    items = await searchTikTokKeywords({
      queries,
      dateFrom,
      dateTo,
      limit,
      sortBy,
      minFollowers,
      maxFollowers,
      minLikes,
      maxLikes,
    });
  }

    const videos = items
      .map(item =>
        normalizeTikTokVideo(
            item,
            item.searchQuery ?? ''
        )
    );

    return deduplicateVideos(videos); 
}

