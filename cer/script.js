/* =====================================================
   مدرسة الغزالي الابتدائية — script.js
   الهوية البصرية المؤسسية — إصدار 2026
   ===================================================== */
'use strict';

const state = { template: 'appreciation', logoSrc: null };

/* ── الشعار الرسمي SVG (دائرة خضراء + كتاب + "باقة الغربية") ── */
const DEFAULT_LOGO_SVG = `<svg class="cert-logo-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <!-- الحلقة الخارجية ذهبية -->
  <circle cx="50" cy="50" r="47" fill="none" stroke="#D4AF37" stroke-width="3.5"/>
  <!-- الدائرة الخضراء -->
  <circle cx="50" cy="50" r="43" fill="#1F7A63"/>
  <!-- حلقة ذهبية داخلية رفيعة -->
  <circle cx="50" cy="50" r="37" fill="none" stroke="#D4AF37" stroke-width="1.2"/>
  <!-- الكتاب (مبسّط) -->
  <g transform="translate(50,46)" fill="none" stroke="#FAFCFA" stroke-width="1.8" stroke-linejoin="round">
    <path d="M0,-16 L0,8" stroke="#D4AF37" stroke-width="1.5"/>
    <path d="M0,-16 C-10,-14 -16,-8 -16,8 L0,8 Z" fill="rgba(255,255,255,.15)"/>
    <path d="M0,-16 C 10,-14  16,-8  16,8 L0,8 Z" fill="rgba(255,255,255,.15)"/>
    <path d="M0,-16 C-10,-14 -16,-8 -16,8 L0,8 Z"/>
    <path d="M0,-16 C 10,-14  16,-8  16,8 L0,8 Z"/>
    <path d="M-16,8 L16,8"/>
  </g>
  <!-- اسم المدرسة بالعربي داخل الدائرة - نص دائري علوي -->
  <path id="topArc" d="M 15,50 A 35,35 0 0,1 85,50" fill="none"/>
  <text font-family="Cairo,Tajawal,sans-serif" font-size="9" font-weight="700" fill="#D4AF37">
    <textPath href="#topArc" startOffset="10%">مدرسة الغزالي الابتدائية</textPath>
  </text>
  <!-- نص سفلي -->
  <path id="botArc" d="M 18,55 A 33,33 0 0,0 82,55" fill="none"/>
  <text font-family="Cairo,Tajawal,sans-serif" font-size="8" fill="#E6D3A3">
    <textPath href="#botArc" startOffset="18%">باقة الغربية</textPath>
  </text>
  <!-- نقاط زخرفية -->
  <circle cx="50" cy="13" r="2" fill="#D4AF37"/>
  <circle cx="50" cy="87" r="2" fill="#D4AF37"/>
</svg>`;

