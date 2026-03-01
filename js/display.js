/* ═══════════════════════════════════════════════════
   MASJID DISPLAY — display.js
   منطق الشاشة الرئيسية
═══════════════════════════════════════════════════ */

// ── Config Management ─────────────────────────────
const CONFIG_URL = 'assets/config.json';
const TIMES_URL  = 'assets/dehri.json';

let CFG = {};
let TIMES = {};

async function loadTimes() {
  try {
    const r = await fetch(TIMES_URL + '?v=' + Date.now());
    TIMES = await r.json();
  } catch(e) {
    console.warn('Could not load prayer times', e);
  }
}

async function loadConfig() {
  try {
    // GitHub Pages: bust cache
    const r = await fetch(CONFIG_URL + '?v=' + Date.now());
    CFG = await r.json();
  } catch(e) {
    console.warn('Could not load config', e);
    CFG = {};
  }
}

// ── Prayer Times Logic ────────────────────────────
const PRAYER_KEYS  = ['Fajr','Sunrise','Dhuhr','Asr','Maghrib','Isha'];
const PRAYER_NAMES = { Fajr:'الفجر', Sunrise:'الشروق', Dhuhr:'الظهر', Asr:'العصر', Maghrib:'المغرب', Isha:'العشاء' };
// Prayers that have Iqama (no Sunrise)
const HAS_IQAMA = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];

function pad(n) { return String(n).padStart(2,'0'); }

function todayKey() {
  const d = new Date();
  return `${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

function getAdjustedAdhan(key) {
  const base = (TIMES[todayKey()] || {})[key];
  if (!base) return null;
  const adj = ((CFG.adjustments || {})[key.toLowerCase()]) || 0;
  if (adj === 0) return base;
  const [h,m] = base.split(':').map(Number);
  const total = ((h*60 + m + Number(adj)) % 1440 + 1440) % 1440;
  return `${pad(Math.floor(total/60))}:${pad(total%60)}`;
}

function getIqamaTime(key) {
  if (!HAS_IQAMA.includes(key)) return null;
  const adhan = getAdjustedAdhan(key);
  if (!adhan) return null;
  const delay = ((CFG.iqama || {})[key.toLowerCase()]) || 15;
  const [h,m] = adhan.split(':').map(Number);
  const total = ((h*60 + m + Number(delay)) % 1440 + 1440) % 1440;
  return `${pad(Math.floor(total/60))}:${pad(total%60)}`;
}

function toMinutes(t) {
  if (!t) return -1;
  const [h,m] = t.split(':').map(Number);
  return h*60+m;
}

function getNextPrayerKey(now) {
  const cur = now.getHours()*60 + now.getMinutes() + now.getSeconds()/60;
  const prayable = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];
  for (const k of prayable) {
    const t = getAdjustedAdhan(k);
    if (t && toMinutes(t) > cur) return k;
  }
  return 'Fajr'; // next day Fajr
}

function getCurrentPrayerKey(now) {
  const cur = now.getHours()*60 + now.getMinutes();
  let last = null;
  for (const k of PRAYER_KEYS) {
    const t = getAdjustedAdhan(k);
    if (t && toMinutes(t) <= cur) last = k;
  }
  return last;
}

// ── Render Prayer Table ───────────────────────────
function renderPrayerTable() {
  const table = document.getElementById('prayerTable');
  if (!table) return;
  table.innerHTML = '';
  const now = new Date();
  const nextKey = getNextPrayerKey(now);
  const curKey  = getCurrentPrayerKey(now);

  PRAYER_KEYS.forEach(key => {
    const adhan  = getAdjustedAdhan(key) || '—';
    const iqama  = getIqamaTime(key);
    const isNext = key === nextKey;
    const isCur  = key === curKey && !isNext;

    const row = document.createElement('div');
    row.className = 'prayer-row';
    if (isNext) row.classList.add('is-next');
    else if (isCur) row.classList.add('is-current');

    const badge = isNext ? `<span class="next-badge">التالية</span>` : '';
    row.innerHTML = `
      <div class="prayer-name">${badge}${PRAYER_NAMES[key]}</div>
      <div class="prayer-adhan">${adhan}</div>
      <div class="prayer-iqama">${iqama || '—'}</div>
    `;
    table.appendChild(row);
  });
}

// ── Update Next Prayer Widget ─────────────────────
function updateNextWidget(now) {
  const nextKey = getNextPrayerKey(now);
  const adhan   = getAdjustedAdhan(nextKey);
  const iqama   = getIqamaTime(nextKey);

  const nameEl  = document.getElementById('nextPrayerName');
  const timeEl  = document.getElementById('nextPrayerTime');
  const iqamaEl = document.getElementById('nextIqamaTime');
  const cdEl    = document.getElementById('countdownValue');

  if (nameEl)  nameEl.textContent  = PRAYER_NAMES[nextKey];
  if (timeEl)  timeEl.textContent  = adhan || '';
  if (iqamaEl) iqamaEl.textContent = iqama ? `إقامة: ${iqama}` : '';

  // Countdown
  if (!adhan || !cdEl) return;
  const cur = now.getHours()*60 + now.getMinutes() + now.getSeconds()/60;
  let diff = toMinutes(adhan) - cur;
  if (diff < 0) diff += 1440; // next day
  const totalSec = Math.round(diff * 60);
  const hh = Math.floor(totalSec/3600);
  const mm = Math.floor((totalSec%3600)/60);
  const ss = totalSec % 60;
  cdEl.textContent = `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
}

