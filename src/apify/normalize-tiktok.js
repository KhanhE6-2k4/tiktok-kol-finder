export function normalizeTikTokVideo(item, keyword) {
    return {
        keyword,

        title: item.text ?? '',

        url: item.webVideoUrl ?? '',

        content: item.text ?? '',

        video: {
            id: item.id ?? '',
            views: item.playCount ?? 0,
            likes: item.diggCount ?? 0,
            comments: item.commentCount ?? 0,
            shares: item.shareCount ?? 0,
            saves: item.collectCount ?? 0,
            createTime: item.createTimeISO ?? null,
        },

        creator: {
            id: item.authorMeta?.id ?? '',
            username: item.authorMeta?.name ?? '',
            nickname: item.authorMeta?.nickName ?? '',
            verified: item.authorMeta?.verified ?? false,
            followers: item.authorMeta?.fans ?? 0,
            following: item.authorMeta?.following ?? 0,
            totalLikes: item.authorMeta?.heart ?? 0,
            videoCount: item.authorMeta?.video ?? 0,
            bio: item.authorMeta?.signature ?? '',
            avatar: item.authorMeta?.avatar ?? '',
        },
    };
}
