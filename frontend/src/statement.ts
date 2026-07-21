import { Linking, Platform, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const inr = (n: number) =>
  '₹' + (n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const g = (n: number) => (n ?? 0).toFixed(3) + ' g';
const dt = (iso?: string) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return ''; }
};

export function buildStatementHtml(s: any) {
  const c = s.client || {};
  const karats = s.gold?.per_karat || [];
  const cash = s.cash || {};
  const recent = cash.recent || [];

  const karatRows = karats.length
    ? karats.map((k: any) => `
      <tr>
        <td>${k.karat}</td>
        <td class="r">${g(k.received)}</td>
        <td class="r">${g(k.issued)}</td>
        <td class="r">${g(k.returned)}</td>
        <td class="r">${g(k.wastage)}</td>
        <td class="r b">${g(k.balance)}</td>
        <td class="r gold">${g(k.fine)}</td>
      </tr>`).join('')
    : `<tr><td colspan="7" class="c muted">No gold entries</td></tr>`;

  const cashRows = recent.length
    ? recent.map((c: any) => `
      <tr>
        <td>${dt(c.date)}</td>
        <td>${(c.type || '').toUpperCase()}</td>
        <td>${c.method || ''}</td>
        <td class="r">${inr(c.amount)}</td>
        <td>${c.remarks || ''}</td>
      </tr>`).join('')
    : `<tr><td colspan="5" class="c muted">No cash entries</td></tr>`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
         color: #0A0A0A; margin: 0; padding: 28px; font-size: 12px; }
  .header { border-bottom: 2px solid #C59B27; padding-bottom: 12px; margin-bottom: 20px;
            display: flex; justify-content: space-between; align-items: flex-start; }
  .brand { font-family: Georgia, "Times New Roman", serif; font-size: 26px; color: #C59B27; font-weight: 700; }
  .brand-sub { font-size: 10px; letter-spacing: 3px; color: #737373; margin-top: 2px; }
  .meta { text-align: right; font-size: 10px; color: #525252; line-height: 1.5; }
  h2 { font-size: 14px; margin: 22px 0 8px; color: #0A0A0A;
       border-left: 3px solid #C59B27; padding-left: 8px; letter-spacing: 1px; }
  .card { border: 1px solid #E5E5E5; border-radius: 8px; padding: 12px 14px; margin-bottom: 12px; }
  .row { display:flex; justify-content:space-between; padding: 4px 0; }
  .row b { color: #C59B27; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th, td { padding: 6px 8px; border-bottom: 1px solid #EEE; font-size: 11px; text-align: left; }
  th { background: #FDF7E6; color: #8A6B11; font-size: 10px; letter-spacing: 1px; }
  .r { text-align: right; font-variant-numeric: tabular-nums; }
  .c { text-align: center; }
  .b { font-weight: 700; }
  .gold { color: #8A6B11; font-weight: 700; }
  .muted { color: #999; }
  .summary { display: flex; gap: 10px; margin: 12px 0 4px; }
  .sum-card { flex:1; border: 1px solid #E5E5E5; border-radius: 8px; padding: 10px 12px; }
  .sum-label { font-size: 9px; letter-spacing: 2px; color: #737373; }
  .sum-value { font-size: 18px; font-weight: 700; color: #0A0A0A; margin-top: 4px;
               font-family: Georgia, serif; }
  .sum-value.warn { color: #B33A3A; }
  .sum-value.gold { color: #8A6B11; }
  .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #E5E5E5;
            font-size: 10px; color: #737373; text-align: center; }
</style></head><body>
<div class="header">
  <div>
    <div class="brand">GoldSmith Pro</div>
    <div class="brand-sub">MANUFACTURING ERP · CLIENT STATEMENT</div>
  </div>
  <div class="meta">
    Generated: ${dt(s.generated_at)}<br />
    ${c.name || ''}<br />
    ${c.phone || ''}
  </div>
</div>

<div class="card">
  <div class="row"><span>Client</span><b>${c.name || '-'}</b></div>
  ${c.company ? `<div class="row"><span>Company</span><span>${c.company}</span></div>` : ''}
  ${c.address ? `<div class="row"><span>Address</span><span>${c.address}</span></div>` : ''}
  ${c.gst ? `<div class="row"><span>GST</span><span>${c.gst}</span></div>` : ''}
  ${c.pan ? `<div class="row"><span>PAN</span><span>${c.pan}</span></div>` : ''}
</div>

<div class="summary">
  <div class="sum-card">
    <div class="sum-label">FINE GOLD TOTAL</div>
    <div class="sum-value gold">${g(s.gold?.total_fine || 0)}</div>
  </div>
  <div class="sum-card">
    <div class="sum-label">TOTAL INVOICED</div>
    <div class="sum-value">${inr(cash.total_invoiced || 0)}</div>
  </div>
  <div class="sum-card">
    <div class="sum-label">BALANCE DUE</div>
    <div class="sum-value warn">${inr(cash.balance_due || 0)}</div>
  </div>
</div>

<h2>GOLD LEDGER (by karat)</h2>
<table>
  <thead>
    <tr>
      <th>Karat</th><th class="r">Received</th><th class="r">Issued</th>
      <th class="r">Returned</th><th class="r">Wastage</th><th class="r">Balance</th><th class="r">Fine</th>
    </tr>
  </thead>
  <tbody>${karatRows}</tbody>
</table>

<h2>MATERIAL BALANCES</h2>
<div class="card">
  <div class="row"><span>Silver</span><b>${g(s.silver_balance || 0)}</b></div>
  <div class="row"><span>Diamond</span><b>${(s.diamond_balance || 0).toFixed(2)} ct</b></div>
</div>

<h2>CASH LEDGER (last 20 entries)</h2>
<table>
  <thead>
    <tr><th>Date</th><th>Type</th><th>Method</th><th class="r">Amount</th><th>Remarks</th></tr>
  </thead>
  <tbody>${cashRows}</tbody>
</table>

<div class="footer">
  This statement is auto-generated by GoldSmith Pro ERP. For queries, contact the workshop.
</div>
</body></html>`;
}

export function buildWhatsAppText(s: any) {
  const c = s.client || {};
  const karats = s.gold?.per_karat || [];
  const lines = [];
  lines.push(`*GoldSmith Pro — Statement*`);
  lines.push(`Client: *${c.name}*`);
  if (c.company) lines.push(`Company: ${c.company}`);
  lines.push(`Date: ${dt(s.generated_at)}`);
  lines.push('');
  lines.push('*Gold (by karat):*');
  if (karats.length === 0) lines.push('  — no entries —');
  karats.forEach((k: any) => {
    lines.push(`  ${k.karat}: bal ${g(k.balance)} · fine ${g(k.fine)}`);
  });
  lines.push(`Fine total: *${g(s.gold?.total_fine || 0)}*`);
  lines.push('');
  lines.push(`Silver bal: ${g(s.silver_balance || 0)}`);
  lines.push(`Diamond bal: ${(s.diamond_balance || 0).toFixed(2)} ct`);
  lines.push('');
  lines.push(`Invoiced: ${inr(s.cash?.total_invoiced || 0)}`);
  lines.push(`Paid: ${inr(s.cash?.total_paid || 0)}`);
  lines.push(`*Balance due: ${inr(s.cash?.balance_due || 0)}*`);
  return lines.join('\n');
}

export async function shareStatementPdf(s: any) {
  const html = buildStatementHtml(s);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    Alert.alert('Sharing not available on this device');
    return;
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `${s.client?.name || 'Client'} — Statement`,
    UTI: 'com.adobe.pdf',
  });
}

export async function sendWhatsAppText(s: any) {
  const text = buildWhatsAppText(s);
  const phoneRaw = (s.client?.phone || '').replace(/[^\d]/g, '');
  const url = phoneRaw
    ? `whatsapp://send?phone=${phoneRaw}&text=${encodeURIComponent(text)}`
    : `whatsapp://send?text=${encodeURIComponent(text)}`;
  const webUrl = phoneRaw
    ? `https://wa.me/${phoneRaw}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
    else await Linking.openURL(webUrl);
  } catch {
    await Linking.openURL(webUrl);
  }
}
