// Show the version number from manifest.json, so it only has to be
// changed in one place when a new version comes out.
document.getElementById('version').textContent = 'v' + chrome.runtime.getManifest().version;
