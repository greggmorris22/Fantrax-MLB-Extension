# Player Names ID Database Dynamic Update Plan

## Objective

Implement a way to dynamically update the player names ID database (`player_map.json`) for free.

## Proposed Options

### Option 1: Local Automation Script (Semi-Automatic)

Create an `update_db.bat` script that the user can double-click locally. This script will:

- Download the latest SFBB Player ID Map CSV from `smartfantasybaseball.com`.
- Run the existing `generate_map.py` script to rebuild `player_map.json`.
- Provide a simple "One-Click Run" experience locally.
  **Pros:** Easy to implement, doesn't require modifying the extension's core logic.
  **Cons:** Requires manual execution by the user periodically (e.g., once a week).

### Option 2: GitHub Actions (Fully Automatic, Cloud-Hosted)

Set up a free GitHub Actions workflow that runs automatically (e.g., every Monday). It will:

- Fetch the latest SFBB CSV.
- Run `generate_map.py`.
- Commit the resulting `player_map.json` directly back to the GitHub repository.
  **Pros:** 100% free and automatic. Anyone using the repo gets the latest JSON.
  **Cons:** Requires the repository to be pushed to GitHub (which I can help set up).

### Option 3: In-Extension Fetching (Fully Automatic, Browser-Based)

Modify the Chrome extension's background script to:

- Periodically check the SFBB CSV URL in the background.
- Download and parse the CSV into JSON format directly within the browser.
- Save the results into `chrome.storage.local`.
  **Pros:** Truly dynamic and autonomous for anyone who installs the extension.
  **Cons:** We have to recreate the `generate_map.py` logic (and `minor_leaguers.csv` handling) inside JavaScript.

## Plan Steps

- [x] Present these options to the user for selection.
- [x] Based on the user's choice, write the corresponding script/workflow.
- [x] Make any necessary updates to `generate_map.py` or the extension.
- [x] Test the solution to ensure it updates correctly and robustly.

## Review (Completed)

- User selected Option 2 (GitHub Actions).
- Provided `.md` file with instructions to set up GitHub PAT and push to personal account.
- GitHub actions `.yml` is fully built and committed to the local `main` branch.
