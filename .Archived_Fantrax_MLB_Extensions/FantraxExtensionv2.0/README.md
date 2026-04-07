# Fantrax Player Linker Chrome Extension

This extension adds links to Fangraphs and Baseball Savant directly next to player names on Fantrax roster pages.

## Features
- **Green Circle**: Links to the player's Fangraphs page.
- **Blue Circle**: Links to the player's Baseball Savant page.
- Automatically handles name variations and dynamic page updates.

## Installation
1. Open Google Chrome.
2. Navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked**.
5. Select the `fantrax-extension` folder in this project directory.

## How it works
The extension uses a player ID mapping file (`player_map.json`) generated from the Chadwick Bureau/Smart Fantasy Baseball registry. It listens for player links on Fantrax pages and injects the corresponding external links.

## Files
- `manifest.json`: Extension configuration.
- `content.js`: Main logic for detecting players and injecting links.
- `styles.css`: Styling for the link circles.
- `player_map.json`: Data mapping names to MLBAM and Fangraphs IDs.
- `popup.html`: Extension popup for status and legend.
