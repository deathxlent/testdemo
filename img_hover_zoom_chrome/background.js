chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get({ enabled: true }, (result) => {
    chrome.storage.sync.set({ enabled: result.enabled });
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TOGGLE_STATE') {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'STATE_CHANGED',
          enabled: message.enabled
        }).catch(() => {});
      });
    });
  }
});
