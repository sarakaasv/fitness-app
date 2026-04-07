# PulseBoard Web App

This is now the main version of the project.

It is an iPhone-first web app, because this Mac cannot run the Xcode version.

## What it includes

- Today screen with daily guidance
- Quick logging
- Routine-based gym logging
- Saved routines
- Training blocks with repeating weeks
- Body check-ins for sleep, soreness, energy, stress, and loaded areas
- Progress view with weekly balance and lift trends
- Backup export and import

## Files that matter most

- `index.html`
- `styles.css`
- `app.js`
- `manifest.webmanifest`
- `service-worker.js`

## How to test on the Mac

Open `index.html` in a browser.

## How to use it on iPhone later

To behave like an app on iPhone, this should be available on a web link.

Then you open it in Safari and choose:

`Share -> Add to Home Screen`

That gives you an app-like icon on the iPhone home screen.

## After any update

Local file changes do not update the iPhone version by themselves.

Use this simple flow every time:

1. Upload or push the changed web app files to GitHub.
2. Wait for Netlify to finish redeploying.
3. Open the Netlify link in Safari on iPhone.
4. Refresh once in Safari.
5. Open the Home Screen app again.

If the old version still shows:

1. Fully close the Home Screen app.
2. Open the Netlify link in Safari again.
3. Refresh once more.
4. If it is still stale, remove the Home Screen icon and add it again from Safari.

## Note

The `PulseBoard/` folder with SwiftUI files is still here as an archive of the native-app attempt, but the web app is now the real working direction.
