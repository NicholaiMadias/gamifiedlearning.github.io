/**
 * createFile.js
 * ─────────────────────────────────────────────────────────────────────────────
 * CI / GitHub Actions helper: creates (or uploads) a file on Google Drive
 * using the Drive API v3 with OAuth2 (refresh-token flow) or a Service Account.
 *
 * Authentication credentials are consumed EXCLUSIVELY from environment
 * variables – never from hardcoded values in this file.
 *
 * Required environment variables (set via GitHub Secrets in CI):
 *   GDRIVE_CLIENT_ID       – OAuth2 Client ID
 *   GDRIVE_CLIENT_SECRET   – OAuth2 Client Secret
 *   GDRIVE_REFRESH_TOKEN   – Long-lived refresh token obtained offline
 *                            (alternative to service-account flow)
 *   GDRIVE_FOLDER_ID       – Destination Drive folder ID (optional)
 *   GDRIVE_FILE_NAME       – Name to give the file in Drive (default: upload)
 *   GDRIVE_MIME_TYPE       – MIME type of the file being uploaded
 *                            (default: application/octet-stream)
 *   UPLOAD_SOURCE_PATH     – Local path of the file to upload
 *
 * Usage (local, with .env loaded by dotenv):
 *   node scripts/google-drive/createFile.js
 *
 * Usage (CI – env vars injected by GitHub Actions):
 *   node scripts/google-drive/createFile.js
 *
 * See README.md §"Google Drive Automation" for full setup instructions.
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const https = require('https');

// ---------------------------------------------------------------------------
// 1. Load .env for local development ONLY (dotenv is an optional dev-dep).
//    In CI the variables are injected directly into the process environment.
// ---------------------------------------------------------------------------
try {
  // eslint-disable-next-line import/no-extraneous-dependencies
  require('dotenv').config();
} catch (_) {
  // dotenv not installed – rely on environment variables already being set
}

// ---------------------------------------------------------------------------
// 2. Read and validate configuration from environment
// ---------------------------------------------------------------------------
const CONFIG = {
  clientId:     process.env.GDRIVE_CLIENT_ID,
  clientSecret: process.env.GDRIVE_CLIENT_SECRET,
  refreshToken: process.env.GDRIVE_REFRESH_TOKEN,
  folderId:     process.env.GDRIVE_FOLDER_ID   || null,
  fileName:     process.env.GDRIVE_FILE_NAME    || 'upload',
  mimeType:     process.env.GDRIVE_MIME_TYPE    || 'application/octet-stream',
  sourcePath:   process.env.UPLOAD_SOURCE_PATH  || null,
};

function validateConfig(cfg) {
  const missing = [];
  if (!cfg.clientId)     missing.push('GDRIVE_CLIENT_ID');
  if (!cfg.clientSecret) missing.push('GDRIVE_CLIENT_SECRET');
  if (!cfg.refreshToken) missing.push('GDRIVE_REFRESH_TOKEN');
  if (!cfg.sourcePath)   missing.push('UPLOAD_SOURCE_PATH');
  if (missing.length > 0) {
    throw new Error(
      `[createFile] Missing required environment variable(s): ${missing.join(', ')}\n` +
      'See .env.example for the full list of required variables.'
    );
  }
  if (!fs.existsSync(cfg.sourcePath)) {
    throw new Error(`[createFile] Upload source file not found: ${cfg.sourcePath}`);
  }
}

// ---------------------------------------------------------------------------
// 3. OAuth2 helpers (pure Node.js https – no extra runtime dependency)
// ---------------------------------------------------------------------------

/**
 * Exchange the stored refresh token for a short-lived access token.
 * @param {object} cfg - Configuration object with OAuth2 credentials.
 * @returns {Promise<string>} Resolves with the access token string.
 */
function getAccessToken(cfg) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams({
      client_id:     cfg.clientId,
      client_secret: cfg.clientSecret,
      refresh_token: cfg.refreshToken,
      grant_type:    'refresh_token',
    }).toString();

    const options = {
      hostname: 'oauth2.googleapis.com',
      path:     '/token',
      method:   'POST',
      headers: {
        'Content-Type':   'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(`[createFile] Token refresh error: ${parsed.error} – ${parsed.error_description}`));
          } else {
            resolve(parsed.access_token);
          }
        } catch (e) {
          reject(new Error(`[createFile] Failed to parse token response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// 4. Drive API v3 – multipart upload
// ---------------------------------------------------------------------------

/**
 * Upload a file to Google Drive using a multipart POST.
 *
 * NOTE: This implementation reads the entire file into memory and encodes it
 * as base64 inside a multipart body. It is suitable for files up to ~5 MB.
 * For larger files use the Drive API resumable upload protocol instead:
 * https://developers.google.com/drive/api/guides/manage-uploads#resumable
 *
 * @param {string} accessToken - Valid OAuth2 access token.
 * @param {object} cfg         - Configuration (fileName, mimeType, folderId, sourcePath).
 * @returns {Promise<object>}  Resolves with the Drive API response body.
 */
function uploadToDrive(accessToken, cfg) {
  return new Promise((resolve, reject) => {
    const fileBuffer  = fs.readFileSync(cfg.sourcePath);
    const boundary    = '-------314159265358979323846';
    const delimiter   = `\r\n--${boundary}\r\n`;
    const closeDelim  = `\r\n--${boundary}--`;

    // Build multipart metadata section
    const metadata = {
      name:     cfg.fileName,
      mimeType: cfg.mimeType,
      // Optionally place the file in a specific folder
      ...(cfg.folderId ? { parents: [cfg.folderId] } : {}),
    };

    const metaPart =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata);

    const dataPart =
      delimiter +
      `Content-Type: ${cfg.mimeType}\r\n` +
      'Content-Transfer-Encoding: base64\r\n\r\n' +
      fileBuffer.toString('base64');

    const body = Buffer.from(metaPart + dataPart + closeDelim, 'utf8');

    const options = {
      hostname: 'www.googleapis.com',
      path:     '/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      method:   'POST',
      headers: {
        'Authorization':  `Bearer ${accessToken}`,
        'Content-Type':   `multipart/related; boundary="${boundary}"`,
        'Content-Length': body.length,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(
              `[createFile] Drive API error ${res.statusCode}: ${JSON.stringify(parsed)}`
            ));
          }
        } catch (e) {
          reject(new Error(`[createFile] Failed to parse Drive response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// 5. Main entry point
// ---------------------------------------------------------------------------
async function main() {
  console.log('[createFile] Starting Google Drive upload…');

  try {
    validateConfig(CONFIG);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  let accessToken;
  try {
    console.log('[createFile] Requesting access token…');
    accessToken = await getAccessToken(CONFIG);
    console.log('[createFile] Access token obtained.');
  } catch (err) {
    console.error(`[createFile] Authentication failed: ${err.message}`);
    process.exit(1);
  }

  let result;
  try {
    console.log(`[createFile] Uploading "${path.basename(CONFIG.sourcePath)}" as "${CONFIG.fileName}"…`);
    result = await uploadToDrive(accessToken, CONFIG);
  } catch (err) {
    console.error(`[createFile] Upload failed: ${err.message}`);
    process.exit(1);
  }

  console.log('[createFile] Upload successful!');
  console.log(`  File ID  : ${result.id}`);
  console.log(`  File name: ${result.name}`);
  if (result.webViewLink) {
    console.log(`  View link: ${result.webViewLink}`);
  }

  // Emit outputs for GitHub Actions step outputs (GITHUB_OUTPUT)
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `drive_file_id=${result.id}\ndrive_file_link=${result.webViewLink || ''}\n`
    );
  }
}

main();
