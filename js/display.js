/* ═══════════════════════════════════════════════════
   MASJID DISPLAY — display.js
   منطق الشاشة الرئيسية
═══════════════════════════════════════════════════ */

// ── Config Management ─────────────────────────────
const CONFIG_URL = 'assets/config.json';
const TIMES_URL  = 'assets/dehri.json';

let CFG   = {};
let TIMES = {};

async function loadTimes() {
  try {
    const r = await fetch(TIMES_URL + '?v=' + Date.now());
    TIMES = await r.json();
  } catch(e) { console.warn('Could not load prayer times', e); }
}

async function loadConfig() {
  try {
    const r = await fetch(CONFIG_URL + '?v=' + Date.now());
    CFG = await r.json();
  } catch(e) { console.warn('Could not load config', e); CFG = {}; }
}

// ── Helpers ───────────────────────────────────────
function pad(n) { return String(n).padStart(2,'0'); }

function todayKey(date) {
  const d = date || new Date();
  return pad(d.getMonth()+1) + '-' + pad(d.getDate());
}

function tomorrowKey() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return pad(d.getMonth()+1) + '-' + pad(d.getDate());
}

function toMinutes(t) {
  if (!t) return -1;
  const p = t.split(':').map(Number);
  return p[0]*60 + p[1];
}

function addMinutes(t, delta) {
  if (!t) return null;
  const p = t.split(':').map(Number);
  const total = ((p[0]*60 + p[1] + Number(delta)) % 1440 + 1440) % 1440;
  return pad(Math.floor(total/60)) + ':' + pad(total%60);
}

// ── Prayer Keys & Names ───────────────────────────
const PRAYER_KEYS  = ['Fajr','Sunrise','Dhuhr','Asr','Maghrib','Isha'];
const HAS_IQAMA    = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];
const PRAYER_NAMES = {
  Fajr:'الفجر', Sunrise:'الشروق', Dhuhr:'الظهر',
  Asr:'العصر', Maghrib:'المغرب', Isha:'العشاء'
};

// ── الأذان المعدَّل ────────────────────────────────
function getAdjustedAdhan(key, dateKey) {
  const dk   = dateKey || todayKey();
  const base = (TIMES[dk] || {})[key];
  if (!base) return null;
  const adj  = ((CFG.adjustments || {})[key.toLowerCase()]) || 0;
  return adj === 0 ? base : addMinutes(base, adj);
}

function getRawAdhanTomorrow(key) {
  return (TIMES[tomorrowKey()] || {})[key] || null;
}

// ── وقت الإقامة ───────────────────────────────────
function getIqamaTime(key) {
  if (!HAS_IQAMA.includes(key)) return null;
  const adhan = getAdjustedAdhan(key);
  if (!adhan) return null;
  const delay = ((CFG.iqama || {})[key.toLowerCase()]) || 15;
  return addMinutes(adhan, delay);
}

// ── الصلاة القادمة ────────────────────────────────
function getNextPrayerKey(now) {
  const cur = now.getHours()*60 + now.getMinutes() + now.getSeconds()/60;
  for (const k of ['Fajr','Dhuhr','Asr','Maghrib','Isha']) {
    const t = getAdjustedAdhan(k);
    if (t && toMinutes(t) > cur) return k;
  }
  return 'Fajr';
}

// ── الصلاة الحالية ────────────────────────────────
function getCurrentPrayerKey(now) {
  const cur  = now.getHours()*60 + now.getMinutes();
  let   last = null;
  for (const k of PRAYER_KEYS) {
    const t = getAdjustedAdhan(k);
    if (t && toMinutes(t) <= cur) last = k;
  }
  return last;
}

// ══════════════════════════════════════════════════
// ملاحظة ٢: توقيت الغد بعد انتهاء الأذان بـ 10 دقائق
// ══════════════════════════════════════════════════
const AFTER_ADHAN_MIN = 10;

function shouldShowTomorrow(key, now) {
  const adhan = getAdjustedAdhan(key);
  if (!adhan) return false;
  const cur      = now.getHours()*60 + now.getMinutes();
  const adhanMin = toMinutes(adhan);
  if (cur < adhanMin + AFTER_ADHAN_MIN) return false;
  // تأكد أن الصلاة التالية لم تحن بعد
  const prayable = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];
  const idx = prayable.indexOf(key);
  if (idx < 0) return false;
  const nextKey = prayable[idx + 1];
  if (nextKey) {
    const nextAdhan = getAdjustedAdhan(nextKey);
    if (nextAdhan && cur >= toMinutes(nextAdhan)) return false;
  }
  return true;
}

