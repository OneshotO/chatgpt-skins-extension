function applyTheme(theme) {
  document.querySelectorAll('link[rel="stylesheet"][data-chatgpt-skin]').forEach(l => l.remove());

  const isDefaultTheme = theme === 'default';

  if (!isDefaultTheme) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL(`styles/${theme}.css`);
    link.dataset.chatgptSkin = true;
    document.head.appendChild(link);
  }

  if (theme === 'rick') {
    mountFloatingSprites();
  } else {
    unmountFloatingSprites();
  }

  // Keep dynamic overrides at the end of <head> so they win the cascade
  const overrideStyle = document.getElementById('cg-dynamic-overrides');
  if (overrideStyle && overrideStyle.parentNode) {
    overrideStyle.parentNode.appendChild(overrideStyle);
  }
}

function ensureStyleTag(id) {
  let style = document.getElementById(id);
  if (!style) {
    style = document.createElement('style');
    style.type = 'text/css';
    style.id = id;
    document.head.appendChild(style);
  }
  return style;
}

// Track current customization so partial storage updates don't wipe values
let currentCustomization = { accentColor: undefined, fontScale: undefined, chatTextColor: undefined, contentWidth: undefined };

function applyCustomizations({ accentColor, fontScale, chatTextColor, contentWidth }) {
  // Preserve previous values if undefined passed
  const effectiveAccent = (accentColor !== undefined) ? accentColor : currentCustomization.accentColor;
  const effectiveFontScale = (fontScale !== undefined) ? fontScale : currentCustomization.fontScale;
  const effectiveChatText = (chatTextColor !== undefined) ? chatTextColor : currentCustomization.chatTextColor;
  const effectiveWidth = (contentWidth !== undefined) ? contentWidth : currentCustomization.contentWidth;

  // Prepare dynamic stylesheet
  const style = ensureStyleTag('cg-dynamic-overrides');
  const rules = [];

  // Accent color variable and usage
  if (effectiveAccent) {
    rules.push(`:root{--cg-accent:${effectiveAccent};}`);
    rules.push(`a{color:var(--cg-accent)!important;}`);
    rules.push(`button{background:var(--cg-accent)!important;color:#000!important;}`);
    rules.push(`textarea,nav,aside,.markdown.prose.markdown-new-styling,.agent-turn,.user-turn,.group\\/turn-messages{border-color:var(--cg-accent)!important;}`);
    rules.push(`textarea,input,select{caret-color:var(--cg-accent)!important;}`);
    rules.push(`textarea:focus,input:focus,select:focus{outline:2px solid var(--cg-accent)!important;}`);
  }

  // Chat text color
  if (effectiveChatText) {
    rules.push(`:root{--cg-chat-text:${effectiveChatText};}`);
    // Target message content wrappers only
    rules.push(`.markdown.prose.markdown-new-styling,[class~="markdown"][class~="prose"][class~="markdown-new-styling"]{color:var(--cg-chat-text)!important;}`);
    // Also target outer message containers so plain text and spans inherit
    rules.push(`.agent-turn,.user-turn,.group\\/turn-messages{color:var(--cg-chat-text)!important;}`);
    // Make Tailwind Typography (.prose) use our chat color for body, headings, bold, links, lists
    rules.push(`.markdown.prose.markdown-new-styling,[class~="markdown"][class~="prose"][class~="markdown-new-styling"]{--tw-prose-body:var(--cg-chat-text);--tw-prose-headings:var(--cg-chat-text);--tw-prose-bold:var(--cg-chat-text);--tw-prose-links:var(--cg-chat-text);--tw-prose-counters:var(--cg-chat-text);--tw-prose-bullets:var(--cg-chat-text);--tw-prose-captions:var(--cg-chat-text);}`);
    // Explicitly override strong color (their rule sets color from var(--tw-prose-bold))
    rules.push(`.markdown.prose.markdown-new-styling :where(strong),[class~="markdown"][class~="prose"][class~="markdown-new-styling"] :where(strong){color:var(--cg-chat-text)!important;}`);
  }

  // Font scaling: messages only, not the whole app
  if (typeof effectiveFontScale === 'number' && !Number.isNaN(effectiveFontScale) && effectiveFontScale !== 100) {
    const factor = (effectiveFontScale / 100).toFixed(3);
    rules.push(`:root{--cg-msg-scale:${factor};}`);
    rules.push(`.markdown.prose.markdown-new-styling,[class~="markdown"][class~="prose"][class~="markdown-new-styling"]{font-size:calc(1rem * var(--cg-msg-scale)) !important;}`);
  // Ensure outer containers scale so all children (including plain strong tags) follow
  rules.push(`.agent-turn,.user-turn,.group\\/turn-messages{font-size:calc(1rem * var(--cg-msg-scale)) !important;}`);
    // Ensure headings and strong scale as well (some site styles use rem on headings)
    rules.push(`.markdown.prose.markdown-new-styling h1,[class~="markdown"][class~="prose"][class~="markdown-new-styling"] h1{font-size:calc(2em * var(--cg-msg-scale)) !important;}`);
    rules.push(`.markdown.prose.markdown-new-styling h2,[class~="markdown"][class~="prose"][class~="markdown-new-styling"] h2{font-size:calc(1.5em * var(--cg-msg-scale)) !important;}`);
    rules.push(`.markdown.prose.markdown-new-styling h3,[class~="markdown"][class~="prose"][class~="markdown-new-styling"] h3{font-size:calc(1.25em * var(--cg-msg-scale)) !important;}`);
    rules.push(`.markdown.prose.markdown-new-styling h4,[class~="markdown"][class~="prose"][class~="markdown-new-styling"] h4{font-size:calc(1.125em * var(--cg-msg-scale)) !important;}`);
    rules.push(`.markdown.prose.markdown-new-styling h5,[class~="markdown"][class~="prose"][class~="markdown-new-styling"] h5{font-size:calc(1em * var(--cg-msg-scale)) !important;}`);
    rules.push(`.markdown.prose.markdown-new-styling h6,[class~="markdown"][class~="prose"][class~="markdown-new-styling"] h6{font-size:calc(0.875em * var(--cg-msg-scale)) !important;}`);
    rules.push(`.markdown.prose.markdown-new-styling strong,[class~="markdown"][class~="prose"][class~="markdown-new-styling"] strong{font-size:calc(1em * var(--cg-msg-scale)) !important;}`);
  } else {
    // Clear scale by setting variable to 1 and no size override
    rules.push(`:root{--cg-msg-scale:1;}`);
  }

  // Content width: widen ChatGPT's narrow content column
  if (typeof effectiveWidth === 'number' && !Number.isNaN(effectiveWidth) && effectiveWidth > 50) {
    const widthVw = effectiveWidth;
    // Override the thread content max-width CSS variable used by ChatGPT
    rules.push(`[class*="thread-content-max-width"],[class*="max-w-"]{--thread-content-max-width:${widthVw}vw !important;max-width:${widthVw}vw !important;}`);
    // Target the specific containers that constrain content width
    rules.push(`.mx-auto.max-w-\\(--thread-content-max-width\\){max-width:${widthVw}vw !important;}`);
    // Broader selector for any element using the CSS variable
    rules.push(`[style*="--thread-content-max-width"]{--thread-content-max-width:${widthVw}vw !important;}`);
    // Direct override on elements with max-w classes that ChatGPT uses
    rules.push(`main .flex-1[class*="max-w"]{max-width:${widthVw}vw !important;}`);
    // Override the thread content max width variable at root and on the thread container
    rules.push(`:root{--thread-content-max-width:${widthVw}vw !important;}`);
    rules.push(`#thread *{--thread-content-max-width:${widthVw}vw !important;}`);
  }

  style.textContent = rules.join('\n');

  // Ensure overrides stay appended last so they outrank theme styles
  if (style.parentNode) {
    style.parentNode.appendChild(style);
  }

  // Update current state
  currentCustomization.accentColor = effectiveAccent;
  currentCustomization.fontScale = effectiveFontScale;
  currentCustomization.chatTextColor = effectiveChatText;
  currentCustomization.contentWidth = effectiveWidth;
}

