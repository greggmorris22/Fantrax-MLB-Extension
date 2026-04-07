// Fantrax to Fangraphs Linker Content Script
console.log("Fantrax FanGraphs Linker loaded");

// SVG for the Fangraphs logo (simplified - green diamond)
const fangraphsIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="14px" height="14px">
  <rect width="48" height="48" fill="#4CAF50"/>
  <path d="M24 10 L38 24 L24 38 L10 24 Z" fill="#FFFFFF"/>
</svg>
`;

// Player lookup map (loaded from player_lookup.json)
// Structure: { 
//   byFantraxId: { "fantaxId": { fgId, name, pos, team } },
//   byName: { "Name": [ { fgId, pos, team } ] }
// }
let playerLookup = null;
let lookupLoaded = false;

// Load the player lookup JSON
async function loadPlayerLookup() {
    try {
        const url = chrome.runtime.getURL('player_lookup.json');
        const response = await fetch(url);
        if (response.ok) {
            playerLookup = await response.json();
            lookupLoaded = true;
            console.log(`Loaded lookup: ${Object.keys(playerLookup.byFantraxId || {}).length} by FantraxID, ${Object.keys(playerLookup.byName || {}).length} by name`);
            // Process the document now that we have the lookup
            processNode(document);
        } else {
            console.error('Failed to load player lookup:', response.status);
        }
    } catch (error) {
        console.error('Error loading player lookup:', error);
    }
}

// Determine if a position string indicates a pitcher
function isPitcher(posString) {
    if (!posString) return null;
    const pos = posString.toUpperCase();
    // Pitcher positions
    if (pos.includes('SP') || pos.includes('RP') || pos === 'P') {
        return true;
    }
    // Hitter positions
    if (pos.match(/\b(C|1B|2B|3B|SS|LF|CF|RF|OF|DH|IF|UTIL)\b/)) {
        return false;
    }
    return null;
}

// Find the best matching player from the lookup entries
function findBestMatch(entries, positionFromPage) {
    if (!entries || entries.length === 0) return null;

    // If only one entry, return it
    if (entries.length === 1) {
        return entries[0];
    }

    // Try to match by position
    const pageIsPitcher = isPitcher(positionFromPage);

    if (pageIsPitcher !== null) {
        for (const entry of entries) {
            const entryIsPitcher = entry.pos === 'P';
            const entryIsHitter = entry.pos === 'H';

            if (pageIsPitcher && entryIsPitcher) {
                return entry;
            }
            if (!pageIsPitcher && entryIsHitter) {
                return entry;
            }
        }
    }

    // Fallback: return the first entry with position data, or just the first
    for (const entry of entries) {
        if (entry.pos) return entry;
    }
    return entries[0];
}

function createFangraphsLink(playerName, fangraphsId) {
    const link = document.createElement('a');
    // Use the proper Fangraphs URL with player ID
    const slugName = playerName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    link.href = `https://www.fangraphs.com/players/${slugName}/${fangraphsId}/stats`;
    link.target = '_blank';
    link.className = 'fangraphs-link';
    link.innerHTML = fangraphsIconSvg;
    link.title = `View ${playerName} on FanGraphs`;
    // Stop propagation to prevent interfering with Fantrax's own click handlers
    link.addEventListener('click', (e) => e.stopPropagation());
    return link;
}

// Extract FantraxID from a player row if possible
function extractFantraxId(scorerInfo) {
    // Look for links that contain Fantrax player IDs
    // Common patterns: href containing the player ID, data attributes, etc.
    const parentRow = scorerInfo.closest('tr, .roster-row, [class*="row"]');
    if (!parentRow) return null;

    // Look for any element with a data attribute containing player ID
    const elementsWithData = parentRow.querySelectorAll('[data-player-id], [data-id], [id*="player"]');
    for (const el of elementsWithData) {
        const id = el.getAttribute('data-player-id') || el.getAttribute('data-id');
        if (id) return id;
    }

    // Look for fantrax links that might contain player IDs
    const links = parentRow.querySelectorAll('a[href*="fantrax.com"]');
    for (const link of links) {
        const href = link.getAttribute('href');
        // Extract ID from URL patterns like /player/123 or playerId=123
        const match = href.match(/\/player\/([^\/\?]+)|playerId=([^&]+)/);
        if (match) {
            return match[1] || match[2];
        }
    }

    return null;
}

