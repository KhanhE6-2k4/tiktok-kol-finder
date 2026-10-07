// Business logic của việc thực hiện, không cần biết Apify hoạt động thế nào

import { scrapeTikTokHashtags, searchTikTokKeywords } from '../apify/tiktok-tools.js';
import { normalizeTikTokVideo } from '../apify/normalize-result.js';
import { deduplicateVideos, isValidDiscoveredVideo, rangeFilterTikTokVideos } from './filter.js';

export async function discoverTikTokVideos({
  queries,
  searchType,
  dateFrom,
  dateTo,
  limit = 100,
  sortBy = 'relevance',

  isFilteredByFollowers = false,
  minFollowers,
  maxFollowers,

  isFilteredByLikes = false,
  minLikes,
  maxLikes,
}) {
  let items = [];

  if (searchType == 'hashtag') {
    items = await scrapeTikTokHashtags({
      hashtags: queries,
      dateFrom,
      dateTo,
      limit,
      sortBy,
      // minFollowers,
      // maxFollowers,
      // minLikes,
      // maxLikes,
    });
  } else if (searchType == 'keyword') {
    items = await searchTikTokKeywords({
      queries,
      dateFrom,
      dateTo,
      limit,
      sortBy,
      // minFollowers,
      // maxFollowers,
      // minLikes,
      // maxLikes,
    });
  }

  // 1. Normalize
  let videos = items.map(item =>
    normalizeTikTokVideo(
        item,
        item.searchQuery ?? ''
    )
  );

  // 2. Validate (check if the response has the required fields)
  videos = videos.filter(isValidDiscoveredVideo);

  // 3. Min, max filter
  videos = rangeFilterTikTokVideos(videos, {
    isFilteredByFollowers,
    minFollowers,
    maxFollowers,
    isFilteredByLikes,
    minLikes,
    maxLikes
  });

  // 4. Deduplicate
  videos = deduplicateVideos(videos);

  return videos;
}