// Animation state management
let animationState = {
  isRunning: true,
  isMounted: false,
  animId: null,
  spriteState: null
};

// Floating background sprites (Rick theme)
function mountFloatingSprites(forceRemount = false) {
  const existing = document.getElementById('cg-floating-sprites');
  if (existing && !forceRemount) {
    animationState.isMounted = true;
    if (existing.style.display === 'none') {
      existing.style.display = '';
    }
    return;
  }
  
  // Remove existing if force remount
  if (existing && forceRemount) {
    existing.parentNode.removeChild(existing);
    const s = document.getElementById('cg-floating-sprites-style');
    if (s && s.parentNode) s.parentNode.removeChild(s);
    if (animationState.animId) {
      cancelAnimationFrame(animationState.animId);
    }
  }

  // Style for sprites
  const style = ensureStyleTag('cg-floating-sprites-style');
  style.textContent = `
    #cg-floating-sprites { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
    #cg-floating-sprites .cg-sprite { position: absolute; width: 220px; height: 220px; background-size: contain; background-repeat: no-repeat; opacity: 0.25; filter: drop-shadow(0 6px 10px rgba(0,0,0,0.4)); pointer-events: auto; cursor: pointer; transition: opacity .25s ease; }
    #cg-floating-sprites .cg-sprite:hover { opacity: 0.9; }
    @media (max-width: 768px) { #cg-floating-sprites .cg-sprite { width: 90px; height: 90px; opacity: 0.4; } }
  `;

  const container = document.createElement('div');
  container.id = 'cg-floating-sprites';

  const mk = (cls, img, character) => {
    const el = document.createElement('div');
    el.className = `cg-sprite ${cls}`;
    el.style.backgroundImage = `url("${chrome.runtime.getURL('images/' + img)}")`;
    el.dataset.character = character;
    el.addEventListener('click', () => {
      playRandomVoice(character);
    });
    return el;
  };

  const sprites = [
    mk('s1', 'rick1.png', 'rick'),
    mk('s2', 'morty1.png', 'morty'),
    mk('s3', 'poopoo.png', 'poopoo')
  ];
  sprites.forEach(s => container.appendChild(s));

  document.body.appendChild(container);

  // Initialize random positions & velocities (bounded motion)
  const spriteState = sprites.map(el => {
    const size = el.getBoundingClientRect();
    const maxX = window.innerWidth - size.width;
    const maxY = window.innerHeight - size.height;
    const x = Math.random() * maxX;
    const y = Math.random() * maxY;
    // velocity between -0.075 and 0.075 px per frame (reduced for slower movement)
    const vx = (Math.random() * 0.15 - 0.075) || 0.05;
    const vy = (Math.random() * 0.15 - 0.075) || -0.05;
    el.style.transform = `translate(${x}px, ${y}px)`;
    return { el, x, y, vx, vy, w: size.width, h: size.height };
  });

  let animId;
  function step() {
    if (!animationState.isRunning) return;
    const W = window.innerWidth;
    const H = window.innerHeight;
    spriteState.forEach(s => {
      s.x += s.vx * 16; // approximate per-frame displacement
      s.y += s.vy * 16;
      // Bounce horizontally
      if (s.x <= 0) { s.x = 0; s.vx = Math.abs(s.vx); }
      else if (s.x + s.w >= W) { s.x = W - s.w; s.vx = -Math.abs(s.vx); }
      // Bounce vertically
      if (s.y <= 0) { s.y = 0; s.vy = Math.abs(s.vy); }
      else if (s.y + s.h >= H) { s.y = H - s.h; s.vy = -Math.abs(s.vy); }
      s.el.style.transform = `translate(${s.x}px, ${s.y}px)`;
    });
    if (animationState.isRunning) {
      animId = requestAnimationFrame(step);
      animationState.animId = animId;
    }
  }
  animationState.spriteState = spriteState;
  animationState.isMounted = true;
  animationState.isRunning = true;
  animId = requestAnimationFrame(step);
  animationState.animId = animId;
  container.dataset.animId = animId;
  container.dataset.spriteCount = spriteState.length;
  
  // Create control panel
  createControlPanel();
}

