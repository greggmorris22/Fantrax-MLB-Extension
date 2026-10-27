# Fantrax Player Linker Chrome Extension

This extension adds links to Fangraphs, Baseball Savant and Baseball-Reference directly next to player names on Fantrax roster pages.

## Features
- **Green FanGraphs Logo**: Links to the player's Fangraphs page.
- **Teal MLB Logo**: Links to the player's Baseball Savant page.
- **Red Pennant**: Links to the player's Baseball-Reference page (minor league register page for prospects).
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
2. Run `py scripts\update_db.py` from the project root to rebuild `data/player_map.csv` from the master file.
3. Commit and push `data/player_map.csv` to the `main` branch on GitHub. It must stay at the repo root, since that is the address the extension downloads from.
   
Note: Other users will automatically receive the latest data within 6 hours (or after refreshing the extension) without needing to update the extension's files manually.

## Cloud Hosting (GitHub)

The extension is configured to pull data from **GitHub Cloud**. When you push data updates to GitHub, all extension users see the changes automatically.

### GitHub Repo Connection
If you haven't linked this folder to GitHub yet:
1. Create a repository on GitHub named `Fantrax-MLB-Extension`.
2. Run this command once in your terminal:
   `git remote add origin https://github.com/greggmorris22/Fantrax-MLB-Extension.git`

## Files
- `manifest.json`: Extension configuration.
- `content.js`: Main logic for detecting players and injecting links.
- `styles.css`: Styling for the link circles.
- `data/player_map.csv`: The current local copy of player data.
- `scripts/update_db.py`: The underlying sync logic.
- `popup.html`: Extension popup for status and legend.
