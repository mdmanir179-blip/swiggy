import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InvoiceRecord, FinancialSummary, PaymentRecord } from '../types';
import { formatINR } from './currency';

export function generateInvoiceReportPDF(
  invoices: InvoiceRecord[],
  summary: FinancialSummary,
  fileName: string = 'Instamart_Vendor_Statement.pdf'
) {
  // Use Landscape orientation so all accounting columns including Last Payment Date fit with ample clarity
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // ~842 pt
  const pageHeight = doc.internal.pageSize.getHeight(); // ~595 pt

  const firstInv = invoices[0] || {} as Partial<InvoiceRecord>;
  const orgName = firstInv.organizationName || 'SCOOTSY LOGISTICS PRIVATE LIMITED';
  const vendorName = firstInv.vendorName || 'The Brothers and Co';
  const vendorCode = firstInv.vendorCode || '1N96368405';
  const gstin = firstInv.gstin || '19BRXPA0554J1ZF';
  const pan = firstInv.pan || 'BRXPA0554J';

  // 1. Header Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('INSTAMART VENDOR PAYMENT STATEMENT (SHEET 1)', 40, 42);

  // Subtitle & Metadata
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}  |  Currency: Indian Rupee (INR - Rs.)  |  Total Invoices: ${invoices.length}`,
    40,
    58
  );

  // Top Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.line(40, 68, pageWidth - 40, 68);

  // 2. Buyer & Vendor Entity Information Cards
  const entityCardWidth = (pageWidth - 80 - 15) / 2;
  const entityCardY = 78;
  const entityCardH = 54;

  // Buyer Card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(40, entityCardY, entityCardWidth, entityCardH, 4, 4, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(40, entityCardY, entityCardWidth, entityCardH, 4, 4, 'D');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('CUSTOMER / BUYER ENTITY:', 50, entityCardY + 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(orgName, 50, entityCardY + 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Instamart Quick Commerce Fulfillment Network', 50, entityCardY + 44);

  // Vendor Card
  const vendorX = 40 + entityCardWidth + 15;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(vendorX, entityCardY, entityCardWidth, entityCardH, 4, 4, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(vendorX, entityCardY, entityCardWidth, entityCardH, 4, 4, 'D');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('SUPPLIER / VENDOR ENTITY:', vendorX + 10, entityCardY + 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${vendorName} (${vendorCode})`, vendorX + 10, entityCardY + 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`GSTIN: ${gstin}   |   PAN: ${pan}`, vendorX + 10, entityCardY + 44);

  // 3. Financial Summary KPI Metric Cards Box
  const cardY = 142;
  const numCards = 4;
  const cardGap = 12;
  const cardW = (pageWidth - 80 - cardGap * (numCards - 1)) / numCards;
  const cardH = 42;

  const cards = [
    { label: 'TOTAL GROSS INVOICED', value: formatINR(summary.totalGrossSales).replace('₹', 'Rs. ') },
    { label: 'NET PAYABLE AMOUNT', value: formatINR(summary.totalNetPayable).replace('₹', 'Rs. ') },
    { label: 'TOTAL REALIZED / PAID', value: formatINR(summary.totalPaidAmount).replace('₹', 'Rs. ') },
    { label: 'OUTSTANDING BALANCE', value: formatINR(summary.totalOutstanding).replace('₹', 'Rs. ') },
  ];

  cards.forEach((c, idx) => {
    const x = 40 + idx * (cardW + cardGap);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(x, cardY, cardW, cardH, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, cardY, cardW, cardH, 3, 3, 'D');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(c.label, x + 8, cardY + 14);

    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(c.value, x + 8, cardY + 31);
  });

  // Overdue Alert Banner if overdue invoices present
  let tableStartY = 196;
  if (summary.totalOverdueAmount > 0) {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 202, 202);
    doc.roundedRect(40, 192, pageWidth - 80, 20, 3, 3, 'FD');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28);
    doc.text(
      `OVERDUE ALERT: ${summary.totalOverdueCount} Invoices totaling ${formatINR(summary.totalOverdueAmount).replace('₹', 'Rs. ')} are past due date and awaiting payment.`,
      50,
      205
    );
    tableStartY = 220;
  }

  // 4. Invoices Table Rows with "Last Payment Date" prominently included!
  const tableData = invoices.map(inv => [
    inv.invoiceNumber,
    inv.invoiceAccountingDate || '—',
    inv.warehouseName || 'Direct',
    inv.poNumber || '—',
    formatINR(inv.invoicesRecorded || inv.grossGrnAmount).replace('₹', ''),
    inv.totalDeductions > 0 ? `-${formatINR(inv.totalDeductions).replace('₹', '')}` : '0.00',
    formatINR(inv.netPayableAmount).replace('₹', ''),
    formatINR(inv.paymentAmount).replace('₹', ''),
    formatINR(inv.outstandingPayment).replace('₹', ''),
    inv.dueDate || '—',
    inv.lastPaymentDate || (inv.paymentAmount > 0 ? 'Settled' : '—'), // Explicit Last Payment Date
    inv.paymentStatus || 'Unpaid',
    inv.paymentReferenceNo || '—'
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [[
      'Invoice #',
      'Date',
      'Warehouse',
      'PO #',
      'Gross (Rs)',
      'Deductions',
      'Net Payable (Rs)',
      'Paid (Rs)',
      'Balance (Rs)',
      'Due Date',
      'Last Payment Date',
      'Status',
      'Bank Ref / UTR'
    ]],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 7.2,
      cellPadding: 4,
      font: 'helvetica',
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right', fontStyle: 'bold' },
      7: { halign: 'right', textColor: [5, 150, 105] }, // emerald for paid
      8: { halign: 'right', fontStyle: 'bold' },
      9: { halign: 'center' },
      10: { halign: 'center', fontStyle: 'bold', textColor: [5, 150, 105] }, // Highlight Last Payment Date
      11: { halign: 'center' },
      12: { halign: 'left', fontSize: 6.5 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        // Status column
        if (data.column.index === 11) {
          const val = String(data.cell.raw || '').toLowerCase();
          if (val === 'paid' || val.includes('paid') && !val.includes('unpaid') && !val.includes('part')) {
            data.cell.styles.textColor = [5, 150, 105];
            data.cell.styles.fontStyle = 'bold';
          } else if (val.includes('unpaid')) {
            data.cell.styles.textColor = [220, 38, 38];
          } else if (val.includes('part')) {
            data.cell.styles.textColor = [217, 119, 6];
          }
        }
        // Balance column: if 0.00, make light grey
        if (data.column.index === 8) {
          const val = String(data.cell.raw || '').trim();
          if (val === '0.00' || val === '0') {
            data.cell.styles.textColor = [100, 116, 139];
          }
        }
      }
    },
    margin: { left: 40, right: 40 },
    didDrawPage: () => {
      // Footer page numbering
      const str = `Page ${doc.getNumberOfPages()}  |  Instamart Payment Tracker  |  Sheet 1 Reconciled Statement`;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(str, 40, pageHeight - 16);
    }
  });

  doc.save(fileName);
}

