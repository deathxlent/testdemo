document.getElementById('captureBtn').addEventListener('click', async () => {
  const btn = document.getElementById('captureBtn');
  const status = document.getElementById('status');

  btn.disabled = true;
  status.innerHTML = '<span class="spinner"></span>正在截取整页...';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const response = await chrome.runtime.sendMessage({
      action: 'captureFullPage',
      tabId: tab.id
    });

    if (response.success) {
      status.textContent = `✓ 截图已保存：${response.filename}`;
      setTimeout(() => window.close(), 2000);
    } else {
      throw new Error(response.error || '截图失败');
    }
  } catch (error) {
    status.textContent = '❌ ' + error.message;
    btn.disabled = false;
  }
});
