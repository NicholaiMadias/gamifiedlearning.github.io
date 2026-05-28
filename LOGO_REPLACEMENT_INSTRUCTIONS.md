# Logo Replacement Instructions

## Overview
This document provides instructions for replacing the logo/favicon for nicholai.org.

## Current Status
- Added favicon link tags to all major HTML pages
- Current logo files are in the `Assets/` directory
- PWA manifest is configured to use the favicon

## Files That Need to Be Replaced

To update the logo for nicholai.org, replace the following image files:

1. **`Assets/favicon.png`** - Main favicon used across the site (currently 1024x1024 PNG)
2. **`Assets/logo.PNG`** - Logo file (currently 1024x1024 PNG)

## How to Replace the Logo

### Option 1: Direct File Replacement
1. Download the new logo image from: https://github.com/user-attachments/assets/d192853b-b346-4920-9efe-febc0a74ef35
2. Save it as a PNG file (1024x1024 pixels recommended)
3. Replace both:
   - `Assets/favicon.png`
   - `Assets/logo.PNG`
4. Commit and push the changes

### Option 2: Using Git Command Line
```bash
# Navigate to the repository
cd /path/to/gamifiedlearning.github.io

# Download the new logo (or add it manually to Assets/)
# Then replace the files:
cp /path/to/new-logo.png Assets/favicon.png
cp /path/to/new-logo.png Assets/logo.PNG

# Commit the changes
git add Assets/favicon.png Assets/logo.PNG
git commit -m "Replace logo with new nicholai.org branding"
git push
```

## Pages Updated with Favicon Links

The following pages now include proper favicon link tags:

- `/index.html` - Main homepage
- `/contact/index.html` - Contact page
- `/arcade/index.html` - Match Maker game
- `/star-matrix/index.html` - Star Matrix game
- `/matrix-of-conscience/index.html` - Matrix of Conscience
- `/ministry.html` - Ministry page
- `/arcade/certificates/index.html` - Certificates page

## Technical Details

Each page now includes these HTML tags in the `<head>` section:

```html
<link rel="icon" type="image/png" sizes="32x32" href="/Assets/favicon.png">
<link rel="icon" type="image/png" sizes="192x192" href="/Assets/favicon.png">
<link rel="apple-touch-icon" href="/Assets/favicon.png">
<link rel="manifest" href="/manifest.json">
```

The `manifest.json` file also references the favicon for Progressive Web App functionality.

## Verification

After replacing the logo files:

1. Clear your browser cache
2. Visit https://nicholai.org
3. Check that the new favicon appears in:
   - Browser tab
   - Bookmarks
   - Mobile home screen (if added as PWA)

## Notes

- The favicon should be at least 512x512 pixels for best quality across all devices
- PNG format with transparency is recommended
- The same image is used for both favicon.png and logo.PNG for consistency
