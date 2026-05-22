const updateColorDisplay = (inputEl) => {
  const mirror = document.querySelector(`.color-value[data-target="${inputEl.id}"]`);
  if (mirror) {
    mirror.textContent = inputEl.value.toUpperCase();
  }
};

// Persist selected theme
document.getElementById('themeSelect').addEventListener('change', (e) => {
  chrome.storage.sync.set({ theme: e.target.value });

  // Apply recommended defaults for Eye Protection mode
  if (e.target.value === 'eye') {
    const eyeFont = 115;
    const eyeWidth = 65;
    fontRange.value = eyeFont;
    fontValue.textContent = `${eyeFont}%`;
    widthRange.value = eyeWidth;
    widthValue.textContent = `${eyeWidth}%`;
    chrome.storage.sync.set({ fontScale: eyeFont, contentWidth: eyeWidth });
  }
});

// Persist accent color
const accentInput = document.getElementById('accentColor');
accentInput.addEventListener('input', (e) => {
  const accentColor = e.target.value;
  chrome.storage.sync.set({ accentColor });
  updateColorDisplay(accentInput);
});

// Persist font size scale (in percent)
const fontRange = document.getElementById('fontSizeRange');
const fontValue = document.getElementById('fontSizeValue');
fontRange.addEventListener('input', (e) => {
  const fontScale = parseInt(e.target.value, 10);
  fontValue.textContent = `${fontScale}%`;
  chrome.storage.sync.set({ fontScale });
});

// Persist content width (in percent)
const widthRange = document.getElementById('contentWidthRange');
const widthValue = document.getElementById('contentWidthValue');
widthRange.addEventListener('input', (e) => {
  const contentWidth = parseInt(e.target.value, 10);
  widthValue.textContent = `${contentWidth}%`;
  chrome.storage.sync.set({ contentWidth });
});

// Persist chat text color
const chatTextInput = document.getElementById('chatTextColor');
chatTextInput.addEventListener('input', (e) => {
  const chatTextColor = e.target.value;
  chrome.storage.sync.set({ chatTextColor });
  updateColorDisplay(chatTextInput);
});

// Reset button: clear customizations (keep theme selection)
const resetBtn = document.getElementById('resetBtn');
resetBtn.addEventListener('click', () => {
  // Clear stored keys
  chrome.storage.sync.remove(['accentColor', 'fontScale', 'chatTextColor', 'contentWidth'], () => {
    // Reset UI controls to defaults
    accentInput.value = '#39ff14';
    fontRange.value = 100;
    fontValue.textContent = '100%';
    widthRange.value = 50;
    widthValue.textContent = '50%';
    chatTextInput.value = '#e0ffe0';
    updateColorDisplay(accentInput);
    updateColorDisplay(chatTextInput);
    // Notify content to clear overrides
    chrome.storage.sync.set({
      accentColor: null,
      fontScale: null,
      chatTextColor: null,
      contentWidth: null
    });
  });
});

// Initialize popup controls from storage
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['theme', 'accentColor', 'fontScale', 'chatTextColor', 'contentWidth'], (data) => {
    if (data.theme) {
      document.getElementById('themeSelect').value = data.theme;
    }
    if (data.accentColor) {
      accentInput.value = data.accentColor;
    }
    updateColorDisplay(accentInput);
    if (typeof data.fontScale === 'number') {
      fontRange.value = data.fontScale;
      fontValue.textContent = `${data.fontScale}%`;
    }
    if (typeof data.contentWidth === 'number') {
      widthRange.value = data.contentWidth;
      widthValue.textContent = `${data.contentWidth}%`;
    }
    if (data.chatTextColor) {
      chatTextInput.value = data.chatTextColor;
    }
    updateColorDisplay(chatTextInput);
  });
});