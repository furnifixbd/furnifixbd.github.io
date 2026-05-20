/* ===== State ===== */
let currentTab = 'invoice';
let invoiceItemCount = 0;
let requisitionItemCount = 0;
let sidebarVisible = true;
let showInvSignatures = true;
let showReqSignatures = true;
let _restoringDraft = false;
let _autoSaveTimer = null;

const A4_W_PX  = 794;
const A4_H_PX  = 1123;
const LOGO_SRC = 'logo.png';
const DRAFTS_KEY = 'docforge_drafts';
const MAX_MANUAL_DRAFTS = 50;

const DEFAULTS = {
  name:    'Furni Fix',
  phone:   '01717-722535',
  address: 'ZIRANI, BKSP, ASHULIA, SAVAR, DHAKA',
  email:   'furnifixbd@gmail.com',
  website: 'furnifix.github.io',
};

/* All named form field IDs (excluding item containers) */
const ALL_FIELD_IDS = [
  'inv-from-name','inv-from-email','inv-from-phone','inv-from-website','inv-from-address',
  'inv-to-name','inv-to-email','inv-to-address',
  'inv-number','inv-currency','inv-date','inv-due-date',
  'inv-tax','inv-discount','inv-terms','inv-notes','inv-color',
  'req-org','req-dept','req-org-phone','req-org-email','req-org-website','req-org-address',
  'req-name','req-emp-id','req-email','req-phone',
  'req-number','req-priority','req-date','req-required-by','req-purpose',
  'req-currency','req-budget-code','req-vendor','req-notes','req-color',
];

/* ===== Init ===== */
document.addEventListener('DOMContentLoaded', () => {
  prefillDefaults();
  setDefaultDates();
  addInvoiceItem();
  addInvoiceItem();
  addRequisitionItem();
  addRequisitionItem();
  addRequisitionItem();
  updatePreview();
  refreshDraftsBadge();

  document.getElementById('inv-color').addEventListener('input', function () {
    document.getElementById('inv-color-label').textContent = this.value;
    updatePreview();
  });
  document.getElementById('req-color').addEventListener('input', function () {
    document.getElementById('req-color-label').textContent = this.value;
    updatePreview();
  });

  applyPreviewScale();
  window.addEventListener('resize', applyPreviewScale);
});

/* ===== Pre-fill defaults ===== */
function prefillDefaults() {
  setVal('inv-from-name',    DEFAULTS.name);
  setVal('inv-from-phone',   DEFAULTS.phone);
  setVal('inv-from-address', DEFAULTS.address);
  setVal('inv-from-email',   DEFAULTS.email);
  setVal('inv-from-website', DEFAULTS.website);
  setVal('inv-number',       'INV-');

  setVal('req-org',          DEFAULTS.name);
  setVal('req-org-phone',    DEFAULTS.phone);
  setVal('req-org-address',  DEFAULTS.address);
  setVal('req-org-email',    DEFAULTS.email);
  setVal('req-org-website',  DEFAULTS.website);
  setVal('req-number',       'REQ-');
}
function setVal(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

/* ===== Sidebar toggle ===== */
function toggleSidebar() {
  sidebarVisible = !sidebarVisible;
  document.getElementById('app-main').classList.toggle('sidebar-collapsed', !sidebarVisible);
  const icon = document.getElementById('toggle-icon');
  if (sidebarVisible) {
    icon.innerHTML = `<rect x="1" y="1" width="16" height="16" rx="3" stroke="currentColor" stroke-width="1.5"/>
      <path d="M6 1v16" stroke="currentColor" stroke-width="1.5"/>
      <path d="M3.5 6.5L5 9l-1.5 2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`;
  } else {
    icon.innerHTML = `<rect x="1" y="1" width="16" height="16" rx="3" stroke="currentColor" stroke-width="1.5"/>
      <path d="M6 1v16" stroke="currentColor" stroke-width="1.5"/>
      <path d="M8.5 6.5L7 9l1.5 2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  setTimeout(applyPreviewScale, 280);
}

/* ===== Signature toggle ===== */
function toggleSignatures(type) {
  if (type === 'inv') {
    showInvSignatures = !showInvSignatures;
    document.getElementById('inv-sig-toggle').classList.toggle('active', showInvSignatures);
  } else {
    showReqSignatures = !showReqSignatures;
    document.getElementById('req-sig-toggle').classList.toggle('active', showReqSignatures);
  }
  updatePreview();
  scheduleAutoSave();
}

/* ===== Mobile preview scaling ===== */
function applyPreviewScale() {
  const scroll  = document.querySelector('.preview-scroll');
  const wrapper = document.querySelector('.preview-wrapper');
  if (!scroll || !wrapper) return;
  const available = scroll.clientWidth - 40;
  if (available < A4_W_PX) {
    const scale = available / A4_W_PX;
    wrapper.style.transform       = `scale(${scale})`;
    wrapper.style.transformOrigin = 'top left';
    wrapper.style.marginBottom    = `-${A4_W_PX * (1 - scale)}px`;
  } else {
    wrapper.style.transform    = '';
    wrapper.style.marginBottom = '';
  }
}

/* ===== Date helpers ===== */
function setDefaultDates() {
  const today = new Date();
  const fmt   = d => d.toISOString().split('T')[0];
  const due   = new Date(today); due.setDate(due.getDate() + 30);
  const reqBy = new Date(today); reqBy.setDate(reqBy.getDate() + 14);
  const s = id => document.getElementById(id);
  if (s('inv-date'))        s('inv-date').value        = fmt(today);
  if (s('inv-due-date'))    s('inv-due-date').value    = fmt(due);
  if (s('req-date'))        s('req-date').value        = fmt(today);
  if (s('req-required-by')) s('req-required-by').value = fmt(reqBy);
}

/* ===== Tab Switching ===== */
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  document.getElementById('invoice-form').classList.toggle('hidden', tab !== 'invoice');
  document.getElementById('requisition-form').classList.toggle('hidden', tab !== 'requisition');
  document.getElementById('invoice-preview').classList.toggle('hidden', tab !== 'invoice');
  document.getElementById('requisition-preview').classList.toggle('hidden', tab !== 'requisition');
  updatePreview();
}

/* ===== Renumber item badges ===== */
function renumberItems(prefix) {
  document.querySelectorAll(`#${prefix}-items .item-row`).forEach((row, i) => {
    const badge = row.querySelector('.item-number');
    if (badge) badge.textContent = i + 1;
  });
}

