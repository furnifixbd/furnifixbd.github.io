/* ===== State ===== */
let currentTab = "invoice";
let invoiceItemCount = 0;
let requisitionItemCount = 0;

/* ===== Logo — change only this constant (or swap logo.png) to update the logo ===== */
const LOGO_SRC = "logo.svg";

/* ===== Init ===== */
document.addEventListener("DOMContentLoaded", () => {
  setDefaultDates();
  setDefaultNumbers();
  setDefaultFromValues();
  addInvoiceItem();
  addInvoiceItem();
  addRequisitionItem();
  addRequisitionItem();
  addRequisitionItem();
  loadFromLocalStorage();
  updatePreview();

  document.getElementById("inv-color").addEventListener("input", function () {
    document.getElementById("inv-color-label").textContent = this.value;
  });
  document.getElementById("req-color").addEventListener("input", function () {
    document.getElementById("req-color-label").textContent = this.value;
  });

  /* Auto-save to localStorage on any input change */
  document.addEventListener("input", debounce(saveToLocalStorage, 600));
  document.addEventListener("change", debounce(saveToLocalStorage, 600));
});

/* ===== Default From Values ===== */
function setDefaultFromValues() {
  const email = document.getElementById("inv-from-email");
  const website = document.getElementById("inv-from-website");
  const address = document.getElementById("inv-from-address");
  if (email && !email.value) email.value = "info@hatil.com";
  if (website && !website.value) website.value = "www.hatil.com";
  if (address && !address.value)
    address.value = "Domna, Muslimtek, Kashimpur, Gazipur";
}

/* ===== Default Dates ===== */
function setDefaultDates() {
  const today = new Date();
  const dueDate = new Date(today);
  dueDate.setDate(dueDate.getDate() + 30);

  const requiredBy = new Date(today);
  requiredBy.setDate(requiredBy.getDate() + 14);

  const fmt = (d) => d.toISOString().split("T")[0];

  const invDate = document.getElementById("inv-date");
  const invDue = document.getElementById("inv-due-date");
  const reqDate = document.getElementById("req-date");
  const reqReq = document.getElementById("req-required-by");

  if (invDate && !invDate.value) invDate.value = fmt(today);
  if (invDue && !invDue.value) invDue.value = fmt(dueDate);
  if (reqDate && !reqDate.value) reqDate.value = fmt(today);
  if (reqReq && !reqReq.value) reqReq.value = fmt(requiredBy);
}

/* ===== Default Numbers ===== */
function setDefaultNumbers() {
  const invNum = document.getElementById("inv-number");
  const reqNum = document.getElementById("req-number");
  const rand = () => Math.floor(Math.random() * 900) + 100;
  if (invNum && !invNum.value) invNum.value = "INV-" + rand();
  if (reqNum && !reqNum.value) reqNum.value = "REQ-" + rand();
}

/* ===== Invoice Type Change Handler ===== */
function handleInvoiceTypeChange() {
  const invType = val("inv-type");
  const numGroup = document.getElementById("inv-number-group");
  /* Hide invoice number when Pick-up Schedule is selected */
  if (numGroup) {
    numGroup.style.display = invType === "Pick-up Schedule" ? "none" : "";
  }
  updatePreview();
}

/* ===== Tab Switching ===== */
function switchTab(tab) {
  currentTab = tab;

  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));
  document.querySelector(`[data-tab="${tab}"]`).classList.add("active");

  document
    .getElementById("invoice-form")
    .classList.toggle("hidden", tab !== "invoice");
  document
    .getElementById("requisition-form")
    .classList.toggle("hidden", tab !== "requisition");
  document
    .getElementById("invoice-preview")
    .classList.toggle("hidden", tab !== "invoice");
  document
    .getElementById("requisition-preview")
    .classList.toggle("hidden", tab !== "requisition");

  updatePreview();
}

/* ===================================================================
   LINE ITEMS — INVOICE
   Each item row now has:
     - Item name (text)
     - Description (text, optional)
     - Qty (number)
     - Pack Quantity (number, optional)
     - Rate (number)
     - Fabric Rate (number, optional)
     - Amount (number, auto-calculated but manually editable)
   =================================================================== */
