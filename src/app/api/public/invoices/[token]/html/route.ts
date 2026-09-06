import { formatMoney, formatPostalCityLine } from "@/lib/format";
import { findCustomer, findInvoiceByToken } from "@/lib/mock-data";
import { SETTING_DEFAULTS as company } from "@/lib/settings";
import { computeTotals } from "@/lib/totals";

// ponytail: a hardcoded A4 document, not the §11 renderer. The stored templates
// and their {{token}} syntax replace this whole file once §11 lands.

const esc = (value: unknown) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/public/invoices/[token]/html">,
) {
  const invoice = findInvoiceByToken((await params).token);
  if (!invoice) return new Response("Not found", { status: 404 });

  const customer = findCustomer(invoice.customerId);
  const { subtotal, tax, discount, total } = computeTotals(invoice);
  const money = (amount: number) => formatMoney(amount, invoice.currency);

  const customerLines = [
    customer?.name,
    customer?.address,
    formatPostalCityLine(
      customer?.city,
      customer?.postalCode,
      customer?.countryCode,
    ),
    customer?.email,
    customer?.taxId,
  ].filter(Boolean);

  const totalRows: [string, string][] = [
    ["Subtotal", money(subtotal)],
    ...(discount
      ? ([["Discount", `-${money(discount)}`]] as [string, string][])
      : []),
    ["Tax", money(tax)],
  ];

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<title>${esc(invoice.invoiceNumber)}</title>
<style>
  @page { size: A4; margin: 10mm; }
  body { font: 12px Helvetica, Arial, sans-serif; color: #111; margin: 0; padding: 24px; }
  header { overflow: hidden; border-bottom: 3px solid ${company.highlight}; padding-bottom: 16px; }
  .company { float: left; }
  .meta { float: right; text-align: right; }
  h1 { margin: 0 0 4px; font-size: 22px; font-weight: 400; letter-spacing: .04em; }
  .name { font-size: 15px; font-weight: 700; }
  .muted { color: #666; }
  section { margin-top: 24px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .05em;
       color: #666; border-bottom: 1px solid #ddd; padding: 6px 8px; }
  td { padding: 8px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
  .right { text-align: right; }
  .totals { float: right; width: 260px; margin-top: 16px; }
  .totals td { border: 0; padding: 4px 8px; }
  .totals .grand td { border-top: 2px solid ${company.highlight}; font-size: 14px; font-weight: 700; }
  footer { clear: both; padding-top: 32px; white-space: pre-line; }
</style></head>
<body>
  <header>
    <div class="company">
      <div class="name">${esc(company.companyName)}</div>
      <div class="muted">${esc(company.companyAddress)}<br />${esc(company.companyEmail)} · ${esc(company.companyPhone)}<br />${esc(company.companyTaxId)}</div>
    </div>
    <div class="meta">
      <h1>INVOICE</h1>
      <div><strong>${esc(invoice.invoiceNumber)}</strong></div>
      <div class="muted">Issued ${esc(invoice.issueDate)}${invoice.dueDate ? `<br />Due ${esc(invoice.dueDate)}` : ""}</div>
    </div>
  </header>

  <section><div class="muted">Bill to</div>${customerLines.map((line) => `<div>${esc(line)}</div>`).join("")}</section>

  <section>
    <table>
      <thead><tr><th>Description</th><th class="right">Qty</th><th class="right">Unit price</th><th class="right">Amount</th></tr></thead>
      <tbody>${invoice.items
        .map(
          (item) => `<tr>
        <td>${esc(item.description)}${item.notes ? `<div class="muted">${esc(item.notes)}</div>` : ""}</td>
        <td class="right">${esc(item.quantity)}${item.unit ? ` ${esc(item.unit)}` : ""}</td>
        <td class="right">${esc(money(item.unitPrice))}</td>
        <td class="right">${esc(money(item.quantity * item.unitPrice))}</td>
      </tr>`,
        )
        .join("")}</tbody>
    </table>

    <table class="totals">
      ${totalRows.map(([label, value]) => `<tr><td>${esc(label)}</td><td class="right">${esc(value)}</td></tr>`).join("")}
      <tr class="grand"><td>Total</td><td class="right">${esc(money(total))}</td></tr>
    </table>
  </section>

  <footer class="muted">${esc(invoice.paymentTerms ?? company.paymentTerms)}
${esc(company.bankAccount)}
${esc(invoice.notes ?? "")}</footer>
</body></html>`;

  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
