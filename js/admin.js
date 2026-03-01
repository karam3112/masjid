/* ═══════════════════════════════════════════════════
   MASJID DISPLAY — admin.js
   منطق لوحة التحكم + GitHub API Sync
═══════════════════════════════════════════════════ */

// ══ GitHub Config (يُعبأ من لوحة الإعداد) ══
let GH = {
  owner: '',
  repo:  '',
  token: '',
  path:  'assets/config.json'
};

// ══ Current Config ══
let CFG = {};
const ADMIN_PASS = 'admin1234'; // كلمة مرور لوحة التحكم

// ══ Prayer labels ══
const PRAYER_LABELS = {
  fajr:'الفجر', sunrise:'الشروق', dhuhr:'الظهر',
  asr:'العصر', maghrib:'المغرب', isha:'العشاء'
};
const HAS_IQAMA_ADMIN = ['fajr','dhuhr','asr','maghrib','isha'];

// ══════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════
function initLogin() {
  document.getElementById('loginBtn').addEventListener('click', doLogin);
  document.getElementById('loginPass').addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });
}

function doLogin() {
  const pass = document.getElementById('loginPass').value.trim();
  if (pass === ADMIN_PASS) {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('app').classList.add('show');
    loadGHSettings();
    loadAndRender();
  } else {
    document.getElementById('loginError').classList.add('show');
  }
}

// ══════════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════════
function initNav() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      item.classList.add('active');
      const panel = document.getElementById('panel-' + item.dataset.panel);
      if (panel) panel.classList.add('active');
    });
  });
}

// ══════════════════════════════════════════════════
// GITHUB SETTINGS
// ══════════════════════════════════════════════════
function loadGHSettings() {
  try {
    const saved = localStorage.getItem('gh_settings');
    if (saved) GH = { ...GH, ...JSON.parse(saved) };
    document.getElementById('ghOwner').value = GH.owner || '';
    document.getElementById('ghRepo').value  = GH.repo  || '';
    document.getElementById('ghToken').value = GH.token || '';
  } catch(e) {}
}

function saveGHSettings() {
  GH.owner = document.getElementById('ghOwner').value.trim();
  GH.repo  = document.getElementById('ghRepo').value.trim();
  GH.token = document.getElementById('ghToken').value.trim();
  localStorage.setItem('gh_settings', JSON.stringify(GH));
  showStatus('✔ تم حفظ إعدادات GitHub', 'success');
}

