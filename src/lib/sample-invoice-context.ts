import type { TemplateContext } from "@/lib/template";

/** Sample invoice context for template preview and testing */
export const SAMPLE_INVOICE_CONTEXT: TemplateContext = {
  companyName: "Acme Corp",
  companyAddress: "123 Business Ave",
  companyCity: "San Francisco",
  companyPostalCode: "94102",
  companyPostalCity: "San Francisco, CA, US",
  companyEmail: "hello@acme.com",
  companyPhone: "+1 (555) 123-4567",
  companyTaxId: "12-3456789",

  invoiceNumber: "2024-001",
  issueDate: "September 15, 2024",
  dueDate: "October 15, 2024",
  currency: "USD",
  status: "sent",

  customerName: "Tech Innovations Inc",
  customerContactName: "John Smith",
  customerEmail: "john@techinnovations.com",
  customerPhone: "+1 (555) 987-6543",
  customerAddress: "456 Innovation Drive",
  customerCity: "New York",
  customerPostalCode: "10001",
  customerCountryCode: "US",
  customerPostalCity: "New York, NY, US",
  customerTaxId: "98-7654321",

  items: [
    {
      description: "Web Design Services",
      quantity: "1",
      unit: "project",
      unitPrice: "$2,500.00",
      lineTotal: "$2,500.00",
      notes: "Homepage redesign and optimization",
    },
    {
      description: "Development Services",
      quantity: "40",
      unit: "hours",
      unitPrice: "$150.00",
      lineTotal: "$6,000.00",
      notes: "Backend API development",
    },
    {
      description: "Testing & QA",
      quantity: "20",
      unit: "hours",
      unitPrice: "$100.00",
      lineTotal: "$2,000.00",
      notes: "Automated and manual testing",
    },
  ],

  subtotal: "$10,500.00",
  discount: "$500.00",
  discountPercent: "5%",
  taxableSubtotal: "$10,000.00",
  taxAmount: "$1,000.00",
  total: "$11,000.00",

  notes: "Thank you for your business!",
  terms: "Net 30 days",
  paymentTerms: "Bank transfer preferred",
};
