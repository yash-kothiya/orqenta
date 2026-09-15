/**
 * §11 — the built-in A4 template, seeded into the `templates` table and used
 * whenever an invoice has no template of its own.
 *
 * It is a plain string rather than a file read at runtime: the renderer has to
 * work the same in a container, in a serverless function and during a build.
 */
export const BUILTIN_TEMPLATE_NAME = "Classic A4";

export const BUILTIN_TEMPLATE_DESCRIPTION =
  "A4 invoice with a logo header, line items and a totals block.";

export const BUILTIN_TEMPLATE_HTML = String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Invoice {{invoiceNumber}}</title>
    <style>
      @page { size: A4; margin: 10mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font: 12px/1.5 Helvetica, Arial, sans-serif;
        color: #111827;
      }
      .header { overflow: hidden; padding-bottom: 16px; }
      .logo-box { float: left; max-width: 240px; }
      .logo-box img { max-height: 64px; max-width: 240px; }
      .company-name { font-size: 18px; font-weight: bold; }
      .meta { float: right; text-align: right; }
      .meta h1 {
        margin: 0 0 4px;
        font-size: 26px;
        font-weight: normal;
        letter-spacing: 0.04em;
        color: {{highlightColor}};
      }
      .meta dl { margin: 0; }
      .meta dt { display: inline; color: #6b7280; }
      .meta dd { display: inline; margin: 0 0 0 6px; }
      .meta div { margin-top: 2px; }
      .rule { clear: both; border-top: 2px solid {{highlightColor}}; margin: 8px 0 16px; }
      .parties { overflow: hidden; margin-bottom: 20px; }
      .party { float: left; width: 48%; }
      .party + .party { float: right; }
      .party h2 {
        margin: 0 0 4px;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #6b7280;
      }
      table { width: 100%; border-collapse: collapse; }
      thead th {
        background: {{highlightColorLight}};
        text-align: left;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        padding: 6px 8px;
      }
      tbody td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
      .num { text-align: right; white-space: nowrap; }
      .item-notes { color: #6b7280; font-size: 11px; }
      .totals { float: right; width: 260px; margin-top: 12px; }
      .totals td { padding: 4px 8px; }
      .totals .grand td {
        border-top: 2px solid {{highlightColor}};
        font-size: 14px;
        font-weight: bold;
      }
      .footer { clear: both; padding-top: 28px; }
      .footer section { margin-top: 12px; }
      .footer h2 {
        margin: 0 0 2px;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #6b7280;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="logo-box">
        {{#logo}}<img src="{{logo}}" alt="{{companyName}}" />{{/logo}}
        <div class="company-name">{{companyName}}</div>
        <div>{{{companyAddressHtml}}}</div>
        <div>{{companyPostalCity}}</div>
        {{#companyEmail}}<div>{{companyEmail}}</div>{{/companyEmail}}
        {{#companyPhone}}<div>{{companyPhone}}</div>{{/companyPhone}}
        {{#companyTaxId}}<div>Tax ID {{companyTaxId}}</div>{{/companyTaxId}}
      </div>
      <div class="meta">
        <h1>Invoice</h1>
        <div><dt>Number</dt><dd>{{invoiceNumber}}</dd></div>
        <div><dt>Issued</dt><dd>{{issueDate}}</dd></div>
        {{#dueDate}}<div><dt>Due</dt><dd>{{dueDate}}</dd></div>{{/dueDate}}
        <div><dt>Status</dt><dd>{{status}}</dd></div>
      </div>
    </div>

    <div class="rule"></div>

    <div class="parties">
      <div class="party">
        <h2>Billed to</h2>
        <div><strong>{{customerName || "—"}}</strong></div>
        {{#customerContactName}}<div>{{customerContactName}}</div>{{/customerContactName}}
        <div>{{{customerAddressHtml}}}</div>
        <div>{{customerPostalCity}}</div>
        {{#customerCountryCode}}<div>{{customerCountryCode}}</div>{{/customerCountryCode}}
        {{#customerTaxId}}<div>Tax ID {{customerTaxId}}</div>{{/customerTaxId}}
      </div>
      <div class="party">
        <h2>Contact</h2>
        {{#customerEmail}}<div>{{customerEmail}}</div>{{/customerEmail}}
        {{#customerPhone}}<div>{{customerPhone}}</div>{{/customerPhone}}
        {{#paymentTerms}}<div>Terms: {{paymentTerms}}</div>{{/paymentTerms}}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="num">Qty</th>
          {{#hasItemUnits}}<th>Unit</th>{{/hasItemUnits}}
          <th class="num">Price</th>
          <th class="num">Amount</th>
        </tr>
      </thead>
      <tbody>
        {{#items}}
        <tr>
          <td>
            {{description}}
            {{#notes}}<div class="item-notes">{{{notesHtml}}}</div>{{/notes}}
          </td>
          <td class="num">{{quantity}}</td>
          {{#hasItemUnits}}<td>{{unit}}</td>{{/hasItemUnits}}
          <td class="num">{{unitPrice}}</td>
          <td class="num">{{lineTotal}}</td>
        </tr>
        {{/items}}
      </tbody>
    </table>

    <table class="totals">
      <tr><td>Subtotal</td><td class="num">{{subtotal}}</td></tr>
      {{#hasDiscount}}
      <tr><td>Discount</td><td class="num">-{{discountAmount}}</td></tr>
      {{/hasDiscount}}
      {{#hasTaxSummary}}
        {{#taxSummary}}
        <tr><td>{{label}}</td><td class="num">{{amount}}</td></tr>
        {{/taxSummary}}
      {{/hasTaxSummary}}
      {{#hasTax}}
      <tr><td>Tax total</td><td class="num">{{taxAmount}}</td></tr>
      {{/hasTax}}
      <tr class="grand"><td>Total</td><td class="num">{{total}} {{currency}}</td></tr>
    </table>

    <div class="footer">
      {{#paymentMethods}}
      <section>
        <h2>Payment methods</h2>
        <div>{{paymentMethods}}</div>
      </section>
      {{/paymentMethods}}
      {{#bankAccount}}
      <section>
        <h2>Bank details</h2>
        <div>{{{bankAccountHtml}}}</div>
      </section>
      {{/bankAccount}}
      {{#notes}}
      <section>
        <h2>Notes</h2>
        <div>{{{notesHtml}}}</div>
      </section>
      {{/notes}}
    </div>
  </body>
</html>
`;
