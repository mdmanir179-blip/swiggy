import * as XLSX from 'xlsx';
import { InvoiceRecord, PaymentRecord } from '../types';
import { parseINR } from './currency';
import { parseAndFormatDate, extractDateFromGrnNo } from './dateFormatter';

export type DetectedFileType = 'invoice_report' | 'payment_report' | 'unknown';

export interface ParseResult {
  fileType: DetectedFileType;
  invoices?: InvoiceRecord[];
  payments?: PaymentRecord[];
  fileName: string;
  totalRows: number;
  errors: string[];
}

/**
 * Standardize column header strings for resilient matching
 */
function normalizeHeader(header: string): string {
  return (header || '')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Detect file type based on column keys
 */
export function detectReportType(headers: string[]): DetectedFileType {
  const normHeaders = headers.map(normalizeHeader);

  const invoiceKeywords = ['invoicesrecorded', 'grossgrnamount', 'pono', 'grnno', 'invoicenumber', 'netpayableamount', 'outstandingpayment', 'grndate', 'invoiceaccountingdate'];
  const paymentKeywords = ['paymentnumber', 'tradevendortype', 'paymenttype', 'reversal', 'netamount'];

  const invoiceMatches = invoiceKeywords.filter(k => normHeaders.some(h => h.includes(k))).length;
  const paymentMatches = paymentKeywords.filter(k => normHeaders.some(h => h.includes(k))).length;

  if (invoiceMatches >= 2) return 'invoice_report';
  if (paymentMatches >= 2) return 'payment_report';
  
  if (normHeaders.some(h => h.includes('invoice'))) return 'invoice_report';
  if (normHeaders.some(h => h.includes('payment'))) return 'payment_report';

  return 'invoice_report'; // default fallback
}

/**
 * Map raw object rows to typed InvoiceRecords
 */
export function mapRowsToInvoices(rawRows: Record<string, any>[]): InvoiceRecord[] {
  return rawRows.map((row, idx) => {
    // Helper to find value by flexible key lookup
    const getVal = (...keys: string[]): any => {
      for (const k of keys) {
        const direct = row[k];
        if (direct !== undefined && direct !== null && direct !== '') return direct;
        
        // try normalized lookup
        const normKey = normalizeHeader(k);
        for (const [rKey, rVal] of Object.entries(row)) {
          if (normalizeHeader(rKey) === normKey) {
            if (rVal !== undefined && rVal !== null && rVal !== '') return rVal;
          }
        }
      }
      return '';
    };

    const orgName = String(getVal('Organization Name', 'Organization', 'Company', 'Org') || 'SCOOTSY LOGISTICS PRIVATE LIMITED');
    const vendorName = String(getVal('Vendor Name', 'Vendor', 'Supplier Name') || 'The Brothers and Co');
    const vendorCode = String(getVal('Vendor Code', 'Supplier Code', 'Vendor ID') || '1N96368405');
    const gstin = String(getVal('GSTIN', 'GST', 'Tax ID') || '');
    const pan = String(getVal('PAN', 'PAN Number') || '');
    const warehouseName = String(getVal('Warehouse Name', 'Warehouse', 'DC', 'Location') || 'General Warehouse');
    const city = String(getVal('City') || '');
    const state = String(getVal('State') || '');
    const statusOfInvoice = String(getVal('Status of Invoice', 'Status') || 'Posted');
    const poNumber = String(getVal('PO No.', 'PO No', 'PO Number', 'Purchase Order No') || '');
    
    // 1. PO Date
    const poDate = parseAndFormatDate(getVal('PO Date', 'PODate', 'PO Dt', 'Order Date'));
    const poAmount = parseINR(getVal('PO Amount', 'PO Value'));
    
    const grnNumber = String(getVal('GRN No.', 'GRN No', 'GRN Number', 'Receipt No') || '');
    
    // 2. GRN Date (with automatic fallback to extract from GRN number like ##10072026)
    let grnDate = parseAndFormatDate(getVal('GRN Date', 'GRNDate', 'GRN Dt', 'Receipt Date', 'Goods Receipt Date'));
    if (!grnDate && grnNumber) {
      grnDate = extractDateFromGrnNo(grnNumber);
    }

    const grossGrnAmount = parseINR(getVal('Gross GRN Amount', 'Gross GRN', 'GRN Amount'));
    const invoiceNumber = String(getVal('Invoice Number', 'Invoice No', 'Bill No', 'Inv No') || `INV-${idx + 1}`);
    
    // 3. Invoice Accounting Date
    const invoiceAccountingDate = parseAndFormatDate(getVal(
      'Invoice Accounting Date', 
      'Invoice Date', 
      'InvoiceDate', 
      'Inv Date', 
      'InvDate', 
      'Accounting Date', 
      'AccountingDate', 
      'Bill Date', 
      'Billing Date',
      'Date'
    ));
    
    // Invoices recorded (Sales amount)
    let invoicesRecorded = parseINR(getVal('Invoices recorded', 'Invoice Amount', 'Gross Amount', 'Gross Invoiced'));
    if (!invoicesRecorded && grossGrnAmount) {
      invoicesRecorded = grossGrnAmount;
    }

    const tdsTcs = parseINR(getVal('TDS/TCS', 'TDS', 'TCS', 'TDS Amount'));
    const purchaseReturnAmount = parseINR(getVal('Purchase Return Amount', 'Purchase Return', 'Returns'));
    const brandDiscountPromoClaims = parseINR(getVal('Brand discount (Promo Claims)', 'Brand discount', 'Promo Claims', 'Promo Discount'));
    const otherDebitAmount = parseINR(getVal('Other Debit Amount', 'Debit Note', 'Other Debits'));
    const otherAdjustments = parseINR(getVal('Other adjustments *', 'Other adjustments', 'Adjustments'));
    
    let netPayableAmount = parseINR(getVal('Net Payable Amount', 'Net Payable', 'Net Amount'));
    if (!netPayableAmount && invoicesRecorded) {
      netPayableAmount = invoicesRecorded - (tdsTcs + purchaseReturnAmount + brandDiscountPromoClaims + otherDebitAmount + otherAdjustments);
    }

    const otherAdjustmentDate = parseAndFormatDate(getVal('Other Adjustment Date', 'Adjustment Date'));
    const invoiceStatus = String(getVal('Invoice Status', 'Reconciliation Status') || 'Reconciled');
    const paymentAmount = parseINR(getVal('Payment amount', 'Paid Amount', 'Payment', 'Received Amount'));
    const paymentReferenceNo = String(getVal('Payment Reference No', 'Payment Reference', 'UTR', 'Bank Ref', 'UTR No', 'UTR Number') || '');
    
    let outstandingPayment = parseINR(getVal('Outstanding payment', 'Outstanding', 'Balance', 'Pending Amount'));
    if (outstandingPayment === 0 && paymentAmount < netPayableAmount && !row['Outstanding payment']) {
      outstandingPayment = Math.max(0, netPayableAmount - paymentAmount);
    }

    // 4. Due Date
    const dueDate = parseAndFormatDate(getVal('Due Date', 'DueDate', 'Payment Due Date', 'Due Dt'));
    const creditPeriod = parseInt(String(getVal('Credit Period', 'Payment Terms', 'Credit Days') || '30'), 10) || 30;
    
    let overdueStatus = String(getVal('Overdue', 'Overdue Status') || 'Not Due');
    if (!overdueStatus || overdueStatus === '') {
      overdueStatus = outstandingPayment > 0 ? 'Overdue' : 'No due';
    }

    let paymentStatus = String(getVal('Payment Status') || '');
    if (!paymentStatus) {
      if (outstandingPayment <= 0 && paymentAmount > 0) {
        paymentStatus = 'Paid';
      } else if (paymentAmount > 0 && outstandingPayment > 0) {
        paymentStatus = 'Partially Paid';
      } else {
        paymentStatus = 'Unpaid';
      }
    }

    // 5. Last Payment Date
    const lastPaymentDate = parseAndFormatDate(getVal(
      'Last Payment Date', 
      'Payment Date', 
      'LastPaymentDate', 
      'PaymentDate', 
      'Paid Date', 
      'PaidDate', 
      'Last Payment Dt',
      'Last Paid Date',
      'Disbursed Date', 
      'Settlement Date', 
      'Value Date',
      'Remittance Date',
      'Pmt Date',
      'Payment Dt'
    ));

    const totalDeductions = tdsTcs + purchaseReturnAmount + brandDiscountPromoClaims + otherDebitAmount + otherAdjustments;

    return {
      id: `inv-${Date.now()}-${idx}-${invoiceNumber.replace(/[^a-zA-Z0-9]/g, '_')}`,
      organizationName: orgName,
      vendorName,
      vendorCode,
      gstin,
      pan,
      warehouseName,
      city: city || (warehouseName.includes('BLR') ? 'Bengaluru' : warehouseName.includes('KOL') ? 'Kolkata' : warehouseName.includes('CHE') ? 'Chennai' : warehouseName.includes('MUM') ? 'Mumbai' : warehouseName.includes('HYD') ? 'Hyderabad' : warehouseName.includes('Viz') ? 'Visakhapatnam' : 'Metro Hub'),
      state: state || 'India',
      statusOfInvoice,
      poNumber,
      poDate,
      poAmount,
      grnNumber,
      grnDate,
      grossGrnAmount,
      invoiceNumber,
      invoiceAccountingDate,
      invoicesRecorded,
      tdsTcs,
      purchaseReturnAmount,
      brandDiscountPromoClaims,
      otherDebitAmount,
      otherAdjustments,
      netPayableAmount,
      otherAdjustmentDate,
      invoiceStatus,
      paymentAmount,
      paymentReferenceNo,
      outstandingPayment,
      dueDate,
      creditPeriod,
      overdueStatus,
      paymentStatus,
      lastPaymentDate,
      totalDeductions,
      agingBucket: paymentStatus === 'Paid' ? 'Paid' : overdueStatus === 'Overdue' ? '31-60 days' : 'Not Due'
    };
  });
}

/**
 * Map raw object rows to typed PaymentRecords (Point 2)
 */
export function mapRowsToPayments(rawRows: Record<string, any>[]): PaymentRecord[] {
  return rawRows.map((row, idx) => {
    const getVal = (...keys: string[]): any => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && row[k] !== '') return row[k];
        const normKey = normalizeHeader(k);
        for (const [rKey, rVal] of Object.entries(row)) {
          if (normalizeHeader(rKey) === normKey) {
            if (rVal !== undefined && rVal !== null && rVal !== '') return rVal;
          }
        }
      }
      return '';
    };

    const orgName = String(getVal('Organization Name', 'Organization') || 'SCOOTSY LOGISTICS PRIVATE LIMITED');
    const vendorName = String(getVal('Vendor Name', 'Vendor') || 'The Brothers and Co');
    const vendorCode = String(getVal('Vendor Code') || '1N96368405');
    const gstin = String(getVal('GSTIN') || '');
    const pan = String(getVal('PAN') || '');
    const tradeVendorType = String(getVal('Trade Vendor Type') || 'Inventory / FMCG');
    const paymentType = String(getVal('Payment type', 'Payment Type') || 'NEFT');
    
    // Payment Date
    const paymentDate = parseAndFormatDate(getVal(
      'Payment Date', 
      'PaymentDate', 
      'Paid Date', 
      'Value Date', 
      'Transaction Date', 
      'Date'
    ));
    
    const paymentNumber = String(getVal('Payment Number', 'Payment No', 'Pmt No') || `PAY-${idx + 1}`);
    const paymentReferenceNo = String(getVal('Payment reference no.', 'Payment Reference No', 'UTR', 'UTR No', 'Bank Ref') || '');
    const amount = parseINR(getVal('Amount', 'Gross Amount'));
    const reversal = parseINR(getVal('Reversal'));
    const netAmount = parseINR(getVal('Net Amount')) || (amount - reversal);

    return {
      id: `pmt-${Date.now()}-${idx}-${paymentReferenceNo || idx}`,
      organizationName: orgName,
      vendorName,
      vendorCode,
      gstin,
      pan,
      tradeVendorType,
      paymentType,
      paymentDate,
      paymentNumber,
      paymentReferenceNo,
      amount,
      reversal,
      netAmount,
      linkedInvoices: []
    };
  });
}

