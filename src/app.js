// Get, inject Dependency and express configuration
import express from 'express';
import session from 'express-session';
import 'dotenv/config';

import { exportCreatorsCsv } from './export/export-creators-csv.js';

import { TikTokClient } from "./providers/tiktok/tiktok-client.js";
import { TikTokProvider } from "./providers/tiktok/tiktok-provider.js";

import { ProviderRegistry } from "./services/discovery/provider-registry.js";
import { DiscoveryService } from "./services/discovery/discovery-service.js";
import { ResultStorageService } from './services/discovery/result-storage-service.js';

import { DiscoveryController } from './controllers/discovery-controller.js';
import { createDiscoveryRoutes } from './routes/discovery-routes.js';

import { DownloadService } from './services/download/download-service.js';
import { DownloadController } from './controllers/download-controller.js';
import { createDownloadRoutes } from './routes/download-routes.js';


import { GoogleAuthService } from './services/google/google-auth-service.js';
import { GoogleSheetService } from './services/google/google-sheet-service.js';

import { GoogleAuthController } from './controllers/google-auth-controller.js';
import { createGoogleAuthRoutes } from './routes/google-auth-routes.js';

import { GoogleSheetController } from './controllers/google-sheet-controller.js';
import { createGoogleSheetRoutes } from './routes/google-sheet-routes.js';


const app = express();

// Dependency Injection (Infrastructure)
const tikTokClient = new TikTokClient({
  apiToken: process.env.APIFY_API_TOKEN,
});

const tikTokProvider = new TikTokProvider({
  client: tikTokClient,
});

const providerRegistry = new ProviderRegistry([
  tikTokProvider,
]);

const discoveryService = new DiscoveryService({
  providerRegistry,
});

const resultStorageService = new ResultStorageService({
  exportCreatorsCsv,
});

const googleAuthService = new GoogleAuthService();

const googleSheetService = new GoogleSheetService({
  googleAuthService,
  resultStorageService,
});

const downloadService = new DownloadService();


// Controller

const discoveryController = new DiscoveryController({
  discoveryService,
  resultStorageService,
});

const googleAuthController = new GoogleAuthController({
  googleAuthService,
});

const googleSheetController = new GoogleSheetController({
  googleSheetService,
});

const downloadController = new DownloadController({
  downloadService,
});

// Middleware

app.use(express.json());

app.use(express.static('public'));

app.set('trust proxy', 1);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  })
);

// Routes

app.use(
  '/api',
  createDiscoveryRoutes({
    discoveryController,
  })
);

app.use(
  '/api',
  createDownloadRoutes({
    downloadController,
  })
);

// Routes - Google OAuth

app.use(
  '/api',
  createGoogleAuthRoutes({
    googleAuthController,
  })
);

// Routes - Google sheets

app.use(
  '/api',
  createGoogleSheetRoutes({
    googleSheetController,
  })
);

export default app;
