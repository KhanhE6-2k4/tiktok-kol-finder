export class DownloadController {
  constructor({ downloadService }) {
    this.downloadService = downloadService;
  }

  download = async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).send('Bạn chưa đăng nhập');
    }

    try {
      const { filePath, fileName } = await this.downloadService.getDownloadInfo(
        req.session.userId,
        req.params.file
      );

      return res.download(filePath, fileName);
    } catch (error) {
      if (error.message === 'File not found!') {
        return res.status(404).send('File not found');
      }

      console.error('Download file failed:', error);

      return res.status(500).send('Không thể tải file.');
    }
  };
}
