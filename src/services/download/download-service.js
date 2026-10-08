import fs from 'fs/promises';
import path from 'path';

const ALLOWED_FILES = {
  'results.json': 'results.json',
  'results.csv': 'results.csv',
};

export class DownloadService {
  getAllowedFile(fileName) {
    return ALLOWED_FILES[fileName] ?? null;
  }

  getUserFilePath(userId, fileName) {
    const allowedFile = this.getAllowedFile(fileName);

    if (!allowedFile) {
      throw new Error('File not found!');
    }

    return path.join(
      process.cwd(),
      'data',
      'users',
      String(userId),
      allowedFile
    );
  }

  async ensureFileExist(filePath) {
    try {
      await fs.access(filePath);
    } catch (error) {
      throw new Error('File not found!');
    }
  }

  async getDownloadInfo(userId, fileName) {
    const safeFileName = this.getAllowedFile(fileName);

    if (!safeFileName) {
      throw new Error('File not found!');
    }

    const filePath = this.getUserFilePath(userId, safeFileName);

    await this.ensureFileExist(filePath);

    return { filePath, fileName: safeFileName };
  }
}
