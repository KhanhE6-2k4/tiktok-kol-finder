import express from 'express';

export function createDiscoveryRoutes({ discoveryController }) {
  const router = express.Router();

  router.post(
    '/discover',
    discoveryController.discover
  );
  return router;
}
