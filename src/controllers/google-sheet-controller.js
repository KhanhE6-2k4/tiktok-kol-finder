export class GoogleSheetController {

	constructor({
		googleSheetService
	}) {
		this.googleSheetService = googleSheetService;
	}

	validate = async (req, res) => {
		try {
			const userId =
				req.session.userId;

			if (!userId) {
				return res.status(401).json({
					success: false,
					error: 'Bạn chưa đăng nhập.',
				});
			}

			const {
				spreadsheetUrl,
			} = req.body;

			if (!spreadsheetUrl) {
				return res.status(400).json({
					success: false,
					error: 'spreadsheetUrl là bắt buộc.',
				});
			}

			const result = await this.googleSheetService
				.validateSheet(
					userId,
					spreadsheetUrl
				);

			return res.json({
				success: true,
				...result,
			});

		} catch (error) {
			console.error('Google Sheet validation error:', error);

			return res.status(400).json({
				success: false,
				error: error.message,
			});
		}
	};

	export = async (req, res) => {
		try {
			const userId =
				req.session.userId;

			if (!userId) {
				return res.status(401).json({
					success: false,
					error: 'Bạn chưa đăng nhập.',
				});
			}

			const {
				spreadsheetUrl,
			} = req.body;

			if (!spreadsheetUrl) {
				return res.status(400).json({
					success: false,
					error: 'spreadsheetUrl là bắt buộc.',
				});
			}

			const result =
				await this.googleSheetService.writeResults(
					userId,
					spreadsheetUrl
				);

			return res.json({
				success: true,
				...result,
			});

		} catch (error) {
			console.error(
				'Google Sheet export error:',
				error
			);

			return res.status(500).json({
				success: false,
				error: error.message,
			});
		}
	};
}
