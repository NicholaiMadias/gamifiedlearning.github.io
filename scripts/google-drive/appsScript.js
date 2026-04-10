/**
 * appsScript.js  –  Google Apps Script: Drive file creation utility
 * ─────────────────────────────────────────────────────────────────────────────
 * Copy this file into your Google Apps Script project (script.google.com).
 * It provides a parameterized wrapper around DriveApp / Drive.Files.create
 * with the minimum required OAuth scopes.
 *
 * REQUIRED SCOPES (add to appsscript.json → "oauthScopes"):
 *   "https://www.googleapis.com/auth/drive.file"
 *   "https://www.googleapis.com/auth/script.external_request"  (if using UrlFetch)
 *
 * SECURITY NOTES:
 *   • Never hard-code folder IDs, filenames, or any user-specific data here.
 *   • Store runtime configuration in Script Properties:
 *       Extensions → Project Settings → Script Properties
 *   • Rotate/revoke access via the Google Account permissions page:
 *       https://myaccount.google.com/permissions
 *
 * SETUP (first run):
 *   1. Open your Apps Script project.
 *   2. Click Extensions → Project Settings → Script Properties.
 *   3. Add the properties listed in CONFIG_KEYS below.
 *   4. Run `createDriveFile` once manually to grant OAuth consent.
 *   5. For automated triggers, use a time-driven trigger on `createDriveFile`.
 *
 * See README.md §"Google Drive Automation – Apps Script" for full details.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ---------------------------------------------------------------------------
// Script Property keys (values are set in Project Settings – never in code)
// ---------------------------------------------------------------------------
var CONFIG_KEYS = {
  GDRIVE_FOLDER_ID:  'GDRIVE_FOLDER_ID',   // ID of the destination Drive folder
  GDRIVE_FILE_NAME:  'GDRIVE_FILE_NAME',    // Name to give the new file in Drive
  GDRIVE_MIME_TYPE:  'GDRIVE_MIME_TYPE',    // MIME type, e.g. 'text/plain'
  GDRIVE_FILE_BODY:  'GDRIVE_FILE_BODY',    // (optional) Text content for a new Doc/text file
};

// ---------------------------------------------------------------------------
// Utility: read a required Script Property (throws on missing value)
// ---------------------------------------------------------------------------
function getRequiredProperty(key) {
  var value = PropertiesService.getScriptProperties().getProperty(key);
  if (!value) {
    throw new Error(
      'Missing Script Property: "' + key + '". ' +
      'Add it via Extensions → Project Settings → Script Properties.'
    );
  }
  return value;
}

// ---------------------------------------------------------------------------
// Core: Create (or upload) a file in Google Drive
// ─────────────────────────────────────────────────────────────────────────────
// Parameters are injected from Script Properties so that this function can be
// called safely from a time-driven trigger without any hardcoded values.
// ---------------------------------------------------------------------------
function createDriveFile() {
  // -- Read configuration from Script Properties ----------------------------
  var folderId = getRequiredProperty(CONFIG_KEYS.GDRIVE_FOLDER_ID);
  var fileName = getRequiredProperty(CONFIG_KEYS.GDRIVE_FILE_NAME);
  var mimeType = getRequiredProperty(CONFIG_KEYS.GDRIVE_MIME_TYPE);

  // File body is optional – defaults to an empty string for plain-text files
  var fileBody = PropertiesService.getScriptProperties()
                   .getProperty(CONFIG_KEYS.GDRIVE_FILE_BODY) || '';

  // -- Locate destination folder --------------------------------------------
  var folder = DriveApp.getFolderById(folderId);

  // -- Create the file -------------------------------------------------------
  // ▶ DYNAMIC CONTENT: replace `fileBody` with your generated content here.
  //   E.g., fileBody = buildReportContent();
  var blob = Utilities.newBlob(fileBody, mimeType, fileName);
  var file = folder.createFile(blob);

  Logger.log('File created: %s (ID: %s)', file.getName(), file.getId());
  Logger.log('View: %s', file.getUrl());

  return {
    id:   file.getId(),
    name: file.getName(),
    url:  file.getUrl(),
  };
}

// ---------------------------------------------------------------------------
// Optional: Convert an existing Drive file to Google Docs format
// (demonstrates Drive.Files.copy for conversion use-cases)
// ---------------------------------------------------------------------------
function convertFileToGoogleDoc(sourceFileId) {
  // ▶ DYNAMIC CONTENT: pass sourceFileId from a trigger or external call.
  var sourceFile = DriveApp.getFileById(sourceFileId);
  var folderId   = getRequiredProperty(CONFIG_KEYS.FOLDER_ID);
  var folder     = DriveApp.getFolderById(folderId);

  var copy = sourceFile.makeCopy('[Doc] ' + sourceFile.getName(), folder);
  Logger.log('Converted copy: %s (ID: %s)', copy.getName(), copy.getId());
  return copy.getId();
}

// ---------------------------------------------------------------------------
// Trigger registration helper – run once to install a daily trigger
// ---------------------------------------------------------------------------
function installDailyTrigger() {
  // Remove any existing triggers for createDriveFile to avoid duplicates
  ScriptApp.getProjectTriggers()
    .filter(function(t) { return t.getHandlerFunction() === 'createDriveFile'; })
    .forEach(function(t) { ScriptApp.deleteTrigger(t); });

  ScriptApp.newTrigger('createDriveFile')
    .timeBased()
    .everyDays(1)
    .atHour(6)
    .create();

  Logger.log('Daily trigger installed for createDriveFile.');
}
