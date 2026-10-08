// ResultStorageService
//  - tạo thư mục user
//  - lưu results.json
//  - tạo results.csv


import fs from 'fs/promises';
import path from 'path';

export class ResultStorageService {
	constructor({
		exportCreatorsCsv
	}) {
		this.exportCreatorsCsv = exportCreatorsCsv;
	}

	getUserDirectory(userId) {
		return path.join(
			process.cwd(),
			'data',
			'users',
			String(userId)
		);
	}

	getResultsCsvPath(userId) {
		return path.join(
			this.getUserDirectory(userId),
			'results.csv'
		);
	}

	async saveResults(userId, videos) {
		const userDirectory = this.getUserDirectory(userId);

		await fs.mkdir(userDirectory, {
			recursive: true,
		});

		const jsonPath = path.join(
			userDirectory,
			'results.json'
		);

		const csvPath = path.join(
			userDirectory,
			'results.csv'
		);

		await fs.writeFile(
			jsonPath,
			JSON.stringify(videos, null, 2),
			'utf8'
		);

		const csvResult = await this.exportCreatorsCsv(
			videos,
			csvPath
		);

		return {
			jsonPath,
			csvPath,
			creatorCount: csvResult.creatorCount,
		};
	}

	async getResultsCsv(userId) {
		const csvPath =
			this.getResultsCsvPath(userId);

		try {
			return await fs.readFile(
				csvPath,
				'utf8'
			);
		} catch (error) {
			if (error.code === 'ENOENT') {
				throw new Error(
					'Chưa có kết quả tìm kiếm để export.'
				);
			}

			throw error;
		}
	}
}
