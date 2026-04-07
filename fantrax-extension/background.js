// This is a Service Worker script that runs in the background of Chrome.
// Link to your data file on GitHub so others can use it immediately.
// We point to the "main" branch version of player_map.csv
const CSV_URL = 'https://raw.githubusercontent.com/greggmorris22/Fantrax-MLB-Extension/main/data/player_map.csv';

chrome.runtime.onInstalled.addListener(() => {
    console.log('Fantrax Player Linker extension installed.');
    // Run fetch on install
    fetchAndStorePlayerData();

    // Set alarm to fetch every 6 hours
    chrome.alarms.create('fetchDataAlarm', { periodInMinutes: 360 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'fetchDataAlarm') {
        fetchAndStorePlayerData();
    }
});

function parseCSV(csvText) {
    const lines = csvText.split(/\r?\n/);
    const playerMap = {};
    const nameMap = {};
    if (lines.length === 0) return { playerMap, nameMap };

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

            const playerData = {
                mlbam: mlbId || null,
                fg: fgId || null,
                name: name || null
            };

            if (fid) playerMap[fid] = playerData;
            if (name) nameMap[name.toLowerCase()] = playerData;
        }
    }
    return { playerMap, nameMap };
}

async function fetchAndStorePlayerData() {
    console.log('Fantrax Linker: Fetching latest player data from cloud...');
    try {
        const response = await fetch(CSV_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        const { playerMap, nameMap } = parseCSV(csvText);

        const keysCount = Object.keys(playerMap).length;
        if (keysCount > 0) {
            await chrome.storage.local.set({ playerMap, nameMap });
            console.log(`Fantrax Linker: Stored ${keysCount} IDs and ${Object.keys(nameMap).length} names.`);
        } else {
            console.error('Fantrax Linker: Parsed CSV resulted in 0 players.');
        }
    } catch (err) {
        console.error('Fantrax Linker: Error fetching player data:', err);
    }
}
