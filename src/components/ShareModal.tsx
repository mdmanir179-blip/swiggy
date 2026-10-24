import React, { useState, useEffect } from 'react';
import { InvoiceRecord, PaymentRecord } from '../types';
import { createShareableLink } from '../utils/shareManager';
import { formatINR } from '../utils/currency';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  MessageSquare, 
  Mail, 
  ShieldCheck, 
  FileSpreadsheet, 
  Loader2 
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: InvoiceRecord[];
  payments: PaymentRecord[];
  vendorName: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  invoices,
  payments,
  vendorName
}) => {
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState('');
  const [isCloudSaved, setIsCloudSaved] = useState(false);

  useEffect(() => {
    if (isOpen && invoices.length > 0) {
      generateLink();
    }
  }, [isOpen, invoices, payments]);

  const generateLink = async () => {
    setIsGenerating(true);
    setCopied(false);
    try {
      const result = await createShareableLink(invoices, payments, note);
      setShareUrl(result.url);
      setIsCloudSaved(result.isCloudSaved);
    } catch (err) {
      console.error('Failed to generate link:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const totalGross = invoices.reduce((acc, i) => acc + (i.invoicesRecorded || i.grossGrnAmount || 0), 0);
  const totalNet = invoices.reduce((acc, i) => acc + (i.netPayableAmount || 0), 0);

  const shareText = `Here is the Instamart Payment Tracker report for ${vendorName || 'our vendor account'} (${invoices.length} invoices, Net: ${formatINR(totalNet)}). Open the link to review: ${shareUrl}`;

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Instamart Vendor Payment Statement - ${vendorName || 'Account'}`);
    const body = encodeURIComponent(shareText);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Share Dataset via Link
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Share your uploaded Instamart sheets with anyone via a direct web link
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-slate-700 dark:text-slate-300">
          
          {/* Dataset Summary Card */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900 dark:text-white text-sm">
                {vendorName || 'Active Dataset'}
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                {invoices.length} Invoices · {payments.length} Payments Records
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Net Payable</div>
              <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                {formatINR(totalNet)}
              </div>
            </div>
          </div>

          {/* Optional Note for Recipient */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Add a Note / Memo for the Recipient (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. October 2026 Instamart settlement for reconciliation & audit"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          {/* Link Container */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Shareable Web Link
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  readOnly
                  value={isGenerating ? 'Generating secure share link...' : shareUrl}
                  className="w-full pl-3 pr-8 py-2.5 text-xs font-mono bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 truncate select-all focus:outline-none"
                />
              </div>

              <button
                onClick={handleCopy}
                disabled={isGenerating || !shareUrl}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs shadow-xs transition-colors shrink-0 disabled:opacity-50"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-800" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
            
            {copied && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Link copied to clipboard! Anyone opening this link will see your uploaded data.
              </p>
            )}
          </div>

          {/* Quick Share Channels */}
          <div>
            <span className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-2">
              Quick Share Options
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleWhatsAppShare}
                disabled={!shareUrl}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={handleEmailShare}
                disabled={!shareUrl}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <Mail className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Email</span>
              </button>

              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors ${
                  !shareUrl ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Tab</span>
              </a>
            </div>
          </div>

          {/* How it works info */}
          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Full Data Preservation</span>
            </div>
            <p>
              When the recipient opens this link, the software will automatically load all 34 invoice fields, PO/GRN dates, Last Payment Dates, bank UTRs, and aging breakdown. They can analyze, search, and generate PDF statements without needing to upload the files themselves.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg text-xs transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