function processNode(node) {
    // Don't process until lookup is loaded
    if (!lookupLoaded || !playerLookup) {
        return;
    }

    // Find all scorer__info containers that haven't been processed
    const scorerInfos = node.querySelectorAll ?
        node.querySelectorAll('.scorer__info:not([data-fg-processed])') : [];

    scorerInfos.forEach(scorerInfo => {
        // Mark as processed
        scorerInfo.setAttribute('data-fg-processed', 'true');

        // Find the player name link
        const nameLink = scorerInfo.querySelector('.scorer__info__name a[tabindex="0"]');
        if (!nameLink) return;

        const playerName = nameLink.textContent.trim();
        if (!playerName) return;

        // Find position info
        const positionsDiv = scorerInfo.querySelector('.scorer__info__positions');
        let positionStr = '';
        if (positionsDiv) {
            const posSpan = positionsDiv.querySelector('span:first-child');
            if (posSpan) {
                positionStr = posSpan.textContent.trim();
            }
        }

        let fangraphsId = null;

        // Try 1: Look up by FantraxID (most accurate)
        const fantraxId = extractFantraxId(scorerInfo);
        if (fantraxId && playerLookup.byFantraxId && playerLookup.byFantraxId[fantraxId]) {
            const entry = playerLookup.byFantraxId[fantraxId];
            fangraphsId = entry.fgId;
        }

        // Try 2: Look up by name with position disambiguation
        if (!fangraphsId && playerLookup.byName) {
            const entries = playerLookup.byName[playerName];
            if (entries) {
                const bestMatch = findBestMatch(entries, positionStr);
                if (bestMatch && bestMatch.fgId) {
                    fangraphsId = bestMatch.fgId;
                }
            }
        }

        if (!fangraphsId) {
            console.log(`Player not found: ${playerName} (pos: ${positionStr})`);
            return;
        }

        // Check if link already exists
        if (nameLink.nextSibling && nameLink.nextSibling.classList &&
            nameLink.nextSibling.classList.contains('fangraphs-link')) {
            return;
        }

        const link = createFangraphsLink(playerName, fangraphsId);
        nameLink.parentNode.insertBefore(link, nameLink.nextSibling);
    });

    // Also handle standalone anchors (for pages with different structure)
    const standaloneAnchors = node.querySelectorAll ?
        node.querySelectorAll('a[tabindex="0"]:not([data-fg-processed])') : [];

    standaloneAnchors.forEach(anchor => {
        // Skip if already inside a processed scorer__info
        if (anchor.closest('.scorer__info[data-fg-processed]')) {
            return;
        }

        anchor.setAttribute('data-fg-processed', 'true');

        const text = anchor.textContent.trim();
        if (!playerLookup.byName) return;

        const entries = playerLookup.byName[text];

        if (entries && entries.length > 0) {
            const entry = entries[0];
            if (entry && entry.fgId) {
                if (anchor.nextSibling && anchor.nextSibling.classList &&
                    anchor.nextSibling.classList.contains('fangraphs-link')) {
                    return;
                }
                const link = createFangraphsLink(text, entry.fgId);
                anchor.parentNode.insertBefore(link, anchor.nextSibling);
            }
        }
    });
}

// Observer to handle dynamic content loading
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                    processNode(node);
                }
            });
        }
    });
});

// Start loading the lookup, then start observing
loadPlayerLookup().then(() => {
    // Start observing for dynamic content
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});
