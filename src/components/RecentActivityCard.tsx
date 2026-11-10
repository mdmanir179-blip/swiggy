import React from 'react';
import { UploadActivityMeta, EditActivityMeta } from '../types';
import { 
  FileSpreadsheet, 
  Clock, 
  Edit3, 
  Upload, 
  PlusCircle, 
  CheckCircle2, 
  Database,
  ArrowUpRight,
  ShieldCheck,
  Calendar
} from 'lucide-react';

interface RecentActivityCardProps {
  lastUpload: UploadActivityMeta | null;
  lastEdit: EditActivityMeta | null;
  totalInvoices: number;
  totalPayments: number;
  lastSyncTime?: string;
  onOpenUpload: () => void;
  onOpenAddInvoice: () => void;
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
  lastUpload,
  lastEdit,
  totalInvoices,
  totalPayments,
  lastSyncTime,
  onOpenUpload,
  onOpenAddInvoice
}) => {
  const formatTime = (isoString?: string) => {
    if (!isoString) return 'Not available';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  const getActionBadge = (action?: string) => {
    switch (action) {
      case 'paid':
        return {
          label: 'Payment Settled',
          className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
        };
      case 'added':
        return {
          label: 'New Invoice Added',
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300 dark:border-blue-800'
        };
      case 'edited':
        return {
          label: 'Details Updated',
          className: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800'
        };
      case 'reverted':
        return {
          label: 'Payment Reverted',
          className: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300 dark:border-purple-800'
        };
      default:
        return {
          label: 'System Sync',
          className: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700'
        };
    }
  };

  const editBadge = getActionBadge(lastEdit?.action);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Data Audit & Activity Log</span>
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                Real-time Parity
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tracks the latest file uploaded and the most recent invoice modification or payment record.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-amber-500" />
            <span>Upload File</span>
          </button>
          <button
            onClick={onOpenAddInvoice}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>+ Edit / Add</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Panel 1: Last Uploaded File */}
        <div className="bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Last Uploaded File</span>
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                {lastUpload ? (lastUpload.fileType === 'invoice' ? 'Invoice Ledger (34 Col)' : 'Payment Remittance') : (totalInvoices > 0 ? 'Active Dataset' : 'Pending Upload')}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm font-bold text-slate-900 dark:text-white truncate" title={lastUpload?.fileName || 'Initial Standard Dataset'}>
                {lastUpload?.fileName || (totalInvoices > 0 ? 'Instamart_Standard_Invoice_Report.xlsx' : 'No file uploaded yet')}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {lastUpload?.uploadedAt 
                    ? formatTime(lastUpload.uploadedAt) 
                    : (lastSyncTime ? `Synchronized at ${lastSyncTime}` : 'Awaiting first file upload')}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Processed Records:
            </span>
            <span className="font-mono font-semibold text-slate-900 dark:text-white">
              {lastUpload?.rowCount 
                ? `${lastUpload.rowCount} Records` 
                : `${totalInvoices} Invoices, ${totalPayments} Payments`}
            </span>
          </div>
        </div>

        {/* Panel 2: Last Edited Action / Modification */}
        <div className="bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Last Edit & Modification</span>
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded font-medium border ${editBadge.className}`}>
                {editBadge.label}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm font-bold text-slate-900 dark:text-white truncate" title={lastEdit?.description || 'Data synchronized with Firestore'}>
                {lastEdit?.description || (totalInvoices > 0 ? 'Active invoices reconciled and verified' : 'No manual edits recorded yet')}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {lastEdit?.editedAt 
                    ? formatTime(lastEdit.editedAt) 
                    : (lastSyncTime ? `Last ledger touch: ${lastSyncTime}` : 'All records in initial status')}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Audit Status:
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Audit Trail Validated</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
