let searchWindows = [];

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({
      maxWindows: 3,
      closeKey: 'Escape'
    }, resolve);
  });
}

async function openRottenTomatoesPopup(url) {
  const settings = await getSettings();
  
  // Clean up old windows
  searchWindows = (await Promise.all(
    searchWindows.map(async (windowId) => {
      try {
        await chrome.windows.get(windowId);
        return windowId;
      } catch {
        return null;
      }
    })
  )).filter(Boolean);

  // Limit number of open windows
  if (searchWindows.length >= settings.maxWindows) {
    chrome.windows.remove(searchWindows.shift());
  }
  
  chrome.windows.getCurrent({}, (parentWindow) => {
    const width = 1100;
    const height = 1200;
    
    const left = parentWindow.left + parentWindow.width - width - 20;
    const top = parentWindow.top + 50;

    chrome.windows.create({
      url: url,
      type: 'popup',
      width: width,
      height: height,
      left: left,
      top: top,
      focused: true
    }, (window) => {
      searchWindows.push(window.id);
      
      // Add keyboard listener
      chrome.tabs.query({ windowId: window.id }, (tabs) => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: (closeKey) => {
            document.addEventListener('keydown', (e) => {
              if (e.key === closeKey) {
                window.close();
              }
            });
          },
          args: [settings.closeKey]
        });
      });
    });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openRottenTomatoes") {
    openRottenTomatoesPopup(request.url);
  }
}); 