export function generatePaymentLedgerPDF(
  payments: PaymentRecord[],
  fileName: string = 'Instamart_Payment_Remittance_Ledger.pdf'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const firstPmt = payments[0] || {} as Partial<PaymentRecord>;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('INSTAMART BANK REMITTANCE REGISTER (POINT 2)', 40, 45);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')} | Vendor: ${firstPmt.vendorName || 'The Brothers and Co'}`, 40, 60);

  doc.setDrawColor(226, 232, 240);
  doc.line(40, 70, 555, 70);

  const tableData = payments.map(p => [
    p.paymentReferenceNo || '—',
    p.paymentDate || '—',
    p.paymentNumber || '—',
    p.paymentType || 'NEFT',
    formatINR(p.amount).replace('₹', ''),
    p.reversal > 0 ? `-${formatINR(p.reversal).replace('₹', '')}` : '0.00',
    formatINR(p.netAmount).replace('₹', ''),
    p.linkedInvoices ? p.linkedInvoices.join(', ') : '—'
  ]);

  autoTable(doc, {
    startY: 85,
    head: [[
      'Bank Ref / UTR',
      'Payment Date',
      'Payment #',
      'Type',
      'Amount (Rs)',
      'Reversal',
      'Net Credit (Rs)',
      'Invoices Linked'
    ]],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 40, right: 40 },
    didDrawPage: () => {
      const str = `Page ${doc.getNumberOfPages()} | Instamart Payment Tracker`;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(str, 40, doc.internal.pageSize.height - 20);
    }
  });

  doc.save(fileName);
}
