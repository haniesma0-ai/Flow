/**
 * Export Utilities — PDF, CSV, and Print for Fox Petroleum
 * Uses jsPDF (already installed) for PDF generation
 * Pure JS for CSV generation
 * window.print() with dynamic style injection for Print
 */
import jsPDF from 'jspdf';

// ─── Helpers ───────────────────────────────────────────

const COMPANY = {
  name: 'Fox Petroleum',
  address: 'Résidence Al Azizia Boulevard Royaume Arabie Saoudite 3ème Etage N°20 TANGER ',
  phone: '+212 522 243 030',
  email: 'contactus@fox-petroleum.com',
};

/** Load logo from /logo.png as base64 for embedding in jsPDF */
const loadLogo = (): Promise<string | null> =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = '/logo.png';
  });

const MAD = (v: number) =>
  Number(v).toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' });

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('fr-FR') : '—';

const today = () => new Date().toLocaleDateString('fr-FR');

// ─── PDF — Report ──────────────────────────────────────

interface ReportData {
  period: string;
  reportType: string;
  salesData: { month: string; sales: number; orders: number }[];
  customerData: { name: string; orders: number; amount: number }[];
  summaryCards: { label: string; value: string }[];
}

export async function exportReportPDF(data: ReportData) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  let y = 15;
  const logo = await loadLogo();

  // --- Header bar ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageW, 38, 'F');
  const textStart = logo ? 40 : 14;
  if (logo) {
    doc.addImage(logo, 'PNG', 10, 4, 28, 28);
  }
  doc.setFontSize(20);
  doc.setTextColor(245, 158, 11); // amber-500
  doc.text('FOX PETROLEUM', textStart, 18);
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text(`${COMPANY.address}  |  ${COMPANY.phone}  |  ${COMPANY.email}`, textStart, 26);
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(`Rapport ${data.reportType.toUpperCase()} — ${data.period}`, textStart, 34);
  doc.setFontSize(9);
  doc.text(`Généré le ${today()}`, pageW - 14, 34, { align: 'right' });
  y = 48;

  // --- Summary boxes ---
  doc.setTextColor(30, 30, 30);
  const boxW = (pageW - 28 - 12) / 4;
  data.summaryCards.forEach((card, i) => {
    const x = 14 + i * (boxW + 4);
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(x, y, boxW, 22, 3, 3, 'F');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(card.label, x + 4, y + 8);
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(card.value, x + 4, y + 18);
  });
  y += 30;

  // --- Sales table ---
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Données de ventes', 14, y);
  y += 6;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageW - 28, 8, 'F');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Mois', 16, y + 5.5);
  doc.text('Chiffre d\'affaires', 80, y + 5.5);
  doc.text('Commandes', 140, y + 5.5);
  y += 8;

  // Table rows
  doc.setTextColor(30, 41, 59);
  data.salesData.forEach((row) => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFontSize(8);
    doc.text(row.month, 16, y + 5);
    doc.text(MAD(row.sales), 80, y + 5);
    doc.text(String(row.orders || 0), 140, y + 5);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y + 7, pageW - 14, y + 7);
    y += 8;
  });

  y += 8;

  // --- Customer table ---
  if (data.customerData.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Top Clients', 14, y);
    y += 6;

    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, pageW - 28, 8, 'F');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Client', 16, y + 5.5);
    doc.text('Commandes', 100, y + 5.5);
    doc.text('Montant', 150, y + 5.5);
    y += 8;

    doc.setTextColor(30, 41, 59);
    data.customerData.forEach((c) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFontSize(8);
      doc.text(c.name, 16, y + 5);
      doc.text(String(c.orders), 100, y + 5);
      doc.text(MAD(c.amount), 150, y + 5);
      doc.setDrawColor(226, 232, 240);
      doc.line(14, y + 7, pageW - 14, y + 7);
      y += 8;
    });
  }

  // --- Footer ---
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Fox Petroleum — Rapport confidentiel`, 14, 290);
    doc.text(`Page ${p}/${pages}`, pageW - 14, 290, { align: 'right' });
  }

  doc.save(`rapport_${data.reportType}_${data.period}_${Date.now()}.pdf`);
}

// ─── CSV — Report ──────────────────────────────────────

export function exportReportCSV(data: ReportData) {
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel
  let csv = BOM;

  // Header
  csv += `Rapport ${data.reportType} — Période: ${data.period}\r\n`;
  csv += `Généré le: ${today()}\r\n\r\n`;

  // Summary
  csv += 'Résumé\r\n';
  data.summaryCards.forEach((c) => {
    csv += `${c.label};"${c.value}"\r\n`;
  });
  csv += '\r\n';

  // Sales data
  csv += 'Données de ventes\r\n';
  csv += 'Mois;Chiffre d\'affaires;Commandes\r\n';
  data.salesData.forEach((r) => {
    csv += `${r.month};${r.sales};${r.orders || 0}\r\n`;
  });
  csv += '\r\n';

  // Customer data
  if (data.customerData.length > 0) {
    csv += 'Top Clients\r\n';
    csv += 'Client;Commandes;Montant\r\n';
    data.customerData.forEach((c) => {
      csv += `"${c.name}";${c.orders};${c.amount}\r\n`;
    });
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rapport_${data.reportType}_${data.period}_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── PDF — Invoice / Receipt ───────────────────────────

interface InvoicePDFData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  status: string;
  customer: {
    name: string;
    address?: string;
    city?: string;
    postalCode?: string;
    phone?: string;
    email?: string;
    ice?: string;
    rc?: string;
  };
  items: { name: string; code?: string; quantity: number; price: number; tva: number; total: number }[];
  subtotal: number;
  totalTva: number;
  total: number;
  paidAmount: number;
  remainingAmount: number;
}

export async function generateInvoicePDF(data: InvoicePDFData) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  let y = 15;
  const logo = await loadLogo();

  // --- Header ---
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 45, 'F');

  // Logo + Company info
  const textStart = logo ? 44 : 14;
  if (logo) {
    doc.addImage(logo, 'PNG', 10, 6, 30, 30);
  }
  doc.setFontSize(22);
  doc.setTextColor(245, 158, 11);
  doc.text('FOX PETROLEUM', textStart, 20);
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.text(COMPANY.address, textStart, 27);
  doc.text(`Tél: ${COMPANY.phone}  |  Email: ${COMPANY.email}`, textStart, 33);

  // Invoice title
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('FACTURE', pageW - 14, 20, { align: 'right' });
  doc.setFontSize(10);
  doc.text(data.invoiceNumber, pageW - 14, 28, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.text(`Date: ${fmtDate(data.date)}`, pageW - 14, 35, { align: 'right' });
  doc.text(`Échéance: ${fmtDate(data.dueDate)}`, pageW - 14, 41, { align: 'right' });
  y = 55;

  // --- Customer box ---
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageW - 28, 32, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('FACTURER À:', 18, y + 7);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(data.customer.name, 18, y + 14);
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const addr = [data.customer.address, `${data.customer.postalCode || ''} ${data.customer.city || ''}`.trim()].filter(Boolean).join(', ');
  if (addr) doc.text(addr, 18, y + 20);
  const contact = [data.customer.phone, data.customer.email].filter(Boolean).join('  |  ');
  if (contact) doc.text(contact, 18, y + 26);
  if (data.customer.ice) {
    doc.text(`ICE: ${data.customer.ice}`, pageW - 18, y + 14, { align: 'right' });
  }
  y += 40;

  // --- Items table ---
  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(14, y, pageW - 28, 10, 'F');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  const cols = [
    { label: 'Produit', x: 16 },
    { label: 'P.U. (MAD)', x: 100 },
    { label: 'Qté', x: 130 },
    { label: 'TVA', x: 150 },
    { label: 'Total (MAD)', x: pageW - 16 },
  ];
  cols.forEach((c) => {
    const opts = c.x === pageW - 16 ? { align: 'right' as const } : {};
    doc.text(c.label, c.x, y + 7, opts);
  });
  y += 10;

  // Rows
  doc.setTextColor(30, 41, 59);
  let stripe = false;
  data.items.forEach((item) => {
    if (y > 250) { doc.addPage(); y = 20; }
    if (stripe) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, pageW - 28, 10, 'F');
    }
    stripe = !stripe;
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(item.name, 16, y + 7);
    if (item.code) {
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.text(item.code, 16, y + 10);
    }
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(Number(item.price).toFixed(2), 100, y + 7);
    doc.text(String(item.quantity), 130, y + 7);
    doc.text(`${item.tva}%`, 150, y + 7);
    doc.setTextColor(15, 23, 42);
    doc.text(Number(item.total).toFixed(2), pageW - 16, y + 7, { align: 'right' });
    y += item.code ? 12 : 10;
  });

  // --- Totals ---
  y += 6;
  doc.setDrawColor(226, 232, 240);
  doc.line(110, y, pageW - 14, y);
  y += 6;

  const totals = [
    { label: 'Sous-total HT', value: Number(data.subtotal).toFixed(2) + ' MAD', bold: false },
    { label: 'TVA', value: Number(data.totalTva).toFixed(2) + ' MAD', bold: false },
    { label: 'Total TTC', value: Number(data.total).toFixed(2) + ' MAD', bold: true },
    { label: 'Montant payé', value: Number(data.paidAmount).toFixed(2) + ' MAD', bold: false },
    { label: 'Reste à payer', value: Number(data.remainingAmount).toFixed(2) + ' MAD', bold: true },
  ];

  totals.forEach((t) => {
    doc.setFontSize(t.bold ? 10 : 8);
    doc.setTextColor(t.bold ? 15 : 71, t.bold ? 23 : 85, t.bold ? 42 : 105);
    doc.text(t.label, 110, y);
    doc.text(t.value, pageW - 16, y, { align: 'right' });
    y += t.bold ? 8 : 6;
  });

  // --- Status badge ---
  y += 4;
  const statusColors: Record<string, [number, number, number]> = {
    paid: [34, 197, 94],
    sent: [59, 130, 246],
    overdue: [239, 68, 68],
    draft: [148, 163, 184],
    cancelled: [148, 163, 184],
  };
  const col = statusColors[data.status] || [148, 163, 184];
  const statusLabels: Record<string, string> = {
    paid: 'PAYÉE', sent: 'ENVOYÉE', overdue: 'EN RETARD', draft: 'BROUILLON', cancelled: 'ANNULÉE',
  };
  doc.setFillColor(col[0], col[1], col[2]);
  const statusText = statusLabels[data.status] || data.status.toUpperCase();
  doc.roundedRect(14, y, 40, 10, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(statusText, 34, y + 7, { align: 'center' });

  // --- Footer ---
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Fox Petroleum — Merci pour votre confiance.', 14, 283);
  doc.line(14, 285, pageW - 14, 285);
  doc.text(`${COMPANY.address}  |  ${COMPANY.phone}  |  ${COMPANY.email}`, 14, 290);

  doc.save(`facture_${data.invoiceNumber}_${Date.now()}.pdf`);
}

// ─── Print Report (styled window.print) ────────────────

export function printReport(data: ReportData) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Rapport ${data.reportType} — Fox Petroleum</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 30px; }
    .header { background: #0f172a; color: #fff; padding: 20px 24px; border-radius: 8px; margin-bottom: 24px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .header img { width: 48px; height: 48px; object-fit: contain; }
    .header .header-text { flex: 1; }
    .header h1 { color: #f59e0b; font-size: 22px; margin-bottom: 4px; }
    .header p { color: #cbd5e1; font-size: 11px; }
    .header .title { color: #fff; font-size: 14px; margin-top: 8px; }
    .header .date { float: right; color: #94a3b8; font-size: 10px; margin-top: -14px; }
    .summary { display: flex; gap: 12px; margin-bottom: 24px; }
    .summary-card { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
    .summary-card .label { font-size: 10px; color: #64748b; text-transform: uppercase; }
    .summary-card .value { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 4px; }
    h2 { font-size: 14px; color: #0f172a; margin: 20px 0 8px; border-bottom: 2px solid #f59e0b; padding-bottom: 4px; display: inline-block; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #f1f5f9; padding: 8px 12px; text-align: left; font-size: 10px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #e2e8f0; }
    td { padding: 8px 12px; font-size: 11px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    .text-right { text-align: right; }
    .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
    @media print { body { padding: 15px; } .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .summary-card { -webkit-print-color-adjust: exact; print-color-adjust: exact; } th { -webkit-print-color-adjust: exact; print-color-adjust: exact; } tr:nth-child(even) { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <img src="/logo.png" alt="Fox Petroleum" />
    <div class="header-text">
    <h1>FOX PETROLEUM</h1>
    <p>${COMPANY.address}  |  ${COMPANY.phone}  |  ${COMPANY.email}</p>
    <div class="title">Rapport ${data.reportType.toUpperCase()} — ${data.period}</div>
    <div class="date">Généré le ${today()}</div>
    </div>
  </div>

  <div class="summary">
    ${data.summaryCards.map(c => `<div class="summary-card"><div class="label">${c.label}</div><div class="value">${c.value}</div></div>`).join('')}
  </div>

  <h2>Données de ventes</h2>
  <table>
    <thead><tr><th>Mois</th><th class="text-right">Chiffre d'affaires</th><th class="text-right">Commandes</th></tr></thead>
    <tbody>
      ${data.salesData.map(r => `<tr><td>${r.month}</td><td class="text-right">${MAD(r.sales)}</td><td class="text-right">${r.orders || 0}</td></tr>`).join('')}
    </tbody>
  </table>

  ${data.customerData.length > 0 ? `
  <h2>Top Clients</h2>
  <table>
    <thead><tr><th>Client</th><th class="text-right">Commandes</th><th class="text-right">Montant</th></tr></thead>
    <tbody>
      ${data.customerData.map(c => `<tr><td>${c.name}</td><td class="text-right">${c.orders}</td><td class="text-right">${MAD(c.amount)}</td></tr>`).join('')}
    </tbody>
  </table>
  ` : ''}

  <div class="footer">Fox Petroleum — Document généré automatiquement — ${today()}</div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
}

// ─── Print Invoice / Receipt ───────────────────────────

export function printInvoice(data: InvoicePDFData) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const statusLabels: Record<string, string> = {
    paid: 'PAYÉE', sent: 'ENVOYÉE', overdue: 'EN RETARD', draft: 'BROUILLON', cancelled: 'ANNULÉE',
  };
  const statusColors: Record<string, string> = {
    paid: '#22c55e', sent: '#3b82f6', overdue: '#ef4444', draft: '#94a3b8', cancelled: '#94a3b8',
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Facture ${data.invoiceNumber} — Fox Petroleum</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 30px; max-width: 800px; margin: 0 auto; }
    .header { background: #0f172a; color: #fff; padding: 20px 24px; border-radius: 8px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
    .header .left { display: flex; align-items: center; gap: 12px; }
    .header .left img { width: 48px; height: 48px; object-fit: contain; }
    .header .left h1 { color: #f59e0b; font-size: 22px; }
    .header .left p { color: #cbd5e1; font-size: 10px; margin-top: 2px; }
    .header .right { text-align: right; }
    .header .right .invoice-title { font-size: 18px; font-weight: 700; }
    .header .right .invoice-num { font-size: 12px; color: #94a3b8; margin-top: 2px; }
    .header .right .dates { font-size: 9px; color: #cbd5e1; margin-top: 6px; }
    .customer-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; }
    .customer-box .label { font-size: 9px; text-transform: uppercase; color: #64748b; margin-bottom: 6px; }
    .customer-box .name { font-size: 14px; font-weight: 600; color: #0f172a; }
    .customer-box .detail { font-size: 10px; color: #475569; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #0f172a; color: #fff; padding: 10px 12px; text-align: left; font-size: 9px; text-transform: uppercase; }
    th.text-right { text-align: right; }
    td { padding: 10px 12px; font-size: 11px; border-bottom: 1px solid #e2e8f0; }
    td.text-right { text-align: right; }
    tr:nth-child(even) { background: #f8fafc; }
    .product-code { font-size: 9px; color: #94a3b8; }
    .totals { margin-left: auto; width: 260px; }
    .totals .row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px; color: #475569; }
    .totals .row.bold { font-weight: 700; font-size: 13px; color: #0f172a; border-top: 2px solid #0f172a; padding-top: 8px; margin-top: 4px; }
    .status-badge { display: inline-block; padding: 4px 16px; border-radius: 20px; color: #fff; font-size: 11px; font-weight: 600; margin-top: 16px; }
    .footer { margin-top: 40px; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
    @media print { body { padding: 15px; } .header, th, .status-badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .customer-box, tr:nth-child(even) { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="left">
      <img src="/logo.png" alt="Fox Petroleum" />
      <div>
      <h1>FOX PETROLEUM</h1>
      <p>${COMPANY.address}</p>
      <p>Tél: ${COMPANY.phone}  |  ${COMPANY.email}</p>
      </div>
    </div>
    <div class="right">
      <div class="invoice-title">FACTURE</div>
      <div class="invoice-num">${data.invoiceNumber}</div>
      <div class="dates">Date: ${fmtDate(data.date)}<br/>Échéance: ${fmtDate(data.dueDate)}</div>
    </div>
  </div>

  <div class="customer-box">
    <div>
      <div class="label">Facturer à</div>
      <div class="name">${data.customer.name}</div>
      ${data.customer.address ? `<div class="detail">${data.customer.address}</div>` : ''}
      ${data.customer.city ? `<div class="detail">${data.customer.postalCode || ''} ${data.customer.city}</div>` : ''}
      ${data.customer.phone ? `<div class="detail">Tél: ${data.customer.phone}</div>` : ''}
      ${data.customer.email ? `<div class="detail">${data.customer.email}</div>` : ''}
    </div>
    <div style="text-align:right;">
      ${data.customer.ice ? `<div class="detail">ICE: ${data.customer.ice}</div>` : ''}
      ${data.customer.rc ? `<div class="detail">RC: ${data.customer.rc}</div>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Produit</th>
        <th class="text-right">P.U. (MAD)</th>
        <th class="text-right">Qté</th>
        <th class="text-right">TVA</th>
        <th class="text-right">Total (MAD)</th>
      </tr>
    </thead>
    <tbody>
      ${data.items.map(item => `
      <tr>
        <td>${item.name}${item.code ? `<div class="product-code">${item.code}</div>` : ''}</td>
        <td class="text-right">${Number(item.price).toFixed(2)}</td>
        <td class="text-right">${item.quantity}</td>
        <td class="text-right">${item.tva}%</td>
        <td class="text-right">${Number(item.total).toFixed(2)}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="row"><span>Sous-total HT</span><span>${Number(data.subtotal).toFixed(2)} MAD</span></div>
    <div class="row"><span>TVA</span><span>${Number(data.totalTva).toFixed(2)} MAD</span></div>
    <div class="row bold"><span>Total TTC</span><span>${Number(data.total).toFixed(2)} MAD</span></div>
    <div class="row"><span>Montant payé</span><span>${Number(data.paidAmount).toFixed(2)} MAD</span></div>
    <div class="row bold"><span>Reste à payer</span><span>${Number(data.remainingAmount).toFixed(2)} MAD</span></div>
  </div>

  <div class="status-badge" style="background:${statusColors[data.status] || '#94a3b8'}">${statusLabels[data.status] || data.status.toUpperCase()}</div>

  <div class="footer">
    Fox Petroleum — Merci pour votre confiance.<br/>
    ${COMPANY.address}  |  ${COMPANY.phone}  |  ${COMPANY.email}
  </div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
}

// ─── CSV — Invoices list ───────────────────────────────

interface InvoiceRow {
  invoiceNumber: string;
  customerName: string;
  date: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
}

export function exportInvoicesCSV(invoices: InvoiceRow[]) {
  const BOM = '\uFEFF';
  let csv = BOM;
  csv += 'Fox Petroleum — Liste des factures\r\n';
  csv += `Généré le: ${today()}\r\n\r\n`;
  csv += 'N° Facture;Client;Date;Montant;Payé;Reste;Statut\r\n';
  invoices.forEach((i) => {
    csv += `${i.invoiceNumber};"${i.customerName}";${fmtDate(i.date)};${i.amount};${i.paidAmount};${i.remainingAmount};${i.status}\r\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `factures_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
