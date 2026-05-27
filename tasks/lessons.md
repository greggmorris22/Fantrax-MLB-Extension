# Lessons Learned

## Dynamic Web Pages & Row Reuse
- **Issue:** In modern web apps (like Fantrax), filtering a table often reuses the same HTML elements (rows/cells) and just changes the text/images inside them.
- **Problem:** If an extension marks a row as "processed" using a simple class, it will skip that row even if the player inside it has changed.
- **Solution:** Instead of a generic "processed" class, use a data attribute (`dataset.fantraxId`) to store the specific ID of the item being displayed. Check this ID every time the page changes. If it doesn't match the current ID, refresh the injected content.
- **Tooling:** Use `MutationObserver` with `attributes: true` and `attributeFilter` if you need to detect changes to IDs stored in attributes (like headshot URLs or `href` links).

## ID Formats & Roster Matching
- **Issue:** Fantrax uses multiple ID formats for the same player across different areas: 5-character legacy IDs (e.g., `050w9`) are used for headshot images and scorer blocks, while 8-character IDs (e.g., `QbdzhwOi`) are returned by the league API.
- **Problem:** Matching league-owned rosters to the database using `fantraxId` directly resulted in mismatches and duplicate entries.
- **Solution:** Match players by normalized name (lowercase, accent-stripped, suffix-ignored) and apply a position check (pitcher vs hitter) to handle identical name duplicates (like starting pitcher Jared Jones vs hitter Jared Jones). Resolve missing IDs manually and update the database.

