/**
 * Instamart Payment Tracker - Core Domain Types
 */

// 1. Complete Invoice Report Schema (Point 1 - 34 fields)
export interface InvoiceRecord {
  id: string;
  organizationName: string;            // Organization Name
  vendorName: string;                  // Vendor Name
  vendorCode: string;                  // Vendor Code
  gstin: string;                        // GSTIN
  pan: string;                          // PAN
  warehouseName: string;                // Warehouse Name
  city: string;                         // City
  state: string;                        // State
  statusOfInvoice: string;              // Status of Invoice (e.g. Posted)
  poNumber: string;                     // PO No.
  poDate: string;                       // PO Date
  poAmount: number;                     // PO Amount
  grnNumber: string;                    // GRN No.
  grnDate: string;                      // GRN Date
  grossGrnAmount: number;               // Gross GRN Amount
  invoiceNumber: string;                // Invoice Number
  invoiceAccountingDate: string;        // Invoice Accounting Date
  invoicesRecorded: number;             // Invoices recorded (Sales / Gross Invoice)
  tdsTcs: number;                       // TDS/TCS
  purchaseReturnAmount: number;         // Purchase Return Amount
  brandDiscountPromoClaims: number;     // Brand discount (Promo Claims)
  otherDebitAmount: number;             // Other Debit Amount
  otherAdjustments: number;             // Other adjustments *
  netPayableAmount: number;             // Net Payable Amount
  otherAdjustmentDate: string;          // Other Adjustment Date
  invoiceStatus: string;                // Invoice Status (e.g. Reconciled)
  paymentAmount: number;                // Payment amount
  paymentReferenceNo: string;           // Payment Reference No
  outstandingPayment: number;           // Outstanding payment
  dueDate: string;                      // Due Date
  creditPeriod: number;                 // Credit Period (in days)
  overdueStatus: 'Overdue' | 'Not Due' | 'No due' | string; // Overdue
  paymentStatus: 'Paid' | 'Partially Paid' | 'Unpaid' | string; // Payment Status
  lastPaymentDate: string;              // Last Payment Date

  // Computed helper fields
  totalDeductions: number;              // TDS + Returns + Promo + Debits + Adjustments
  daysUntilDue?: number;                // calculated days relative to due date
  agingBucket?: '0-30 days' | '31-60 days' | '61-90 days' | '90+ days' | 'Not Due' | 'Paid';
}

// 2. Complete Payment Report Schema (Point 2 - 13 fields)
export interface PaymentRecord {
  id: string;
  organizationName: string;            // Organization Name
  vendorName: string;                  // Vendor Name
  vendorCode: string;                  // Vendor Code
  gstin: string;                        // GSTIN
  pan: string;                          // PAN
  tradeVendorType: string;              // Trade Vendor Type
  paymentType: string;                  // Payment type (NEFT, RTGS, etc.)
  paymentDate: string;                  // Payment Date
  paymentNumber: string;                // Payment Number
  paymentReferenceNo: string;           // Payment reference no.
  amount: number;                       // Amount
  reversal: number;                     // Reversal
  netAmount: number;                    // Net Amount

  // Reconciled matching link
  linkedInvoices?: string[];            // Invoice numbers matching this payment ref
  matchedInvoiceCount?: number;
}

// Financial Summary Metrics (Point 3 & Point 9)
export interface FinancialSummary {
  totalInvoicesCount: number;
  totalGrossSales: number;              // Total Invoices Recorded
  totalNetPayable: number;              // Net Payable
  totalPaidAmount: number;              // Total Amount Paid
  totalOutstanding: number;             // Total Outstanding Balance
  totalOverdueAmount: number;           // Total Overdue Amount
  totalOverdueCount: number;
  totalPendingNotDueAmount: number;     // Pending Not Due Amount
  totalPendingNotDueCount: number;
  totalPaidInvoicesCount: number;
  totalPartialInvoicesCount: number;
  totalUnpaidInvoicesCount: number;
  
  // Deductions & Adjustments
  totalTdsTcs: number;
  totalPurchaseReturns: number;
  totalPromoClaims: number;
  totalOtherDebits: number;
  totalAdjustments: number;
  totalDeductionsCombined: number;

  // Rate metrics
  paymentRealizationRate: number;       // (totalPaid / totalNetPayable) * 100
  overdueExposureRate: number;          // (totalOverdue / totalOutstanding) * 100
}

export type ViewTab = 'dashboard' | 'invoices' | 'payments' | 'reconciliation' | 'aging' | 'reports';

export interface FilterOptions {
  searchQuery: string;
  paymentStatus: string;                // 'All' | 'Paid' | 'Partially Paid' | 'Unpaid'
  overdueFilter: string;                // 'All' | 'Overdue' | 'Not Due' | 'No due'
  warehouse: string;                   // 'All' | specific warehouse
  dateFrom: string;
  dateTo: string;
  minAmount?: number;
  maxAmount?: number;
}