/* ── TEMPLATES ── */
const TEMPLATES = {
  appreciation: {
    cls: 'tpl-appreciation',
    d: { title:'شهادة تقدير واعتزاز', intro:'تمنح هذه الشهادة تقديرًا واعترافًا بالجهد والتميّز', highlight:'لتفوقه المستمر وحسن سلوكه', qualities:'المتميز, المجتهد, القدوة', body:'وإيمانًا بأهمية تكريم المتميزين وتعزيز روح الإبداع والعطاء لدى أبنائنا الطلاب، نُقدِّم لهذا الطالب المتميز هذه الشهادة وفاءً بحقه وتحفيزًا له على مواصلة مسيرته المضيئة.' }
  },
  academic: {
    cls: 'tpl-academic',
    d: { title:'شهادة إنجاز أكاديمي', intro:'تُمنح تقديرًا للتحصيل الأكاديمي المتميز', highlight:'لتحقيقه المرتبة الأولى على مستوى الصف', qualities:'الأول على الصف, المتفوق, النموذج الأكاديمي', body:'نشهد بأن هذا الطالب قد أبدى مستوى رفيعًا من الالتزام بالتحصيل العلمي والتفوق الدراسي، وأثبت جدارة تامة باستحقاق هذا التقدير والتكريم.' }
  },
  encouragement: {
    cls: 'tpl-encouragement',
    d: { title:'شهادة تشجيع وتحفيز', intro:'نُقدِّم هذه الشهادة تشجيعًا على مواصلة المسيرة', highlight:'لإبدائه تقدمًا ملموسًا ومثابرة في التعلم', qualities:'المثابر, المتطور, الواعد', body:'نُشجّع هذا الطالب على المضي قدمًا في مسيرته التعليمية، إذ أبدى تقدمًا ملحوظًا واجتهادًا واضحًا في سعيه نحو التميز والنجاح.' }
  },
  occasion: {
    cls: 'tpl-occasion',
    d: { title:'شهادة مناسبة', intro:'بمناسبة يوم الطالب المتميز لهذا الفصل الدراسي', highlight:'تميّز وأبهر زملاءه وأساتذته', qualities:'مميز, متألق, ملهم', body:'نُهنّئ هذا الطالب بهذه المناسبة الكريمة، ونأمل أن يواصل مسيرته المتألقة محققًا مزيدًا من النجاح والتفوق في جميع مراحله الدراسية.' }
  },
  thanks: {
    cls: 'tpl-thanks',
    d: { title:'شهادة شكر وتقدير', intro:'تُقدَّم شكرًا وعرفانًا بالجهود المبذولة', highlight:'لإسهامه الفاعل في الحياة المدرسية', qualities:'المتعاون, المسؤول, القدوة الحسنة', body:'نتقدم بخالص الشكر والتقدير على ما أبداه من تعاون وإسهام في خدمة المجتمع المدرسي، ونُقدِّر هذه الجهود الطيبة التي تستحق كل ثناء وتكريم.' }
  },
  teacher: {
    cls: 'tpl-teacher',
    d: { title:'شهادة تقدير لمعلم/ة متميز/ة', intro:'اعترافًا بالعطاء التربوي المتميز', highlight:'لما أبدته من إخلاص وحرص على نجاح الطلاب', qualities:'المعلمة المثالية, القدوة التربوية, الملهِمة', body:'وفاءً لهذه المعلمة الفاضلة التي بذلت جهدًا استثنائيًا في خدمة الرسالة التربوية، وأثّرت إيجابيًا في نفوس طلابها بعلمها وإخلاصها وحسن تعاملها.' }
  },
  honor: {
    cls: 'tpl-honor',
    d: { title:'شهادة فخرية', intro:'تُمنح تكريمًا رفيعًا لمكانة متميزة', highlight:'رفع اسم مدرسته عاليًا في المحافل والمسابقات', qualities:'الفخر, العزة, الإنجاز الاستثنائي', body:'نُسجِّل بهذه الشهادة الفخرية إعجابنا العميق بهذا الطالب البطل الذي رفع اسم مدرستنا في المحافل الوطنية، وكان سفيرًا حقيقيًا لمدرسة الغزالي الابتدائية.' }
  },
  medal: {
    cls: 'tpl-medal',
    d: { title:'وسام الغزالي', intro:'يُمنح هذا الوسام الرفيع لمن بلغ أعلى درجات التميز والإنجاز', highlight:'إكليل الشرف لأعلى مراتب التفوق', qualities:'الإنجاز الاستثنائي, التفوق النادر, رمز الفخر', body:'بموجب السلطة الممنوحة لنا، نُكرِّم هذا المتميز النادر بوسام الغزالي — أعلى تكريم تمنحه مدرستنا — اعترافًا بإنجاز استثنائي يُخلَّد في سجلات المدرسة.' }
  },
};

/* ── LOGO ── */
function handleLogoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = (ev) => {
    state.logoSrc = ev.target.result;
    const img = document.getElementById('logoPreviewImg');
    img.src = state.logoSrc; img.style.display = 'block';
    document.getElementById('logoPlaceholder').style.display = 'none';
    document.getElementById('btnRemoveLogo').style.display = 'inline-block';
    updatePreview();
  };
  r.readAsDataURL(file);
}

