# gamifiedlearning.github.io
Mobile friendly educational gaming platform, admin console, development and web design.

---

## Google Drive Automation

This project supports two modes of automated Google Drive file creation:

1. **Google Apps Script** – in-suite automation triggered from within Google Workspace.
2. **GitHub Actions (CI)** – Node.js upload script executed securely from CI/CD pipelines.

> **Security rule:** No API credentials, refresh tokens, or service-account keys are ever committed to this repository. All secrets are stored in GitHub Secrets (CI) or Google Apps Script Properties (Apps Script).

---

### Apps Script Setup

The sample script lives at `scripts/google-drive/appsScript.js`.

#### Required OAuth Scopes

Add the following to your `appsscript.json` under `"oauthScopes"`:

```json
"oauthScopes": [
  "https://www.googleapis.com/auth/drive.file"
]
```

#### Storing Configuration Safely

Script configuration is stored as **Script Properties** – never hardcoded in the script file.

1. Open your Apps Script project at <https://script.google.com>.
2. Click **Extensions → Project Settings → Script Properties**.
3. Add each property listed below:

| Property Key         | Description                                     |
|---------------------|-------------------------------------------------|
| `GDRIVE_FOLDER_ID`  | ID of the target Google Drive folder            |
| `GDRIVE_FILE_NAME`  | Name to give the created file                   |
| `GDRIVE_MIME_TYPE`  | MIME type (e.g., `text/plain`, `text/html`)     |
| `GDRIVE_FILE_BODY`  | *(optional)* Text content for the file          |

#### First-Run Authorization

Run `createDriveFile()` once manually to grant the OAuth consent. Subsequent runs (including time-driven triggers) reuse the stored authorization automatically.

#### Re-authentication Flow

If the authorization expires or is revoked:
1. Go to <https://myaccount.google.com/permissions> and remove the script's access.
2. Re-run `createDriveFile()` manually to re-authorize.

#### Automated Triggers

Call `installDailyTrigger()` once to install a daily time-driven trigger:

```javascript
installDailyTrigger(); // installs a 06:00 daily trigger for createDriveFile()
```

---

### GitHub Actions / CI Setup

The Node.js upload script lives at `scripts/google-drive/createFile.js`.  
The workflow definition is at `.github/workflows/google-drive-upload.yml`.

#### Required GitHub Secrets

Go to **Settings → Secrets and variables → Actions** and add:

| Secret Name            | Description                                           |
|------------------------|-------------------------------------------------------|
| `GDRIVE_CLIENT_ID`     | OAuth2 Client ID from Google Cloud Console            |
| `GDRIVE_CLIENT_SECRET` | OAuth2 Client Secret                                  |
| `GDRIVE_REFRESH_TOKEN` | Long-lived refresh token (see "Obtaining a Refresh Token" below) |
| `GDRIVE_FOLDER_ID`     | Destination Google Drive folder ID                    |

#### Obtaining a Refresh Token

1. Open [Google Cloud Console](https://console.cloud.google.com) and create (or select) a project.
2. Enable the **Google Drive API** under **APIs & Services → Library**.
3. Create an **OAuth 2.0 Client ID** of type *Desktop app* under **APIs & Services → Credentials**.
4. Download the client secret JSON (do **not** commit this file – it is git-ignored).
5. Use the [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/) to obtain a refresh token:
   - Click the **gear icon (⚙)** in the top-right corner.
   - Check **"Use your own OAuth credentials"** and enter your Client ID and Client Secret.
   - In Step 1, add the scope `https://www.googleapis.com/auth/drive.file` and click **Authorize APIs**.
   - Complete the consent screen, then in Step 2 click **Exchange authorization code for tokens**.
   - Copy the `refresh_token` value from the response.
   - Alternatively, use the `oauth2l` CLI: `oauth2l fetch --credentials client_secret.json --scope drive.file --output_format refresh_token`
6. Store the refresh token as `GDRIVE_REFRESH_TOKEN` in GitHub Secrets.

#### Local Development

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
# Edit .env with your real values – this file is git-ignored
```

Install optional dev dependencies:

```bash
npm install dotenv
```

Run the upload script locally:

```bash
UPLOAD_SOURCE_PATH=./README.md node scripts/google-drive/createFile.js
```

#### Running the Workflow

**Manual trigger** (any branch, any file):

1. Go to **Actions → Google Drive Upload**.
2. Click **Run workflow**.
3. Fill in the optional inputs (file name, MIME type, source path).

**Automatic trigger**: the workflow runs automatically when `workflow_dispatch` is called from another workflow or the GitHub API.

#### Workflow Outputs

After a successful upload the `drive_upload` step exposes:

| Output               | Description                    |
|----------------------|-------------------------------|
| `drive_file_id`      | Google Drive file ID           |
| `drive_file_link`    | Direct web-view link           |

---

### Security Checklist

- [x] No credentials, tokens, or keys committed to source.
- [x] `.env` and `*credentials*.json` are listed in `.gitignore`.
- [x] GitHub Actions uses only `secrets.*` references – no plaintext secrets in workflow YAML.
- [x] Apps Script uses Script Properties – no hardcoded values in script files.
- [x] `.env.example` provides a safe template with placeholder values only.

---
