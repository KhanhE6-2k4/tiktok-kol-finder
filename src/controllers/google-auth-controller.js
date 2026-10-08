export class GoogleAuthController {
  constructor({ googleAuthService }) {
    this.googleAuthService = googleAuthService;
  }

  authorize = async (req, res) => {
    try {
      const url = await this.googleAuthService.createAuthorizationUrl(req);
      return res.redirect(url);
    } catch (error) {
      console.error('Google authorization error: ', error);

      return res.status(500).send(error.message || 'Không thể kết nối Google');
    }
  };

  callback = async (req, res) => {
    try {
      await this.googleAuthService.handleCallback(req);
      return res.redirect('/?googleAuth=success');
    } catch (error) {
      console.error('Google callback error:', error);
      return res.redirect(
        `/?googleAuth=error&message=${encodeURIComponent(
            error.message || 'Google authentication failed'
        )}`
      );
    }
  };
}
