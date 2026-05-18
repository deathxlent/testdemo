const toggle = document.getElementById('enableToggle');

chrome.storage.sync.get({ enabled: true }, (result) => {
  toggle.checked = result.enabled;
});

toggle.addEventListener('change', () => {
  const enabled = toggle.checked;
  chrome.storage.sync.set({ enabled });
  
  chrome.runtime.sendMessage({ type: 'TOGGLE_STATE', enabled });
});
