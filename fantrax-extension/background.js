// This is a Service Worker script that runs in the background of Chrome.
// Currently, it just logs a message when the extension is installed, 
// but this is where we will add the logic to fetch the latest Player ID Map from GitHub 
// instead of relying on the local static file.
chrome.runtime.onInstalled.addListener(() => {
    console.log('Fantrax Player Linker extension installed.');
});
