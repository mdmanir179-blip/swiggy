import * as XLSX from 'xlsx';
import { InvoiceRecord, PaymentRecord, FinancialSummary } from '../types';
import { formatINR } from './currency';

/**
 * Export filtered invoices to Excel (.xlsx) with all 34 columns
 */
export function exportInvoicesToExcel(invoices: InvoiceRecord[], fileName: string = 'Instamart_Invoice_Report.xlsx') {
  const exportData = invoices.map(inv => ({
    'Organization Name': inv.organizationName,
    'Vendor Name': inv.vendorName,
    'Vendor Code': inv.vendorCode,
    'GSTIN': inv.gstin,
    'PAN': inv.pan,
    'Warehouse Name': inv.warehouseName,
    'City': inv.city,
    'State': inv.state,
    'Status of Invoice': inv.statusOfInvoice,
    'PO No.': inv.poNumber,
    'PO Date': inv.poDate,
    'PO Amount': inv.poAmount,
    'GRN No.': inv.grnNumber,
    'GRN Date': inv.grnDate,
    'Gross GRN Amount': inv.grossGrnAmount,
    'Invoice Number': inv.invoiceNumber,
    'Invoice Accounting Date': inv.invoiceAccountingDate,
    'Invoices recorded': inv.invoicesRecorded,
    'TDS/TCS': inv.tdsTcs,
    'Purchase Return Amount': inv.purchaseReturnAmount,
    'Brand discount (Promo Claims)': inv.brandDiscountPromoClaims,
    'Other Debit Amount': inv.otherDebitAmount,
    'Other adjustments *': inv.otherAdjustments,
    'Net Payable Amount': inv.netPayableAmount,
    'Other Adjustment Date': inv.otherAdjustmentDate,
    'Invoice Status': inv.invoiceStatus,
    'Payment amount': inv.paymentAmount,
    'Payment Reference No': inv.paymentReferenceNo,
    'Outstanding payment': inv.outstandingPayment,
    'Due Date': inv.dueDate,
    'Credit Period': inv.creditPeriod,
    'Overdue': inv.overdueStatus,
    'Payment Status': inv.paymentStatus,
    'Last Payment Date': inv.lastPaymentDate
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoice Report');
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export payments to Excel (.xlsx) matching Point 2 schema
 */
export function exportPaymentsToExcel(payments: PaymentRecord[], fileName: string = 'Instamart_Payment_Report.xlsx') {
  const exportData = payments.map(p => ({
    'Organization Name': p.organizationName,
    'Vendor Name': p.vendorName,
    'Vendor Code': p.vendorCode,
    'GSTIN': p.gstin,
    'PAN': p.pan,
    'Trade Vendor Type': p.tradeVendorType,
    'Payment type': p.paymentType,
    'Payment Date': p.paymentDate,
    'Payment Number': p.paymentNumber,
    'Payment reference no.': p.paymentReferenceNo,
    'Amount': p.amount,
    'Reversal': p.reversal,
    'Net Amount': p.netAmount,
    'Linked Invoices': p.linkedInvoices ? p.linkedInvoices.join(', ') : ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Payment Report');
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export overdue invoices priority follow-up sheet
 */
export function exportOverdueRecoveryReport(invoices: InvoiceRecord[], fileName: string = 'Instamart_Overdue_Recovery_Report.xlsx') {
  const overdueOnly = invoices.filter(i => (i.overdueStatus || '').toLowerCase().includes('overdue') && i.outstandingPayment > 0);

  const exportData = overdueOnly.map(inv => ({
    'Invoice Number': inv.invoiceNumber,
    'Warehouse Name': inv.warehouseName,
    'City': inv.city,
    'Due Date': inv.dueDate,
    'Invoice Date': inv.invoiceAccountingDate,
    'Net Invoiced (INR)': inv.netPayableAmount,
    'Received (INR)': inv.paymentAmount,
    'Overdue Outstanding (INR)': inv.outstandingPayment,
    'Payment Reference No': inv.paymentReferenceNo || 'Unreferenced',
    'PO Number': inv.poNumber,
    'GRN Number': inv.grnNumber,
    'Vendor Name': inv.vendorName,
    'GSTIN': inv.gstin
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Overdue Recovery');
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export CSV format
 */
export function exportToCsv(data: Record<string, any>[], filename: string) {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers
      .map(h => {
        const val = row[h] ?? '';
        const escaped = String(val).replace(/"/g, '""');
        return `"${escaped}"`;
      })
      .join(',')
  );

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