// ══════════════════════════════════════════════════
// LOAD CONFIG FROM GITHUB
// ══════════════════════════════════════════════════
async function loadAndRender() {
  setSyncBadge('syncing');
  try {
    const url = `https://raw.githubusercontent.com/${GH.owner}/${GH.repo}/main/${GH.path}?v=${Date.now()}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error('fetch failed');
    CFG = await r.json();
    setSyncBadge('synced');
  } catch(e) {
    // fallback: load local default
    try {
      const r2 = await fetch('../assets/config.json?v=' + Date.now());
      CFG = await r2.json();
    } catch(e2) {
      CFG = defaultConfig();
    }
    setSyncBadge('error');
  }
  renderForm();
}

function defaultConfig() {
  return {
    mosqueName: 'مسجد النور',
    mosqueSubName: 'جامع النور الإسلامي',
    city: 'باقة الغربية',
    adjustments: { fajr:0, sunrise:0, dhuhr:0, asr:0, maghrib:0, isha:0 },
    iqama: { fajr:20, dhuhr:15, asr:15, maghrib:5, isha:15 },
    nightMode: { enabled:true, delayMinutes:30, endBeforeMinutes:15 },
    ticker: { enabled:true, text:'أهلاً وسهلاً بكم في مسجد النور' },
    footerText: { right:'اللهم صل وسلم على نبينا محمد ﷺ', center:'السلام عليكم ورحمة الله وبركاته', left:'حفظكم الله ورعاكم' },
    antiBurn: true,
    showWeather: true
  };
}

// ══════════════════════════════════════════════════
// RENDER FORM FROM CFG
// ══════════════════════════════════════════════════
function renderForm() {
  // Basic info
  setVal('mosqueName', CFG.mosqueName);
  setVal('mosqueSubName', CFG.mosqueSubName);
  setVal('city', CFG.city);

  // Adjustments + Iqama
  const adjs  = CFG.adjustments || {};
  const iqama = CFG.iqama || {};
  Object.keys(PRAYER_LABELS).forEach(key => {
    setVal('adj_' + key, adjs[key] || 0);
    if (HAS_IQAMA_ADMIN.includes(key)) {
      setVal('iqama_' + key, iqama[key] || 15);
    }
  });

  // Night mode
  setChecked('nightEnabled', (CFG.nightMode || {}).enabled !== false);
  setVal('nightDelay',      (CFG.nightMode || {}).delayMinutes  || 30);
  setVal('nightEndBefore',  (CFG.nightMode || {}).endBeforeMinutes ?? 15);

  // Ticker
  setChecked('tickerEnabled', (CFG.ticker || {}).enabled !== false);
  setVal('tickerText', (CFG.ticker || {}).text || '');

  // Footer
  const ft = CFG.footerText || {};
  setVal('footerRight',  ft.right  || '');
  setVal('footerCenter', ft.center || '');
  setVal('footerLeft',   ft.left   || '');

  // Anti-Burn
  setChecked('antiBurn', CFG.antiBurn !== false);
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}
function setChecked(id, val) {
  const el = document.getElementById(id);
  if (el) el.checked = !!val;
}

// ══════════════════════════════════════════════════
// COLLECT CFG FROM FORM
// ══════════════════════════════════════════════════
function collectConfig() {
  const adjs = {}, iqama = {};
  Object.keys(PRAYER_LABELS).forEach(key => {
    adjs[key] = parseInt(document.getElementById('adj_' + key)?.value || 0);
    if (HAS_IQAMA_ADMIN.includes(key)) {
      iqama[key] = parseInt(document.getElementById('iqama_' + key)?.value || 15);
    }
  });

  return {
    mosqueName:    document.getElementById('mosqueName')?.value?.trim()    || CFG.mosqueName,
    mosqueSubName: document.getElementById('mosqueSubName')?.value?.trim() || CFG.mosqueSubName,
    city:          document.getElementById('city')?.value?.trim()          || CFG.city,
    adjustments: adjs,
    iqama: iqama,
    nightMode: {
      enabled: document.getElementById('nightEnabled')?.checked || false,
      delayMinutes:     parseInt(document.getElementById('nightDelay')?.value     || 30),
      endBeforeMinutes: parseInt(document.getElementById('nightEndBefore')?.value ?? 15)
    },
    ticker: {
      enabled: document.getElementById('tickerEnabled')?.checked || false,
      text: document.getElementById('tickerText')?.value?.trim() || ''
    },
    footerText: {
      right:  document.getElementById('footerRight')?.value?.trim()  || '',
      center: document.getElementById('footerCenter')?.value?.trim() || '',
      left:   document.getElementById('footerLeft')?.value?.trim()   || ''
    },
    antiBurn: document.getElementById('antiBurn')?.checked || false,
    showWeather: true,
    lastUpdated: new Date().toISOString()
  };
}

// ══════════════════════════════════════════════════
// SAVE TO GITHUB
// ══════════════════════════════════════════════════
async function saveToGitHub() {
  if (!GH.owner || !GH.repo || !GH.token) {
    showStatus('⚠ يرجى ضبط إعدادات GitHub أولاً', 'error');
    // Switch to settings panel
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelector('[data-panel="settings"]')?.classList.add('active');
    document.getElementById('panel-settings')?.classList.add('active');
    return;
  }

  CFG = collectConfig();
  setSyncBadge('syncing');
  showStatus('⏳ جارٍ الحفظ على GitHub...', 'syncing');

  try {
    // Get current SHA
    const apiUrl = `https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/${GH.path}`;
    const shaRes = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${GH.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    let sha = null;
    if (shaRes.ok) {
      const shaData = await shaRes.json();
      sha = shaData.sha;
    }

    // Push update
    const body = {
      message: `تحديث الإعدادات - ${new Date().toLocaleString('ar')}`,
      content: btoa(unescape(encodeURIComponent(JSON.stringify(CFG, null, 2)))),
      ...(sha ? { sha } : {})
    };

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GH.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!putRes.ok) {
      const err = await putRes.json();
      throw new Error(err.message || 'GitHub API error');
    }

    setSyncBadge('synced');
    showStatus('✔ تم الحفظ وسيظهر على الشاشة خلال 30 ثانية', 'success');
  } catch(e) {
    setSyncBadge('error');
    showStatus('✘ خطأ: ' + e.message, 'error');
  }
}

// ══════════════════════════════════════════════════
// UI HELPERS
// ══════════════════════════════════════════════════
function setSyncBadge(state) {
  const badge = document.getElementById('syncBadge');
  if (!badge) return;
  badge.className = 'sync-badge ' + state;
  const labels = { synced:'متزامن ✓', syncing:'جارٍ المزامنة...', error:'خطأ في الاتصال' };
  badge.innerHTML = `<span class="dot ${state==='syncing'?'pulse':''}"></span>${labels[state]||''}`;
}

let statusTimer = null;
function showStatus(msg, type='success') {
  const bar = document.getElementById('statusBar');
  if (!bar) return;
  bar.textContent = msg;
  bar.className = 'status-bar show ' + type;
  if (statusTimer) clearTimeout(statusTimer);
  statusTimer = setTimeout(() => bar.classList.remove('show'), 4000);
}

// Adjustment buttons
function initAdjButtons() {
  document.querySelectorAll('.adj-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target  = btn.dataset.target;
      const delta   = parseInt(btn.dataset.delta);
      const input   = document.getElementById(target);
      if (!input) return;
      input.value = parseInt(input.value || 0) + delta;
    });
  });
}

// ══════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initLogin();
  initNav();
  initAdjButtons();

  // Save button
  document.getElementById('saveBtn')?.addEventListener('click', saveToGitHub);
  // GitHub settings save
  document.getElementById('saveGHBtn')?.addEventListener('click', saveGHSettings);
  // Reload from GitHub
  document.getElementById('reloadBtn')?.addEventListener('click', loadAndRender);
});
