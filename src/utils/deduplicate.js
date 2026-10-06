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