/* ===== Line Items — Invoice ===== */
function addInvoiceItem() {
  invoiceItemCount++;
  const id  = invoiceItemCount;
  const con = document.getElementById('inv-items');
  const div = document.createElement('div');
  div.className = 'item-row';
  div.id = `inv-item-${id}`;
  div.innerHTML = `
    <div class="item-row-header">
      <span class="item-number">${con.children.length + 1}</span>
      <button class="btn btn-danger" onclick="removeItem('inv-item-${id}','inv')">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="field-group" style="margin-bottom:2px">
      <label>Description</label>
      <input type="text" placeholder="Service or product description" oninput="updatePreview();scheduleAutoSave()">
    </div>
    <div class="item-amounts">
      <div class="field-group"><label>Qty</label><input type="number" placeholder="1" min="0" step="any" oninput="autoCalcAmount(this)"></div>
      <div class="field-group"><label>Rate</label><input type="number" placeholder="0.00" min="0" step="0.01" oninput="autoCalcAmount(this)"></div>
      <div class="field-group"><label>Amount</label><input type="number" placeholder="auto" min="0" step="0.01" oninput="updatePreview();scheduleAutoSave()"></div>
    </div>`;
  con.appendChild(div);
  renumberItems('inv');
  updatePreview();
}

/* ===== Line Items — Requisition ===== */
function addRequisitionItem() {
  requisitionItemCount++;
  const id  = requisitionItemCount;
  const con = document.getElementById('req-items');
  const div = document.createElement('div');
  div.className = 'item-row';
  div.id = `req-item-${id}`;
  div.innerHTML = `
    <div class="item-row-header">
      <span class="item-number">${con.children.length + 1}</span>
      <button class="btn btn-danger" onclick="removeItem('req-item-${id}','req')">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="field-group" style="margin-bottom:2px">
      <label>Item / Description</label>
      <input type="text" placeholder="Item name and specifications" oninput="updatePreview();scheduleAutoSave()">
    </div>
    <div class="item-amounts">
      <div class="field-group"><label>Qty</label><input type="number" placeholder="1" min="0" step="any" oninput="autoCalcAmount(this)"></div>
      <div class="field-group"><label>Unit Price</label><input type="number" placeholder="0.00" min="0" step="0.01" oninput="autoCalcAmount(this)"></div>
      <div class="field-group"><label>Amount</label><input type="number" placeholder="auto" min="0" step="0.01" oninput="updatePreview();scheduleAutoSave()"></div>
    </div>`;
  con.appendChild(div);
  renumberItems('req');
  updatePreview();
}

function autoCalcAmount(input) {
  const row    = input.closest('.item-row');
  const inputs = row.querySelectorAll('.item-amounts input');
  if (inputs.length < 3) { updatePreview(); return; }
  const qty  = parseFloat(inputs[0].value) || 0;
  const rate = parseFloat(inputs[1].value) || 0;
  if (!inputs[2]._manual) inputs[2].value = (qty * rate) > 0 ? (qty * rate).toFixed(2) : '';
  updatePreview();
  scheduleAutoSave();
}

function removeItem(id, prefix) {
  const el = document.getElementById(id);
  if (el) { el.remove(); renumberItems(prefix); updatePreview(); scheduleAutoSave(); }
}

/* ===== Collect Items ===== */
function getInvoiceItems() {
  return Array.from(document.querySelectorAll('#inv-items .item-row')).map(row => {
    const desc      = row.querySelector('input[type="text"]')?.value.trim() || '';
    const inputs    = row.querySelectorAll('.item-amounts input');
    const qty       = parseFloat(inputs[0]?.value) || 0;
    const rate      = parseFloat(inputs[1]?.value) || 0;
    const manualAmt = parseFloat(inputs[2]?.value);
    const amount    = !isNaN(manualAmt) && inputs[2]?.value !== '' ? manualAmt : qty * rate;
    return { desc, qty, rate, amount };
  }).filter(i => i.desc || i.qty || i.rate || i.amount);
}

function getRequisitionItems() {
  return Array.from(document.querySelectorAll('#req-items .item-row')).map(row => {
    const desc      = row.querySelector('input[type="text"]')?.value.trim() || '';
    const inputs    = row.querySelectorAll('.item-amounts input');
    const qty       = parseFloat(inputs[0]?.value) || 0;
    const price     = parseFloat(inputs[1]?.value) || 0;
    const manualAmt = parseFloat(inputs[2]?.value);
    const total     = !isNaN(manualAmt) && inputs[2]?.value !== '' ? manualAmt : qty * price;
    return { desc, qty, price, total };
  }).filter(i => i.desc || i.qty || i.price || i.total);
}

/* ===== Helpers ===== */
function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}
function numVal(id) {
  const el = document.getElementById(id);
  return el ? (parseFloat(el.value) || 0) : 0;
}
function fmtDate(str) {
  if (!str) return '—';
  return new Date(str + 'T00:00:00').toLocaleDateString('en-GB', { year:'numeric', month:'short', day:'numeric' });
}
function fmtMoney(amount, sym) {
  return sym + amount.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
}
function fmtQty(q) { return q % 1 === 0 ? String(q) : q.toFixed(2); }
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ===== Signature blocks ===== */
function sigBlock(label) {
  return `<div class="inv-sig-block">
    <div class="inv-sig-label">${label}</div>
    <div class="inv-sig-sub">Signature</div>
    <div class="inv-sig-date">Date: _______________</div>
  </div>`;
}
function reqSigBlock(label) {
  return `<div class="req-sig-block">
    <div class="req-sig-label">${label}</div>
    <div class="req-sig-sub">Signature</div>
    <div class="req-sig-date">Date: _______________</div>
  </div>`;
}