function removeLogo() {
  state.logoSrc = null;
  const img = document.getElementById('logoPreviewImg');
  img.src = ''; img.style.display = 'none';
  document.getElementById('logoPlaceholder').style.display = 'flex';
  document.getElementById('btnRemoveLogo').style.display = 'none';
  document.getElementById('logoInput').value = '';
  updatePreview();
}

/* ── TEMPLATE SELECT ── */
function selectTemplate(el, tpl) {
  document.querySelectorAll('.tpl-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  state.template = tpl;
  const d = TEMPLATES[tpl].d;
  document.getElementById('fldTitle').value     = d.title;
  document.getElementById('fldIntro').value     = d.intro;
  document.getElementById('fldHighlight').value = d.highlight;
  document.getElementById('fldQualities').value = d.qualities;
  document.getElementById('fldBody').value      = d.body;
  updatePreview();
}

/* ── HELPERS ── */
const fv = id => (document.getElementById(id).value || '').trim();

function getQualities() {
  const raw = fv('fldQualities');
  if (!raw) return [];
  return raw.split(/[,،]+/).map(s => s.trim()).filter(Boolean);
}

function nameSize(n) {
  const l = n.length;
  if (l <= 12) return '44px';
  if (l <= 18) return '36px';
  if (l <= 24) return '29px';
  return '24px';
}
function bodySize(t) {
  const l = t.length;
  if (l <= 120) return '14.5px';
  if (l <= 220) return '13px';
  return '12px';
}

/* ── LOGO HTML ── */
function logoHTML() {
  if (state.logoSrc) {
    return `<div class="cert-logo-wrap"><img src="${state.logoSrc}" alt="شعار المدرسة" /></div>`;
  }
  return DEFAULT_LOGO_SVG;
}

/* ── BUILD CERT HTML ── */
function buildCert() {
  const tpl = state.template;
  const d = TEMPLATES[tpl].d;
  const name    = fv('fldName')        || 'اسم الطالب / المكرَّم';
  const title   = fv('fldTitle')       || d.title;
  const intro   = fv('fldIntro')       || d.intro;
  const hl      = fv('fldHighlight')   || d.highlight;
  const body    = fv('fldBody')        || d.body;
  const signer  = fv('fldSigner')      || 'مدير المدرسة';
  const sTitle  = fv('fldSignerTitle') || 'المدير العام';
  const date    = fv('fldDate')        || getHijri();
  const school  = fv('fldSchool')      || 'مدرسة الغزالي الابتدائية';
  const tagline = fv('fldTagline')     || 'نرافق الطالب في رحلته نحو ذاته';
  const quals   = getQualities();

  const qualsHTML = quals.length
    ? `<div class="cert-qualities">${quals.map(q=>`<span class="cert-quality-tag">${q}</span>`).join('')}</div>`
    : '';

  const medalStar = tpl === 'medal'
    ? `<div class="cert-medal-star">✦ ✦ ✦</div>`
    : '';

  return `
    <div class="cert-bg"></div>
    <div class="cert-frame-outer"></div>
    <div class="cert-frame-inner cert-frame-corners"></div>

    <div class="cert-header">
      ${logoHTML()}
      <div class="cert-school-info">
        <div class="cert-school-name">${school}</div>
        <div class="cert-school-sub">${tagline}</div>
      </div>
      ${logoHTML()}
    </div>

    <div class="cert-gold-rule"></div>

    <div class="cert-content">
      <div class="cert-title">${title}</div>
      <div class="cert-intro">${intro}</div>
      <div class="cert-rule-sm"></div>
      <div class="cert-name" style="font-size:${nameSize(name)}">${name}</div>
      ${hl ? `<div class="cert-highlight">${hl}</div>` : ''}
      ${qualsHTML}
      ${medalStar}
      <div class="cert-rule-sm"></div>
      <div class="cert-body" style="font-size:${bodySize(body)}">${body}</div>
    </div>

    <div class="cert-footer">
      <div class="cert-signer">
        <div class="cert-signer-line"></div>
        <div class="cert-signer-name">${signer}</div>
        <div class="cert-signer-title">${sTitle}</div>
      </div>
      <div class="cert-date-area">
        <div class="cert-date-label">التاريخ</div>
        <div class="cert-date-val">${date}</div>
      </div>
      <div class="cert-footer-school">
        <div class="cert-footer-school-name">${school}</div>
        <div class="cert-footer-school-tag">${tagline}</div>
      </div>
    </div>
  `;
}

/* ── UPDATE PREVIEW ── */
function updatePreview() {
  const cert = document.getElementById('certificate');
  Object.values(TEMPLATES).forEach(t => cert.classList.remove(t.cls));
  cert.classList.add(TEMPLATES[state.template].cls);
  cert.innerHTML = buildCert();
  scalePreview();
}

function scalePreview() {
  const wrap = document.querySelector('.preview-wrap');
  const scaler = document.getElementById('previewScaler');
  const avail = wrap.clientWidth - 40;
  const scale = Math.min(1, avail / 900);
  scaler.style.transform = `scale(${scale})`;
  wrap.style.minHeight = (636 * scale + 40) + 'px';
}

/* ── CAPTURE ── */
async function capture() {
  const cert = document.getElementById('certificate');
  const scaler = document.getElementById('previewScaler');
  const prev = scaler.style.transform;
  scaler.style.transform = 'scale(1)';
  await new Promise(r => setTimeout(r, 80));
  const canvas = await html2canvas(cert, { scale:3, useCORS:true, allowTaint:true, backgroundColor:null, width:900, height:636, logging:false });
  scaler.style.transform = prev;
  return canvas;
}

async function downloadPNG() {
  showToast('⏳ جاري تجهيز الصورة...');
  try {
    const c = await capture();
    const a = document.createElement('a');
    a.download = 'شهادة-الغزالي.png';
    a.href = c.toDataURL('image/png');
    a.click();
    showToast('✅ تم تحميل الصورة بنجاح');
  } catch(e) { showToast('❌ حدث خطأ، حاول مجددًا'); console.error(e); }
}

async function downloadPDF() {
  showToast('⏳ جاري تجهيز ملف PDF...');
  try {
    const c = await capture();
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation:'landscape', unit:'mm', format:'a4' });
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();
    const m = 10, iW = W - m*2, iH = iW * (636/900);
    const y = (H - iH) / 2;
    pdf.addImage(c.toDataURL('image/png'), 'PNG', m, y, iW, iH);
    pdf.save('شهادة-الغزالي.pdf');
    showToast('✅ تم تصدير PDF بنجاح');
  } catch(e) { showToast('❌ حدث خطأ، حاول مجددًا'); console.error(e); }
}

