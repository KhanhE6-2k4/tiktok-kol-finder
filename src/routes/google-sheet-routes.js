import express from 'express';

export function createGoogleSheetRoutes({
  googleSheetController,
}) {
  const router = express.Router();

  router.post(
    '/google-sheets/validate',
    googleSheetController.validate
  );

  router.post(
    '/google-sheets/export',
    googleSheetController.export
  );

  return router;
}