// ══════════════════════════════════════════════════
// ملاحظة ٣: وضع الجمعة
// ══════════════════════════════════════════════════
function isFridayMode(now) {
  const day = now.getDay();
  const cur = now.getHours()*60 + now.getMinutes();

  // ليلة الجمعة (الخميس بعد إقامة العشاء + 5 دقائق)
  if (day === 4) {
    const ishaIqama = getIqamaTime('Isha');
    if (ishaIqama && cur >= toMinutes(ishaIqama) + 5) return true;
  }

  // يوم الجمعة: حتى 30 دقيقة بعد أذان الظهر
  if (day === 5) {
    const dhuhrAdhan = getAdjustedAdhan('Dhuhr');
    if (dhuhrAdhan && cur < toMinutes(dhuhrAdhan) + 30) return true;
    return false;
  }

  return false;
}

// ── جدول الصلوات ──────────────────────────────────
function renderPrayerTable() {
  const table = document.getElementById('prayerTable');
  if (!table) return;
  table.innerHTML = '';

  const now     = new Date();
  const nextKey = getNextPrayerKey(now);
  const curKey  = getCurrentPrayerKey(now);
  const friday  = isFridayMode(now);

  PRAYER_KEYS.forEach(function(key) {
    const isTomorrow = shouldShowTomorrow(key, now);
    var   adhan      = isTomorrow
                        ? (getRawAdhanTomorrow(key) || getAdjustedAdhan(key) || '—')
                        : (getAdjustedAdhan(key) || '—');

    var displayName = PRAYER_NAMES[key];
    var iqama       = getIqamaTime(key);

    // وضع الجمعة: الظهر → الجمعة
    if (friday && key === 'Dhuhr') {
      displayName = 'صلاة الجمعة';
      iqama       = null;
      var rawDhuhr = (TIMES[todayKey()] || {})['Dhuhr'];
      if (rawDhuhr) adhan = rawDhuhr;
    }

    var isNext = key === nextKey;
    var isCur  = key === curKey && !isNext;

    var row = document.createElement('div');
    row.className = 'prayer-row';
    if (isNext) row.classList.add('is-next');
    else if (isCur) row.classList.add('is-current');

    var nextBadge     = isNext     ? '<span class="next-badge">التالية</span>'  : '';
    var tomorrowBadge = isTomorrow ? '<span class="next-badge tomorrow-badge">غداً</span>' : '';

    row.innerHTML =
      '<div class="prayer-name">' + nextBadge + tomorrowBadge + displayName + '</div>' +
      '<div class="prayer-adhan">' + adhan + '</div>' +
      '<div class="prayer-iqama">' + (iqama || '—') + '</div>';

    table.appendChild(row);
  });
}

// ── ويدجت الصلاة القادمة ──────────────────────────
function updateNextWidget(now) {
  const nextKey = getNextPrayerKey(now);
  const adhan   = getAdjustedAdhan(nextKey);
  const iqama   = getIqamaTime(nextKey);
  const friday  = isFridayMode(now);
  const name    = (friday && nextKey === 'Dhuhr') ? 'صلاة الجمعة' : PRAYER_NAMES[nextKey];

  const nameEl  = document.getElementById('nextPrayerName');
  const timeEl  = document.getElementById('nextPrayerTime');
  const iqamaEl = document.getElementById('nextIqamaTime');
  const cdEl    = document.getElementById('countdownValue');

  if (nameEl)  nameEl.textContent  = name;
  if (timeEl)  timeEl.textContent  = adhan || '';
  if (iqamaEl) iqamaEl.textContent = (friday && nextKey === 'Dhuhr') ? '' : (iqama ? 'إقامة: ' + iqama : '');

  if (!adhan || !cdEl) return;
  const cur = now.getHours()*60 + now.getMinutes() + now.getSeconds()/60;
  var diff = toMinutes(adhan) - cur;
  if (diff < 0) diff += 1440;
  const totalSec = Math.round(diff * 60);
  const hh = Math.floor(totalSec/3600);
  const mm = Math.floor((totalSec%3600)/60);
  const ss = totalSec % 60;
  cdEl.textContent = pad(hh) + ':' + pad(mm) + ':' + pad(ss);
}

