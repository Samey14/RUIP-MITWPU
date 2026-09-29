import { Expense, Attachment } from '../types';

export function numToWordsINR(num: number): string {
  if (num === 0) return 'Zero';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n === 0) return '';
    if (n < 20) return a[n] + ' ';
    if (n < 100) return b[Math.floor(n / 10)] + ' ' + inWords(n % 10);
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred ' + inWords(n % 100);
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + inWords(n % 1000);
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + inWords(n % 100000);
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + inWords(n % 10000000);
  }

  return inWords(Math.abs(Math.round(num))).trim();
}

export function generateVoucherSvgDataUrl(expense: Expense, filename?: string): string {
  const billNum = expense.billNumber || `VCH-${expense.id.replace('exp-', '2026-')}`;
  const vendor = expense.vendor;
  const date = expense.date;
  const amtStr = expense.amount.toLocaleString('en-IN');
  const mode = expense.paymentMode;
  const desc = expense.description || `${expense.category} supplies for Rural Immersion`;
  const faculty = expense.paidByFaculty || 'Faculty Coordinator';
  const fn = filename || `${vendor.toLowerCase().replace(/[^a-z0-9]/g, '-')}-bill.jpg`;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 780" width="100%" height="100%">
  <defs>
    <style>
      .text-title { font-family: 'Courier New', Courier, monospace; font-size: 20px; font-weight: bold; fill: #111827; }
      .text-sub { font-family: 'Courier New', Courier, monospace; font-size: 11px; fill: #4b5563; }
      .text-bold { font-family: 'Courier New', Courier, monospace; font-size: 13px; font-weight: bold; fill: #111827; }
      .text-mono { font-family: 'Courier New', Courier, monospace; font-size: 12px; fill: #1f2937; }
      .text-amt { font-family: 'Courier New', Courier, monospace; font-size: 22px; font-weight: 800; fill: #047857; }
      .line { stroke: #9ca3af; stroke-dasharray: 4 4; stroke-width: 1.5; }
      .solid-line { stroke: #111827; stroke-width: 2; }
    </style>
  </defs>

  <rect x="10" y="10" width="580" height="760" rx="8" fill="#ffffff" stroke="#d1d5db" stroke-width="2"/>
  <rect x="18" y="18" width="564" height="744" rx="4" fill="#fafafa"/>
  <rect x="25" y="25" width="550" height="8" fill="#e5e7eb" rx="2"/>

  <!-- Store / Vendor Header -->
  <g transform="translate(40, 60)">
    <text x="260" y="20" class="text-title" text-anchor="middle">${vendor.toUpperCase()}</text>
    <text x="260" y="38" class="text-sub" text-anchor="middle">AUTHORIZED RETAIL &amp; SERVICE PROVIDER</text>
    <text x="260" y="52" class="text-sub" text-anchor="middle">Grampanchayat Road, Shirur / Durgaon, Dist. Pune - 412210</text>
    <text x="260" y="66" class="text-sub" text-anchor="middle">GSTIN / REG NO: 27AABCM${Math.floor(1000 + Math.random() * 9000)}Z1Z5</text>
  </g>

  <line x1="40" y1="140" x2="560" y2="140" class="solid-line"/>

  <!-- Bill Details Banner -->
  <g transform="translate(40, 155)">
    <text x="0" y="18" class="text-bold">TAX INVOICE / CASH MEMO</text>
    <text x="520" y="18" class="text-bold" text-anchor="end">BILL NO: ${billNum}</text>

    <text x="0" y="38" class="text-mono">DATE: ${date}</text>
    <text x="520" y="38" class="text-mono" text-anchor="end">TIME: 14:32 IST</text>

    <text x="0" y="58" class="text-mono">BILLED TO: MIT WORLD PEACE UNIVERSITY, PUNE</text>
    <text x="520" y="58" class="text-mono" text-anchor="end">CAMP: DURGAON</text>

    <text x="0" y="78" class="text-mono">COORDINATOR: ${faculty.toUpperCase()}</text>
    <text x="520" y="78" class="text-mono" text-anchor="end">MODE: ${mode.toUpperCase()}</text>
  </g>

  <!-- Items Table Header -->
  <g transform="translate(40, 255)">
    <line x1="0" y1="0" x2="520" y2="0" class="line"/>
    <text x="0" y="20" class="text-bold">SR.  DESCRIPTION</text>
    <text x="350" y="20" class="text-bold" text-anchor="end">QTY</text>
    <text x="440" y="20" class="text-bold" text-anchor="end">RATE</text>
    <text x="520" y="20" class="text-bold" text-anchor="end">AMOUNT</text>
    <line x1="0" y1="30" x2="520" y2="30" class="line"/>
  </g>

  <!-- Items Content -->
  <g transform="translate(40, 305)">
    <text x="0" y="20" class="text-mono">01.  ${expense.category.toUpperCase()} EXPENSE</text>
    <text x="350" y="20" class="text-mono" text-anchor="end">1 LOT</text>
    <text x="440" y="20" class="text-mono" text-anchor="end">₹${amtStr}</text>
    <text x="520" y="20" class="text-bold" text-anchor="end">₹${amtStr}</text>

    <text x="25" y="44" class="text-sub">${desc.slice(0, 55)}</text>
    ${desc.length > 55 ? `<text x="25" y="58" class="text-sub">${desc.slice(55, 110)}</text>` : ''}

    <line x1="0" y1="85" x2="520" y2="85" class="line"/>
  </g>

  <!-- Totals Section -->
  <g transform="translate(40, 410)">
    <text x="320" y="20" class="text-mono">SUB TOTAL:</text>
    <text x="520" y="20" class="text-mono" text-anchor="end">₹${amtStr}</text>

    <text x="320" y="40" class="text-mono">SGST / CGST (INCL):</text>
    <text x="520" y="40" class="text-mono" text-anchor="end">₹0.00</text>

    <line x1="320" y1="52" x2="520" y2="52" class="solid-line"/>

    <text x="320" y="75" class="text-bold" font-size="15">NET TOTAL:</text>
    <text x="520" y="75" class="text-amt" text-anchor="end">₹${amtStr}</text>
    
    <line x1="320" y1="85" x2="520" y2="85" class="solid-line"/>
  </g>

  <!-- Payment Status Stamp Box -->
  <g transform="translate(60, 520)">
    <rect x="0" y="0" width="220" height="90" rx="8" fill="#ecfdf5" stroke="#059669" stroke-width="2.5" stroke-dasharray="6 3"/>
    <text x="110" y="30" font-family="'Courier New', monospace" font-size="16" font-weight="900" fill="#047857" text-anchor="middle">PAID &amp; SETTLED</text>
    <text x="110" y="50" font-family="'Courier New', monospace" font-size="11" font-weight="bold" fill="#065f46" text-anchor="middle">${mode.toUpperCase()}</text>
    <text x="110" y="70" font-family="'Courier New', monospace" font-size="10" fill="#047857" text-anchor="middle">MIT-WPU RUIP AUDIT</text>
  </g>

  <!-- Signatures on Paper -->
  <g transform="translate(360, 560)">
    <line x1="0" y1="35" x2="180" y2="35" stroke="#1f2937" stroke-width="1.5"/>
    <text x="90" y="52" class="text-sub" text-anchor="middle">AUTHORIZED SIGNATORY</text>
    <text x="90" y="24" font-family="'Brush Script MT', cursive, sans-serif" font-size="18" fill="#1e3a8a" text-anchor="middle">${vendor.split(' ')[0]}</text>
  </g>

  <!-- Barcode Simulation -->
  <g transform="translate(180, 645)">
    <rect x="0" y="0" width="2" height="35" fill="#111827"/>
    <rect x="5" y="0" width="4" height="35" fill="#111827"/>
    <rect x="12" y="0" width="1" height="35" fill="#111827"/>
    <rect x="16" y="0" width="3" height="35" fill="#111827"/>
    <rect x="22" y="0" width="5" height="35" fill="#111827"/>
    <rect x="30" y="0" width="2" height="35" fill="#111827"/>
    <rect x="35" y="0" width="1" height="35" fill="#111827"/>
    <rect x="38" y="0" width="4" height="35" fill="#111827"/>
    <rect x="45" y="0" width="2" height="35" fill="#111827"/>
    <rect x="50" y="0" width="5" height="35" fill="#111827"/>
    <rect x="58" y="0" width="2" height="35" fill="#111827"/>
    <rect x="63" y="0" width="3" height="35" fill="#111827"/>
    <rect x="70" y="0" width="1" height="35" fill="#111827"/>
    <rect x="74" y="0" width="4" height="35" fill="#111827"/>
    <rect x="82" y="0" width="2" height="35" fill="#111827"/>
    <rect x="88" y="0" width="5" height="35" fill="#111827"/>
    <rect x="96" y="0" width="1" height="35" fill="#111827"/>
    <rect x="100" y="0" width="3" height="35" fill="#111827"/>
    <rect x="106" y="0" width="4" height="35" fill="#111827"/>
    <rect x="114" y="0" width="2" height="35" fill="#111827"/>
    <rect x="120" y="0" width="3" height="35" fill="#111827"/>
    <rect x="126" y="0" width="1" height="35" fill="#111827"/>
    <rect x="130" y="0" width="4" height="35" fill="#111827"/>
    <rect x="138" y="0" width="2" height="35" fill="#111827"/>
    <rect x="144" y="0" width="5" height="35" fill="#111827"/>
    <rect x="152" y="0" width="2" height="35" fill="#111827"/>
    <rect x="158" y="0" width="4" height="35" fill="#111827"/>
    <rect x="166" y="0" width="2" height="35" fill="#111827"/>
    <rect x="172" y="0" width="4" height="35" fill="#111827"/>
    <rect x="180" y="0" width="3" height="35" fill="#111827"/>
    <rect x="186" y="0" width="1" height="35" fill="#111827"/>
    <rect x="190" y="0" width="5" height="35" fill="#111827"/>
    <rect x="200" y="0" width="2" height="35" fill="#111827"/>
    <rect x="205" y="0" width="3" height="35" fill="#111827"/>
    <rect x="212" y="0" width="2" height="35" fill="#111827"/>
    <rect x="218" y="0" width="4" height="35" fill="#111827"/>
    <rect x="225" y="0" width="2" height="35" fill="#111827"/>
    <text x="115" y="47" class="text-sub" text-anchor="middle">* ${billNum} *</text>
  </g>

  <text x="300" y="725" class="text-sub" text-anchor="middle">Official Rural Immersion Verified Bill · Uploaded file: ${fn}</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getExpensePreviewUrl(expense: Expense): string {
  const billAtt = expense.attachments.find(a => a.type === 'bill') || expense.attachments[0];
  if (billAtt?.dataUrl) {
    return billAtt.dataUrl;
  }
  return generateVoucherSvgDataUrl(expense, billAtt?.name);
}

export function downloadExpenseBill(expense: Expense, attachment?: Attachment): void {
  const url = attachment?.dataUrl || getExpensePreviewUrl(expense);
  const filename = attachment?.name || `${expense.vendor.toLowerCase().replace(/[^a-z0-9]/g, '-')}-bill.svg`;
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
