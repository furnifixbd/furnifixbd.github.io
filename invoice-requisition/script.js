/* ===== State ===== */
let currentTab = 'invoice';
let invoiceItemCount = 0;
let requisitionItemCount = 0;

/* ===== Init ===== */
document.addEventListener('DOMContentLoaded', () => {
  setDefaultDates();
  setDefaultNumbers();
  addInvoiceItem();
  addInvoiceItem();
  addRequisitionItem();
  addRequisitionItem();
  addRequisitionItem();
  updatePreview();

  document.getElementById('inv-color').addEventListener('input', function() {
    document.getElementById('inv-color-label').textContent = this.value;
  });
  document.getElementById('req-color').addEventListener('input', function() {
    document.getElementById('req-color-label').textContent = this.value;
  });
});

function setDefaultDates() {
  const today = new Date();
  const dueDate = new Date(today);
  dueDate.setDate(dueDate.getDate() + 30);

  const requiredBy = new Date(today);
  requiredBy.setDate(requiredBy.getDate() + 14);

  const fmt = d => d.toISOString().split('T')[0];

  const invDate = document.getElementById('inv-date');
  const invDue = document.getElementById('inv-due-date');
  const reqDate = document.getElementById('req-date');
  const reqReq = document.getElementById('req-required-by');

  if (invDate) invDate.value = fmt(today);
  if (invDue) invDue.value = fmt(dueDate);
  if (reqDate) reqDate.value = fmt(today);
  if (reqReq) reqReq.value = fmt(requiredBy);
}

