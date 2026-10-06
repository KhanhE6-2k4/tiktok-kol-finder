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