function addInvoiceItem() {
  invoiceItemCount++;
  const id = invoiceItemCount;
  const container = document.getElementById("inv-items");

  const div = document.createElement("div");
  div.className = "item-row";
  div.id = `inv-item-${id}`;
  div.innerHTML = `
    <div class="item-row-header">
      <span class="item-number">Item ${id}</span>
      <button class="btn btn-danger" onclick="removeItem('inv-item-${id}')">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="item-fields">
      <!-- Item name — full width -->
      <div class="field-group item-desc">
        <label>Item</label>
        <input type="text" class="inv-item-name-input" placeholder="Product or service name" oninput="updatePreview()">
      </div>
      <!-- Description — full width -->
      <div class="field-group item-desc">
        <label>Description</label>
        <input type="text" class="inv-item-desc-input" placeholder="Optional description" oninput="updatePreview()">
      </div>
      <!-- Qty and Rate -->
      <div class="field-group">
        <label>Qty</label>
        <input type="number" class="inv-item-qty" placeholder="1" min="0" step="any" oninput="autoCalcAmount(this)">
      </div>
      <div class="field-group">
        <label>Rate</label>
        <input type="number" class="inv-item-rate" placeholder="0.00" min="0" step="0.01" oninput="autoCalcAmount(this)">
      </div>
      <!-- Pack Quantity (optional) -->
      <div class="field-group">
        <label>Pack Qty <span class="optional-label">(optional)</span></label>
        <input type="number" class="inv-item-pack-qty" placeholder="" min="0" step="any" oninput="autoCalcAmount(this)">
      </div>
      <!-- Fabric Rate (optional) -->
      <div class="field-group">
        <label>Fabric Rate <span class="optional-label">(optional)</span></label>
        <input type="number" class="inv-item-fabric-rate" placeholder="" min="0" step="0.01" oninput="autoCalcAmount(this)">
      </div>
      <!-- Amount — auto-calculated, manually editable -->
      <div class="field-group item-amount-group">
        <label>
          Amount
          <button class="amount-recalc-btn" type="button" title="Recalculate automatically" onclick="recalcAmount(this)">↺</button>
        </label>
        <input type="number" class="inv-item-amount" placeholder="0.00" min="0" step="0.01"
               oninput="markManualAmount(this); updatePreview()">
      </div>
    </div>
  `;
  container.appendChild(div);
  updatePreview();
}

/* Auto-calculate amount using: Amount = (Qty × Rate) + Fabric Rate
   Pack Quantity is informational only — does NOT affect the amount.
   Skips calculation if amount was manually overridden (data-manual="true") */
function autoCalcAmount(changedInput) {
  const row = changedInput.closest(".item-row");
  const amountEl = row.querySelector(".inv-item-amount");

  /* Only auto-calc if amount hasn't been manually set */
  if (amountEl.dataset.manual === "true") {
    updatePreview();
    return;
  }

  const qty = parseFloat(row.querySelector(".inv-item-qty").value) || 0;
  const rate = parseFloat(row.querySelector(".inv-item-rate").value) || 0;
  const fabricRate =
    parseFloat(row.querySelector(".inv-item-fabric-rate").value) || 0;

  /* Formula: (Qty × Rate) + Fabric Rate */
  const calculated = qty * rate + fabricRate;
  amountEl.value = calculated > 0 ? calculated.toFixed(2) : "";
  updatePreview();
}

/* Mark amount field as manually set */
function markManualAmount(amountEl) {
  amountEl.dataset.manual = "true";
}

/* Recalculate button — clears manual flag and recalculates */
function recalcAmount(btn) {
  const row = btn.closest(".item-row");
  const amountEl = row.querySelector(".inv-item-amount");
  amountEl.dataset.manual = "false";
  autoCalcAmount(btn);
}

/* ===== Line Items — Requisition ===== */
function addRequisitionItem() {
  requisitionItemCount++;
  const id = requisitionItemCount;
  const container = document.getElementById("req-items");

  const div = document.createElement("div");
  div.className = "item-row";
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
  if (el) {
    el.remove();
    updatePreview();
  }
}

/* ===== Helpers ===== */
function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function numVal(id) {
  const el = document.getElementById(id);
  return el ? parseFloat(el.value) || 0 : 0;
}

