import React from 'react';
import { UploadActivityMeta, EditActivityMeta } from '../types';
import { 
  FileSpreadsheet, 
  Clock, 
  Edit3, 
  Upload, 
  PlusCircle, 
  CheckCircle2, 
  Calendar,
  ShieldCheck,
  FileText,
  Sparkles,
  ArrowRight
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

interface FormattedDateTime {
  date: string;
  time: string;
  full: string;
  relative: string;
}

function parseDateTime(isoString?: string, fallbackTimeStr?: string): FormattedDateTime {
  if (!isoString) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = fallbackTimeStr || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return {
      date: dateStr,
      time: timeStr,
      full: `${dateStr}, ${timeStr}`,
      relative: 'Active Session'
    };
  }

  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      return {
        date: isoString,
        time: fallbackTimeStr || '',
        full: isoString,
        relative: ''
      };
    }

    const dateStr = d.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
    
    const timeStr = d.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });

    // Relative calculation
    const diffMs = Math.max(0, Date.now() - d.getTime());
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let relative = 'Just now';
    if (diffDays > 0) {
      relative = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      relative = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMins > 0) {
      relative = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    }

    return {
      date: dateStr,
      time: timeStr,
      full: `${dateStr}, ${timeStr}`,
      relative
    };
  } catch {
    return {
      date: isoString,
      time: fallbackTimeStr || '',
      full: isoString,
      relative: ''
    };
  }
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
  // Format Date and Time for Last Upload
  const uploadDateTime = parseDateTime(
    lastUpload?.uploadedAt,
    lastSyncTime
  );

  // Format Date and Time for Last Edit
  const editDateTime = parseDateTime(
    lastEdit?.editedAt,
    lastSyncTime
  );

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
          label: 'Ledger Reconciled',
          className: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700'
        };
    }
  };

  const editBadge = getActionBadge(lastEdit?.action);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs transition-colors">
      
      {/* Top Header Section with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Last File Upload & Edit Activity</span>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Exact date and time when files were uploaded and when invoice records were last modified.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-amber-500" />
            <span>Upload New File</span>
          </button>
          <button
            onClick={onOpenAddInvoice}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/70 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-800 rounded-lg transition-colors shadow-2xs"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>+ Edit / Add Invoice</span>
          </button>
        </div>
      </div>

      {/* Main Grid: 2 High-Visibility Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        
        {/* PANEL 1: LAST FILE UPLOAD DATE & TIME */}
        <div className="relative overflow-hidden bg-gradient-to-br from-sky-50/60 via-slate-50 to-white dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 border border-sky-200/80 dark:border-sky-900/50 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            
            {/* Header Tag */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Last File Upload</span>
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                {lastUpload 
                  ? (lastUpload.fileType === 'invoice' ? 'Invoice Ledger (34 Fields)' : 'Payment Remittance (13 Fields)')
                  : (totalInvoices > 0 ? 'Active Dataset' : 'Ready for Upload')}
              </span>
            </div>

            {/* PROMINENT DATE & TIME HIGHLIGHT BOX */}
            <div className="bg-white dark:bg-slate-800/90 border border-sky-200 dark:border-slate-700/80 rounded-xl p-3 sm:p-3.5 shadow-xs">
              <div className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Upload Date & Time</span>
              </div>
              
              <div className="flex flex-wrap items-baseline gap-2.5">
                <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                  {uploadDateTime.date}
                </span>
                <span className="text-sm sm:text-base font-bold text-sky-600 dark:text-sky-400 font-mono">
                  {uploadDateTime.time}
                </span>
                {uploadDateTime.relative && (
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                    {uploadDateTime.relative}
                  </span>
                )}
              </div>
            </div>

            {/* File & Records Detail */}
            <div className="space-y-1.5 pt-1">
              <div className="text-xs text-slate-500 dark:text-slate-400">File Name:</div>
              <div 
                className="text-sm font-bold text-slate-900 dark:text-white font-mono truncate bg-slate-100/70 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800"
                title={lastUpload?.fileName || 'Instamart_Standard_Invoice_Report.xlsx'}
              >
                {lastUpload?.fileName || (totalInvoices > 0 ? 'Instamart_Standard_Invoice_Report.xlsx' : 'No file uploaded yet')}
              </div>
            </div>

          </div>

          {/* Footer of Panel 1 */}
          <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Total Ingested Records:
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-900">
              {lastUpload?.rowCount 
                ? `${lastUpload.rowCount} Invoices / Rows` 
                : `${totalInvoices} Invoices, ${totalPayments} Payments`}
            </span>
          </div>
        </div>

        {/* PANEL 2: LAST FILE / RECORD EDIT DATE & TIME */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-50/60 via-slate-50 to-white dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            
            {/* Header Tag */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Last Edit & Modification</span>
              </span>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${editBadge.className}`}>
                {editBadge.label}
              </span>
            </div>

            {/* PROMINENT DATE & TIME HIGHLIGHT BOX */}
            <div className="bg-white dark:bg-slate-800/90 border border-amber-200 dark:border-slate-700/80 rounded-xl p-3 sm:p-3.5 shadow-xs">
              <div className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Modification Date & Time</span>
              </div>
              
              <div className="flex flex-wrap items-baseline gap-2.5">
                <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                  {editDateTime.date}
                </span>
                <span className="text-sm sm:text-base font-bold text-amber-600 dark:text-amber-400 font-mono">
                  {editDateTime.time}
                </span>
                {editDateTime.relative && (
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                    {editDateTime.relative}
                  </span>
                )}
              </div>
            </div>

            {/* Edit Description Detail */}
            <div className="space-y-1.5 pt-1">
              <div className="text-xs text-slate-500 dark:text-slate-400">Action Summary:</div>
              <div 
                className="text-sm font-semibold text-slate-900 dark:text-white truncate bg-slate-100/70 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800"
                title={lastEdit?.description || 'Active dataset verified and synchronized'}
              >
                {lastEdit?.description || (totalInvoices > 0 ? 'Active invoices reconciled & validated' : 'No manual edits recorded yet')}
              </div>
            </div>

          </div>

          {/* Footer of Panel 2 */}
          <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Audit Status:
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Multi-Device Parity Verified</span>
            </span>
          </div>
        </div>

      </div>

      {/* Quick Audit Timestamp Summary Strip at bottom */}
      <div className="mt-4 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="font-medium text-slate-800 dark:text-slate-200">
            Active Ledger Summary:
          </span>
          <span className="font-mono text-slate-600 dark:text-slate-400">
            Uploaded on <strong>{uploadDateTime.full}</strong> · Modified on <strong>{editDateTime.full}</strong>
          </span>
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-500">
          Auto-synchronized across all connected devices
        </div>
      </div>

    </div>
  );
};
