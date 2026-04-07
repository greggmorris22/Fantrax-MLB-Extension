# Database Update and Cloud Automation Plan

The goal is to update the extension's player database using the master `Baseball_Player_ID_Database.csv` and set up a system where the extension automatically pulls the latest data from GitHub.

## Phase 1: Data Integration
- [x] Create a script to sync the master `Baseball_Player_ID_Database.csv` to the extension's `data/player_map.csv` format.
- [x] Update `player_map.csv` with the latest records.
- [x] Verify that names and IDs match correctly.

## Phase 2: Cloud Automation (GitHub)
- [x] Initialize GitHub remote instructions in README.
- [x] Update `background.js` to fetch data from the GitHub "Raw" URL.
- [x] Create `sync_and_push.bat` for one-click updates.

## Phase 3: Testing & Handover
- [x] Verify local sync works correctly (6439 players synced).
- [x] Update README with clear contributor/user instructions.

## Review
- The extension now correctly pulls from GitHub Cloud.
- The sync process is automated via `sync_and_push.bat`.
