let playerMap = {};
let nameMap = {};
let isLoaded = false;

// ------------------------------------------------------------
// 1. DATA LOADING
// ------------------------------------------------------------
// Fetch the latest player map from chrome.storage.local memory.
console.log('Fantrax Linker: Requesting player map from storage...');
chrome.storage.local.get(['playerMap', 'nameMap'], (result) => {
    if (result.playerMap) {
        playerMap = result.playerMap;
        nameMap = result.nameMap || {};
        isLoaded = true;
        console.log('Fantrax Linker: Data loaded (IDs: ' + Object.keys(playerMap).length + ', Names: ' + Object.keys(nameMap).length + ')');
        init();
    } else {
        console.warn('Fantrax Linker: No player map found in storage. Ensure the background script has fetched the data.');
    }
});

// Watch for data updates in the background without needing to refresh
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes.playerMap) playerMap = changes.playerMap.newValue;
        if (changes.nameMap) nameMap = changes.nameMap.newValue;
        isLoaded = true;
        processPage();
    }
});

// ------------------------------------------------------------
// 2. PAGE OBSERVER (Monitoring for changes)
// ------------------------------------------------------------
// Because Fantrax frequently updates the screen without fully
// refreshing the page (like when you switch tabs or change views),
// we use a "MutationObserver". This tool constantly watches the 
// webpage for any new elements appearing, and runs our link 
// injection logic again whenever the screen shifts.
function init() {
    const observer = new MutationObserver((mutations) => {
        // We run our logic if anything in the content changes.
        // Fantrax uses a lot of dynamic updates, so we watch for 
        // new elements (childList) and important attribute changes.
        processPage();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true, 
        attributeFilter: ['style', 'href'] // Watch for ID shifts in headshots or links
    });

    processPage();
}

// ------------------------------------------------------------
// 3. FINDING PLAYERS
// ------------------------------------------------------------
// This function searches the page for specific HTML tags and 
// class names that Fantrax uses to display player names.
function processPage() {
    if (!isLoaded) return;

    // 1. Process Scorer blocks (Main Roster Table)
    // Fantrax reuses these elements when you change filters, so we 
    // must check the player ID inside them every time.
    const scorers = document.querySelectorAll('scorer');
    scorers.forEach(scorer => {
        const nameLink = scorer.querySelector('.scorer__info__name a');
        if (!nameLink) return;

        // Find the current player ID from the headshot image style
        let fantraxId = null;
        const figure = scorer.querySelector('figure.scorer__image');
        if (figure) {
            const style = figure.getAttribute('style') || '';
            const idMatch = style.match(/hs([a-z0-9]+)_/i);
            if (idMatch) fantraxId = idMatch[1].toLowerCase();
        }

        const playerName = nameLink.textContent.trim().toLowerCase();
        const trackingKey = fantraxId || playerName;

        // If this block is already showing the correct player's links, skip it
        if (scorer.dataset.fantraxId === trackingKey) return;

        // Otherwise (it's new or the player changed), remove any old links tray
        const oldLinks = scorer.querySelector('.fantrax-linker-links');
        if (oldLinks) oldLinks.remove();

        // Find data for the player currently in this row
        const playerData = fantraxId ? playerMap[fantraxId] : nameMap[playerName];
        
        if (playerData) {
            injectLinks(nameLink, playerData);
        }
        
        // Mark as processed for THIS player. If the player changes, 
        // this ID will no longer match and we will refresh the links.
        scorer.dataset.fantraxId = trackingKey;
    });

    // 2. Process standalone player links (Popups and other areas)
    const playerLinks = document.querySelectorAll('a[href*="playerProfile.go"], a[href*="/player/"]');
    playerLinks.forEach(link => {
        // Skip links that are actually our own injected icons
        if (link.classList.contains('fantrax-linker-circle')) return;

        let fantraxId = null;
        const href = link.href.toLowerCase();

        const idMatch = href.match(/[f]?pid=([a-z0-9]+)/i);
        if (idMatch) {
            fantraxId = idMatch[1];
        } else if (href.includes('/player/')) {
            const parts = href.split('/');
            const idx = parts.findIndex(p => p === 'player');
            if (idx !== -1 && parts[idx + 1]) {
                fantraxId = parts[idx + 1].split(';')[0].split('?')[0];
            }
        }

        const playerName = link.textContent.trim().toLowerCase();
        const trackingKey = (fantraxId || playerName) + href;

        // Skip if already processed for this specific link state
        if (link.dataset.fantraxId === trackingKey) return;

        // Cleanup sibling if it was our links tray
        const next = link.nextElementSibling;
        if (next && next.classList.contains('fantrax-linker-links')) {
            next.remove();
        }

        const playerData = fantraxId ? playerMap[fantraxId] : nameMap[playerName];
        if (playerData) {
            injectLinks(link, playerData);
        }

        link.dataset.fantraxId = trackingKey;
    });
}

// ------------------------------------------------------------
// 4. INJECTING UI LINKS
// ------------------------------------------------------------
// This builds the actual clickable diamond/circle icons and physical
// HTML tags, and pushes them directly into the Fantrax webpage UI.
function injectLinks(element, data) {
    // Determine the tray if it already exists (though caller handles removal now)
    const parent = element.parentElement;
    if (parent.querySelector('.fantrax-linker-links')) return;
    
    // Create our wrapper span that holds both links
    const container = document.createElement('span');
    container.className = 'fantrax-linker-links';

    // Build the Fangraphs Link (Green Diamond)
    if (data.fg) {
        const fgLink = document.createElement('a');
        const slug = data.name ? data.name.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'player';
        fgLink.href = `https://www.fangraphs.com/players/${slug}/${data.fg}/stats`;
        fgLink.target = '_blank';
        fgLink.title = 'View on Fangraphs';
        fgLink.className = 'fantrax-linker-circle fantrax-linker-fangraphs';
        container.appendChild(fgLink);
    }

    // Build the Baseball Savant Link (Red/Blue Circle)
    if (data.mlbam) {
        const savantLink = document.createElement('a');
        savantLink.href = `https://baseballsavant.mlb.com/savant-player/${data.mlbam}`;
        savantLink.target = '_blank';
        savantLink.title = 'View on Baseball Savant';
        savantLink.className = 'fantrax-linker-circle fantrax-linker-savant';
        container.appendChild(savantLink);
    }

    // Insert the container directly AFTER the name link
    element.insertAdjacentElement('afterend', container);
}