function setDefaultNumbers() {
  const invNum = document.getElementById('inv-number');
  const reqNum = document.getElementById('req-number');
  const rand = () => Math.floor(Math.random() * 900) + 100;
  if (invNum && !invNum.value) invNum.value = 'INV-' + rand();
  if (reqNum && !reqNum.value) reqNum.value = 'REQ-' + rand();
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

/* ===== Line Items — Invoice ===== */
function addInvoiceItem() {
  invoiceItemCount++;
  const id = invoiceItemCount;
  const container = document.getElementById('inv-items');

  const div = document.createElement('div');
  div.className = 'item-row';
  div.id = `inv-item-${id}`;
  div.innerHTML = `
    <div class="item-row-header">
      <span class="item-number">Item ${id}</span>
      <button class="btn btn-danger" onclick="removeItem('inv-item-${id}')">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="item-fields">
      <div class="field-group item-desc">
        <label>Description</label>
        <input type="text" placeholder="Service or product description" oninput="updatePreview()">
      </div>
      <div class="field-group">
        <label>Qty</label>
        <input type="number" placeholder="1" min="0" step="any" oninput="updatePreview()">
      </div>
      <div class="field-group">
        <label>Rate</label>
        <input type="number" placeholder="0.00" min="0" step="0.01" oninput="updatePreview()">
      </div>
    </div>
  `;
  container.appendChild(div);
  updatePreview();
}

/* ===== Line Items — Requisition ===== */
function addRequisitionItem() {
  requisitionItemCount++;
  const id = requisitionItemCount;
  const container = document.getElementById('req-items');

  const div = document.createElement('div');
  div.className = 'item-row';
  div.id = `req-item-${id}`;
  div.innerHTML = `
    <div class="item-row-header">
      <span class="item-number">Item ${id}</span>
      <button class="btn btn-danger" onclick="removeItem('req-item-${id}')">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="item-fields">
      <div class="field-group item-desc">
        <label>Item / Description</label>
        <input type="text" placeholder="Item name and specifications" oninput="updatePreview()">
      </div>
      <div class="field-group">
        <label>Qty</label>
        <input type="number" placeholder="1" min="0" step="any" oninput="updatePreview()">
      </div>
      <div class="field-group">
        <label>Unit Price</label>
        <input type="number" placeholder="0.00" min="0" step="0.01" oninput="updatePreview()">
      </div>
    </div>
  `;
  container.appendChild(div);
  updatePreview();
}

function removeItem(id) {
  const el = document.getElementById(id);
  if (el) { el.remove(); updatePreview(); }
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
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function fmtMoney(amount, sym) {
  return sym + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ===== Collect Invoice Items ===== */
function getInvoiceItems() {
  const rows = document.querySelectorAll('#inv-items .item-row');
  return Array.from(rows).map(row => {
    const inputs = row.querySelectorAll('input');
    const desc = inputs[0] ? inputs[0].value.trim() : '';
    const qty = parseFloat(inputs[1] ? inputs[1].value : 0) || 0;
    const rate = parseFloat(inputs[2] ? inputs[2].value : 0) || 0;
    return { desc, qty, rate, amount: qty * rate };
  }).filter(i => i.desc || i.qty || i.rate);
}

/* ===== Collect Requisition Items ===== */
function getRequisitionItems() {
  const rows = document.querySelectorAll('#req-items .item-row');
  return Array.from(rows).map(row => {
    const inputs = row.querySelectorAll('input');
    const desc = inputs[0] ? inputs[0].value.trim() : '';
    const qty = parseFloat(inputs[1] ? inputs[1].value : 0) || 0;
    const price = parseFloat(inputs[2] ? inputs[2].value : 0) || 0;
    return { desc, qty, price, total: qty * price };
  }).filter(i => i.desc || i.qty || i.price);
}

/* ===== Update Preview ===== */
function updatePreview() {
  if (currentTab === 'invoice') renderInvoice();
  else renderRequisition();
}

/* ===== Render Invoice ===== */
function renderInvoice() {
  const color = val('inv-color') || '#4F46E5';
  const sym = val('inv-currency') || '$';
  const items = getInvoiceItems();
  const taxRate = numVal('inv-tax');
  const discountRate = numVal('inv-discount');

  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const discountAmt = subtotal * (discountRate / 100);
  const afterDiscount = subtotal - discountAmt;
  const taxAmt = afterDiscount * (taxRate / 100);
  const total = afterDiscount + taxAmt;

  const fromName = val('inv-from-name') || 'Your Company';
  const fromEmail = val('inv-from-email');
  const fromPhone = val('inv-from-phone');
  const fromAddr = val('inv-from-address');
  const toName = val('inv-to-name') || 'Client Name';
  const toEmail = val('inv-to-email');
  const toAddr = val('inv-to-address');
  const invNum = val('inv-number') || 'INV-001';
  const invDate = val('inv-date');
  const dueDate = val('inv-due-date');
  const terms = val('inv-terms');
  const notes = val('inv-notes');

  const itemsHTML = items.length > 0
    ? items.map(i => `
        <tr>
          <td><div class="inv-item-name">${esc(i.desc)}</div></td>
          <td class="right">${i.qty % 1 === 0 ? i.qty : i.qty.toFixed(2)}</td>
          <td class="right">${fmtMoney(i.rate, sym)}</td>
          <td class="right amount">${fmtMoney(i.amount, sym)}</td>
        </tr>`).join('')
    : `<tr><td colspan="4" style="padding:20px 12px;text-align:center;color:#9CA3AF;font-size:13px;">Add line items using the form</td></tr>`;

  const totalsHTML = `
    <div class="inv-total-row"><span class="inv-total-label">Subtotal</span><span class="inv-total-value">${fmtMoney(subtotal, sym)}</span></div>
    ${discountRate > 0 ? `<div class="inv-total-row"><span class="inv-total-label">Discount (${discountRate}%)</span><span class="inv-total-value">-${fmtMoney(discountAmt, sym)}</span></div>` : ''}
    ${taxRate > 0 ? `<div class="inv-total-row"><span class="inv-total-label">Tax (${taxRate}%)</span><span class="inv-total-value">${fmtMoney(taxAmt, sym)}</span></div>` : ''}
    <div class="inv-total-row grand"><span class="inv-total-label">Total</span><span class="inv-total-value" style="color:${color}">${fmtMoney(total, sym)}</span></div>
  `;

  const fromDetails = [fromEmail, fromPhone, fromAddr].filter(Boolean).join(' · ').replace(/·\s*·/g, '·');

  document.getElementById('invoice-preview').innerHTML = `
    <div class="inv-doc">
      <div class="inv-header">
        <div>
          <div class="inv-brand-name">${esc(fromName)}</div>
          <div class="inv-brand-details">${esc(fromDetails)}</div>
        </div>
        <div class="inv-title-block">
          <div class="inv-badge" style="background:${hexToRgba(color,0.1)};color:${color}">INVOICE</div>
          <div class="inv-number">${esc(invNum)}</div>
          <div class="inv-dates">
            ${invDate ? `Issued: ${fmtDate(invDate)}<br>` : ''}
            ${dueDate ? `Due: <strong style="color:#111827">${fmtDate(dueDate)}</strong>` : ''}
          </div>
        </div>
      </div>

      <div class="inv-divider" style="background:linear-gradient(90deg,${color},${hexToRgba(color,0.3)})"></div>

      <div class="inv-parties">
        <div>
          <div class="inv-party-label">From</div>
          <div class="inv-party-name">${esc(fromName)}</div>
          <div class="inv-party-detail">${esc(fromEmail)}${fromPhone ? `<br>${esc(fromPhone)}` : ''}${fromAddr ? `<br>${esc(fromAddr).replace(/\n/g,'<br>')}` : ''}</div>
        </div>
        <div>
          <div class="inv-party-label">Bill To</div>
          <div class="inv-party-name">${esc(toName)}</div>
          <div class="inv-party-detail">${esc(toEmail)}${toAddr ? `<br>${esc(toAddr).replace(/\n/g,'<br>')}` : ''}</div>
        </div>
      </div>

      <div class="inv-items-section">
        <table class="inv-table">
          <thead>
            <tr>
              <th>Description</th>
              <th class="right">Qty</th>
              <th class="right">Rate</th>
              <th class="right">Amount</th>
            </tr>
          </thead>
          <tbody>${itemsHTML}</tbody>
        </table>
      </div>

      <div class="inv-totals">
        <div class="inv-totals-box">${totalsHTML}</div>
      </div>

      <div class="inv-footer">
        ${terms ? `<div><div class="inv-footer-label">Payment Terms</div><div class="inv-footer-value">${esc(terms)}</div></div>` : '<div></div>'}
        ${notes ? `<div><div class="inv-footer-label">Notes</div><div class="inv-footer-value">${esc(notes)}</div></div>` : '<div></div>'}
      </div>
    </div>
  `;
}

/* ===== Render Requisition ===== */
function renderRequisition() {
  const color = val('req-color') || '#059669';
  const sym = val('req-currency') || '$';
  const items = getRequisitionItems();
  const orgName = val('req-org') || 'Organization Name';
  const dept = val('req-dept');
  const location = val('req-location');
  const reqName = val('req-name') || 'Requester Name';
  const empId = val('req-emp-id');
  const email = val('req-email');
  const phone = val('req-phone');
  const reqNum = val('req-number') || 'REQ-001';
  const priority = val('req-priority') || 'Normal';
  const reqDate = val('req-date');
  const requiredBy = val('req-required-by');
  const purpose = val('req-purpose');
  const budgetCode = val('req-budget-code');
  const vendor = val('req-vendor');
  const notes = val('req-notes');

  const total = items.reduce((s, i) => s + i.total, 0);

  const priorityColors = {
    Normal: { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
    High: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
    Urgent: { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444' },
    Low: { bg: '#F0FDF4', text: '#166534', dot: '#22C55E' },
  };
  const pColor = priorityColors[priority] || priorityColors.Normal;

  const itemsHTML = items.length > 0
    ? items.map((i,idx) => `
        <tr>
          <td>${idx+1}</td>
          <td class="bold">${esc(i.desc)}</td>
          <td class="right">${i.qty % 1 === 0 ? i.qty : i.qty.toFixed(2)}</td>
          <td class="right">${fmtMoney(i.price, sym)}</td>
          <td class="right bold">${fmtMoney(i.total, sym)}</td>
        </tr>`).join('')
    : `<tr><td colspan="5" style="padding:20px 12px;text-align:center;color:#9CA3AF;font-size:13px;">Add requested items using the form</td></tr>`;

  document.getElementById('requisition-preview').innerHTML = `
    <div class="req-doc">
      <div class="req-header">
        <div>
          <div class="req-org">${esc(orgName)}</div>
          <div class="req-org-sub">${dept ? esc(dept) + ' Department' : 'Purchase Requisition'}${location ? ' &nbsp;·&nbsp; ' + esc(location) : ''}</div>
        </div>
        <div class="req-title-block">
          <div class="req-badge" style="background:${hexToRgba(color,0.1)};color:${color}">REQUISITION</div>
          <div class="req-number">${esc(reqNum)}</div>
          <div class="req-meta">
            ${reqDate ? `Date: ${fmtDate(reqDate)}<br>` : ''}
            ${requiredBy ? `Required by: <strong style="color:#111827">${fmtDate(requiredBy)}</strong>` : ''}
          </div>
        </div>
      </div>

      <div class="req-priority-bar" style="background:${pColor.bg};color:${pColor.text};border-top:1px solid ${hexToRgba(color,0.15)};border-bottom:1px solid ${hexToRgba(color,0.15)}">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="${pColor.dot}"><circle cx="5" cy="5" r="5"/></svg>
        Priority: ${priority}
        ${budgetCode ? `&nbsp;&nbsp;·&nbsp;&nbsp;Budget Code: <strong>${esc(budgetCode)}</strong>` : ''}
        ${vendor ? `&nbsp;&nbsp;·&nbsp;&nbsp;Vendor: ${esc(vendor)}` : ''}
      </div>

      <div class="req-info-grid">
        <div class="req-info-block">
          <div class="req-info-label">Requester</div>
          <div class="req-info-value">${esc(reqName)}</div>
          ${empId ? `<div class="req-info-sub">${esc(empId)}</div>` : ''}
        </div>
        <div class="req-info-block">
          <div class="req-info-label">Department</div>
          <div class="req-info-value">${dept ? esc(dept) : '—'}</div>
          ${location ? `<div class="req-info-sub">${esc(location)}</div>` : ''}
        </div>
        <div class="req-info-block">
          <div class="req-info-label">Contact</div>
          <div class="req-info-value">${email ? esc(email) : '—'}</div>
          ${phone ? `<div class="req-info-sub">${esc(phone)}</div>` : ''}
        </div>
      </div>

      ${purpose ? `
      <div class="req-purpose-block" style="border-left-color:${color}">
        <div class="req-purpose-label">Purpose & Justification</div>
        <div class="req-purpose-text">${esc(purpose).replace(/\n/g,'<br>')}</div>
      </div>` : ''}

      <div class="req-items-section">
        <div class="req-section-title">Requested Items</div>
        <table class="req-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th class="right">Qty</th>
              <th class="right">Unit Price</th>
              <th class="right">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHTML}</tbody>
        </table>
      </div>

      <div class="req-totals">
        <div class="req-totals-box">
          <div class="req-grand-total" style="background:${hexToRgba(color,0.08)};color:${color}">
            <span>Total Estimated Cost</span>
            <span>${fmtMoney(total, sym)}</span>
          </div>
        </div>
      </div>

      <div class="req-approval">
        <div class="req-approval-title">Approval Signatures</div>
        <div class="req-approval-grid">
          <div class="req-sig-block">
            <div class="req-sig-label">Requested by</div>
            <div style="height:32px"></div>
            <div class="req-sig-date">Date: _______________</div>
          </div>
          <div class="req-sig-block">
            <div class="req-sig-label">Approved by (Manager)</div>
            <div style="height:32px"></div>
            <div class="req-sig-date">Date: _______________</div>
          </div>
          <div class="req-sig-block">
            <div class="req-sig-label">Finance / Procurement</div>
            <div style="height:32px"></div>
            <div class="req-sig-date">Date: _______________</div>
          </div>
        </div>
      </div>

      ${notes ? `
      <div class="req-footer-notes">
        <div class="req-notes-label">Additional Notes</div>
        <div class="req-notes-text">${esc(notes).replace(/\n/g,'<br>')}</div>
      </div>` : ''}
    </div>
  `;
}

/* ===== Escape HTML ===== */
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

/* ===== Reset ===== */
function resetForm() {
  const forms = document.querySelectorAll('input, textarea, select');
  forms.forEach(el => {
    if (el.type === 'color') return;
    if (el.type === 'select-one') { el.selectedIndex = 0; return; }
    el.value = '';
  });
  document.getElementById('inv-items').innerHTML = '';
  document.getElementById('req-items').innerHTML = '';
  invoiceItemCount = 0;
  requisitionItemCount = 0;
  setDefaultDates();
  setDefaultNumbers();
  addInvoiceItem();
  addInvoiceItem();
  addRequisitionItem();
  addRequisitionItem();
  addRequisitionItem();
  updatePreview();
  showToast('Form reset successfully', 'success');
}

/* ===== Toast ===== */
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => { t.classList.remove('show'); }, 3000);
}

/* ===== Get Preview Element ===== */
function getPreviewEl() {
  return currentTab === 'invoice'
    ? document.getElementById('invoice-preview')
    : document.getElementById('requisition-preview');
}

function getDocTitle() {
  const num = currentTab === 'invoice' ? val('inv-number') : val('req-number');
  return (currentTab === 'invoice' ? 'Invoice' : 'Requisition') + (num ? '_' + num : '');
}

/* ===== Download PDF ===== */
async function downloadPDF() {
  const el = getPreviewEl();
  if (!el) return;

  showToast('Generating PDF…', 'loading');

  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    const { jsPDF } = window.jspdf;
    const imgData = canvas.toDataURL('image/png');

    const pxW = canvas.width;
    const pxH = canvas.height;
    const ratio = pxH / pxW;

    const pageW = 210; // A4 mm
    const pageH = pageW * ratio;

    const pdf = new jsPDF({
      orientation: pageH > pageW ? 'portrait' : 'landscape',
      unit: 'mm',
      format: pageH <= 297 ? [pageW, pageH] : 'a4'
    });

    if (pageH <= 297) {
      pdf.addImage(imgData, 'PNG', 0, 0, pageW, pageH);
    } else {
      // Multi-page
      const singlePageH = 297;
      let yPos = 0;
      let pageIdx = 0;

      while (yPos < pageH) {
        if (pageIdx > 0) pdf.addPage();
        const clipH = Math.min(singlePageH, pageH - yPos);
        const yRatio = yPos / pageH;
        const hRatio = clipH / pageH;

        const offCanvas = document.createElement('canvas');
        offCanvas.width = canvas.width;
        offCanvas.height = canvas.height * hRatio;
        const ctx = offCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, canvas.height * yRatio, canvas.width, canvas.height * hRatio, 0, 0, canvas.width, canvas.height * hRatio);

        const sliceData = offCanvas.toDataURL('image/png');
        pdf.addImage(sliceData, 'PNG', 0, 0, pageW, clipH);
        yPos += singlePageH;
        pageIdx++;
      }
    }

    pdf.save(getDocTitle() + '.pdf');
    showToast('PDF downloaded!', 'success');
  } catch (e) {
    console.error(e);
    showToast('Failed to generate PDF', 'error');
  }
}

/* ===== Download JPG ===== */
async function downloadJPG() {
  const el = getPreviewEl();
  if (!el) return;

  showToast('Generating JPG…', 'loading');

  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    const link = document.createElement('a');
    link.download = getDocTitle() + '.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();

    showToast('JPG downloaded!', 'success');
  } catch (e) {
    console.error(e);
    showToast('Failed to generate JPG', 'error');
  }
}