/* ===== Update Preview ===== */
function updatePreview() {
  if (currentTab === 'invoice') renderInvoice();
  else renderRequisition();
  if (!_restoringDraft) scheduleAutoSave();
}

/* ================================================================
   RENDER INVOICE
================================================================ */
function renderInvoice() {
  const color    = val('inv-color') || '#E11D27';
  const sym      = val('inv-currency') || '৳';
  const items    = getInvoiceItems();
  const taxRate  = numVal('inv-tax');
  const discRate = numVal('inv-discount');

  const subtotal    = items.reduce((s, i) => s + i.amount, 0);
  const totalQty    = items.reduce((s, i) => s + i.qty, 0);
  const discountAmt = subtotal * (discRate / 100);
  const afterDisc   = subtotal - discountAmt;
  const taxAmt      = afterDisc * (taxRate / 100);
  const total       = afterDisc + taxAmt;

  const fromName    = val('inv-from-name');
  const fromEmail   = val('inv-from-email');
  const fromPhone   = val('inv-from-phone');
  const fromAddr    = val('inv-from-address');
  const fromWebsite = val('inv-from-website');
  const toName      = val('inv-to-name')   || 'Client Name';
  const toEmail     = val('inv-to-email');
  const toAddr      = val('inv-to-address');
  const invNum      = val('inv-number')    || 'INV-';
  const invDate     = val('inv-date');
  const dueDate     = val('inv-due-date');
  const terms       = val('inv-terms');
  const notes       = val('inv-notes');

  const rowsHTML = items.length > 0
    ? items.map((item, i) => `<tr>
        <td class="mono">${String(i+1).padStart(2,'0')}</td>
        <td><div class="inv-item-name">${esc(item.desc)}</div></td>
        <td class="right">${fmtQty(item.qty)}</td>
        <td class="right">${fmtMoney(item.rate, sym)}</td>
        <td class="right amount">${fmtMoney(item.amount, sym)}</td>
      </tr>`).join('')
    : `<tr><td colspan="5" style="text-align:center;padding:20px 8px;color:#9CA3AF;font-size:12px;">Add line items using the form on the left</td></tr>`;

  const singleHTML = `
    <div class="a4-page" id="inv-page-1">
      ${buildInvLogoHeader(invNum, color, invDate, dueDate)}
      <div class="inv-accent-bar" style="background:${color}"></div>
      ${buildInvParties(fromName, fromEmail, fromPhone, fromAddr, fromWebsite, toName, toEmail, toAddr)}
      <div class="inv-items-section">
        <table class="inv-table">
          <thead><tr><th>#</th><th>Description</th><th class="right">Qty</th><th class="right">Rate</th><th class="right">Amount</th></tr></thead>
          <tbody>${rowsHTML}</tbody>
        </table>
      </div>
      ${buildInvTotals(sym, totalQty, subtotal, discountAmt, discRate, taxAmt, taxRate, total, color)}
      ${showInvSignatures ? buildInvSigs() : ''}
      ${buildInvFooter(terms, notes)}
    </div>`;

  const container = document.getElementById('invoice-preview');
  container.innerHTML = singleHTML;

  const p1 = container.querySelector('#inv-page-1');
  if (p1 && p1.offsetHeight > A4_H_PX && items.length > 1) {
    paginateInvoice(container, items, { invNum, color, sym, fromName, fromEmail, fromPhone, fromAddr, fromWebsite,
      toName, toEmail, toAddr, invDate, dueDate, subtotal, discountAmt, discRate, taxAmt, taxRate, total, totalQty, terms, notes });
  }
}

function buildInvLogoHeader(invNum, color, invDate, dueDate) {
  return `<div class="inv-logo-header">
    <img src="${LOGO_SRC}" class="inv-logo-img" alt="Logo">
    <div class="inv-title-block">
      <div class="inv-badge" style="background:${color}">&nbsp;INVOICE&nbsp;</div>
      <div class="inv-number-text">${esc(invNum)}</div>
      <div class="inv-dates-text">
        ${invDate ? `Issued: ${fmtDate(invDate)}<br>` : ''}
        ${dueDate ? `Due: <strong>${fmtDate(dueDate)}</strong>` : ''}
      </div>
    </div>
  </div>`;
}
function buildInvParties(fromName, fromEmail, fromPhone, fromAddr, fromWebsite, toName, toEmail, toAddr) {
  return `<div class="inv-parties">
    <div>
      <div class="inv-party-label">From</div>
      <div class="inv-party-name">${esc(fromName)}</div>
      <div class="inv-party-detail">
        ${fromEmail   ? `${esc(fromEmail)}<br>` : ''}
        ${fromPhone   ? `${esc(fromPhone)}<br>` : ''}
        ${fromWebsite ? `${esc(fromWebsite)}<br>` : ''}
        ${fromAddr    ? esc(fromAddr).replace(/\n/g,'<br>') : ''}
      </div>
    </div>
    <div>
      <div class="inv-party-label">Bill To</div>
      <div class="inv-party-name">${esc(toName)}</div>
      <div class="inv-party-detail">
        ${toEmail ? `${esc(toEmail)}<br>` : ''}
        ${toAddr  ? esc(toAddr).replace(/\n/g,'<br>') : ''}
      </div>
    </div>
  </div>`;
}
function buildInvTotals(sym, totalQty, subtotal, discountAmt, discRate, taxAmt, taxRate, total, color) {
  return `<div class="inv-totals"><div class="inv-totals-box">
    <div class="inv-total-row"><span>Total Quantity</span><span>${fmtQty(totalQty)}</span></div>
    <div class="inv-total-row"><span>Subtotal</span><span>${fmtMoney(subtotal, sym)}</span></div>
    ${discRate > 0 ? `<div class="inv-total-row"><span>Discount (${discRate}%)</span><span>-${fmtMoney(discountAmt, sym)}</span></div>` : ''}
    ${taxRate  > 0 ? `<div class="inv-total-row"><span>Tax (${taxRate}%)</span><span>${fmtMoney(taxAmt, sym)}</span></div>` : ''}
    <div class="inv-total-row grand"><span>Total</span><span style="color:${color}">${fmtMoney(total, sym)}</span></div>
  </div></div>`;
}
function buildInvSigs() {
  return `<div class="inv-signatures">
    <div class="inv-sig-title">Signatures</div>
    <div class="inv-sig-grid">
      ${sigBlock('Prepared by')}${sigBlock('Authorized by')}
    </div>
  </div>`;
}
function buildInvFooter(terms, notes) {
  if (!terms && !notes) return '';
  return `<div class="inv-footer">
    ${terms ? `<div><div class="inv-footer-label">Payment Terms</div><div class="inv-footer-value">${esc(terms)}</div></div>` : '<div></div>'}
    ${notes ? `<div><div class="inv-footer-label">Notes</div><div class="inv-footer-value">${esc(notes).replace(/\n/g,'<br>')}</div></div>` : '<div></div>'}
  </div>`;
}