// ── Clock & Date ──────────────────────────────────
const DAYS_AR = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];

function updateClock() {
  const now = new Date();
  const h24 = now.getHours();
  const m   = now.getMinutes();

  // 24h format as required
  const clockEl = document.getElementById('clockTime');
  if (clockEl) clockEl.textContent = `${pad(h24)}:${pad(m)}`;

  // Gregorian
  const gregEl = document.getElementById('gregorianDate');
  if (gregEl) {
    const dd = pad(now.getDate()), mo = pad(now.getMonth()+1), yy = now.getFullYear();
    gregEl.textContent = `${DAYS_AR[now.getDay()]} ${dd}-${mo}-${yy}`;
  }

  // Hijri
  updateHijri(now);

  // Night mode
  checkNightMode(now);

  // Night clock (large)
  const nightClock = document.getElementById('nightClockTime');
  if (nightClock) nightClock.textContent = `${pad(h24)}:${pad(m)}`;

  // Prayer table & countdown
  renderPrayerTable();
  updateNextWidget(now);
}

function updateHijri(date) {
  try {
    const raw = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
      day:'numeric', month:'long', year:'numeric'
    }).format(date);
    // تحويل الأرقام العربية إلى غربية
    const western = raw.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
    const clean   = western.replace(/\s*هـ\s*/g,'').replace(/\s*ه\s*$/,'').trim();
    const el = document.getElementById('hijriDate');
    if (el) el.textContent = clean + ' هـ';
  } catch(e) {}
}

// ── Night Mode ────────────────────────────────────
function checkNightMode(now) {
  const nm   = CFG.nightMode || {};
  if (!nm.enabled) {
    document.getElementById('mainScreen')?.classList.remove('night-mode');
    return;
  }
  // Get Isha time
  const ishaAdhan = getAdjustedAdhan('Isha');
  if (!ishaAdhan) return;
  const delay = Number(nm.delayMinutes || 30);
  const [ih, im] = ishaAdhan.split(':').map(Number);
  const nightStart = ih*60 + im + delay;
  const cur = now.getHours()*60 + now.getMinutes();

  // Night mode: after isha+delay, until fajr
  const fajrAdhan = getAdjustedAdhan('Fajr');
  const fajrMin   = fajrAdhan ? toMinutes(fajrAdhan) : 320;

  const isNight = cur >= nightStart || cur < fajrMin;
  document.getElementById('mainScreen')?.classList.toggle('night-mode', isNight);
}

// ── Apply Config ──────────────────────────────────
function applyConfig() {
  // Mosque name
  const mn = document.getElementById('mosqueName');
  const ms = document.getElementById('mosqueSubName');
  if (mn) mn.textContent = CFG.mosqueName || 'مسجد النور';
  if (ms) ms.textContent = CFG.mosqueSubName || 'جامع النور الإسلامي';

  // Ticker
  const tb  = document.getElementById('tickerBar');
  const txt = document.getElementById('tickerText');
  const ticker = CFG.ticker || {};
  if (tb)  tb.style.display  = (ticker.enabled !== false) ? '' : 'none';
  if (txt) txt.textContent   = ticker.text || '';

  // Footer
  const ft = CFG.footerText || {};
  const fr = document.getElementById('footerRight');
  const fc = document.getElementById('footerCenter');
  const fl = document.getElementById('footerLeft');
  if (fr) fr.textContent = ft.right  || '';
  if (fc) fc.textContent = ft.center || '';
  if (fl) fl.textContent = ft.left   || '';

  // Anti-Burn
  document.body.classList.toggle('anti-burn-active', CFG.antiBurn !== false);
}

// ── Auto-Refresh from GitHub ──────────────────────
let lastUpdated = '';
async function autoRefresh() {
  await loadConfig();
  if (CFG.lastUpdated !== lastUpdated) {
    lastUpdated = CFG.lastUpdated || '';
    applyConfig();
  }
}

// ── INIT ──────────────────────────────────────────
(async function init() {
  await loadTimes();
  await loadConfig();
  applyConfig();
  updateClock();
  setInterval(updateClock, 1000);

  // Refresh times at midnight
  let lastDay = new Date().getDate();
  setInterval(() => {
    const d = new Date().getDate();
    if (d !== lastDay) { lastDay = d; loadTimes(); }
  }, 60000);

  // Poll config every 30 seconds
  setInterval(autoRefresh, 30000);
})();
