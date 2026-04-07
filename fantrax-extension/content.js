let playerMap = {};
let isLoaded = false;

// ------------------------------------------------------------
// 1. DATA LOADING
// ------------------------------------------------------------
// Fetch the latest player map from chrome.storage.local memory.
console.log('Fantrax Linker: Requesting player map from storage...');
chrome.storage.local.get(['playerMap'], (result) => {
    if (result.playerMap) {
        playerMap = result.playerMap;
        isLoaded = true;
        console.log('Fantrax Linker: Player map loaded with ' + Object.keys(playerMap).length + ' entries.');
        init();
    } else {
        console.warn('Fantrax Linker: No player map found in storage. Ensure the background script has fetched the data.');
    }
});

// Watch for data updates in the background without needing to refresh
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.playerMap) {
        console.log('Fantrax Linker: Player map updated in background. Refreshing local memory...');
        playerMap = changes.playerMap.newValue;
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
        processPage();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
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
    // These contain the headshot image which has the ID we need.
    const scorers = document.querySelectorAll('scorer');
    scorers.forEach(scorer => {
        if (scorer.classList.contains('fantrax-linker-processed')) return;

        const figure = scorer.querySelector('figure.scorer__image');
        if (figure) {
            const style = figure.getAttribute('style') || '';
            const idMatch = style.match(/hs([a-z0-9]+)_/i);
            if (idMatch) {
                const fantraxId = idMatch[1];
                const playerData = playerMap[fantraxId];
                if (playerData) {
                    const nameLink = scorer.querySelector('.scorer__info__name a');
                    if (nameLink) {
                        injectLinks(nameLink, playerData);
                    }
                }
            }
        }
        scorer.classList.add('fantrax-linker-processed');
    });

    // 2. Process standalone player links (Popups and other areas)
    const playerLinks = document.querySelectorAll('a[href*="playerProfile.go"], a[href*="/player/"]');
    playerLinks.forEach(link => {
        if (link.classList.contains('fantrax-linker-processed')) return;

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

        if (fantraxId) {
            let playerData = playerMap[fantraxId];
            if (playerData) {
                injectLinks(link, playerData);
            }
        }

        link.classList.add('fantrax-linker-processed');
    });
}

// ------------------------------------------------------------
// 4. INJECTING UI LINKS
// ------------------------------------------------------------
// This builds the actual clickable diamond/circle icons and physical
// HTML tags, and pushes them directly into the Fantrax webpage UI.
function injectLinks(element, data) {
    // If the element is within another link or already has our icons, skip it
    if (element.querySelector('.fantrax-linker-links')) return;
    
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
