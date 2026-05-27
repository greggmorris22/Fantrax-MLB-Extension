# Fantrax Extension Improvement Suggestions

## 1. The "One-Click" Updater (`run.bat`)

Right now, you have to open a terminal to run the Python script whenever player data changes. We should create a simple `update_data.bat` file in the root folder. You could just double-click it, and it will dynamically run the Python script for you (following your "novice user" rule for one-click executions).

## 2. Move Data to the Cloud (No Local Script Needed)

Instead of running a Python script locally to generate a JSON file, we could host the player mapping CSVs on a Google Sheet or GitHub. The extension's `background.js` could quietly fetch the latest data every few hours in the background. It would permanently eliminate the need for you to update it manually!

## 3. Better Memory & Speed (Chrome Storage)

Currently, the `player_map.json` is a ~450KB file that gets loaded as a Web Accessible Resource on _every single_ Fantrax page load. Instead of loading that file every time you click a page, we could have the extension load that list into `chrome.storage.local` memory once when Chrome starts. It would make Fantrax run noticeably faster and lighter.

## 4. Premium "SaaS" Popup Design

Your `popup.html` could be restyled with a sleek "vibe" (like a modern minimal SaaS tool). We can utilize clean Inter/Roboto fonts, remove generic browser borders, and incorporate soft rounded edges or FedEx-style branding for a pristine finish.

## 5. Quick-Stat Tooltips

Since you already have the Fangraphs and Baseball Savant IDs, we could add a tiny feature where hovering over the new link icons briefly displays a small, elegant tooltip with the player's current WAR or wRC+, minimizing the need to actually click through if you just want a quick glance.
