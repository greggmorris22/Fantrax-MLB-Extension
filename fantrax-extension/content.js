let playerMap = {};
let isLoaded = false;

// ------------------------------------------------------------
// 1. DATA LOADING
// ------------------------------------------------------------
// This section currently fetches the 'player_map.json' that is 
// bundled locally inside the extension. 
// We will update this later to fetch dynamically from GitHub 
// via the background script.
console.log('Fantrax Linker: Loading player map...');
fetch(chrome.runtime.getURL('player_map.json'))
    .then(response => response.json())
    .then(data => {
        playerMap = data;
        isLoaded = true;
        console.log('Fantrax Linker: Player map loaded with ' + Object.keys(data).length + ' entries.');
        init();
    })
    .catch(err => console.error('Fantrax Linker: Error loading player map:', err));

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

    // These selectors target different areas of Fantrax where player names appear
    const selectors = [
        '.scorer__info__name a',
        'a[href*="playerProfile.go"]',
        'a[href*="/player/"]',
        '.player-linker a'
    ];

    const playerLinks = document.querySelectorAll(selectors.join(', '));

    playerLinks.forEach(link => {
        // If we already added links next to this player, skip them
        if (link.classList.contains('fantrax-linker-processed')) return;

        let name = link.textContent.trim();
        if (!name) return;

        // Clean up the name string by removing injury brackets like "(IL)"
        // or position codes that sometimes get pasted into the name block
        let cleanName = name
            .replace(/\s*\([\w\d]+\)\s*$/, '')
            .replace(/\s+[A-Z,1-9\/]{1,6}$/, '')
            .trim()
            .toLowerCase();

        // Check if our JSON map has this exact name
        let playerData = playerMap[cleanName];

        // Fantrax sometimes lists names backwards like "Ohtani, Shohei"
        // This checks if there is a comma, and flips it to "Shohei Ohtani"
        if (!playerData && cleanName.includes(',')) {
            const parts = cleanName.split(',').map(p => p.trim());
            if (parts.length === 2) {
                const reverseName = `${parts[1]} ${parts[0]}`;
                playerData = playerMap[reverseName];
                if (playerData) cleanName = reverseName;
            }
        }

        // If we found a match in our database, inject the UI links
        if (playerData) {
            injectLinks(link, playerData);
        }

        // Mark this specific name as "processed" so we don't duplicate links
        link.classList.add('fantrax-linker-processed');
    });
}

// ------------------------------------------------------------
// 4. INJECTING UI LINKS
// ------------------------------------------------------------
// This builds the actual clickable diamond/circle icons and physical
// HTML tags, and pushes them directly into the Fantrax webpage UI.
function injectLinks(element, data) {
    // Find the container for the second line (positions, team, icons)
    const scorerInfo = element.closest('.scorer__info');
    let targetContainer = null;

    if (scorerInfo) {
        targetContainer = scorerInfo.querySelector('.scorer__info__positions');
    }

    // If no specific container found (old UI), fallback to after the element itself
    if (!targetContainer) {
        targetContainer = element.parentNode;
    }

    // Check if already injected
    if (targetContainer.querySelector('.fantrax-linker-links')) return;

    // Create our wrapper span that holds both links
    const container = document.createElement('span');
    container.className = 'fantrax-linker-links';

    // Build the Fangraphs Link (Green Diamond)
    if (data.fg) {
        const fgLink = document.createElement('a');
        const slug = data.fg_slug || 'player';
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

    // Append our new icons to the end of the container (after positions/team/icons)
    targetContainer.appendChild(container);
}
