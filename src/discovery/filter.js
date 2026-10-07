export function rangeFilterTikTokVideos(
  videos,
  {
    verifiedFilter = 'any',

    isFilteredByFollowers = false,
    minFollowers,
    maxFollowers,

    isFilteredByLikes = false,
    minLikes,
    maxLikes,

    isFilteredByVideoCount = false,
    minVideoCount,
  }
) {
  console.log('\n=== FILTER DEBUG ===');

  console.log('Followers filter:', {
      enabled: isFilteredByFollowers,
      min: minFollowers,
      max: maxFollowers
  });

  console.log('Likes filter:', {
      enabled: isFilteredByLikes,
      min: minLikes,
      max: maxLikes
  });

  console.log('Videos before filter:', videos.length);

  for (const video of videos.slice(0, 10)) {
    console.log({
        username: video.creator?.username,
        followers: video.creator?.followers,
        likes: video.video?.likes
    });
  }

  const filteredVideos = videos.filter(video => {
    const verified = video.creator?.verified === true;
    const followers = video.creator?.followers ?? 0;
    const likes = video.video?.likes ?? 0;
    const videoCount = Number(
      video.creator?.videoCount ?? 0
    );

    if (isFilteredByFollowers) {
        if (minFollowers !== undefined &&
            followers < minFollowers
        ) {
            return false;
        }

        if (maxFollowers !== undefined &&
            followers > maxFollowers
        ) {
            return false;
        }
    }

    if (isFilteredByLikes) {
        if (
            minLikes !== undefined &&
            likes < minLikes
        ) {
            return false;
        }

        if (maxLikes !== undefined &&
            likes > maxLikes
        ) {
            return false;
        }
    }

    if (isFilteredByVideoCount &&
        minVideoCount !== undefined &&
        videoCount < minVideoCount
    ) {
        return false;
    }

    if (verifiedFilter === 'verified' && !verified) {
        return false;
    }

    if (verifiedFilter === 'not-verified' && verified) {
      return false;
    }

    return true;
  });

  console.log('Videos after filter:', filteredVideos.length);
  return filteredVideos;
}

export function deduplicateVideos(videos) {
  const seen = new Set();

  return videos.filter(video => {
      const key = video.video?.id || video.url;

      if (!key) {
          return true;
      }

      if (seen.has(key)) {
          return false;
      }

      seen.add(key);
      return true;
  });
}

export function isValidDiscoveredVideo(video) {
  return (
      Boolean(video.url) &&
      Boolean(video.video?.id) &&
      Boolean(
          video.creator?.id ||
          video.creator?.username
      )
  );
}

export function validateDiscoveredVideos(videos) {
  const invalid = [];

  videos.forEach((video, index) => {
      if (!video.url) {
          invalid.push({
              index,
              reason: 'missing url',
          });
      }

      if (!video.video?.id) {
          invalid.push({
              index,
              reason: 'missing video.id',
          });
      }

      if (!video.creator?.id && !video.creator?.username) {
          invalid.push({
              index,
              reason: 'missing creator',
          });
      }
  });

  return invalid;
}
