import React, { useState, useMemo } from 'react';
import { InvoiceRecord } from '../types';
import { formatINR } from '../utils/currency';
import { 
  Search, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal, 
  FileText, 
  ExternalLink,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  X,
  Calendar
} from 'lucide-react';

interface InvoiceTableProps {
  invoices: InvoiceRecord[];
  onSelectInvoice: (invoice: InvoiceRecord) => void;
  selectedWarehouse?: string;
  onClearWarehouseFilter?: () => void;
  onOpenUpload?: () => void;
}

type SortField = 
  | 'invoiceAccountingDate' 
  | 'grnDate' 
  | 'lastPaymentDate' 
  | 'dueDate' 
  | 'invoiceNumber' 
  | 'invoicesRecorded' 
  | 'netPayableAmount' 
  | 'paymentAmount' 
  | 'outstandingPayment';

type SortOrder = 'asc' | 'desc';

export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  onSelectInvoice,
  selectedWarehouse,
  onClearWarehouseFilter,
  onOpenUpload
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [warehouseFilter, setWarehouseFilter] = useState<string>(selectedWarehouse || 'All');
  const [sortField, setSortField] = useState<SortField>('invoiceAccountingDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [showAllColumns, setShowAllColumns] = useState(false);

  // Sync warehouse filter when prop changes
  React.useEffect(() => {
    if (selectedWarehouse) {
      setWarehouseFilter(selectedWarehouse);
    }
  }, [selectedWarehouse]);

  // Unique warehouses for filter dropdown
  const uniqueWarehouses = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach(i => {
      if (i.warehouseName) set.add(i.warehouseName);
    });
    return Array.from(set).sort();
  }, [invoices]);

  // Multi-field Search & Filter: Invoice #, Date, Warehouse, Vendor, UTR / Reference
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // Comprehensive Search Query Matching
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches = 
          (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(q)) ||
          // Dates (Invoice date, due date, PO date, GRN date, Last payment date)
          (inv.invoiceAccountingDate && inv.invoiceAccountingDate.toLowerCase().includes(q)) ||
          (inv.grnDate && inv.grnDate.toLowerCase().includes(q)) ||
          (inv.lastPaymentDate && inv.lastPaymentDate.toLowerCase().includes(q)) ||
          (inv.dueDate && inv.dueDate.toLowerCase().includes(q)) ||
          (inv.poDate && inv.poDate.toLowerCase().includes(q)) ||
          // Warehouse Name & City
          (inv.warehouseName && inv.warehouseName.toLowerCase().includes(q)) ||
          (inv.city && inv.city.toLowerCase().includes(q)) ||
          // Vendor Name & Code
          (inv.vendorName && inv.vendorName.toLowerCase().includes(q)) ||
          (inv.vendorCode && inv.vendorCode.toLowerCase().includes(q)) ||
          (inv.organizationName && inv.organizationName.toLowerCase().includes(q)) ||
          // UTR / Payment Reference Number
          (inv.paymentReferenceNo && inv.paymentReferenceNo.toLowerCase().includes(q)) ||
          // PO & GRN numbers
          (inv.poNumber && inv.poNumber.toLowerCase().includes(q)) ||
          (inv.grnNumber && inv.grnNumber.toLowerCase().includes(q));

        if (!matches) return false;
      }

      // Warehouse filter
      if (warehouseFilter !== 'All' && inv.warehouseName !== warehouseFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'Overdue') {
        return (inv.overdueStatus || '').toLowerCase().includes('overdue') && inv.outstandingPayment > 0;
      }
      if (statusFilter === 'Not Due') {
        return (inv.overdueStatus || '').toLowerCase().includes('not due') || (inv.overdueStatus || '').toLowerCase().includes('no due');
      }
      if (statusFilter === 'Paid') {
        return inv.paymentStatus === 'Paid' || inv.outstandingPayment <= 0.01;
      }
      if (statusFilter === 'Partially Paid') {
        return inv.paymentStatus === 'Partially Paid' || (inv.paymentAmount > 0 && inv.outstandingPayment > 0);
      }
      if (statusFilter === 'Unpaid') {
        return inv.paymentStatus === 'Unpaid' || (inv.paymentAmount === 0 && inv.outstandingPayment > 0);
      }

      return true;
    }).sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' 
          ? (aVal as string).localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string);
      }

      return sortOrder === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [invoices, searchQuery, statusFilter, warehouseFilter, sortField, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredInvoices.length / pageSize) || 1;
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, currentPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs transition-colors">
      
      {/* Control Bar: Universal Search & Quick Filters */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/80">
        
        {/* Universal Search Bar */}
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by Invoice #, Date, Warehouse, Vendor, UTR / Ref..."
            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Segmented Controls */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-200/70 dark:bg-slate-950 rounded-lg border border-slate-300/50 dark:border-slate-800/80">
          {[
            { id: 'All', label: 'All' },
            { id: 'Overdue', label: 'Overdue' },
            { id: 'Not Due', label: 'Not Due' },
            { id: 'Unpaid', label: 'Unpaid' },
            { id: 'Partially Paid', label: 'Partial' },
            { id: 'Paid', label: 'Settled' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-amber-400 text-slate-950 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Warehouse Selector & Column Toggle */}
        <div className="flex items-center gap-2">
          <select
            value={warehouseFilter}
            onChange={(e) => {
              setWarehouseFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-300 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-amber-500 shadow-xs"
          >
            <option value="All">All Warehouses ({uniqueWarehouses.length})</option>
            {uniqueWarehouses.map(wh => (
              <option key={wh} value={wh}>{wh}</option>
            ))}
          </select>

          <button
            onClick={() => setShowAllColumns(!showAllColumns)}
            className={`flex items-center gap-1.5 px-2.5 py-2 text-xs rounded-lg border transition-colors whitespace-nowrap shadow-xs ${
              showAllColumns 
                ? 'bg-amber-50 dark:bg-slate-800 border-amber-400 text-amber-800 dark:text-amber-300' 
                : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Toggle between compact audit and full 34-column view"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showAllColumns ? 'Compact' : 'All 34 Fields'}</span>
          </button>
        </div>

      </div>

      {/* Active Filter Indicators */}
      {(warehouseFilter !== 'All' || searchQuery.trim() !== '') && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20 px-4 py-1.5 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {warehouseFilter !== 'All' && (
              <span>Warehouse: <strong className="font-semibold">{warehouseFilter}</strong></span>
            )}
            {searchQuery.trim() !== '' && (
              <span>Query: &ldquo;<strong className="font-semibold">{searchQuery}</strong>&rdquo; ({filteredInvoices.length} found)</span>
            )}
          </div>
          <button 
            onClick={() => {
              setWarehouseFilter('All');
              setSearchQuery('');
              if (onClearWarehouseFilter) onClearWarehouseFilter();
            }}
            className="text-amber-700 dark:text-amber-400 hover:underline text-[11px] font-medium"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Table Canvas with Scrollable Overflow */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-950/90 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 select-none">
              
              <th className="py-3 px-3 font-semibold whitespace-nowrap">
                <button 
                  onClick={() => handleSort('invoiceNumber')} 
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
                >
                  <span>Invoice #</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>

              {/* 1. Explicitly labeled Invoice Date */}
              <th className="py-3 px-3 font-semibold whitespace-nowrap">
                <button 
                  onClick={() => handleSort('invoiceAccountingDate')} 
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
                  title="Invoice Accounting Date"
                >
                  <Calendar className="w-3.5 h-3.5 text-sky-500" />
                  <span>Invoice Date</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>

              <th className="py-3 px-3 font-semibold whitespace-nowrap">Warehouse / City</th>
              <th className="py-3 px-3 font-semibold whitespace-nowrap">Vendor / Code</th>

              {/* 2. Explicitly labeled GRN No & GRN Date */}
              <th className="py-3 px-3 font-semibold whitespace-nowrap">
                <button 
                  onClick={() => handleSort('grnDate')} 
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
                  title="Sort by GRN Date"
                >
                  <span>GRN No & GRN Date</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>

              {showAllColumns && (
                <>
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">Organization</th>
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">GSTIN / PAN</th>
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">Inv. Status</th>
                </>
              )}

              <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">
                <button 
                  onClick={() => handleSort('invoicesRecorded')} 
                  className="flex items-center gap-1 ml-auto hover:text-slate-900 dark:hover:text-white"
                >
                  <span>Gross Sales</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>

              <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">Deductions</th>

              <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">
                <button 
                  onClick={() => handleSort('netPayableAmount')} 
                  className="flex items-center gap-1 ml-auto hover:text-slate-900 dark:hover:text-white"
                >
                  <span>Net Payable</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>

              <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">
                <button 
                  onClick={() => handleSort('paymentAmount')} 
                  className="flex items-center gap-1 ml-auto hover:text-slate-900 dark:hover:text-white"
                >
                  <span>Paid Amount</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>

              <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">
                <button 
                  onClick={() => handleSort('outstandingPayment')} 
                  className="flex items-center gap-1 ml-auto hover:text-slate-900 dark:hover:text-white"
                >
                  <span>Outstanding</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>

              <th className="py-3 px-3 font-semibold whitespace-nowrap">
                <button 
                  onClick={() => handleSort('dueDate')} 
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
                >
                  <span>Due Date</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>

              {/* 3. Explicitly labeled Last Payment Date */}
              <th className="py-3 px-3 font-semibold whitespace-nowrap">
                <button 
                  onClick={() => handleSort('lastPaymentDate')} 
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
                  title="Last Payment / Remittance Date"
                >
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Last Payment Date</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>

              <th className="py-3 px-3 font-semibold whitespace-nowrap">Payment Status</th>
              <th className="py-3 px-3 font-semibold whitespace-nowrap">UTR / Payment Ref</th>

              <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono text-slate-700 dark:text-slate-300">
            {paginatedInvoices.length === 0 ? (
              <tr>
                <td colSpan={showAllColumns ? 17 : 14} className="py-12 text-center text-slate-500 font-sans">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileText className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {invoices.length === 0 ? 'No invoices loaded in the system' : 'No matching invoices found'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {invoices.length === 0 
                        ? 'Upload an Excel or CSV report to start analyzing' 
                        : 'Try searching by a different invoice number, warehouse, date, vendor, or UTR.'}
                    </p>
                    {invoices.length === 0 && onOpenUpload && (
                      <button
                        onClick={onOpenUpload}
                        className="mt-2 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded-lg text-xs"
                      >
                        Upload Excel / CSV
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedInvoices.map((inv) => {
                const isOverdue = (inv.overdueStatus || '').toLowerCase().includes('overdue');
                const isPaid = inv.paymentStatus === 'Paid' || inv.outstandingPayment <= 0.01;
                const isPartial = inv.paymentStatus === 'Partially Paid' || (inv.paymentAmount > 0 && inv.outstandingPayment > 0);

                return (
                  <tr 
                    key={inv.id}
                    onClick={() => onSelectInvoice(inv)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                  >
                    {/* Invoice Number */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {inv.invoiceNumber}
                      </span>
                    </td>

                    {/* 1. Invoice Date Cell */}
                    <td className="py-2.5 px-3 whitespace-nowrap tabular-nums">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {inv.invoiceAccountingDate || '—'}
                      </div>
                    </td>

                    {/* Warehouse */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-sans">
                      <div className="text-slate-900 dark:text-slate-200 font-medium">{inv.warehouseName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{inv.city || 'Metro'}</div>
                    </td>

                    {/* Vendor Name */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-sans text-slate-700 dark:text-slate-300">
                      <div>{inv.vendorName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{inv.vendorCode}</div>
                    </td>

                    {/* 2. GRN No & GRN Date Cell */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px]">
                      <div className="text-slate-800 dark:text-slate-200 truncate max-w-[130px]" title={inv.grnNumber}>
                        {inv.grnNumber ? inv.grnNumber.split('##')[0] : '—'}
                      </div>
                      <div className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="text-slate-400 dark:text-slate-500 font-sans font-normal text-[10px]">GRN Dt:</span>
                        <span>{inv.grnDate || '—'}</span>
                      </div>
                      <div className="text-slate-500 text-[10px] font-sans">
                        PO: {inv.poNumber || '—'} {inv.poDate ? `(${inv.poDate})` : ''}
                      </div>
                    </td>

                    {showAllColumns && (
                      <>
                        <td className="py-2.5 px-3 whitespace-nowrap text-[11px] font-sans">
                          <div className="text-slate-900 dark:text-slate-200">{inv.organizationName}</div>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-[11px] font-mono text-slate-600 dark:text-slate-400">
                          <div>GST: {inv.gstin}</div>
                          <div>PAN: {inv.pan}</div>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-[11px] font-mono text-slate-700 dark:text-slate-300">
                          <span>{inv.statusOfInvoice} / {inv.invoiceStatus}</span>
                        </td>
                      </>
                    )}

                    {/* Gross Sales */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap tabular-nums text-slate-900 dark:text-slate-200 font-medium">
                      {formatINR(inv.invoicesRecorded || inv.grossGrnAmount)}
                    </td>

                    {/* Deductions (Returns, TDS, etc.) */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap tabular-nums font-mono">
                      {inv.totalDeductions > 0 ? (
                        <span className="text-purple-600 dark:text-purple-400" title={`Returns: ${formatINR(inv.purchaseReturnAmount)} | TDS: ${formatINR(inv.tdsTcs)}`}>
                          -{formatINR(inv.totalDeductions)}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">₹0.00</span>
                      )}
                    </td>

                    {/* Net Payable */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap tabular-nums font-bold text-slate-900 dark:text-white">
                      {formatINR(inv.netPayableAmount)}
                    </td>

                    {/* Payment Amount */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                      {formatINR(inv.paymentAmount)}
                    </td>

                    {/* Outstanding */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap tabular-nums font-bold">
                      {inv.outstandingPayment > 0 ? (
                        <span className={isOverdue ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}>
                          {formatINR(inv.outstandingPayment)}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">₹0.00</span>
                      )}
                    </td>

                    {/* Due Date */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="text-slate-700 dark:text-slate-300 tabular-nums">{inv.dueDate || '—'}</div>
                      <div className="text-[10px]">
                        {isOverdue && inv.outstandingPayment > 0 ? (
                          <span className="text-red-600 dark:text-red-400 font-semibold uppercase">Overdue</span>
                        ) : isPaid ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Settled</span>
                        ) : (
                          <span className="text-sky-600 dark:text-sky-400">Not Due</span>
                        )}
                      </div>
                    </td>

                    {/* 3. Payment Date Cell */}
                    <td className="py-2.5 px-3 whitespace-nowrap tabular-nums">
                      {inv.lastPaymentDate ? (
                        <div>
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold">{inv.lastPaymentDate}</span>
                          <div className="text-[10px] text-slate-500 font-sans">Bank Remitted</div>
                        </div>
                      ) : inv.paymentAmount > 0 ? (
                        <div>
                          <span className="text-amber-600 dark:text-amber-400 font-medium">Partially Settled</span>
                          <div className="text-[10px] text-slate-400 font-sans">Date in UTR</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">—</span>
                      )}
                    </td>

                    {/* Payment Status Label (Zero-Pill Discipline) */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-sans">
                      {isPaid ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-xs font-medium">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Paid</span>
                        </span>
                      ) : isPartial ? (
                        <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 text-xs font-medium">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Partial</span>
                        </span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400 flex items-center gap-1 text-xs font-medium">
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Unpaid</span>
                        </span>
                      )}
                    </td>

                    {/* Payment Reference / UTR */}
                    <td className="py-2.5 px-3 whitespace-nowrap max-w-[150px] truncate" title={inv.paymentReferenceNo}>
                      {inv.paymentReferenceNo ? (
                        <span className="text-amber-700 dark:text-amber-300 font-mono font-medium select-all hover:underline">
                          {inv.paymentReferenceNo.split(',')[0]}
                          {inv.paymentReferenceNo.includes(',') && '...'}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">—</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectInvoice(inv);
                        }}
                        className="p-1 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                        title="View Detailed Invoice Breakdown"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <span>
            Showing <strong className="text-slate-900 dark:text-white font-mono">{filteredInvoices.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to{' '}
            <strong className="text-slate-900 dark:text-white font-mono">{Math.min(currentPage * pageSize, filteredInvoices.length)}</strong> of{' '}
            <strong className="text-slate-900 dark:text-white font-mono">{filteredInvoices.length}</strong> invoices
          </span>
          <div className="flex items-center gap-1 text-slate-500">
            <span>Per page:</span>
            {[15, 25, 50, 100].map(sz => (
              <button
                key={sz}
                onClick={() => {
                  setPageSize(sz);
                  setCurrentPage(1);
                }}
                className={`px-1.5 py-0.5 rounded font-mono ${pageSize === sz ? 'text-amber-700 dark:text-amber-400 font-bold bg-slate-200 dark:bg-slate-800' : 'hover:text-slate-800 dark:hover:text-slate-300'}`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono text-slate-700 dark:text-slate-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
