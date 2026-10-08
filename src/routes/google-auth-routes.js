import express from 'express';

export function createGoogleAuthRoutes({
  googleAuthController,
}) {
  const router = express.Router();

  router.get(
    '/auth/google',
    googleAuthController.authorize
  );

  router.get(
    '/auth/google/callback',
    googleAuthController.callback
  );

  return router;
}
