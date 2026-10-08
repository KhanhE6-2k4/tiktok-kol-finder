export function rangeFilterSocialContent(
  contents,
  {
    verified = 'any',
    followers = {},
    likes = {},
    videoCount = {},
  }
) {
  return contents.filter(content => {
    const creator = content.creator ?? {};
    const creatorFollowers = Number(creator.followers ?? 0);
    const creatorLikes = Number(creator.totalLikes ?? 0);
    const creatorVideoCount = Number(creator.videoCount ?? 0);
    const isVerified = creator.verified === true;

    if (followers.min !== undefined && creatorFollowers < followers.min) {
      return false;
    }
    if (followers.max !== undefined && creatorFollowers > followers.max) {
      return false;
    }

    if (likes.min !== undefined && creatorLikes < likes.min) {
      return false;
    }
    if (likes.max !== undefined && creatorLikes > likes.max) {
      return false;
    }

    if (verified === 'verified' && !isVerified) {
      return false;
    }

    if (verified === 'not-verified' && isVerified) {
      return false;
    }

    if (videoCount.min !== undefined && creatorVideoCount < videoCount.min) {
      return false;
    }

    return true;
  })
}

export function deduplicateSocialContent(contents) {
  const visited = new Set();

  return contents.filter(content => {
    const key = content.video?.id || content.url;

    if (!key) {
      return true;
    }

    if (visited.has(key)) {
      return false;
    }

    visited.add(key);

    return true;
  })
}

export function isValidSocialContent(content) {
  return (
    Boolean(content.url) &&
    Boolean(content.video?.id) &&
    Boolean(content.creator?.id || content.creator?.username)
  );
}

export function validateSocialContent(contents) {
  const invalid = [];

  contents.forEach((content, index) => {
    if (!content.url) {
      invalid.push({
        index,
        reason: 'missing url'
      });
    }

    if (!content.video?.id) {
      invalid.push({
        index,
        reason: 'missing content.id'
      });
    }

    if (!content.creator?.id && !content.creator?.username) {
      invalid.push({
        index,
        reason: 'missing creator'
      });
    }
  });

  return invalid;
}