function paginateInvoice(container, items, opts) {
  const { invNum, color, sym, fromName, fromEmail, fromPhone, fromAddr, fromWebsite,
          toName, toEmail, toAddr, invDate, dueDate,
          subtotal, discountAmt, discRate, taxAmt, taxRate, total, totalQty, terms, notes } = opts;
  const p1H   = container.querySelector('#inv-page-1').offsetHeight;
  const perPg = Math.max(1, Math.floor(items.length * A4_H_PX / p1H));
  const pages = splitPages(items, perPg);
  let html = '';
  pages.forEach((pageItems, pi) => {
    const isFirst = pi === 0, isLast = pi === pages.length - 1;
    const offset  = pages.slice(0, pi).reduce((s, p) => s + p.length, 0);
    const rowsHTML = pageItems.map((item, idx) => `<tr>
      <td class="mono">${String(offset+idx+1).padStart(2,'0')}</td>
      <td><div class="inv-item-name">${esc(item.desc)}</div></td>
      <td class="right">${fmtQty(item.qty)}</td>
      <td class="right">${fmtMoney(item.rate, sym)}</td>
      <td class="right amount">${fmtMoney(item.amount, sym)}</td>
    </tr>`).join('');
    const headerHTML = isFirst
      ? `${buildInvLogoHeader(invNum,color,invDate,dueDate)}<div class="inv-accent-bar" style="background:${color}"></div>${buildInvParties(fromName,fromEmail,fromPhone,fromAddr,fromWebsite,toName,toEmail,toAddr)}`
      : `<div class="page-cont-header"><img src="${LOGO_SRC}" class="page-cont-logo" alt="Logo"><span class="page-cont-ref">Ref: ${esc(invNum)} &nbsp;|&nbsp; Page ${pi+1}</span></div>`;
    html += `${pi>0?`<div class="page-sep">— Page ${pi+1} —</div>`:''}
      <div class="a4-page">
        ${headerHTML}
        <div class="inv-items-section">
          ${!isFirst?`<div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#9CA3AF;padding-bottom:8px;border-bottom:1.5px solid #E5E7EB;">Items continued</div>`:''}
          <table class="inv-table"><thead><tr><th>#</th><th>Description</th><th class="right">Qty</th><th class="right">Rate</th><th class="right">Amount</th></tr></thead><tbody>${rowsHTML}</tbody></table>
        </div>
        ${isLast?buildInvTotals(sym,totalQty,subtotal,discountAmt,discRate,taxAmt,taxRate,total,color):''}
        ${isLast&&showInvSignatures?buildInvSigs():''}
        ${isLast?buildInvFooter(terms,notes):''}
      </div>`;
  });
  container.innerHTML = html;
}

/* ================================================================
   RENDER REQUISITION
================================================================ */
function renderRequisition() {
  const color   = val('req-color') || '#E11D27';
  const sym     = val('req-currency') || '৳';
  const items   = getRequisitionItems();

  const orgName    = val('req-org');
  const orgPhone   = val('req-org-phone');
  const orgEmail   = val('req-org-email');
  const orgWebsite = val('req-org-website');
  const orgAddress = val('req-org-address');
  const dept       = val('req-dept');
  const reqName    = val('req-name')     || 'Requester Name';
  const empId      = val('req-emp-id');
  const email      = val('req-email');
  const phone      = val('req-phone');
  const reqNum     = val('req-number')   || 'REQ-';
  const priority   = val('req-priority') || 'Normal';
  const reqDate    = val('req-date');
  const requiredBy = val('req-required-by');
  const purpose    = val('req-purpose');
  const budgetCode = val('req-budget-code');
  const vendor     = val('req-vendor');
  const notes      = val('req-notes');

  const totalAmt = items.reduce((s, i) => s + i.total, 0);
  const totalQty = items.reduce((s, i) => s + i.qty, 0);
  const pc = ({Normal:{bg:'#EFF6FF',text:'#1D4ED8',dot:'#3B82F6'},High:{bg:'#FEF3C7',text:'#92400E',dot:'#F59E0B'},Urgent:{bg:'#FEF2F2',text:'#991B1B',dot:'#EF4444'},Low:{bg:'#F0FDF4',text:'#166534',dot:'#22C55E'}})[priority]||{bg:'#EFF6FF',text:'#1D4ED8',dot:'#3B82F6'};

  const rowsHTML = items.length > 0
    ? items.map((item, idx) => `<tr>
        <td class="mono">${String(idx+1).padStart(2,'0')}</td>
        <td class="bold">${esc(item.desc)}</td>
        <td class="right">${fmtQty(item.qty)}</td>
        <td class="right">${fmtMoney(item.price, sym)}</td>
        <td class="right bold">${fmtMoney(item.total, sym)}</td>
      </tr>`).join('')
    : `<tr><td colspan="5" style="text-align:center;padding:20px 8px;color:#9CA3AF;font-size:12px;">Add items using the form on the left</td></tr>`;

  const infoGrid = `<div class="req-info-grid">
    <div><div class="req-info-label">Requester</div><div class="req-info-value">${esc(reqName)}</div>${empId?`<div class="req-info-sub">${esc(empId)}</div>`:''}</div>
    <div><div class="req-info-label">Department</div><div class="req-info-value">${dept?esc(dept):'—'}</div></div>
    <div><div class="req-info-label">Contact</div><div class="req-info-value">${email?esc(email):'—'}</div>${phone?`<div class="req-info-sub">${esc(phone)}</div>`:''}</div>
  </div>`;
  const totalsHTML = `<div class="req-totals"><div class="req-totals-box">
    <div class="req-total-row"><span>Total Quantity</span><span>${fmtQty(totalQty)}</span></div>
    <div class="req-grand-total" style="background:${hexToRgba(color,0.08)};color:${color}"><span>Total Estimated Cost</span><span>${fmtMoney(totalAmt,sym)}</span></div>
  </div></div>`;
  const logoHeaderHTML = buildReqLogoHeader(reqNum, color, reqDate, requiredBy);
  const orgInfoHTML    = buildReqOrgInfo(orgName, orgEmail, orgPhone, orgWebsite, orgAddress);
  const priorityBar    = `<div class="req-priority-bar" style="background:${pc.bg};color:${pc.text};border-bottom:1px solid ${hexToRgba(color,0.12)}">
    <svg width="8" height="8" viewBox="0 0 8 8" fill="${pc.dot}"><circle cx="4" cy="4" r="4"/></svg>
    Priority: ${priority}
    ${budgetCode?`&nbsp;&nbsp;·&nbsp;&nbsp;Budget: <strong>${esc(budgetCode)}</strong>`:''}
    ${vendor?`&nbsp;&nbsp;·&nbsp;&nbsp;Vendor: ${esc(vendor)}`:''}
  </div>`;

  const container = document.getElementById('requisition-preview');
  container.innerHTML = `
    <div class="a4-page" id="req-page-1">
      ${logoHeaderHTML}<div style="height:3px;background:${color}"></div>${orgInfoHTML}${priorityBar}${infoGrid}
      ${purpose?`<div class="req-purpose-block" style="border-left-color:${color}"><div class="req-purpose-label">Purpose & Justification</div><div class="req-purpose-text">${esc(purpose).replace(/\n/g,'<br>')}</div></div>`:''}
      <div class="req-items-section">
        <div class="req-section-title">Requested Items</div>
        <table class="req-table"><thead><tr><th>#</th><th>Description</th><th class="right">Qty</th><th class="right">Unit Price</th><th class="right">Total</th></tr></thead><tbody>${rowsHTML}</tbody></table>
      </div>
      ${totalsHTML}
      ${showReqSignatures?buildReqSigs():''}
      ${notes?`<div class="req-footer-notes"><div class="req-notes-label">Additional Notes</div><div class="req-notes-text">${esc(notes).replace(/\n/g,'<br>')}</div></div>`:''}
    </div>`;

  const p1 = container.querySelector('#req-page-1');
  if (p1 && p1.offsetHeight > A4_H_PX && items.length > 1) {
    paginateRequisition(container, items, { reqNum, color, sym, purpose, budgetCode, vendor, notes,
      totalAmt, totalQty, infoGrid, totalsHTML, logoHeaderHTML, orgInfoHTML, priorityBar });
  }
}

function buildReqLogoHeader(reqNum, color, reqDate, requiredBy) {
  return `<div class="req-logo-header">
    <img src="${LOGO_SRC}" class="req-logo-img" alt="Logo">
    <div class="req-title-block">
      <div class="req-badge" style="background:${color}">&nbsp;REQUISITION&nbsp;</div>
      <div class="req-number-text">${esc(reqNum)}</div>
      <div class="req-meta-text">
        ${reqDate?`Date: ${fmtDate(reqDate)}<br>`:''}
        ${requiredBy?`Required by: <strong>${fmtDate(requiredBy)}</strong>`:''}
      </div>
    </div>
  </div>`;
}
function buildReqOrgInfo(orgName, orgEmail, orgPhone, orgWebsite, orgAddress) {
  if (!orgName && !orgEmail && !orgPhone && !orgWebsite && !orgAddress) return '';
  return `<div style="padding:8px 40px 8px;background:#F9FAFB;border-bottom:1px solid #E5E7EB;">
    ${orgName?`<div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#9CA3AF;margin-bottom:3px;">${esc(orgName)}</div>`:''}
    <div style="font-size:11px;color:#6B7280;line-height:1.7;">
      ${orgEmail?esc(orgEmail):''}${orgPhone?` &nbsp;·&nbsp; ${esc(orgPhone)}`:''}${orgWebsite?` &nbsp;·&nbsp; ${esc(orgWebsite)}`:''}
      ${orgAddress?`<br>${esc(orgAddress).replace(/\n/g,'<br>')}` :''}
    </div>
  </div>`;
}
function buildReqSigs() {
  return `<div class="req-approval">
    <div class="req-approval-title">Signatures</div>
    <div class="req-approval-grid">${reqSigBlock('Prepared by')}${reqSigBlock('Authorized by')}</div>
  </div>`;
}

function paginateRequisition(container, items, opts) {
  const { reqNum, color, sym, purpose, budgetCode, vendor, notes,
          totalAmt, totalQty, infoGrid, totalsHTML, logoHeaderHTML, orgInfoHTML, priorityBar } = opts;
  const p1H   = container.querySelector('#req-page-1').offsetHeight;
  const perPg = Math.max(1, Math.floor(items.length * A4_H_PX / p1H));
  const pages = splitPages(items, perPg);
  let html = '';
  pages.forEach((pageItems, pi) => {
    const isFirst = pi === 0, isLast = pi === pages.length - 1;
    const offset  = pages.slice(0, pi).reduce((s, p) => s + p.length, 0);
    const rowsHTML = pageItems.map((item, idx) => `<tr>
      <td class="mono">${String(offset+idx+1).padStart(2,'0')}</td>
      <td class="bold">${esc(item.desc)}</td>
      <td class="right">${fmtQty(item.qty)}</td>
      <td class="right">${fmtMoney(item.price,sym)}</td>
      <td class="right bold">${fmtMoney(item.total,sym)}</td>
    </tr>`).join('');
    const headerHTML = isFirst
      ? `${logoHeaderHTML}<div style="height:3px;background:${color}"></div>${orgInfoHTML}${priorityBar}${infoGrid}${purpose?`<div class="req-purpose-block" style="border-left-color:${color}"><div class="req-purpose-label">Purpose & Justification</div><div class="req-purpose-text">${esc(purpose).replace(/\n/g,'<br>')}</div></div>`:''}`
      : `<div class="page-cont-header"><img src="${LOGO_SRC}" class="page-cont-logo" alt="Logo"><span class="page-cont-ref">Ref: ${esc(reqNum)} &nbsp;|&nbsp; Page ${pi+1}</span></div>`;
    html += `${pi>0?`<div class="page-sep">— Page ${pi+1} —</div>`:''}
      <div class="a4-page">
        ${headerHTML}
        <div class="req-items-section">
          <div class="req-section-title">${isFirst?'Requested Items':'Items continued'}</div>
          <table class="req-table"><thead><tr><th>#</th><th>Description</th><th class="right">Qty</th><th class="right">Unit Price</th><th class="right">Total</th></tr></thead><tbody>${rowsHTML}</tbody></table>
        </div>
        ${isLast?totalsHTML:''}
        ${isLast&&showReqSignatures?buildReqSigs():''}
        ${isLast&&notes?`<div class="req-footer-notes"><div class="req-notes-label">Additional Notes</div><div class="req-notes-text">${esc(notes).replace(/\n/g,'<br>')}</div></div>`:''}
      </div>`;
  });
  container.innerHTML = html;
}

function splitPages(items, perPage) {
  const pages = [];
  for (let i = 0; i < items.length; i += perPage) pages.push(items.slice(i, i + perPage));
  return pages.length > 0 ? pages : [[]];
}

/* ================================================================
   DRAFT SYSTEM — localStorage
================================================================ */

/* --- Storage helpers --- */
function getDrafts() {
  try { return JSON.parse(localStorage.getItem(DRAFTS_KEY) || '[]'); } catch { return []; }
}
function setDrafts(drafts) {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

/* --- Capture all form data into a plain object --- */
function captureFormData() {
  const fields = {};
  ALL_FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) fields[id] = el.value;
  });

  const invItems = Array.from(document.querySelectorAll('#inv-items .item-row')).map(row => {
    const inputs = row.querySelectorAll('.item-amounts input');
    return {
      desc:   row.querySelector('input[type="text"]')?.value || '',
      qty:    inputs[0]?.value || '',
      rate:   inputs[1]?.value || '',
      amount: inputs[2]?.value || '',
    };
  });

  const reqItems = Array.from(document.querySelectorAll('#req-items .item-row')).map(row => {
    const inputs = row.querySelectorAll('.item-amounts input');
    return {
      desc:   row.querySelector('input[type="text"]')?.value || '',
      qty:    inputs[0]?.value || '',
      price:  inputs[1]?.value || '',
      amount: inputs[2]?.value || '',
    };
  });

  return { fields, invItems, reqItems, invSignatures: showInvSignatures, reqSignatures: showReqSignatures };
}

/* --- Restore all form data from a plain object --- */
function restoreFormData(formData, tab) {
  _restoringDraft = true;

  switchTab(tab);

  /* Restore named fields */
  Object.entries(formData.fields || {}).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  });

  /* Sync color labels */
  const ic = document.getElementById('inv-color');
  const rc = document.getElementById('req-color');
  if (ic) document.getElementById('inv-color-label').textContent = ic.value;
  if (rc) document.getElementById('req-color-label').textContent = rc.value;

  /* Restore invoice items */
  document.getElementById('inv-items').innerHTML = '';
  invoiceItemCount = 0;
  (formData.invItems || []).forEach(item => {
    addInvoiceItem();
    const rows   = document.querySelectorAll('#inv-items .item-row');
    const row    = rows[rows.length - 1];
    if (!row) return;
    row.querySelector('input[type="text"]').value = item.desc;
    const inputs = row.querySelectorAll('.item-amounts input');
    if (inputs[0]) inputs[0].value = item.qty;
    if (inputs[1]) inputs[1].value = item.rate;
    if (inputs[2]) inputs[2].value = item.amount;
  });

  /* Restore requisition items */
  document.getElementById('req-items').innerHTML = '';
  requisitionItemCount = 0;
  (formData.reqItems || []).forEach(item => {
    addRequisitionItem();
    const rows   = document.querySelectorAll('#req-items .item-row');
    const row    = rows[rows.length - 1];
    if (!row) return;
    row.querySelector('input[type="text"]').value = item.desc;
    const inputs = row.querySelectorAll('.item-amounts input');
    if (inputs[0]) inputs[0].value = item.qty;
    if (inputs[1]) inputs[1].value = item.price;
    if (inputs[2]) inputs[2].value = item.amount;
  });

  /* Restore signature toggles */
  showInvSignatures = formData.invSignatures !== false;
  showReqSignatures = formData.reqSignatures !== false;
  document.getElementById('inv-sig-toggle')?.classList.toggle('active', showInvSignatures);
  document.getElementById('req-sig-toggle')?.classList.toggle('active', showReqSignatures);

  _restoringDraft = false;
  updatePreview();
}

/* --- Timestamp helpers --- */
function nowISO() { return new Date().toISOString(); }

function formatDraftTimestamp(isoStr) {
  const d    = new Date(isoStr);
  const dd   = String(d.getDate()).padStart(2, '0');
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  let   h    = d.getHours();
  const min  = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return { date: `${dd}-${mm}-${yyyy}`, time: `${h}:${min} ${ampm}` };
}

/* --- Auto-save (debounced) --- */
function scheduleAutoSave() {
  if (_restoringDraft) return;
  clearTimeout(_autoSaveTimer);
  _autoSaveTimer = setTimeout(() => doAutoSave(), 3000);
}

function doAutoSave() {
  if (_restoringDraft) return;
  const id     = `autosave_${currentTab}`;
  const docNum = currentTab === 'invoice' ? (val('inv-number') || 'INV-') : (val('req-number') || 'REQ-');
  const draft  = {
    id,
    type:       currentTab,
    docNum,
    savedAt:    nowISO(),
    isAutosave: true,
    formData:   captureFormData(),
  };
  const drafts = getDrafts();
  const idx    = drafts.findIndex(d => d.id === id);
  if (idx >= 0) drafts[idx] = draft;
  else drafts.unshift(draft);
  setDrafts(drafts);
  refreshDraftsBadge();
  /* If drawer is open, re-render */
  if (document.getElementById('drafts-drawer').classList.contains('open')) renderDraftsList();
}

/* --- Manual save (called from "Save Draft" button) --- */
function saveDraft(isAutoOverride = false) {
  const docNum = currentTab === 'invoice' ? (val('inv-number') || 'INV-') : (val('req-number') || 'REQ-');
  const draft  = {
    id:         `draft_${Date.now()}`,
    type:       currentTab,
    docNum,
    savedAt:    nowISO(),
    isAutosave: false,
    formData:   captureFormData(),
  };

  const drafts = getDrafts();
  /* Remove old autosave for this tab when doing a manual save (keep it clean) */
  drafts.unshift(draft);
  /* Limit total manual drafts */
  const manual = drafts.filter(d => !d.isAutosave);
  const auto   = drafts.filter(d => d.isAutosave);
  const trimmed = [...manual.slice(0, MAX_MANUAL_DRAFTS), ...auto];
  setDrafts(trimmed);

  refreshDraftsBadge();
  if (document.getElementById('drafts-drawer').classList.contains('open')) renderDraftsList();
  showToast('Draft saved!', 'success');
}

/* --- Delete draft --- */
function deleteDraft(id) {
  const drafts = getDrafts().filter(d => d.id !== id);
  setDrafts(drafts);
  refreshDraftsBadge();
  renderDraftsList();
  showToast('Draft deleted', '');
}

/* --- Load draft into form --- */
function loadDraft(id) {
  const draft = getDrafts().find(d => d.id === id);
  if (!draft) { showToast('Draft not found', 'error'); return; }
  restoreFormData(draft.formData, draft.type);
  closeDraftsDrawer();
  showToast(`Loaded: ${draft.docNum}`, 'success');
}

/* --- Refresh badge count --- */
function refreshDraftsBadge() {
  const drafts = getDrafts();
  const count  = drafts.length;
  const badge  = document.getElementById('drafts-count');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.classList.add('visible');
  } else {
    badge.textContent = '';
    badge.classList.remove('visible');
  }
}

/* --- Drafts drawer open / close --- */
function openDraftsDrawer() {
  document.getElementById('drafts-drawer').classList.add('open');
  document.getElementById('drawer-overlay').classList.add('open');
  renderDraftsList();
}
function closeDraftsDrawer() {
  document.getElementById('drafts-drawer').classList.remove('open');
  document.getElementById('drawer-overlay').classList.remove('open');
}

/* --- Render the drafts list --- */
function renderDraftsList() {
  const drafts    = getDrafts();
  const container = document.getElementById('drafts-list');

  if (drafts.length === 0) {
    container.innerHTML = `
      <div class="draft-empty">
        <svg width="40" height="40" viewBox="0 0 14 14" fill="none"><path d="M2 2h10a1 1 0 011 1v1H1V3a1 1 0 011-1z" stroke="#9CA3AF" stroke-width="1.3"/><rect x="1" y="5" width="12" height="7" rx="1" stroke="#9CA3AF" stroke-width="1.3"/><path d="M4 8h6M4 10.5h4" stroke="#9CA3AF" stroke-width="1.3" stroke-linecap="round"/></svg>
        <p>No drafts yet.<br>Edits auto-save every 3 seconds.</p>
      </div>`;
    return;
  }

  const auto   = drafts.filter(d => d.isAutosave);
  const manual = drafts.filter(d => !d.isAutosave);

  let html = '';

  if (auto.length > 0) {
    html += `<div class="draft-group-label">Auto-saved</div>`;
    html += auto.map(d => draftCardHTML(d)).join('');
  }
  if (manual.length > 0) {
    html += `<div class="draft-group-label">Saved Drafts</div>`;
    html += manual.map(d => draftCardHTML(d)).join('');
  }

  container.innerHTML = html;
}

function draftCardHTML(draft) {
  const ts   = formatDraftTimestamp(draft.savedAt);
  const type = draft.type === 'invoice' ? 'Invoice' : 'Requisition';
  return `
    <div class="draft-card">
      <div class="draft-card-top">
        <span class="draft-type-badge ${draft.type}">${type}</span>
        ${draft.isAutosave ? `<span class="draft-auto-badge">Auto</span>` : ''}
        <span class="draft-docnum">${esc(draft.docNum)}</span>
      </div>
      <div class="draft-timestamp">
        <span>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><rect x="1" y="2" width="10" height="9" rx="1" stroke="#6B7280" stroke-width="1.2"/><path d="M4 1v2M8 1v2M1 5h10" stroke="#6B7280" stroke-width="1.2" stroke-linecap="round"/></svg>
          ${ts.date}
        </span>
        <span>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#6B7280" stroke-width="1.2"/><path d="M6 4v2.5L8 8" stroke="#6B7280" stroke-width="1.2" stroke-linecap="round"/></svg>
          ${ts.time}
        </span>
      </div>
      <div class="draft-card-actions">
        <button class="draft-load-btn" onclick="loadDraft('${draft.id}')">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Load & Edit
        </button>
        <button class="draft-delete-btn" onclick="deleteDraft('${draft.id}')" title="Delete draft">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M5 3V2h2v1M4 3v6h4V3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </div>`;
}

/* ================================================================
   IMPORT / EXPORT JSON
================================================================ */
function exportJSON() {
  const payload = {
    _version: 1,
    _app: 'DocForge',
    _exportedAt: nowISO(),
    type: currentTab,
    formData: captureFormData(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const docNum = currentTab === 'invoice' ? (val('inv-number') || 'INV') : (val('req-number') || 'REQ');
  link.download = `DocForge-${docNum}-${new Date().toISOString().slice(0,10)}.json`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
  showToast('JSON exported!', 'success');
}

function importJSON(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const payload = JSON.parse(e.target.result);
      /* Accept both a direct formData payload and a wrapped export */
      const formData = payload.formData || payload;
      const tab      = payload.type || currentTab;
      if (!formData.fields) throw new Error('Invalid format');
      restoreFormData(formData, tab);
      showToast('JSON imported!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Invalid JSON file', 'error');
    }
    input.value = ''; /* Reset so same file can be re-imported */
  };
  reader.readAsText(file);
}

/* ================================================================
   MISC
================================================================ */
function getDocNum() {
  return currentTab === 'invoice' ? (val('inv-number') || 'INV') : (val('req-number') || 'REQ');
}
function getDocType() {
  return currentTab === 'invoice' ? 'Invoice' : 'Requisition';
}

function resetForm() {
  document.querySelectorAll('input:not([type="color"]), textarea').forEach(el => el.value = '');
  document.querySelectorAll('select').forEach(el => el.selectedIndex = 0);
  document.getElementById('inv-items').innerHTML = '';
  document.getElementById('req-items').innerHTML = '';
  invoiceItemCount = 0;
  requisitionItemCount = 0;
  showInvSignatures = true;
  showReqSignatures = true;
  document.getElementById('inv-sig-toggle')?.classList.add('active');
  document.getElementById('req-sig-toggle')?.classList.add('active');
  prefillDefaults();
  setDefaultDates();
  addInvoiceItem();
  addInvoiceItem();
  addRequisitionItem();
  addRequisitionItem();
  addRequisitionItem();
  updatePreview();
  showToast('Form reset', 'success');
}

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = 'toast show ' + type;
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => t.classList.remove('show'), 3500);
}

/* ================================================================
   CAPTURE — off-screen clone for pixel-perfect rendering
================================================================ */
async function captureA4Page(pageEl) {
  const wrap = document.createElement('div');
  wrap.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:${A4_W_PX}px;background:white;z-index:-100;pointer-events:none;`;
  const clone = pageEl.cloneNode(true);
  clone.style.cssText = `width:${A4_W_PX}px;box-shadow:none;transform:none;`;
  wrap.appendChild(clone);
  document.body.appendChild(wrap);
  try {
    return await html2canvas(clone, {
      scale: 2, useCORS: true, allowTaint: true,
      backgroundColor: '#ffffff', logging: false,
      width: A4_W_PX, windowWidth: A4_W_PX,
    });
  } finally {
    document.body.removeChild(wrap);
  }
}

/* ================================================================
   PDF DOWNLOAD
================================================================ */
async function downloadPDF() {
  showToast('Generating PDF…', 'loading');
  try {
    const previewId = currentTab === 'invoice' ? 'invoice-preview' : 'requisition-preview';
    const pages     = document.getElementById(previewId).querySelectorAll('.a4-page');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ format:'a4', unit:'mm', orientation:'portrait' });
    let first = true;
    for (const pageEl of pages) {
      const canvas  = await captureA4Page(pageEl);
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const ratio   = canvas.height / canvas.width;
      if (!first) pdf.addPage('a4');
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, Math.min(210 * ratio, 297));
      first = false;
    }
    pdf.save(`${getDocNum()}.pdf`);
    showToast('PDF downloaded!', 'success');
  } catch (e) {
    console.error(e);
    showToast('Failed to generate PDF', 'error');
  }
}

/* ================================================================
   JPG DOWNLOAD — separate file per page
================================================================ */
async function downloadJPG() {
  showToast('Generating JPG…', 'loading');
  try {
    const previewId = currentTab === 'invoice' ? 'invoice-preview' : 'requisition-preview';
    const pages     = document.getElementById(previewId).querySelectorAll('.a4-page');
    if (pages.length === 0) { showToast('Nothing to download', 'error'); return; }

    const docNum  = getDocNum();
    const docType = getDocType();
    const canvases = [];
    for (const p of pages) canvases.push(await captureA4Page(p));

    for (let i = 0; i < canvases.length; i++) {
      const filename = canvases.length === 1
        ? `${docNum}.jpg`
        : i === 0 ? `${docType}-${docNum}.jpg` : `${docNum}-Page-${i+1}.jpg`;
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvases[i].toDataURL('image/jpeg', 0.93);
      link.click();
      if (i < canvases.length - 1) await new Promise(r => setTimeout(r, 300));
    }
    showToast(canvases.length > 1 ? `${canvases.length} JPGs downloaded!` : 'JPG downloaded!', 'success');
  } catch (e) {
    console.error(e);
    showToast('Failed to generate JPG', 'error');
  }
}
