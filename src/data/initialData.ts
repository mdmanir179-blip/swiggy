import { InvoiceRecord, PaymentRecord } from '../types';

export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Derive payment records from invoices if only invoice report is provided
 */
export function deriveInitialPayments(invoices: InvoiceRecord[]): PaymentRecord[] {
  const paymentMap = new Map<string, {
    ref: string;
    date: string;
    totalAmount: number;
    invoices: string[];
    orgName: string;
    vendorName: string;
    vendorCode: string;
    gstin: string;
    pan: string;
  }>();

  for (const inv of invoices) {
    if (!inv.paymentReferenceNo || inv.paymentAmount <= 0) continue;

    // Handle multiple references (e.g. "REF1, REF2")
    const refs = inv.paymentReferenceNo.split(',').map(r => r.trim()).filter(Boolean);
    const amountPerRef = refs.length > 0 ? inv.paymentAmount / refs.length : inv.paymentAmount;

    for (const ref of refs) {
      const existing = paymentMap.get(ref);
      if (existing) {
        existing.totalAmount += amountPerRef;
        if (!existing.invoices.includes(inv.invoiceNumber)) {
          existing.invoices.push(inv.invoiceNumber);
        }
      } else {
        paymentMap.set(ref, {
          ref,
          date: inv.lastPaymentDate || inv.invoiceAccountingDate || '',
          totalAmount: amountPerRef,
          invoices: [inv.invoiceNumber],
          orgName: inv.organizationName,
          vendorName: inv.vendorName,
          vendorCode: inv.vendorCode,
          gstin: inv.gstin,
          pan: inv.pan,
        });
      }
    }
  }

  const payments: PaymentRecord[] = [];
  let pIdx = 1;

  paymentMap.forEach((val) => {
    payments.push({
      id: `pmt-${pIdx++}`,
      organizationName: val.orgName,
      vendorName: val.vendorName,
      vendorCode: val.vendorCode,
      gstin: val.gstin,
      pan: val.pan,
      tradeVendorType: 'Goods / Grocery Supplier',
      paymentType: val.ref.startsWith('HSBC') ? 'NEFT / HSBC Direct' : 'NEFT',
      paymentDate: val.date,
      paymentNumber: `PAY-${1000 + pIdx}`,
      paymentReferenceNo: val.ref,
      amount: Math.round(val.totalAmount * 100) / 100,
      reversal: 0.00,
      netAmount: Math.round(val.totalAmount * 100) / 100,
      linkedInvoices: val.invoices,
      matchedInvoiceCount: val.invoices.length
    });
  });

  return payments;
}

// 100% Clean: No demo / mock data
export const INITIAL_INVOICES: InvoiceRecord[] = [];
export const INITIAL_PAYMENTS: PaymentRecord[] = [];
