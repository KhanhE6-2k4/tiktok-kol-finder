// Google OAuth configuration -> OAuth2 client

import fs from 'fs/promises';
import path from 'path';
import { google } from 'googleapis';

const CREDENTIALS_PATH = path.join(
  process.cwd(),
  'credentials',
  'google-oauth.json'
);

const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/spreadsheets',
];

async function loadCredentials() {
  let credentials;

  if (process.env.GOOGLE_OAUTH_JSON) {
    credentials = JSON.parse(process.env.GOOGLE_OAUTH_JSON);
  } else {
    try {
      await fs.access(CREDENTIALS_PATH);
    } catch (error) {
      throw new Error('Không tìm thấy credentials/google-oauth.json \n', error);
    }

    credentials = JSON.parse(await fs.readFile(CREDENTIALS_PATH, 'utf8'));
  }

  if (!credentials.web) {
    throw new Error('Biến môi trường hoặc file google-oauth.json không chứa cấu hình OAuth');
  }

  return credentials.web;
}

export async function createGoogleOAuthClient() {
  const credentials = await loadCredentials();

  return new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
    process.env.GOOGLE_OAUTH_REDIRECT_URI
  );
}

export function getGoogleOAuthScopes() {
  return SCOPES;
}