/**
 * Parse an uploaded File (Excel .xlsx, .xls or CSV)
 */
export async function parseUploadedFile(file: File): Promise<ParseResult> {
  const fileName = file.name;

  try {
    const arrayBuffer = await file.arrayBuffer();
    // Enable cellDates: true so Excel serial dates are converted to Date objects
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
    let invoices: InvoiceRecord[] = [];
    let payments: PaymentRecord[] = [];
    let primaryType: DetectedFileType = 'unknown';

    // Scan sheets in workbook (e.g. Sheet 1: Invoices, Sheet 2: Payments)
    for (let i = 0; i < workbook.SheetNames.length; i++) {
      const sheetName = workbook.SheetNames[i];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
      if (!rows || rows.length === 0) continue;

      const headers = Object.keys(rows[0] || {});
      const sheetType = detectReportType(headers);

      if (sheetType === 'payment_report') {
        if (payments.length === 0) {
          payments = mapRowsToPayments(rows);
          if (i === 0) primaryType = 'payment_report';
        }
      } else {
        if (invoices.length === 0) {
          invoices = mapRowsToInvoices(rows);
          if (i === 0) primaryType = 'invoice_report';
        }
      }
    }

    if (invoices.length === 0 && payments.length === 0) {
      return {
        fileType: 'unknown',
        fileName,
        totalRows: 0,
        errors: ['The selected file contains no readable data rows.']
      };
    }

    // Cross-link: If an invoice has missing lastPaymentDate, match with payment reference from payments
    if (invoices.length > 0 && payments.length > 0) {
      const pmtRefMap = new Map<string, string>();
      payments.forEach(p => {
        if (p.paymentReferenceNo && p.paymentDate) {
          pmtRefMap.set(p.paymentReferenceNo.toLowerCase().trim(), p.paymentDate);
        }
      });

      invoices = invoices.map(inv => {
        if (!inv.lastPaymentDate && inv.paymentReferenceNo) {
          const matchDate = pmtRefMap.get(inv.paymentReferenceNo.toLowerCase().trim());
          if (matchDate) {
            return { ...inv, lastPaymentDate: matchDate };
          }
        }
        return inv;
      });
    }

    const finalType = primaryType !== 'unknown' ? primaryType : invoices.length > 0 ? 'invoice_report' : 'payment_report';

    return {
      fileType: finalType,
      invoices: invoices.length > 0 ? invoices : undefined,
      payments: payments.length > 0 ? payments : undefined,
      fileName,
      totalRows: (invoices.length || 0) + (payments.length || 0),
      errors: []
    };
  } catch (err: any) {
    return {
      fileType: 'unknown',
      fileName,
      totalRows: 0,
      errors: [err?.message || 'Failed to parse file format. Please ensure valid Excel or CSV.']
    };
  }
}
