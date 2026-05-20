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
      status.textContent = '截图完成，正在下载...';
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `screenshot-${timestamp}.png`;
      
      await chrome.downloads.download({
        url: response.dataUrl,
        filename: filename,
        saveAs: true
      });

      status.textContent = '✓ 截图保存成功！';
      setTimeout(() => window.close(), 1500);
    } else {
      throw new Error(response.error || '截图失败');
    }
  } catch (error) {
    status.textContent = '❌ ' + error.message;
    btn.disabled = false;
  }
});