// ── الساعة والتاريخ ───────────────────────────────
const DAYS_AR = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];

function updateClock() {
  const now = new Date();
  const h24 = now.getHours();
  const m   = now.getMinutes();

  const clockEl = document.getElementById('clockTime');
  if (clockEl) clockEl.textContent = pad(h24) + ':' + pad(m);

  const gregEl = document.getElementById('gregorianDate');
  if (gregEl) {
    gregEl.textContent = DAYS_AR[now.getDay()] + ' ' + pad(now.getDate()) + '-' + pad(now.getMonth()+1) + '-' + now.getFullYear();
  }

  updateHijri(now);
  checkNightMode(now);

  const nightClock = document.getElementById('nightClockTime');
  if (nightClock) nightClock.textContent = pad(h24) + ':' + pad(m);

  renderPrayerTable();
  updateNextWidget(now);
  updateAdhanAlertBar(now);
  checkAdhkarTrigger(now);
}

function updateHijri(date) {
  try {
    const raw     = new Intl.DateTimeFormat('ar-SA-u-ca-islamic',
      { day:'numeric', month:'long', year:'numeric' }).format(date);
    const western = raw.replace(/[٠-٩]/g, function(d){ return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); });
    const clean   = western.replace(/\s*هـ\s*/g,'').replace(/\s*ه\s*$/,'').trim();
    const el = document.getElementById('hijriDate');
    if (el) el.textContent = clean + ' هـ';
  } catch(e) {}
}

// ── وضع السكون الليلي ─────────────────────────────
function checkNightMode(now) {
  const nm = CFG.nightMode || {};
  if (!nm.enabled) {
    document.getElementById('mainScreen') && document.getElementById('mainScreen').classList.remove('night-mode');
    return;
  }
  const cur        = now.getHours()*60 + now.getMinutes();
  const ishaAdhan  = getAdjustedAdhan('Isha');
  if (!ishaAdhan) return;
  const nightStart = toMinutes(ishaAdhan) + Number(nm.delayMinutes || 30);
  const fajrAdhan  = getAdjustedAdhan('Fajr');
  const fajrMin    = fajrAdhan ? toMinutes(fajrAdhan) : 320;
  const nightEnd   = fajrMin - Number(nm.endBeforeMinutes != null ? nm.endBeforeMinutes : 15);
  const isNight    = cur >= nightStart || cur < nightEnd;
  const screen     = document.getElementById('mainScreen');
  if (screen) screen.classList.toggle('night-mode', isNight);
}

// ── شريط تنبيه الأذان / الإقامة ──────────────────
function updateAdhanAlertBar(now) {
  const bar     = document.getElementById('adhanAlertBar');
  const textEl  = document.getElementById('alertText');
  const countEl = document.getElementById('alertCounter');
  const iconEl  = document.getElementById('alertIcon');
  if (!bar) return;

  const curSec    = now.getHours()*3600 + now.getMinutes()*60 + now.getSeconds();
  const ALERT_WIN = (typeof ADHAN_ALERT_MINUTES !== 'undefined' ? ADHAN_ALERT_MINUTES : 5) * 60;
  const friday    = isFridayMode(now);

  for (var i = 0; i < ['Fajr','Dhuhr','Asr','Maghrib','Isha'].length; i++) {
    var key   = ['Fajr','Dhuhr','Asr','Maghrib','Isha'][i];
    var adhan = getAdjustedAdhan(key);
    var iqama = (friday && key === 'Dhuhr') ? null : getIqamaTime(key);
    if (!adhan) continue;

    var adhanSec    = toMinutes(adhan) * 60;
    var diffToAdhan = adhanSec - curSec;
    var dname       = (friday && key === 'Dhuhr') ? 'صلاة الجمعة' : PRAYER_NAMES[key];

    if (diffToAdhan > 0 && diffToAdhan <= ALERT_WIN) {
      var mm = Math.floor(diffToAdhan / 60), ss = diffToAdhan % 60;
      bar.classList.add('show'); bar.classList.remove('iqama-mode');
      if (iconEl)  iconEl.textContent  = '🕌';
      if (textEl)  textEl.textContent  = 'باقي على أذان ' + dname;
      if (countEl) countEl.textContent = pad(mm) + ':' + pad(ss);
      return;
    }

    if (iqama) {
      var iqamaSec    = toMinutes(iqama) * 60;
      var diffToIqama = iqamaSec - curSec;
      if (curSec >= adhanSec && curSec < iqamaSec) {
        var mm2 = Math.floor(diffToIqama / 60), ss2 = diffToIqama % 60;
        bar.classList.add('show','iqama-mode');
        if (iconEl)  iconEl.textContent  = '📿';
        if (textEl)  textEl.textContent  = 'باقي على إقامة ' + dname;
        if (countEl) countEl.textContent = pad(mm2) + ':' + pad(ss2);
        return;
      }
    }
  }
  bar.classList.remove('show','iqama-mode');
}

