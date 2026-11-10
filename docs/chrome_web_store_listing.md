# Chrome Web Store: copy-paste answers

Everything the developer dashboard asks for, in the order it asks. Upload file: `Player_Linker_for_Fantrax_v5.5.zip`.

## Store listing tab

**Description** (the long one):

```
Adds quick links to Fangraphs, Baseball Savant and Baseball-Reference next to every player name on Fantrax.

How it works
- A small link icon sits next to each player on your roster, the player pool, matchups and other Fantrax pages.
- Hover over it and three logos pop out: Fangraphs, Baseball Savant and Baseball-Reference.
- Click a logo to open that player's page. Prospects go to their minor league pages.

Also
- Hides Fantrax's ad boxes so the roster is easier to read.
- The player ID list updates itself in the background every few hours, so new call-ups get links without reinstalling.

Privacy
The extension collects no data. It only reads player names already shown on Fantrax pages, inside your browser.

Not affiliated with or endorsed by Fantrax, Fangraphs, MLB or Sports Reference.
```

**Category:** Sports
**Language:** English (United States)

**Graphics:**
- Store icon: `icons/icon128.png` (inside the extension folder)
- Screenshot: at least one, 1280x800 or 640x400. A screenshot of your Fantrax roster with the logos popped out on one player.
- Small promo tile (440x280): optional, skip it.

**Additional fields:** Homepage URL and Support URL can both be `https://github.com/greggmorris22/Fantrax-MLB-Extension`. Leave the rest blank.

## Privacy practices tab

**Single purpose description:**

```
Adds links to each player's Fangraphs, Baseball Savant and Baseball-Reference pages next to player names on Fantrax.
```

**Permission justifications:**

- **storage:** `Saves the downloaded list of player IDs on the user's computer so links can be added without downloading the list on every page load.`
- **alarms:** `Refreshes the player ID list every 6 hours, and retries a minute later if a download fails, so new players get links without reinstalling the extension.`
- **Host permission (raw.githubusercontent.com/greggmorris22/\*):** `Downloads the public player ID list (a CSV file) from the extension's own GitHub repository. No user data is sent.`
- **Content script on fantrax.com** (shows up as a host permission): `Reads player names and IDs already shown on Fantrax pages so it can place the right links next to them, and hides ad boxes. Runs only on fantrax.com.`

**Are you using remote code?** No, I am not using remote code. (The downloaded file is a data list, not code.)

**Data usage:** check none of the boxes. Then check all three certifications:
- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL:** `https://github.com/greggmorris22/Fantrax-MLB-Extension/blob/main/PRIVACY.md`

## Distribution tab

- **Payments:** Free of charge
- **Visibility:** Unlisted (only people with the link can find it)
- **Distribution:** All regions
