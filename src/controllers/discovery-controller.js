
export class DiscoveryController {
  constructor({ discoveryService, resultStorageService }) {
    this.discoveryService = discoveryService;
    this.resultStorageService = resultStorageService;
  }

  discover = async (req, res) => {
    try {
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
        });
      }

      const {
        queries,
        searchType,
        limit = 10,
        sortBy = 'relevance',
        dateFrom,
        dateTo,

        minFollowers,
        maxFollowers,

        minLikes,
        maxLikes,

        minVideoCount,

        verifiedFilter = 'any',
      } = req.body;

      const videos = await this.discoveryService.discover({
        platform: 'tiktok',
        queries,
        searchType,
        limit,
        sortBy,

        dateFrom,
        dateTo,

        filters: {
          followers: {
            min: minFollowers,
            max: maxFollowers,
          },

          likes: {
            min: minLikes,
            max: maxLikes,
          },

          videoCount: {
            min: minVideoCount,
          },

          verified: verifiedFilter,
        },
      });

      const result = await this.resultStorageService.saveResults(userId, videos);

      return res.json({
        success: true,
        count: videos.length,
        creatorCount: result.creatorCount,
        downloads: {
          json: '/api/download/results.json',
          csv: '/api/download/results.csv',
        },
        videos,
      });
    } catch (error) {
      console.error('Discovery error:', error);
      return res.status(500).json({
        error: error.message || 'Discovery failed',
      });
    }
  };
}