// ══════════════════════════════════════════════════
// ملاحظة ١: شريط الأذكار المتحرك داخل ticker-bar
// ══════════════════════════════════════════════════
var adhkarState = { active: false, prayer: null };

function getAdhkarForPrayer(key) {
  if (typeof ADHKAR === 'undefined') return [];
  return ADHKAR[key.toLowerCase()] || [];
}

function startAdhkarTicker(prayerKey) {
  var list = getAdhkarForPrayer(prayerKey);
  if (!list.length) return;

  adhkarState.active = true;
  adhkarState.prayer = prayerKey;

  var scrollEl = document.getElementById('adhkarScrollText');
  if (scrollEl) scrollEl.textContent = list.join('  ✦  ');

  // ضبط مدة الأنيميشن بناءً على طول النص
  var totalChars = list.join('  ✦  ').length;
  var duration   = Math.max(60, Math.round(totalChars * 0.22));

  var normal = document.getElementById('tickerNormal');
  var adhkar = document.getElementById('tickerAdhkar');
  if (normal) normal.style.display = 'none';
  if (adhkar) {
    adhkar.style.display = '';
    adhkar.style.animationDuration = duration + 's';
  }
}

function stopAdhkarTicker() {
  adhkarState.active = false;
  adhkarState.prayer = null;
  var normal = document.getElementById('tickerNormal');
  var adhkar = document.getElementById('tickerAdhkar');
  if (adhkar) adhkar.style.display = 'none';
  if (normal) normal.style.display = '';
}

function checkAdhkarTrigger(now) {
  var DURATION_MIN = typeof ADHKAR_DURATION_MINUTES !== 'undefined' ? ADHKAR_DURATION_MINUTES : 15;
  var curSec       = now.getHours()*3600 + now.getMinutes()*60 + now.getSeconds();

  var keys = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];
  for (var i = 0; i < keys.length; i++) {
    var key     = keys[i];
    var iqama   = getIqamaTime(key);
    if (!iqama) continue;
    var iqamaSec  = toMinutes(iqama) * 60;
    var windowEnd = iqamaSec + DURATION_MIN * 60;

    if (curSec >= iqamaSec && curSec < windowEnd) {
      if (!adhkarState.active || adhkarState.prayer !== key) {
        startAdhkarTicker(key);
      }
      return;
    }
  }

  if (adhkarState.active) stopAdhkarTicker();
}

// ── Apply Config ──────────────────────────────────
function applyConfig() {
  var mn = document.getElementById('mosqueName');
  var ms = document.getElementById('mosqueSubName');
  if (mn) mn.textContent = CFG.mosqueName    || 'مسجد النور';
  if (ms) ms.textContent = CFG.mosqueSubName || 'جامع النور الإسلامي';

  var tb   = document.getElementById('tickerBar');
  var txt  = document.getElementById('tickerText');
  var txt2 = document.getElementById('tickerText2');
  var ticker = CFG.ticker || {};
  if (tb)   tb.style.display  = (ticker.enabled !== false) ? '' : 'none';
  if (txt)  txt.textContent   = ticker.text || '';
  if (txt2) txt2.textContent  = ticker.text || '';

  var ft = CFG.footerText || {};
  var fr = document.getElementById('footerRight');
  var fc = document.getElementById('footerCenter');
  var fl = document.getElementById('footerLeft');
  if (fr) fr.textContent = ft.right  || '';
  if (fc) fc.textContent = ft.center || '';
  if (fl) fl.textContent = ft.left   || '';

  document.body.classList.toggle('anti-burn-active', CFG.antiBurn !== false);
}

// ── Auto-Refresh ──────────────────────────────────
var lastUpdated = '';
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

  var lastDay = new Date().getDate();
  setInterval(function() {
    var d = new Date().getDate();
    if (d !== lastDay) { lastDay = d; loadTimes(); }
  }, 60000);

  setInterval(autoRefresh, 30000);
})();
