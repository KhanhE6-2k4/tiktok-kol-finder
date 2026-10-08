import {
	google
} from 'googleapis';

export class GoogleSheetService {

	constructor({
		googleAuthService,
		resultStorageService,
	}) {
		this.googleAuthService = googleAuthService;
		this.resultStorageService = resultStorageService;
	}

	extractSpreadsheetId(spreadsheetUrl) {
		try {
			const url = new URL(
				spreadsheetUrl
			);

			const match =
				url.pathname.match(
					/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
				);

			if (!match) {
				throw new Error(
					'URL Google Sheet không hợp lệ.'
				);
			}

			return match[1];

		} catch {
			throw new Error(
				'URL Google Sheet không hợp lệ.'
			);
		}
	}

	async createSheetsClient(userId) {
		const auth =
			await this.googleAuthService
			.getAuthenticatedClient(userId);

		return google.sheets({
			version: 'v4',
			auth,
		});
	}

	async validateSheet(
		userId,
		spreadsheetUrl
	) {
		const spreadsheetId =
			this.extractSpreadsheetId(
				spreadsheetUrl
			);

		const sheets =
			await this.createSheetsClient(
				userId
			);

		try {
			const response =
				await sheets.spreadsheets.get({
					spreadsheetId,

					fields: 'spreadsheetId,properties.title',
				});

			return {
				valid: true,
				spreadsheetId,
				title: response.data
					.properties?.title || '',
			};

		} catch (error) {
			if (error.code === 401) {
				throw new Error(
					'Google token không hợp lệ hoặc đã hết hạn. Hãy kết nối lại Google.'
				);
			}

			if (error.code === 403) {
				throw new Error(
					'Bạn không có quyền truy cập Google Sheet này.'
				);
			}

			if (error.code === 404) {
				throw new Error(
					'Không tìm thấy Google Sheet. Hãy kiểm tra lại URL.'
				);
			}

			throw new Error(
				'Không thể truy cập Google Sheet.'
			);
		}
	}

	createSheetTitle() {
		const now = new Date();

		const formatter =
			new Intl.DateTimeFormat(
				'en-CA', {
					timeZone: 'Asia/Ho_Chi_Minh',
					year: 'numeric',
					month: '2-digit',
					day: '2-digit',
					hour: '2-digit',
					minute: '2-digit',
					second: '2-digit',
					hourCycle: 'h23',
				}
			);

		const parts =
			formatter.formatToParts(now);

		const values =
			Object.fromEntries(
				parts.map(part => [
					part.type,
					part.value,
				])
			);

		return `${values.year}-${values.month}-${values.day}_${values.hour}-${values.minute}-${values.second}`;
	}

	parseCsv(csv) {
		const rows = [];
    let row = [];
		let value = '';
		let insideQuotes = false;

		for (let i = 0; i < csv.length; i++) {
			const char = csv[i];

			if (char === '"') {
				if (
					insideQuotes &&
					csv[i + 1] === '"'
				) {
					value += '"';
					i++;
					continue;
				}

				insideQuotes = !insideQuotes;
				continue;
			}

			if (char === ',' && !insideQuotes) {
				row.push(value);
				value = '';
				continue;
			}

			if (
				(char === '\n' || char === '\r') &&
				!insideQuotes
			) {
				if (
					char === '\r' &&
					csv[i + 1] === '\n'
				) {
					i++;
				}

				row.push(value);
				value = '';

				if (row.length > 0) {
					rows.push(row);
				}

				row = [];
				continue;
			}

			value += char;
		}

		if (value.length > 0 || row.length > 0) {
			row.push(value);
			rows.push(row);
		}

		return rows;
	}

	async writeResults(
		userId,
		spreadsheetUrl
	) {
		const spreadsheetId =
			this.extractSpreadsheetId(
				spreadsheetUrl
			);

		const csv =
			await this.resultStorageService
			.getResultsCsv(userId);

		const rows = this.parseCsv(csv);

		if (!Array.isArray(rows) || rows.length === 0) {
			throw new Error(
				'Không có dữ liệu để export.'
			);
		}

		const sheets =
			await this.createSheetsClient(
				userId
			);

		const sheetTitle =
			this.createSheetTitle();

		const createResponse =
			await sheets.spreadsheets.batchUpdate({
				spreadsheetId,

				requestBody: {
					requests: [{
						addSheet: {
							properties: {
								title: sheetTitle,
							},
						},
					}],
				},
			});

		const createdSheet =
			createResponse.data
			.replies?.[0]
			?.addSheet;

		const sheetId =
			createdSheet
			?.properties
			?.sheetId;

		if (sheetId === undefined) {
			throw new Error(
				'Không thể tạo tab mới trong Google Sheet.'
			);
		}

		await sheets.spreadsheets.values.update({
			spreadsheetId,

			range: `'${sheetTitle}'!A1`,

			valueInputOption: 'USER_ENTERED',

			requestBody: {
				values: rows,
			},
		});

		return {
			spreadsheetId,
			sheetId,
			sheetTitle,
			rowCount: rows.length,
			creatorCount: rows.length - 1,
		};
	}
}
