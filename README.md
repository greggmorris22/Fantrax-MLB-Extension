# Fantrax Player Linker Chrome Extension

This extension adds links to Fangraphs and Baseball Savant directly next to player names on Fantrax roster pages.

## Features
- **Green Diamond**: Links to the player's Fangraphs page.
- **Blue/Red Circle**: Links to the player's Baseball Savant page.
- Automatically handles name variations and dynamic page updates.

## Installation
1. Open Google Chrome.
2. Navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked**.
5. Select the `fantrax-extension` folder in this project directory.

## Database Updates and Cloud Syncing

To update the player database used by this extension:
1. Ensure your master database is located at: `C:\Users\gregg\Documents\Vibecoding\Baseball_Player_ID_Database\Baseball_Player_ID_Database.csv`
2. Simply double-click **`sync_and_push.bat`** in the project root.
   - This script will sync with the master file, commit changes, and push updates to GitHub.
   
Note: Other users will automatically receive the latest data within 6 hours (or after refreshing the extension) without needing to update the extension's files manually.

## Cloud Hosting (GitHub)

The extension is configured to pull data from **GitHub Cloud**. When you push data updates to GitHub, all extension users see the changes automatically.

### GitHub Repo Connection
If you haven't linked this folder to GitHub yet:
1. Create a repository on GitHub named `Fantrax_MLB_Extension`.
2. Run this command once in your terminal:
   `git remote add origin https://github.com/[YOUR_USERNAME]/Fantrax_MLB_Extension.git`

## Files
- `manifest.json`: Extension configuration.
- `content.js`: Main logic for detecting players and injecting links.
- `styles.css`: Styling for the link circles.
- `data/player_map.csv`: The current local copy of player data.
- `sync_and_push.bat`: The automated script to update and publish data.
- `scripts/update_db.py`: The underlying sync logic.
- `popup.html`: Extension popup for status and legend.
