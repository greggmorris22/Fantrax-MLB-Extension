# Player ID Database Update Plan

This plan outlines the steps to update the player ID database for the Fantrax MLB Chrome extension, focusing on resolving missing IDs for MiLB (Minor League) players, fixing a name format inconsistency bug, and running the pipeline.

## Phase 1: Name Format Bug Fixes
- [x] Implement `first_last_to_last_first` helper in `src/utils/name_utils.py` to convert names from "First Last" back to "Last, First".
- [x] Update `load_database` in `src/core/database.py` to convert loaded names back to "Last, First" format internally.
- [x] Update `save_database` in `src/core/database.py` to keep names in "Last, First" format in the master CSV (`Baseball_Player_ID_Database.csv`).
- [x] Update the extension's sync script `scripts/update_db.py` in `Fantrax_MLB_Extension` to convert names to "First Last" format when generating `player_map.csv` for the Chrome extension.

## Phase 2: Pipeline Refinements
- [x] Disable the slow and error-prone fuzzy matching pass (Pass 2) in `src/core/player_lookup.py` to prevent incorrect ID matches (like Jacob Gonzalez matching with Romy Gonzalez) and save execution time.

## Phase 3: Run the Database Pipeline
- [x] Run the database update pipeline (`main.py` in `Baseball_Player_ID_Database`) to fetch fresh player lists, sheet updates, and pull active 2026 minor league rosters from the MLB Stats API.
- [x] Run the extension's sync script (`scripts/update_db.py`) to generate the updated `player_map.csv` for the extension.

## Phase 4: Verification and Git Publish
- [x] Verify that player IDs (such as Jacob Gonzalez's MLB ID `694378`) are correctly populated in the updated database.
- [x] Fetch league-owned rosters for Fantrax league `eofqrg7umiyswern` via the Harry Knows Ball API.
- [x] Cross-reference owned players against the database by name (with position checks) to verify coverage and resolve any missing IDs using manual checks.
- [x] Rebuild `player_map.csv` and ensure all changes are synced and verified.
- [x] Push the updated `player_map.csv` to GitHub so that the extension updates automatically for all users.

## Review
The database updates and verification have been completed successfully:
- **Master Database Sync**: The main pipeline was executed, yielding a substantial increase in ID coverage across minor league players. 2,537 new MLB IDs and 448 new FanGraphs IDs were added.
- **Roster Verification**: Checked all 479 owned players in the Fantrax league `eofqrg7umiyswern`. Using position-aware name matching, all 479 players were successfully matched to the database.
- **Missing IDs Resolved**: Updated 9 owned players with verified FanGraphs/MLB IDs:
  - *Brock Porter (TEX)*: Added FG ID `sa3017770`
  - *Ronny Cruz (WSH)*: Added FG ID `sa3022137`
  - *Taitn Gray (TB)*: Added FG ID `sa3032585`
  - *Jay Allen (CIN)*: Added FG ID `27446`
  - *Spencer Miles (TOR)*: Added FG ID `31621`
  - *Yordanny Monegro (BOS)*: Added MLB ID `694057` and updated FG ID to `sa3017774`
  - *Wandy Asigen (NYM)*: Added FG ID `31566`
  - *Eric Hartman (ATL)*: Added FG ID `sa3022998`
  - *Johenssy Colome (ATH)*: Added FG ID `sa3022513`
- **Known Exception**: Francisco Renteria (PHI) is correctly mapped to MLB ID `836353`. He has no FanGraphs ID yet since he is a brand new international signing (January 2026) and FanGraphs has not yet created a player profile page for him.
- **Extension Compilation**: Re-ran the sync script, rebuilding `player_map.csv` with a total of 7,816 players now correctly mapped.