function printCertificate() { window.print(); }

/* ── TOAST ── */
let tt;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 3200);
}

/* ── HIJRI DATE ── */
function getHijri() {
  try {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { day:'numeric', month:'numeric', year:'numeric' }).format(new Date()) + ' هـ';
  } catch { return new Date().toLocaleDateString('ar'); }
}

/* ── INIT ── */
function init() {
  document.getElementById('fldSchool').value      = 'مدرسة الغزالي الابتدائية';
  document.getElementById('fldTagline').value     = 'نرافق الطالب في رحلته نحو ذاته';
  document.getElementById('fldSigner').value      = 'مدير المدرسة';
  document.getElementById('fldSignerTitle').value = 'المدير العام';
  document.getElementById('fldDate').value        = getHijri();
  document.getElementById('fldName').value        = 'أحمد محمد الزهراني';

  const d = TEMPLATES['appreciation'].d;
  document.getElementById('fldTitle').value     = d.title;
  document.getElementById('fldIntro').value     = d.intro;
  document.getElementById('fldHighlight').value = d.highlight;
  document.getElementById('fldQualities').value = d.qualities;
  document.getElementById('fldBody').value      = d.body;

  updatePreview();
  window.addEventListener('resize', scalePreview);
}

document.addEventListener('DOMContentLoaded', init);