function unmountFloatingSprites() {
  const c = document.getElementById('cg-floating-sprites');
  if (c && c.parentNode) c.parentNode.removeChild(c);
  const s = document.getElementById('cg-floating-sprites-style');
  if (s && s.parentNode) s.parentNode.removeChild(s);
  // Cancel animation if stored
  if (animationState.animId) {
    cancelAnimationFrame(animationState.animId);
  }
  animationState.isMounted = false;
  animationState.isRunning = false;
  animationState.animId = null;
  animationState.spriteState = null;
  // Remove control panel
  removeControlPanel();
}

// Global function for closing panel (accessible from inline handlers)
window.cgClosePanel = function() {
  const panel = document.getElementById('cg-rick-control-panel');
  if (panel) {
    panel.style.display = 'none';
    showToggleButton();
  }
};

// Control panel functions
function createControlPanel() {
  const existing = document.getElementById('cg-rick-control-panel');
  if (existing) return;

  // Create panel using innerHTML for simpler structure
  const panel = document.createElement('div');
  panel.id = 'cg-rick-control-panel';
  panel.innerHTML = `
    <div class="cg-panel-header">
      <h3>Rick Control</h3>
      <button class="cg-panel-close" onclick="window.cgClosePanel(); return false;" type="button">×</button>
    </div>
    <div class="cg-panel-content">
      <button class="cg-panel-btn" id="cg-start-btn">Start Animation</button>
      <button class="cg-panel-btn" id="cg-stop-btn">Stop Animation</button>
      <button class="cg-panel-btn" id="cg-remove-btn">Remove Animation</button>
    </div>
  `;

  document.body.appendChild(panel);
  
  // Attach event handlers to buttons after they're in DOM
  const startBtn = document.getElementById('cg-start-btn');
  const stopBtn = document.getElementById('cg-stop-btn');
  const removeBtn = document.getElementById('cg-remove-btn');
  const closeBtn = panel.querySelector('.cg-panel-close');
  
  if (startBtn) startBtn.addEventListener('click', startAnimation);
  if (stopBtn) stopBtn.addEventListener('click', stopAnimation);
  if (removeBtn) removeBtn.addEventListener('click', toggleRemoveAnimation);
  
  // Add additional close handlers
  if (closeBtn) {
    closeBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      window.cgClosePanel();
      return false;
    });
    
    closeBtn.addEventListener('mousedown', function(e) {
      e.preventDefault();
      e.stopPropagation();
      window.cgClosePanel();
      return false;
    });
  }
  
  // Event delegation as backup
  panel.addEventListener('click', function(e) {
    if (e.target && (e.target.classList.contains('cg-panel-close') || e.target.closest('.cg-panel-close'))) {
      e.preventDefault();
      e.stopPropagation();
      window.cgClosePanel();
      return false;
    }
  }, true);
  
  updateButtonStates();
  hideToggleButton();
}