function fmtDate(str) {
  if (!str) return "—";
  const d = new Date(str + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function fmtMoney(amount, sym) {
  return (
    sym +
    amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function debounce(fn, ms) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

/* ===================================================================
   COLLECT INVOICE ITEMS
   Returns array with item, desc, qty, packQty, rate, fabricRate, amount
   =================================================================== */
function getInvoiceItems() {
  const rows = document.querySelectorAll("#inv-items .item-row");
  return Array.from(rows)
    .map((row) => {
      const itemName =
        (row.querySelector(".inv-item-name-input") || {}).value || "";
      const desc =
        (row.querySelector(".inv-item-desc-input") || {}).value || "";
      const qty =
        parseFloat((row.querySelector(".inv-item-qty") || {}).value) || 0;
      const rate =
        parseFloat((row.querySelector(".inv-item-rate") || {}).value) || 0;
      const packQty =
        parseFloat((row.querySelector(".inv-item-pack-qty") || {}).value) || 0;
      const fabricRate =
        parseFloat((row.querySelector(".inv-item-fabric-rate") || {}).value) ||
        0;
      const amountEl = row.querySelector(".inv-item-amount");
      const amount = parseFloat(amountEl ? amountEl.value : 0) || 0;

      return {
        itemName: itemName.trim(),
        desc: desc.trim(),
        qty,
        packQty,
        rate,
        fabricRate,
        amount,
      };
    })
    .filter((i) => i.itemName || i.qty || i.rate || i.amount);
}

/* ===== Collect Requisition Items ===== */
function getRequisitionItems() {
  const rows = document.querySelectorAll("#req-items .item-row");
  return Array.from(rows)
    .map((row) => {
      const inputs = row.querySelectorAll("input");
      const desc = inputs[0] ? inputs[0].value.trim() : "";
      const qty = parseFloat(inputs[1] ? inputs[1].value : 0) || 0;
      const price = parseFloat(inputs[2] ? inputs[2].value : 0) || 0;
      return { desc, qty, price, total: qty * price };
    })
    .filter((i) => i.desc || i.qty || i.price);
}

/* ===== Update Preview ===== */
function updatePreview() {
  if (currentTab === "invoice") renderInvoice();
  else renderRequisition();
  saveToLocalStorage();
}

/* ===================================================================
   RENDER INVOICE
   =================================================================== */
function renderInvoice() {
  const color = val("inv-color") || "#4F46E5";
  const sym = val("inv-currency") || "৳";
  const items = getInvoiceItems();
  const invType = val("inv-type") || "Invoice";
  const isPickup = invType === "Pick-up Schedule";

  /* Totals */
  const taxRate = numVal("inv-tax");
  const discountType = val("inv-discount-type") || "percent";
  const discountVal = numVal("inv-discount");
  const advance = numVal("inv-advance");
  const showSubtotal = document.getElementById("inv-show-subtotal")
    ? document.getElementById("inv-show-subtotal").checked
    : true;
  const showSignature = document.getElementById("inv-show-signature")
    ? document.getElementById("inv-show-signature").checked
    : true;

  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const totalQty = items.reduce((s, i) => s + i.qty, 0);

  /* Discount: percent or fixed */
  let discountAmt = 0;
  if (discountType === "percent") {
    discountAmt = subtotal * (discountVal / 100);
  } else {
    discountAmt = discountVal;
  }
  const afterDiscount = Math.max(0, subtotal - discountAmt);
  const taxAmt = afterDiscount * (taxRate / 100);
  const total = afterDiscount + taxAmt;
  const remainingDue = Math.max(0, total - advance);

  /* Total Pack Quantity — only count if any item has pack qty */
  const totalPackQty = items.reduce((s, i) => s + i.packQty, 0);
  const hasPackQty = items.some((i) => i.packQty > 0);

  /* Business info (header) */
  const fromEmail = val("inv-from-email");
  const fromWebsite = val("inv-from-website");
  const fromAddr = val("inv-from-address");

  /* Bill To */
  const toInfo = val("inv-to-info");

  /* Invoice Details */
  const invNum = val("inv-number") || "INV-001";
  const invDate = val("inv-date");
  const dueDate = val("inv-due-date");
  const terms = val("inv-terms");
  const notes = val("inv-notes");

  /* Check if any items have pack qty or fabric rate (to show columns) */
  const anyPackQty = items.some((i) => i.packQty > 0);
  const anyFabricRate = items.some((i) => i.fabricRate > 0);

  /* Optional columns — only rendered when at least one item uses them */
  const thPackQty = anyPackQty ? `<th class="right">Pack Qty</th>` : "";
  const thFabricRate = anyFabricRate ? `<th class="right">Fabric Rate</th>` : "";

  /* Total fixed columns: # + Item + Description + Qty + Rate + Amount = 6
     Plus optional Pack Qty and Fabric Rate */
  const totalCols = 6 + (anyPackQty ? 1 : 0) + (anyFabricRate ? 1 : 0);

  /* Build table rows — Item and Description as separate columns, # is auto serial */
  const itemsHTML =
    items.length > 0
      ? items
          .map((i, idx) => {
            const serial = idx + 1; /* Sequential serial number starting from 1 */
            const packQtyCell = anyPackQty
              ? `<td class="right">${i.packQty > 0 ? (i.packQty % 1 === 0 ? i.packQty : i.packQty.toFixed(2)) : "—"}</td>`
              : "";
            const fabricRateCell = anyFabricRate
              ? `<td class="right">${i.fabricRate > 0 ? fmtMoney(i.fabricRate, sym) : "—"}</td>`
              : "";
            return `
          <tr>
            <td class="serial">${serial}</td>
            <td><div class="inv-item-name">${esc(i.itemName)}</div></td>
            <td><div class="inv-item-desc-col">${esc(i.desc)}</div></td>
            <td class="right">${i.qty % 1 === 0 ? i.qty : i.qty.toFixed(2)}</td>
            ${packQtyCell}
            <td class="right">${fmtMoney(i.rate, sym)}</td>
            ${fabricRateCell}
            <td class="right amount">${fmtMoney(i.amount, sym)}</td>
          </tr>`;
          })
          .join("")
      : `<tr><td colspan="${totalCols}" style="padding:20px 12px;text-align:center;color:#9CA3AF;font-size:13px;">Add line items using the form</td></tr>`;

  /* Discount label */
  const discountLabel =
    discountType === "percent"
      ? `Discount (${discountVal}%)`
      : `Discount (Fixed)`;

  /* Totals block
     When showSubtotal is OFF: Total Qty, Total Pack Qty, and Subtotal rows are
     completely hidden (not replaced with "(-)") — the whole summary section disappears. */
  const totalsHTML = `
    ${showSubtotal ? `
    <div class="inv-total-row">
      <span class="inv-total-label">Total Qty</span>
      <span class="inv-total-value">${totalQty}</span>
    </div>
    ${hasPackQty ? `
    <div class="inv-total-row">
      <span class="inv-total-label">Total Pack Qty</span>
      <span class="inv-total-value">${totalPackQty}</span>
    </div>` : ""}
    <div class="inv-total-row">
      <span class="inv-total-label">Subtotal</span>
      <span class="inv-total-value">${fmtMoney(subtotal, sym)}</span>
    </div>` : ""}
    ${discountVal > 0 ? `<div class="inv-total-row"><span class="inv-total-label">${discountLabel}</span><span class="inv-total-value">-${fmtMoney(discountAmt, sym)}</span></div>` : ""}
    ${taxRate > 0 ? `<div class="inv-total-row"><span class="inv-total-label">Tax (${taxRate}%)</span><span class="inv-total-value">${fmtMoney(taxAmt, sym)}</span></div>` : ""}
    <div class="inv-total-row grand">
      <span class="inv-total-label">Total</span>
      <span class="inv-total-value" style="color:${color}">${fmtMoney(total, sym)}</span>
    </div>
    ${advance > 0 ? `
    <div class="inv-total-row">
      <span class="inv-total-label">Advance Paid</span>
      <span class="inv-total-value">-${fmtMoney(advance, sym)}</span>
    </div>
    <div class="inv-total-row grand-due">
      <span class="inv-total-label">Remaining Due</span>
      <span class="inv-total-value" style="color:${color}">${fmtMoney(remainingDue, sym)}</span>
    </div>` : ""}
  `;

  /* Logo element — always loaded from LOGO_SRC constant defined at top of file */
  const logoHTML = `<img src="${LOGO_SRC}" alt="Company Logo" class="inv-company-logo" onerror="this.style.display='none'">`;

  /* Header business details */
  const headerDetails = [fromEmail, fromWebsite, fromAddr].filter(Boolean);

  /* Signature section */
  let signatureHTML = "";
  if (showSignature) {
    signatureHTML = `
      <div class="inv-signatures">
        <div class="inv-sig-title">Authorized Signatures</div>
        <div class="inv-sig-grid">
          <div class="inv-sig-block">
            <div class="inv-sig-line"></div>
            <div class="inv-sig-label">Prepared by</div>
            <div class="inv-sig-date">Date: _______________</div>
          </div>
          <div class="inv-sig-block">
            <div class="inv-sig-line"></div>
            <div class="inv-sig-label">Authorized by</div>
            <div class="inv-sig-date">Date: _______________</div>
          </div>
          <div class="inv-sig-block">
            <div class="inv-sig-line"></div>
            <div class="inv-sig-label">Acknowledged by Customer</div>
            <div class="inv-sig-date">Date: _______________</div>
          </div>
        </div>
      </div>`;
  } else {
    /* Signature OFF — show computer generated notice */
    const cgText = isPickup
      ? "This is a Computer Generated Pick-up Schedule. No Signature Required."
      : "This is a Computer Generated Invoice. No Signature Required.";
    signatureHTML = `
      <div class="inv-no-signature-notice">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.4"/><path d="M7 6v4M7 4.5v.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        ${esc(cgText)}
      </div>`;
  }

  document.getElementById("invoice-preview").innerHTML = `
    <div class="inv-doc">

      <!-- Centered business header with logo -->
      <div class="inv-company-header" style="border-bottom:3px solid ${color}">
        ${logoHTML}
        <div class="inv-company-header-details">
          ${headerDetails.map((d) => `<div>${esc(d)}</div>`).join("")}
        </div>
      </div>

      <!-- Document type badge + number + dates (top-right block) -->
      <div class="inv-meta-bar">
        <!-- Bill To (left) -->
        <div class="inv-bill-to-block">
          <div class="inv-party-label">Bill To</div>
          <div class="inv-party-detail">
            ${
              toInfo
                ? esc(toInfo).replace(/\n/g, "<br>")
                : '<span style="color:#9CA3AF">—</span>'
            }
          </div>
        </div>

        <!-- Title + number + dates (right) -->
        <div class="inv-title-block">
          <div class="inv-badge" style="background:${hexToRgba(color, 0.1)};color:${color}">
            ${esc(invType.toUpperCase())}
          </div>
          ${!isPickup ? `<div class="inv-number">${esc(invNum)}</div>` : ""}
          <div class="inv-dates">
            ${invDate ? `Issued: ${fmtDate(invDate)}<br>` : ""}
            ${dueDate ? `Due: <strong style="color:#111827">${fmtDate(dueDate)}</strong>` : ""}
          </div>
        </div>
      </div>

      <div class="inv-divider" style="background:linear-gradient(90deg,${color},${hexToRgba(color, 0.3)})"></div>

      <!-- Items table — # | Item | Description | Qty | [Pack Qty] | Rate | [Fabric Rate] | Amount -->
      <div class="inv-items-section">
        <table class="inv-table">
          <thead>
            <tr>
              <th class="serial-th">#</th>
              <th>Item</th>
              <th>Description</th>
              <th class="right">Qty</th>
              ${anyPackQty ? '<th class="right">Pack Qty</th>' : ""}
              <th class="right">Rate</th>
              ${anyFabricRate ? '<th class="right">Fabric Rate</th>' : ""}
              <th class="right">Amount</th>
            </tr>
          </thead>
          <tbody>${itemsHTML}</tbody>
        </table>
      </div>

      <!-- Totals -->
      <div class="inv-totals">
        <div class="inv-totals-box">${totalsHTML}</div>
      </div>

      <!-- Footer: terms + notes -->
      <div class="inv-footer">
        ${terms ? `<div><div class="inv-footer-label">Payment Terms</div><div class="inv-footer-value">${esc(terms)}</div></div>` : "<div></div>"}
        ${notes ? `<div><div class="inv-footer-label">Notes</div><div class="inv-footer-value">${esc(notes)}</div></div>` : "<div></div>"}
      </div>

      <!-- Signature section -->
      ${signatureHTML}

    </div>
  `;
}

/* ===================================================================
   RENDER REQUISITION
   =================================================================== */
function renderRequisition() {
  const color = val("req-color") || "#059669";
  const sym = val("req-currency") || "$";
  const items = getRequisitionItems();
  const orgName = val("req-org") || "Organization Name";
  const dept = val("req-dept");
  const location = val("req-location");
  const reqName = val("req-name") || "Requester Name";
  const empId = val("req-emp-id");
  const email = val("req-email");
  const phone = val("req-phone");
  const reqNum = val("req-number") || "REQ-001";
  const priority = val("req-priority") || "Normal";
  const reqDate = val("req-date");
  const requiredBy = val("req-required-by");
  const purpose = val("req-purpose");
  const budgetCode = val("req-budget-code");
  const vendor = val("req-vendor");
  const notes = val("req-notes");

  const total = items.reduce((s, i) => s + i.total, 0);

  const priorityColors = {
    Normal: { bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
    High: { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" },
    Urgent: { bg: "#FEF2F2", text: "#991B1B", dot: "#EF4444" },
    Low: { bg: "#F0FDF4", text: "#166534", dot: "#22C55E" },
  };
  const pColor = priorityColors[priority] || priorityColors.Normal;

  const itemsHTML =
    items.length > 0
      ? items
          .map(
            (i, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td class="bold">${esc(i.desc)}</td>
          <td class="right">${i.qty % 1 === 0 ? i.qty : i.qty.toFixed(2)}</td>
          <td class="right">${fmtMoney(i.price, sym)}</td>
          <td class="right bold">${fmtMoney(i.total, sym)}</td>
        </tr>`,
          )
          .join("")
      : `<tr><td colspan="5" style="padding:20px 12px;text-align:center;color:#9CA3AF;font-size:13px;">Add requested items using the form</td></tr>`;

  document.getElementById("requisition-preview").innerHTML = `
    <div class="req-doc">
      <div class="req-header">
        <div>
          <div class="req-org">${esc(orgName)}</div>
          <div class="req-org-sub">${dept ? esc(dept) + " Department" : "Purchase Requisition"}${location ? " &nbsp;·&nbsp; " + esc(location) : ""}</div>
        </div>
        <div class="req-title-block">
          <div class="req-badge" style="background:${hexToRgba(color, 0.1)};color:${color}">REQUISITION</div>
          <div class="req-number">${esc(reqNum)}</div>
          <div class="req-meta">
            ${reqDate ? `Date: ${fmtDate(reqDate)}<br>` : ""}
            ${requiredBy ? `Required by: <strong style="color:#111827">${fmtDate(requiredBy)}</strong>` : ""}
          </div>
        </div>
      </div>

      <div class="req-priority-bar" style="background:${pColor.bg};color:${pColor.text};border-top:1px solid ${hexToRgba(color, 0.15)};border-bottom:1px solid ${hexToRgba(color, 0.15)}">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="${pColor.dot}"><circle cx="5" cy="5" r="5"/></svg>
        Priority: ${priority}
        ${budgetCode ? `&nbsp;&nbsp;·&nbsp;&nbsp;Budget Code: <strong>${esc(budgetCode)}</strong>` : ""}
        ${vendor ? `&nbsp;&nbsp;·&nbsp;&nbsp;Vendor: ${esc(vendor)}` : ""}
      </div>

      <div class="req-info-grid">
        <div class="req-info-block">
          <div class="req-info-label">Requester</div>
          <div class="req-info-value">${esc(reqName)}</div>
          ${empId ? `<div class="req-info-sub">${esc(empId)}</div>` : ""}
        </div>
        <div class="req-info-block">
          <div class="req-info-label">Department</div>
          <div class="req-info-value">${dept ? esc(dept) : "—"}</div>
          ${location ? `<div class="req-info-sub">${esc(location)}</div>` : ""}
        </div>
        <div class="req-info-block">
          <div class="req-info-label">Contact</div>
          <div class="req-info-value">${email ? esc(email) : "—"}</div>
          ${phone ? `<div class="req-info-sub">${esc(phone)}</div>` : ""}
        </div>
      </div>

      ${
        purpose
          ? `
      <div class="req-purpose-block" style="border-left-color:${color}">
        <div class="req-purpose-label">Purpose &amp; Justification</div>
        <div class="req-purpose-text">${esc(purpose).replace(/\n/g, "<br>")}</div>
      </div>`
          : ""
      }

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
          <div class="req-grand-total" style="background:${hexToRgba(color, 0.08)};color:${color}">
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

      ${
        notes
          ? `
      <div class="req-footer-notes">
        <div class="req-notes-label">Additional Notes</div>
        <div class="req-notes-text">${esc(notes).replace(/\n/g, "<br>")}</div>
      </div>`
          : ""
      }
    </div>
  `;
}

/* ===== Escape HTML ===== */
function esc(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ===== Reset ===== */
function resetForm() {
  const forms = document.querySelectorAll("input, textarea, select");
  forms.forEach((el) => {
    if (el.type === "color") return;
    if (el.type === "checkbox") {
      el.checked = true;
      return;
    }
    if (el.tagName === "SELECT") {
      el.selectedIndex = 0;
      return;
    }
    el.value = "";
  });
  document.getElementById("inv-items").innerHTML = "";
  document.getElementById("req-items").innerHTML = "";
  invoiceItemCount = 0;
  requisitionItemCount = 0;
  setDefaultDates();
  setDefaultNumbers();
  setDefaultFromValues();
  addInvoiceItem();
  addInvoiceItem();
  addRequisitionItem();
  addRequisitionItem();
  addRequisitionItem();
  handleInvoiceTypeChange();
  updatePreview();
  showToast("Form reset successfully", "success");
}

/* ===== Toast ===== */
function showToast(msg, type = "") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast show " + type;
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => {
    t.classList.remove("show");
  }, 3000);
}

/* ===== Get Preview Element ===== */
function getPreviewEl() {
  return currentTab === "invoice"
    ? document.getElementById("invoice-preview")
    : document.getElementById("requisition-preview");
}

function getDocTitle() {
  const invType = val("inv-type") || "Invoice";
  const num = currentTab === "invoice" ? val("inv-number") : val("req-number");
  const docName = currentTab === "invoice" ? invType : "Requisition";
  return docName + (num ? "_" + num : "");
}

/* ===================================================================
   LOCAL STORAGE — Save & Restore Form State
   =================================================================== */
function saveToLocalStorage() {
  try {
    const formData = {};
    /* Save all simple inputs and selects */
    document
      .querySelectorAll(
        'input:not([type="color"]):not([type="checkbox"]), textarea, select',
      )
      .forEach((el) => {
        if (el.id) formData[el.id] = el.value;
      });
    /* Save checkboxes */
    document.querySelectorAll('input[type="checkbox"]').forEach((el) => {
      if (el.id) formData[el.id] = el.checked;
    });
    /* Save invoice items */
    const invItemsData = [];
    document.querySelectorAll("#inv-items .item-row").forEach((row) => {
      invItemsData.push({
        itemName: (row.querySelector(".inv-item-name-input") || {}).value || "",
        desc: (row.querySelector(".inv-item-desc-input") || {}).value || "",
        qty: (row.querySelector(".inv-item-qty") || {}).value || "",
        packQty: (row.querySelector(".inv-item-pack-qty") || {}).value || "",
        rate: (row.querySelector(".inv-item-rate") || {}).value || "",
        fabricRate:
          (row.querySelector(".inv-item-fabric-rate") || {}).value || "",
        amount: (row.querySelector(".inv-item-amount") || {}).value || "",
        amountManual:
          (row.querySelector(".inv-item-amount") || {}).dataset.manual ||
          "false",
      });
    });
    /* Save requisition items */
    const reqItemsData = [];
    document.querySelectorAll("#req-items .item-row").forEach((row) => {
      const inputs = row.querySelectorAll("input");
      reqItemsData.push({
        desc: inputs[0] ? inputs[0].value : "",
        qty: inputs[1] ? inputs[1].value : "",
        price: inputs[2] ? inputs[2].value : "",
      });
    });
    formData["__inv_items__"] = JSON.stringify(invItemsData);
    formData["__req_items__"] = JSON.stringify(reqItemsData);
    localStorage.setItem("docforge_invoice", JSON.stringify(formData));
  } catch (e) {
    /* Silent — localStorage may be unavailable */
  }
}

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem("docforge_invoice");
    if (!raw) return;
    const formData = JSON.parse(raw);

    /* Restore simple fields */
    Object.entries(formData).forEach(([id, value]) => {
      if (id.startsWith("__")) return;
      const el = document.getElementById(id);
      if (!el) return;
      if (el.type === "checkbox") {
        el.checked = value === true || value === "true";
      } else {
        el.value = value;
      }
    });

    /* Update color labels */
    const invColorEl = document.getElementById("inv-color");
    if (invColorEl)
      document.getElementById("inv-color-label").textContent = invColorEl.value;
    const reqColorEl = document.getElementById("req-color");
    if (reqColorEl)
      document.getElementById("req-color-label").textContent = reqColorEl.value;

    /* Restore invoice items */
    if (formData["__inv_items__"]) {
      const invItems = JSON.parse(formData["__inv_items__"]);
      document.getElementById("inv-items").innerHTML = "";
      invoiceItemCount = 0;
      invItems.forEach((data) => {
        addInvoiceItem();
        const row = document.getElementById(`inv-item-${invoiceItemCount}`);
        if (!row) return;
        const nameEl = row.querySelector(".inv-item-name-input");
        const descEl = row.querySelector(".inv-item-desc-input");
        const qtyEl = row.querySelector(".inv-item-qty");
        const packQtyEl = row.querySelector(".inv-item-pack-qty");
        const rateEl = row.querySelector(".inv-item-rate");
        const fabricRateEl = row.querySelector(".inv-item-fabric-rate");
        const amountEl = row.querySelector(".inv-item-amount");
        if (nameEl) nameEl.value = data.itemName || "";
        if (descEl) descEl.value = data.desc || "";
        if (qtyEl) qtyEl.value = data.qty || "";
        if (packQtyEl) packQtyEl.value = data.packQty || "";
        if (rateEl) rateEl.value = data.rate || "";
        if (fabricRateEl) fabricRateEl.value = data.fabricRate || "";
        if (amountEl) {
          amountEl.value = data.amount || "";
          amountEl.dataset.manual = data.amountManual || "false";
        }
      });
    }

    /* Restore requisition items */
    if (formData["__req_items__"]) {
      const reqItems = JSON.parse(formData["__req_items__"]);
      document.getElementById("req-items").innerHTML = "";
      requisitionItemCount = 0;
      reqItems.forEach((data) => {
        addRequisitionItem();
        const row = document.getElementById(`req-item-${requisitionItemCount}`);
        if (!row) return;
        const inputs = row.querySelectorAll("input");
        if (inputs[0]) inputs[0].value = data.desc || "";
        if (inputs[1]) inputs[1].value = data.qty || "";
        if (inputs[2]) inputs[2].value = data.price || "";
      });
    }

    /* Apply invoice type visibility */
    handleInvoiceTypeChange();
  } catch (e) {
    /* Silent — may fail on first load */
  }
}

/* ===================================================================
   GOOGLE SHEETS INTEGRATION
   Stub — configure your Google Apps Script Web App URL below.
   =================================================================== */
const GOOGLE_SHEETS_URL = ""; /* TODO: Set your Apps Script deployment URL */

async function saveToGoogleSheets() {
  if (!GOOGLE_SHEETS_URL) {
    showToast("Google Sheets URL not configured", "error");
    return;
  }
  try {
    showToast("Saving to Google Sheets…", "loading");
    const items = getInvoiceItems();
    const payload = {
      type: val("inv-type"),
      number: val("inv-number"),
      date: val("inv-date"),
      dueDate: val("inv-due-date"),
      toInfo: val("inv-to-info"),
      items: items,
      tax: numVal("inv-tax"),
      discountType: val("inv-discount-type"),
      discount: numVal("inv-discount"),
      advance: numVal("inv-advance"),
      terms: val("inv-terms"),
      notes: val("inv-notes"),
    };
    await fetch(GOOGLE_SHEETS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    showToast("Saved to Google Sheets!", "success");
  } catch (e) {
    showToast("Failed to save to Google Sheets", "error");
  }
}

/* ===================================================================
   PDF DOWNLOAD
   =================================================================== */
async function downloadPDF() {
  const el = getPreviewEl();
  if (!el) return;

  showToast("Generating PDF…", "loading");

  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const { jsPDF } = window.jspdf;
    const imgData = canvas.toDataURL("image/png");

    const pxW = canvas.width;
    const pxH = canvas.height;
    const ratio = pxH / pxW;

    const pageW = 210; /* A4 mm */
    const pageH = pageW * ratio;

    const pdf = new jsPDF({
      orientation: pageH > pageW ? "portrait" : "landscape",
      unit: "mm",
      format: pageH <= 297 ? [pageW, pageH] : "a4",
    });

    if (pageH <= 297) {
      pdf.addImage(imgData, "PNG", 0, 0, pageW, pageH);
    } else {
      /* Multi-page fallback */
      const singlePageH = 297;
      let yPos = 0;
      let pageIdx = 0;

      while (yPos < pageH) {
        if (pageIdx > 0) pdf.addPage();
        const clipH = Math.min(singlePageH, pageH - yPos);
        const yRatio = yPos / pageH;
        const hRatio = clipH / pageH;

        const offCanvas = document.createElement("canvas");
        offCanvas.width = canvas.width;
        offCanvas.height = Math.ceil(canvas.height * hRatio);
        const ctx = offCanvas.getContext("2d");
        ctx.drawImage(
          canvas,
          0,
          canvas.height * yRatio,
          canvas.width,
          canvas.height * hRatio,
          0,
          0,
          canvas.width,
          canvas.height * hRatio,
        );

        const sliceData = offCanvas.toDataURL("image/png");
        pdf.addImage(sliceData, "PNG", 0, 0, pageW, clipH);
        yPos += singlePageH;
        pageIdx++;
      }
    }

    pdf.save(getDocTitle() + ".pdf");
    showToast("PDF downloaded!", "success");
  } catch (e) {
    console.error(e);
    showToast("Failed to generate PDF", "error");
  }
}

/* ===================================================================
   JPG DOWNLOAD
   =================================================================== */
async function downloadJPG() {
  const el = getPreviewEl();
  if (!el) return;

  showToast("Generating JPG…", "loading");

  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const link = document.createElement("a");
    link.download = getDocTitle() + ".jpg";
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.click();

    showToast("JPG downloaded!", "success");
  } catch (e) {
    console.error(e);
    showToast("Failed to generate JPG", "error");
  }
}
