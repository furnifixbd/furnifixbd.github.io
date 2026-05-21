/* ===== State ===== */
let currentTab = 'invoice';
let invoiceItemCount = 0;
let requisitionItemCount = 0;
let sidebarVisible = true;
let showInvSignatures = true;
let showReqSignatures = true;
let showReqAmounts = true;

const A4_W_PX = 794;
const A4_H_PX = 1123;
const LOGO_SRC = 'logo.png';

const DEFAULTS = {
  name:    'Furni Fix',
  phone:   '01717-722535',
  address: 'ZIRANI, BKSP, ASHULIA, SAVAR, DHAKA',
  email:   'furnifixbd@gmail.com',
  website: 'furnifix.github.io',
};

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
    const btn = document.getElementById('inv-sig-toggle');
    btn.classList.toggle('active', showInvSignatures);
  } else {
    showReqSignatures = !showReqSignatures;
    const btn = document.getElementById('req-sig-toggle');
    btn.classList.toggle('active', showReqSignatures);
  }
  updatePreview();
}

/* ===== Amount toggle ===== */
function toggleReqAmounts() {
  showReqAmounts = !showReqAmounts;
  document.getElementById('req-amt-toggle').classList.toggle('active', showReqAmounts);
  updatePreview();
}

/* ===== Mobile preview scaling ===== */
function applyPreviewScale() {
  const scroll   = document.querySelector('.preview-scroll');
  const wrapper  = document.querySelector('.preview-wrapper');
  if (!scroll || !wrapper) return;
  const available = scroll.clientWidth - 40;
  if (available < A4_W_PX) {
    const scale = available / A4_W_PX;
    wrapper.style.transform      = `scale(${scale})`;
    wrapper.style.transformOrigin = 'top left';
    wrapper.style.marginBottom   = `-${(A4_W_PX * (1 - scale))}px`;
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
  const id        = invoiceItemCount;
  const container = document.getElementById('inv-items');
  const div       = document.createElement('div');
  div.className   = 'item-row';
  div.id          = `inv-item-${id}`;
  div.innerHTML   = `
    <div class="item-row-header">
      <span class="item-number">${container.children.length + 1}</span>
      <button class="btn btn-danger" onclick="removeItem('inv-item-${id}','inv')">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="field-group" style="margin-bottom:2px">
      <label>Description</label>
      <input type="text" placeholder="Service or product description" oninput="updatePreview()">
    </div>
    <div class="item-amounts">
      <div class="field-group"><label>Qty</label><input type="number" placeholder="1" min="0" step="any" oninput="autoCalcAmount(this)"></div>
      <div class="field-group"><label>Rate</label><input type="number" placeholder="0.00" min="0" step="0.01" oninput="autoCalcAmount(this)"></div>
      <div class="field-group"><label>Amount</label><input type="number" placeholder="auto" min="0" step="0.01" oninput="updatePreview()"></div>
    </div>`;
  container.appendChild(div);
  renumberItems('inv');
  updatePreview();
}

/* ===== Line Items — Requisition ===== */
function addRequisitionItem() {
  requisitionItemCount++;
  const id        = requisitionItemCount;
  const container = document.getElementById('req-items');
  const div       = document.createElement('div');
  div.className   = 'item-row';
  div.id          = `req-item-${id}`;
  div.innerHTML   = `
    <div class="item-row-header">
      <span class="item-number">${container.children.length + 1}</span>
      <button class="btn btn-danger" onclick="removeItem('req-item-${id}','req')">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="field-group" style="margin-bottom:2px">
      <label>Item / Description</label>
      <input type="text" placeholder="Item name and specifications" oninput="updatePreview()">
    </div>
    <div class="item-amounts">
      <div class="field-group"><label>Qty</label><input type="number" placeholder="1" min="0" step="any" oninput="autoCalcAmount(this)"></div>
      <div class="field-group"><label>Unit Price</label><input type="number" placeholder="0.00" min="0" step="0.01" oninput="autoCalcAmount(this)"></div>
      <div class="field-group"><label>Amount</label><input type="number" placeholder="auto" min="0" step="0.01" oninput="updatePreview()"></div>
    </div>`;
  container.appendChild(div);
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
}

function removeItem(id, prefix) {
  const el = document.getElementById(id);
  if (el) { el.remove(); renumberItems(prefix); updatePreview(); }
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

  /* Use actual field values — no silent fallback to defaults */
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

  const totalsHTML = buildInvTotals(sym, totalQty, subtotal, discountAmt, discRate, taxAmt, taxRate, total, color);
  const footerHTML = buildInvFooter(terms, notes);

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
      ${totalsHTML}
      ${showInvSignatures ? buildInvSigs() : ''}
      ${footerHTML}
    </div>`;

  const container = document.getElementById('invoice-preview');
  container.innerHTML = singleHTML;

  const p1 = container.querySelector('#inv-page-1');
  if (p1 && p1.offsetHeight > A4_H_PX && items.length > 1) {
    paginateInvoice(container, items, { invNum, color, sym, fromName, fromEmail, fromPhone, fromAddr, fromWebsite,
      toName, toEmail, toAddr, invDate, dueDate, subtotal, discountAmt, discRate, taxAmt, taxRate, total, totalQty, terms, notes });
  }
}

/* ===== Invoice builders ===== */
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
      ${sigBlock('Prepared by')}
      ${sigBlock('Authorized by')}
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
      <td class="mono">${String(offset + idx + 1).padStart(2,'0')}</td>
      <td><div class="inv-item-name">${esc(item.desc)}</div></td>
      <td class="right">${fmtQty(item.qty)}</td>
      <td class="right">${fmtMoney(item.rate, sym)}</td>
      <td class="right amount">${fmtMoney(item.amount, sym)}</td>
    </tr>`).join('');

    const headerHTML = isFirst
      ? `${buildInvLogoHeader(invNum, color, invDate, dueDate)}
         <div class="inv-accent-bar" style="background:${color}"></div>
         ${buildInvParties(fromName, fromEmail, fromPhone, fromAddr, fromWebsite, toName, toEmail, toAddr)}`
      : `<div class="page-cont-header">
           <img src="${LOGO_SRC}" class="page-cont-logo" alt="Logo">
           <span class="page-cont-ref">Ref: ${esc(invNum)} &nbsp;|&nbsp; Page ${pi + 1}</span>
         </div>`;

    html += `
      ${pi > 0 ? `<div class="page-sep">— Page ${pi + 1} —</div>` : ''}
      <div class="a4-page">
        ${headerHTML}
        <div class="inv-items-section">
          ${!isFirst ? `<div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#9CA3AF;padding-bottom:8px;border-bottom:1.5px solid #E5E7EB;">Items continued</div>` : ''}
          <table class="inv-table">
            <thead><tr><th>#</th><th>Description</th><th class="right">Qty</th><th class="right">Rate</th><th class="right">Amount</th></tr></thead>
            <tbody>${rowsHTML}</tbody>
          </table>
        </div>
        ${isLast ? buildInvTotals(sym, totalQty, subtotal, discountAmt, discRate, taxAmt, taxRate, total, color) : ''}
        ${isLast && showInvSignatures ? buildInvSigs() : ''}
        ${isLast ? buildInvFooter(terms, notes) : ''}
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

  /* Use actual field values only — no silent fallback */
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

  const pc = ({ Normal:{bg:'#EFF6FF',text:'#1D4ED8',dot:'#3B82F6'}, High:{bg:'#FEF3C7',text:'#92400E',dot:'#F59E0B'}, Urgent:{bg:'#FEF2F2',text:'#991B1B',dot:'#EF4444'}, Low:{bg:'#F0FDF4',text:'#166534',dot:'#22C55E'} })[priority] || {bg:'#EFF6FF',text:'#1D4ED8',dot:'#3B82F6'};

  const rowsHTML = items.length > 0
    ? items.map((item, idx) => `<tr>
        <td class="mono">${String(idx+1).padStart(2,'0')}</td>
        <td class="bold">${esc(item.desc)}</td>
        <td class="right">${fmtQty(item.qty)}</td>
        <td class="right">${showReqAmounts ? fmtMoney(item.price, sym) : '(-)'}</td>
        <td class="right bold">${showReqAmounts ? fmtMoney(item.total, sym) : '(-)'}</td>
      </tr>`).join('')
    : `<tr><td colspan="5" style="text-align:center;padding:20px 8px;color:#9CA3AF;font-size:12px;">Add items using the form on the left</td></tr>`;

  const infoGrid = `<div class="req-info-grid">
    <div>
      <div class="req-info-label">Requester</div>
      <div class="req-info-value">${esc(reqName)}</div>
      ${empId ? `<div class="req-info-sub">${esc(empId)}</div>` : ''}
    </div>
    <div>
      <div class="req-info-label">Department</div>
      <div class="req-info-value">${dept ? esc(dept) : '—'}</div>
    </div>
    <div>
      <div class="req-info-label">Contact</div>
      <div class="req-info-value">${email ? esc(email) : '—'}</div>
      ${phone ? `<div class="req-info-sub">${esc(phone)}</div>` : ''}
    </div>
  </div>`;

  const totalsHTML = showReqAmounts
    ? `<div class="req-totals">
        <div class="req-totals-box">
          <div class="req-total-row"><span>Total Quantity</span><span>${fmtQty(totalQty)}</span></div>
          <div class="req-grand-total" style="background:${hexToRgba(color,0.08)};color:${color}">
            <span>Total Estimated Cost</span><span>${fmtMoney(totalAmt, sym)}</span>
          </div>
        </div>
      </div>`
    : `<div class="req-totals">
        <div class="req-totals-box">
          <div class="req-grand-total" style="background:${hexToRgba(color,0.08)};color:${color}">
            <span>Total Quantity</span><span>${fmtQty(totalQty)}</span>
          </div>
          <div class="req-total-row"><span>Total Estimated Cost</span><span>(-)</span></div>
        </div>
      </div>`;

  const logoHeaderHTML = buildReqLogoHeader(reqNum, color, reqDate, requiredBy);
  const orgInfoHTML    = buildReqOrgInfo(orgName, orgEmail, orgPhone, orgWebsite, orgAddress);
  const priorityBar    = `<div class="req-priority-bar" style="background:${pc.bg};color:${pc.text};border-bottom:1px solid ${hexToRgba(color,0.12)}">
    <svg width="8" height="8" viewBox="0 0 8 8" fill="${pc.dot}"><circle cx="4" cy="4" r="4"/></svg>
    Priority: ${priority}
    ${budgetCode ? `&nbsp;&nbsp;·&nbsp;&nbsp;Budget: <strong>${esc(budgetCode)}</strong>` : ''}
    ${vendor     ? `&nbsp;&nbsp;·&nbsp;&nbsp;Vendor: ${esc(vendor)}` : ''}
  </div>`;

  const page1HTML = `
    <div class="a4-page" id="req-page-1">
      ${logoHeaderHTML}
      <div style="height:3px;background:${color}"></div>
      ${orgInfoHTML}
      ${priorityBar}
      ${infoGrid}
      ${purpose ? `<div class="req-purpose-block" style="border-left-color:${color}"><div class="req-purpose-label">Purpose & Justification</div><div class="req-purpose-text">${esc(purpose).replace(/\n/g,'<br>')}</div></div>` : ''}
      <div class="req-items-section">
        <div class="req-section-title">Requested Items</div>
        <table class="req-table">
          <thead><tr><th>#</th><th>Description</th><th class="right">Qty</th><th class="right">Unit Price</th><th class="right">Total</th></tr></thead>
          <tbody>${rowsHTML}</tbody>
        </table>
      </div>
      ${totalsHTML}
      ${showReqSignatures ? buildReqSigs() : ''}
      ${notes ? `<div class="req-footer-notes"><div class="req-notes-label">Additional Notes</div><div class="req-notes-text">${esc(notes).replace(/\n/g,'<br>')}</div></div>` : ''}
    </div>`;

  const container = document.getElementById('requisition-preview');
  container.innerHTML = page1HTML;

  const p1 = container.querySelector('#req-page-1');
  if (p1 && p1.offsetHeight > A4_H_PX && items.length > 1) {
    paginateRequisition(container, items, { reqNum, color, sym, orgName, orgPhone, orgEmail, orgWebsite, orgAddress,
      dept, reqName, empId, email, phone, priority, pc, reqDate, requiredBy, purpose, budgetCode, vendor, notes,
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
        ${reqDate    ? `Date: ${fmtDate(reqDate)}<br>` : ''}
        ${requiredBy ? `Required by: <strong>${fmtDate(requiredBy)}</strong>` : ''}
      </div>
    </div>
  </div>`;
}

function buildReqOrgInfo(orgName, orgEmail, orgPhone, orgWebsite, orgAddress) {
  if (!orgName && !orgEmail && !orgPhone && !orgWebsite && !orgAddress) return '';
  return `<div style="padding:8px 40px 8px;background:#F9FAFB;border-bottom:1px solid #E5E7EB;">
    ${orgName ? `<div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#9CA3AF;margin-bottom:3px;">${esc(orgName)}</div>` : ''}
    <div style="font-size:11px;color:#6B7280;line-height:1.7;">
      ${orgEmail   ? esc(orgEmail) : ''}
      ${orgPhone   ? ` &nbsp;·&nbsp; ${esc(orgPhone)}` : ''}
      ${orgWebsite ? ` &nbsp;·&nbsp; ${esc(orgWebsite)}` : ''}
      ${orgAddress ? `<br>${esc(orgAddress).replace(/\n/g,'<br>')}` : ''}
    </div>
  </div>`;
}

function buildReqSigs() {
  return `<div class="req-approval">
    <div class="req-approval-title">Signatures</div>
    <div class="req-approval-grid">
      ${reqSigBlock('Prepared by')}
      ${reqSigBlock('Authorized by')}
    </div>
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
      <td class="mono">${String(offset + idx + 1).padStart(2,'0')}</td>
      <td class="bold">${esc(item.desc)}</td>
      <td class="right">${fmtQty(item.qty)}</td>
      <td class="right">${showReqAmounts ? fmtMoney(item.price, sym) : '(-)'}</td>
      <td class="right bold">${showReqAmounts ? fmtMoney(item.total, sym) : '(-)'}</td>
    </tr>`).join('');

    const headerHTML = isFirst
      ? `${logoHeaderHTML}<div style="height:3px;background:${color}"></div>${orgInfoHTML}${priorityBar}${infoGrid}
         ${purpose ? `<div class="req-purpose-block" style="border-left-color:${color}"><div class="req-purpose-label">Purpose & Justification</div><div class="req-purpose-text">${esc(purpose).replace(/\n/g,'<br>')}</div></div>` : ''}`
      : `<div class="page-cont-header">
           <img src="${LOGO_SRC}" class="page-cont-logo" alt="Logo">
           <span class="page-cont-ref">Ref: ${esc(reqNum)} &nbsp;|&nbsp; Page ${pi + 1}</span>
         </div>`;

    html += `
      ${pi > 0 ? `<div class="page-sep">— Page ${pi + 1} —</div>` : ''}
      <div class="a4-page">
        ${headerHTML}
        <div class="req-items-section">
          <div class="req-section-title">${isFirst ? 'Requested Items' : 'Items continued'}</div>
          <table class="req-table">
            <thead><tr><th>#</th><th>Description</th><th class="right">Qty</th><th class="right">Unit Price</th><th class="right">Total</th></tr></thead>
            <tbody>${rowsHTML}</tbody>
          </table>
        </div>
        ${isLast ? totalsHTML : ''}
        ${isLast && showReqSignatures ? buildReqSigs() : ''}
        ${isLast && notes ? `<div class="req-footer-notes"><div class="req-notes-label">Additional Notes</div><div class="req-notes-text">${esc(notes).replace(/\n/g,'<br>')}</div></div>` : ''}
      </div>`;
  });
  container.innerHTML = html;
}

function splitPages(items, perPage) {
  const pages = [];
  for (let i = 0; i < items.length; i += perPage) pages.push(items.slice(i, i + perPage));
  return pages.length > 0 ? pages : [[]];
}

/* ===== Doc helpers ===== */
function getDocNum() {
  return currentTab === 'invoice' ? (val('inv-number') || 'INV') : (val('req-number') || 'REQ');
}
function getDocType() {
  return currentTab === 'invoice' ? 'Invoice' : 'Requisition';
}

/* ===== Reset ===== */
function resetForm() {
  document.querySelectorAll('input:not([type="color"]), textarea').forEach(el => el.value = '');
  document.querySelectorAll('select').forEach(el => el.selectedIndex = 0);
  document.getElementById('inv-items').innerHTML = '';
  document.getElementById('req-items').innerHTML = '';
  invoiceItemCount = 0;
  requisitionItemCount = 0;

  showInvSignatures = true;
  showReqSignatures = true;
  showReqAmounts = true;
  document.getElementById('inv-sig-toggle')?.classList.add('active');
  document.getElementById('req-sig-toggle')?.classList.add('active');
  document.getElementById('req-amt-toggle')?.classList.add('active');

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

/* ===== Toast ===== */
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => t.classList.remove('show'), 3500);
}

/* ================================================================
   CAPTURE — off-screen clone for pixel-perfect rendering
   Avoids CSS transform / overflow clipping on the live preview
================================================================ */
async function captureA4Page(pageEl) {
  /* Create a hidden off-screen container at exact A4 width */
  const wrap = document.createElement('div');
  wrap.style.cssText = `
    position: fixed; top: -9999px; left: -9999px;
    width: ${A4_W_PX}px; background: white; z-index: -100;
    pointer-events: none;
  `;
  const clone = pageEl.cloneNode(true);
  /* Reset any inline transforms or shadows on the clone */
  clone.style.cssText = `width:${A4_W_PX}px; box-shadow:none; transform:none;`;
  wrap.appendChild(clone);
  document.body.appendChild(wrap);

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: A4_W_PX,
      windowWidth: A4_W_PX,
    });
    return canvas;
  } finally {
    document.body.removeChild(wrap);
  }
}

/* ================================================================
   PDF DOWNLOAD — high quality (scale 2, JPEG 0.92)
================================================================ */
async function downloadPDF() {
  showToast('Generating PDF…', 'loading');
  try {
    const previewId = currentTab === 'invoice' ? 'invoice-preview' : 'requisition-preview';
    const pages     = document.getElementById(previewId).querySelectorAll('.a4-page');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ format: 'a4', unit: 'mm', orientation: 'portrait' });

    let first = true;
    for (const pageEl of pages) {
      const canvas  = await captureA4Page(pageEl);
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const ratio   = canvas.height / canvas.width;
      const pageH   = Math.min(210 * ratio, 297);
      if (!first) pdf.addPage('a4');
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, pageH);
      first = false;
    }

    const docNum = getDocNum();
    pdf.save(`${docNum}.pdf`);
    showToast('PDF downloaded!', 'success');
  } catch (e) {
    console.error(e);
    showToast('Failed to generate PDF', 'error');
  }
}

/* ================================================================
   JPG DOWNLOAD — separate file per page, named correctly
================================================================ */
async function downloadJPG() {
  showToast('Generating JPG…', 'loading');
  try {
    const previewId = currentTab === 'invoice' ? 'invoice-preview' : 'requisition-preview';
    const pages     = document.getElementById(previewId).querySelectorAll('.a4-page');
    if (pages.length === 0) { showToast('Nothing to download', 'error'); return; }

    const docNum  = getDocNum();   /* e.g. "INV-042" */
    const docType = getDocType();  /* "Invoice" or "Requisition" */

    const canvases = [];
    for (const p of pages) {
      canvases.push(await captureA4Page(p));
    }

    for (let i = 0; i < canvases.length; i++) {
      let filename;
      if (canvases.length === 1) {
        /* Single page: just the document number */
        filename = `${docNum}.jpg`;
      } else if (i === 0) {
        /* First of multiple pages */
        filename = `${docType}-${docNum}.jpg`;
      } else {
        /* Subsequent pages */
        filename = `${docNum}-Page-${i + 1}.jpg`;
      }

      const link = document.createElement('a');
      link.download = filename;
      link.href = canvases[i].toDataURL('image/jpeg', 0.93);
      link.click();

      /* Small delay so browser doesn't block multiple downloads */
      if (i < canvases.length - 1) await new Promise(r => setTimeout(r, 300));
    }

    showToast(canvases.length > 1 ? `${canvases.length} JPGs downloaded!` : 'JPG downloaded!', 'success');
  } catch (e) {
    console.error(e);
    showToast('Failed to generate JPG', 'error');
  }
}