function showToggleButton() {
  let toggle = document.getElementById('cg-rick-panel-toggle');
  if (!toggle) {
    toggle = document.createElement('button');
    toggle.id = 'cg-rick-panel-toggle';
    toggle.textContent = '⚙';
    toggle.className = 'visible';
    toggle.addEventListener('click', () => {
      const panel = document.getElementById('cg-rick-control-panel');
      if (panel) {
        panel.style.display = 'flex';
        hideToggleButton();
        updateButtonStates();
      }
    });
    document.body.appendChild(toggle);
  } else {
    toggle.classList.add('visible');
  }
}

function hideToggleButton() {
  const toggle = document.getElementById('cg-rick-panel-toggle');
  if (toggle) {
    toggle.classList.remove('visible');
  }
}

function removeControlPanel() {
  const panel = document.getElementById('cg-rick-control-panel');
  if (panel && panel.parentNode) {
    panel.parentNode.removeChild(panel);
  }
  const toggle = document.getElementById('cg-rick-panel-toggle');
  if (toggle && toggle.parentNode) {
    toggle.parentNode.removeChild(toggle);
  }
}

function startAnimation() {
  if (!animationState.isMounted) return;
  animationState.isRunning = true;
  if (animationState.spriteState) {
    const step = () => {
      if (!animationState.isRunning) return;
      const W = window.innerWidth;
      const H = window.innerHeight;
      animationState.spriteState.forEach(s => {
        s.x += s.vx * 16;
        s.y += s.vy * 16;
        if (s.x <= 0) { s.x = 0; s.vx = Math.abs(s.vx); }
        else if (s.x + s.w >= W) { s.x = W - s.w; s.vx = -Math.abs(s.vx); }
        if (s.y <= 0) { s.y = 0; s.vy = Math.abs(s.vy); }
        else if (s.y + s.h >= H) { s.y = H - s.h; s.vy = -Math.abs(s.vy); }
        s.el.style.transform = `translate(${s.x}px, ${s.y}px)`;
      });
      if (animationState.isRunning) {
        animationState.animId = requestAnimationFrame(step);
      }
    };
    animationState.animId = requestAnimationFrame(step);
  }
  updateButtonStates();
}

function stopAnimation() {
  animationState.isRunning = false;
  if (animationState.animId) {
    cancelAnimationFrame(animationState.animId);
    animationState.animId = null;
  }
  updateButtonStates();
}

function toggleRemoveAnimation() {
  const removeBtn = document.getElementById('cg-remove-btn');
  const container = document.getElementById('cg-floating-sprites');
  
  if (animationState.isMounted && container) {
    // Remove animation
    container.style.display = 'none';
    stopAnimation();
    removeBtn.textContent = 'Create Animation';
    animationState.isMounted = false;
  } else {
    // Create animation
    if (container) {
      container.style.display = '';
      animationState.isMounted = true;
      // Re-initialize sprite state if needed
      if (!animationState.spriteState) {
        const sprites = container.querySelectorAll('.cg-sprite');
        if (sprites.length > 0) {
          animationState.spriteState = Array.from(sprites).map(el => {
            const size = el.getBoundingClientRect();
            const maxX = window.innerWidth - size.width;
            const maxY = window.innerHeight - size.height;
            const x = Math.random() * maxX;
            const y = Math.random() * maxY;
            const vx = (Math.random() * 0.15 - 0.075) || 0.05;
            const vy = (Math.random() * 0.15 - 0.075) || -0.05;
            el.style.transform = `translate(${x}px, ${y}px)`;
            return { el, x, y, vx, vy, w: size.width, h: size.height };
          });
        }
      }
      startAnimation();
    } else {
      // Re-mount sprites completely
      mountFloatingSprites(true);
    }
    removeBtn.textContent = 'Remove Animation';
  }
  updateButtonStates();
}

