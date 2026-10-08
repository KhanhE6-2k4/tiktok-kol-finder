import express from 'express';

export function createDownloadRoutes({ downloadController }) {
  const route = express.Router();

  route.get(
    '/download/:file',
    downloadController.download
  );

  return route;
}
