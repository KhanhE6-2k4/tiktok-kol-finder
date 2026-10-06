import fs from 'fs';
import path from 'path';

function escapeCsv(value) {
    if (value === null || value === undefined) {
        return '';
    }

    const stringValue = String(value);

    if (
        stringValue.includes(',') ||
        stringValue.includes('"') ||
        stringValue.includes('\n')
    ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
}

export function exportCreatorsCsv(videos, outputPath) {
    const creators = new Map();

    for (const video of videos) {
        const creator = video.creator;

        if (!creator) {
            continue;
        }

        const creatorId =
            creator.id ||
            creator.username;

        if (!creatorId) {
            continue;
        }

        if (!creators.has(creatorId)) {
            creators.set(creatorId, {
                creator: creator.username || '',
                creatorName: creator.nickname || '',
                profileUrl: creator.username
                    ? `https://www.tiktok.com/@${creator.username}`
                    : '',
                verified: creator.verified ?? false,
                followers: creator.followers ?? 0,
                totalLikes: creator.totalLikes ?? 0,
                videoCount: creator.videoCount ?? 0,
                videosFound: 0,
                keywords: new Set(),
                bio: creator.bio || '',
            });
        }

        const current = creators.get(creatorId);

        current.videosFound += 1;

        if (video.keyword) {
            current.keywords.add(video.keyword);
        }
    }

    const headers = [
        'Creator',
        'Creator Name',
        'Profile URL',
        'Verified',
        'Followers',
        'Total Likes',
        'Video Count',
        'Videos Found',
        'Keywords Matched',
        'Bio',
    ];

    const rows = [
        headers.join(','),
    ];

    for (const creator of creators.values()) {
        rows.push([
            creator.creator,
            creator.creatorName,
            creator.profileUrl,
            creator.verified,
            creator.followers,
            creator.totalLikes,
            creator.videoCount,
            creator.videosFound,
            [...creator.keywords].join('; '),
            creator.bio,
        ]
            .map(escapeCsv)
            .join(','));
    }

    const csv = '\uFEFF' + rows.join('\n');

    fs.mkdirSync(path.dirname(outputPath), {
        recursive: true,
    });

    fs.writeFileSync(outputPath, csv, 'utf8');

    return {
        creatorCount: creators.size,
        outputPath,
    };
}