function updateButtonStates() {
  const startBtn = document.getElementById('cg-start-btn');
  const stopBtn = document.getElementById('cg-stop-btn');
  const removeBtn = document.getElementById('cg-remove-btn');
  
  if (!startBtn || !stopBtn || !removeBtn) return;

  if (!animationState.isMounted) {
    startBtn.disabled = true;
    stopBtn.disabled = true;
    removeBtn.textContent = 'Create Animation';
  } else {
    startBtn.disabled = animationState.isRunning;
    stopBtn.disabled = !animationState.isRunning;
    removeBtn.textContent = 'Remove Animation';
  }
}

// Voice playback configuration
const voiceFiles = {
  rick: [
    "EVERYTHINGS GONNA BE FINE - AUDIO FROM JAYUZUMI.COM.mp3",
    "I HEARD NEWS MYSELF TAKE A LISTEN ' PT1 - AUDIO FROM JAYUZUMI.COM.mp3",
    "pickle_rick.mp3",
    "riggity-riggity-wrecked-son.mp3",
    "wubalubadubdubs1.mp3",
    "wubalubadubdubs2.mp3"
  ],
  morty: [
    "I'VE NEVER FELT SO GOOD - AUDIO FROM JAYUZUMI.COM.mp3",
    "SORRY YOUR NAME BECAME FART - AUDIO FROM JAYUZUMI.COM.mp3",
    "TELL YA SOMETHING PT3 - AUDIO FROM JAYUZUMI.COM.mp3",
    "WE ALL HAVE BAD IMPULSES - AUDIO FROM JAYUZUMI.COM.mp3",
    "oh-jeez-rick.mp3",
    "ohgeez1.mp3"
  ],
  poopoo: [
    "HUNGRY PT2 - AUDIO FROM JAYUZUMI.COM.mp3",
    "I'VE ALWAYS BEEN HERE FOR YOU GUYS - AUDIO FROM JAYUZUMI.COM.mp3",
    "IS SOMETHING WRONG - AUDIO FROM JAYUZUMI.COM.mp3",
    "WE'RE HERE TO HELP - AUDIO FROM JAYUZUMI.COM.mp3",
    "god-damn_NDnVMSy.mp3"
  ]
};

let voiceAudioEl;
function playRandomVoice(character) {
  const list = voiceFiles[character];
  if (!list || !list.length) return;
  const file = list[Math.floor(Math.random() * list.length)];
  if (!voiceAudioEl) {
    voiceAudioEl = document.createElement('audio');
    voiceAudioEl.style.display = 'none';
    document.body.appendChild(voiceAudioEl);
  }
  voiceAudioEl.src = chrome.runtime.getURL(`voices/${character}/${file}`);
  voiceAudioEl.currentTime = 0;
  voiceAudioEl.play().catch(() => {/* Ignore autoplay restriction errors */});
}

// Initialize theme and customizations on load
chrome.storage.sync.get(['theme', 'accentColor', 'fontScale', 'chatTextColor', 'contentWidth'], (data) => {
  applyTheme(data.theme || 'default');
  applyCustomizations({ accentColor: data.accentColor, fontScale: data.fontScale, chatTextColor: data.chatTextColor, contentWidth: data.contentWidth });
});

// React to storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  if (changes.theme) {
    applyTheme(changes.theme.newValue || 'default');
    // Reapply stored overrides after theme switch so colors/fonts persist
    applyCustomizations({});
  }
  if (changes.accentColor || changes.fontScale || changes.chatTextColor || changes.contentWidth) {
    applyCustomizations({
      accentColor: changes.accentColor ? changes.accentColor.newValue : undefined,
      fontScale: changes.fontScale ? changes.fontScale.newValue : undefined,
      chatTextColor: changes.chatTextColor ? changes.chatTextColor.newValue : undefined,
      contentWidth: changes.contentWidth ? changes.contentWidth.newValue : undefined
    });
  }
});
