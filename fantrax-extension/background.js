// This is a Service Worker script that runs in the background of Chrome.
// Link to your data file on GitHub so others can use it immediately.
// We point to the "main" branch version of player_map.csv
const CSV_URL = 'https://raw.githubusercontent.com/greggmorris22/Fantrax-MLB-Extension/main/data/player_map.csv';

// If a download fails (computer just woke up, Wi-Fi reconnecting, etc.),
// try again a minute later instead of waiting 6 hours. After this many
// quick retries in a row we give up until the next 6-hour check.
const MAX_QUICK_RETRIES = 5;

chrome.runtime.onInstalled.addListener(() => {
    console.log('Fantrax Player Linker extension installed.');
    // Older versions also saved a separate name list. The page now builds
    // that itself, so clear out the old copy.
    chrome.storage.local.remove('nameMap');

    // Run fetch on install
    fetchAndStorePlayerData();

    // Set alarm to fetch every 6 hours
    chrome.alarms.create('fetchDataAlarm', { periodInMinutes: 360 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'fetchDataAlarm' || alarm.name === 'retryFetchAlarm') {
        fetchAndStorePlayerData();
    }
});

function parseCSV(csvText) {
    const lines = csvText.split(/\r?\n/);
    const playerMap = {};
    if (lines.length === 0) return playerMap;

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        let cols = [];
        let curr = '';
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                cols.push(curr);
                curr = '';
            } else {
                curr += char;
            }
        }
        cols.push(curr);

        if (cols.length >= 3) {
            const cleanCol = (c) => c.replace(/^"|"$/g, '').trim();
            const fid = cleanCol(cols[0]);
            const mlbId = cleanCol(cols[1]);
            const fgId = cleanCol(cols[2]);
            const name = cols[3] ? cleanCol(cols[3]) : '';
            const team = cols[4] ? cleanCol(cols[4]) : '';
            const position = cols[5] ? cleanCol(cols[5]) : '';

            const playerData = {
                mlbam: mlbId || null,
                fg: fgId || null,
                name: name || null,
                team: team || null,
                position: position || null
            };

            // Every row has a Fantrax ID, so this one list is all we store.
            // The page builds its own name lookup from it.
            if (fid) playerMap[fid] = playerData;
        }
    }
    return playerMap;
}

async function fetchAndStorePlayerData() {
    console.log('Fantrax Linker: Fetching latest player data from cloud...');
    try {
        const response = await fetch(CSV_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        const playerMap = parseCSV(csvText);

        const keysCount = Object.keys(playerMap).length;
        if (keysCount === 0) {
            throw new Error('Parsed CSV resulted in 0 players.');
        }
        await chrome.storage.local.set({ playerMap, fetchRetries: 0 });
        console.log(`Fantrax Linker: Stored ${keysCount} players.`);
    } catch (err) {
        await scheduleRetry(err);
    }
}

// A failed download is usually a passing network blip, and the last good
// player list is still saved, so log a warning (not an error) and retry soon.
async function scheduleRetry(err) {
    const { fetchRetries = 0 } = await chrome.storage.local.get('fetchRetries');
    if (fetchRetries < MAX_QUICK_RETRIES) {
        await chrome.storage.local.set({ fetchRetries: fetchRetries + 1 });
        chrome.alarms.create('retryFetchAlarm', { delayInMinutes: 1 });
        console.warn(`Fantrax Linker: Couldn't download player data (${err.message}). Trying again in 1 minute.`);
    } else {
        await chrome.storage.local.set({ fetchRetries: 0 });
        console.warn(`Fantrax Linker: Couldn't download player data (${err.message}). Will try again at the next 6-hour check. Saved data is still in use.`);
    }
}
