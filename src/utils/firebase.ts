import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  deleteDoc, 
  writeBatch, 
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { InvoiceRecord, PaymentRecord } from '../types';

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Gracefully attempt anonymous authentication if enabled (does not crash if not configured)
let isAuthAttempted = false;
export async function ensureAuth(): Promise<void> {
  if (isAuthAttempted) return;
  isAuthAttempted = true;
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
  } catch (err) {
    // Non-blocking: firestore.rules allows unauthenticated reads and writes
    console.info('Firebase auth initialization info:', err);
  }
}
ensureAuth().catch(() => {});

// Initialize Firestore with the provisioned custom database ID
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Collections
export const INVOICES_COLLECTION = 'invoices';
export const PAYMENTS_COLLECTION = 'payments';
export const WORKSPACE_COLLECTION = 'workspace';
export const ACTIVE_WORKSPACE_DOC = 'active_ledger';

/**
 * Deep sanitizer to ensure NO field is ever `undefined` (which causes Firestore setDoc/batch to throw errors)
 */
export function sanitizeInvoice(inv: Partial<InvoiceRecord>, index = 0): InvoiceRecord {
  const invoiceNum = String(inv.invoiceNumber || `INV-${index + 1}`).trim();
  const rawId = inv.id || `inv_${Date.now()}_${index}_${invoiceNum.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const safeId = String(rawId).replace(/\//g, '_');

  return {
    id: safeId,
    organizationName: String(inv.organizationName || 'SCOOTSY LOGISTICS PRIVATE LIMITED'),
    vendorName: String(inv.vendorName || ''),
    vendorCode: String(inv.vendorCode || ''),
    gstin: String(inv.gstin || ''),
    pan: String(inv.pan || ''),
    warehouseName: String(inv.warehouseName || 'General Warehouse'),
    city: String(inv.city || ''),
    state: String(inv.state || 'India'),
    statusOfInvoice: String(inv.statusOfInvoice || 'Posted'),
    poNumber: String(inv.poNumber || ''),
    poDate: String(inv.poDate || ''),
    poAmount: Number(inv.poAmount) || 0,
    grnNumber: String(inv.grnNumber || ''),
    grnDate: String(inv.grnDate || ''),
    grossGrnAmount: Number(inv.grossGrnAmount) || 0,
    invoiceNumber: invoiceNum,
    invoiceAccountingDate: String(inv.invoiceAccountingDate || ''),
    invoicesRecorded: Number(inv.invoicesRecorded) || 0,
    tdsTcs: Number(inv.tdsTcs) || 0,
    purchaseReturnAmount: Number(inv.purchaseReturnAmount) || 0,
    brandDiscountPromoClaims: Number(inv.brandDiscountPromoClaims) || 0,
    otherDebitAmount: Number(inv.otherDebitAmount) || 0,
    otherAdjustments: Number(inv.otherAdjustments) || 0,
    netPayableAmount: Number(inv.netPayableAmount) || 0,
    otherAdjustmentDate: String(inv.otherAdjustmentDate || ''),
    invoiceStatus: String(inv.invoiceStatus || 'Reconciled'),
    paymentAmount: Number(inv.paymentAmount) || 0,
    paymentReferenceNo: String(inv.paymentReferenceNo || ''),
    outstandingPayment: Number(inv.outstandingPayment) || 0,
    dueDate: String(inv.dueDate || ''),
    creditPeriod: Number(inv.creditPeriod) || 30,
    overdueStatus: String(inv.overdueStatus || 'Not Due'),
    paymentStatus: String(inv.paymentStatus || 'Unpaid'),
    lastPaymentDate: String(inv.lastPaymentDate || ''),
    totalDeductions: Number(inv.totalDeductions) || 0,
    daysUntilDue: inv.daysUntilDue !== undefined ? Number(inv.daysUntilDue) : 0,
    agingBucket: (inv.agingBucket as any) || 'Not Due'
  };
}

export function sanitizePayment(pmt: Partial<PaymentRecord>, index = 0): PaymentRecord {
  const pmtNum = String(pmt.paymentNumber || `PMT-${index + 1}`).trim();
  const rawId = pmt.id || `pay_${Date.now()}_${index}_${pmtNum.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const safeId = String(rawId).replace(/\//g, '_');

  return {
    id: safeId,
    organizationName: String(pmt.organizationName || 'SCOOTSY LOGISTICS PRIVATE LIMITED'),
    vendorName: String(pmt.vendorName || ''),
    vendorCode: String(pmt.vendorCode || ''),
    gstin: String(pmt.gstin || ''),
    pan: String(pmt.pan || ''),
    tradeVendorType: String(pmt.tradeVendorType || 'Trade'),
    paymentType: String(pmt.paymentType || 'NEFT'),
    paymentDate: String(pmt.paymentDate || ''),
    paymentNumber: pmtNum,
    paymentReferenceNo: String(pmt.paymentReferenceNo || ''),
    amount: Number(pmt.amount) || 0,
    reversal: Number(pmt.reversal) || 0,
    netAmount: Number(pmt.netAmount) || 0,
    linkedInvoices: Array.isArray(pmt.linkedInvoices) ? pmt.linkedInvoices.filter(Boolean).map(String) : [],
    matchedInvoiceCount: Number(pmt.matchedInvoiceCount) || 0
  };
}

/**
 * Save all invoices to Firestore Cloud Database
 * Syncs both the collection documents (/invoices/{id}) and the active_ledger workspace doc
 */
export async function saveInvoicesToCloud(
  invoices: InvoiceRecord[], 
  vendorName?: string
): Promise<{ success: boolean; count: number }> {
  await ensureAuth();

  const sanitized = invoices.map((inv, idx) => sanitizeInvoice(inv, idx));
  const primaryVendor = vendorName || sanitized[0]?.vendorName || '';

  try {
    // 1. Write to active_ledger metadata doc
    const activeDocRef = doc(db, WORKSPACE_COLLECTION, ACTIVE_WORKSPACE_DOC);
    
    // If under 150 invoices, also store array in active_ledger for instant single-document fetch
    const payload: Record<string, any> = {
      totalInvoices: sanitized.length,
      vendorName: primaryVendor,
      updatedAt: new Date().toISOString(),
      version: Date.now()
    };
    if (sanitized.length <= 150) {
      payload.invoices = sanitized;
    }

    await setDoc(activeDocRef, payload, { merge: true });

    // 2. Batch write all invoices into collection /invoices in chunks of 200
    const BATCH_SIZE = 200;
    for (let i = 0; i < sanitized.length; i += BATCH_SIZE) {
      const chunk = sanitized.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      for (const inv of chunk) {
        const ref = doc(db, INVOICES_COLLECTION, inv.id);
        batch.set(ref, { ...inv, updatedAt: new Date().toISOString() });
      }
      await batch.commit();
    }

    console.log(`[Cloud Sync] Successfully persisted ${sanitized.length} invoices to Firestore.`);
    return { success: true, count: sanitized.length };
  } catch (err) {
    console.error('[Cloud Sync] Failed to save invoices to Firestore:', err);
    throw err;
  }
}

/**
 * Save all payments to Firestore Cloud Database
 */
export async function savePaymentsToCloud(payments: PaymentRecord[]): Promise<{ success: boolean; count: number }> {
  await ensureAuth();

  const sanitized = payments.map((p, idx) => sanitizePayment(p, idx));

  try {
    const activeDocRef = doc(db, WORKSPACE_COLLECTION, ACTIVE_WORKSPACE_DOC);
    const payload: Record<string, any> = {
      totalPayments: sanitized.length,
      updatedAt: new Date().toISOString(),
      version: Date.now()
    };
    if (sanitized.length <= 150) {
      payload.payments = sanitized;
    }
    await setDoc(activeDocRef, payload, { merge: true });

    const BATCH_SIZE = 200;
    for (let i = 0; i < sanitized.length; i += BATCH_SIZE) {
      const chunk = sanitized.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      for (const pmt of chunk) {
        const ref = doc(db, PAYMENTS_COLLECTION, pmt.id);
        batch.set(ref, { ...pmt, updatedAt: new Date().toISOString() });
      }
      await batch.commit();
    }

    console.log(`[Cloud Sync] Successfully persisted ${sanitized.length} payments to Firestore.`);
    return { success: true, count: sanitized.length };
  } catch (err) {
    console.error('[Cloud Sync] Failed to save payments to Firestore:', err);
    throw err;
  }
}

/**
 * Update or insert a single invoice in Firestore (used for Mark As Paid, Manual Add, or Edit)
 */
export async function updateSingleInvoiceInCloud(invoice: InvoiceRecord): Promise<void> {
  await ensureAuth();
  const sanitized = sanitizeInvoice(invoice);
  try {
    const ref = doc(db, INVOICES_COLLECTION, sanitized.id);
    await setDoc(ref, { ...sanitized, updatedAt: new Date().toISOString() }, { merge: true });

    // Touch active_ledger so other devices immediately detect change
    const activeDocRef = doc(db, WORKSPACE_COLLECTION, ACTIVE_WORKSPACE_DOC);
    await setDoc(activeDocRef, {
      updatedAt: new Date().toISOString(),
      version: Date.now()
    }, { merge: true });

    console.log(`[Cloud Sync] Updated invoice ${sanitized.invoiceNumber} in Firestore.`);
  } catch (err) {
    console.warn('[Cloud Sync] Error updating single invoice in cloud:', err);
  }
}

/**
 * Load complete dataset from Cloud Firestore
 * This is called on startup from any device (Desktop, Laptop, Phone, or Vercel URL)
 */
export async function loadDatasetFromCloud(): Promise<{
  invoices: InvoiceRecord[];
  payments: PaymentRecord[];
  vendorName?: string;
  lastUpdated?: string;
} | null> {
  await ensureAuth();
  try {
    // 1. First check if documents exist in the dedicated collections
    const [invSnap, pmtSnap, activeDocSnap] = await Promise.all([
      getDocs(collection(db, INVOICES_COLLECTION)),
      getDocs(collection(db, PAYMENTS_COLLECTION)),
      getDoc(doc(db, WORKSPACE_COLLECTION, ACTIVE_WORKSPACE_DOC))
    ]);

    const invoices: InvoiceRecord[] = [];
    const payments: PaymentRecord[] = [];

    invSnap.forEach(d => {
      invoices.push(sanitizeInvoice(d.data() as any));
    });

    pmtSnap.forEach(d => {
      payments.push(sanitizePayment(d.data() as any));
    });

    let vendorName: string | undefined = undefined;
    let lastUpdated: string | undefined = undefined;

    if (activeDocSnap.exists()) {
      const activeData = activeDocSnap.data();
      vendorName = activeData.vendorName;
      lastUpdated = activeData.updatedAt || activeData.lastUpdated;

      // Fallback: if collection was empty but active_ledger had array
      if (invoices.length === 0 && Array.isArray(activeData.invoices) && activeData.invoices.length > 0) {
        invoices.push(...activeData.invoices.map((inv: any, idx: number) => sanitizeInvoice(inv, idx)));
      }
      if (payments.length === 0 && Array.isArray(activeData.payments) && activeData.payments.length > 0) {
        payments.push(...activeData.payments.map((p: any, idx: number) => sanitizePayment(p, idx)));
      }
    }

    if (invoices.length > 0 || payments.length > 0) {
      console.log(`[Cloud Sync] Loaded ${invoices.length} invoices and ${payments.length} payments from Firestore.`);
      return {
        invoices,
        payments,
        vendorName: vendorName || invoices[0]?.vendorName || '',
        lastUpdated
      };
    }
  } catch (err) {
    console.warn('[Cloud Sync] Could not fetch dataset from Firestore:', err);
  }
  return null;
}

/**
 * Real-time listener for multi-device sync
 * When user uploads, edits, marks as paid, or adds invoices on Device A,
 * Device B's onSnapshot triggers immediately and updates its UI!
 */
export function subscribeToCloudLedger(
  onUpdate: (data: { invoices: InvoiceRecord[]; payments: PaymentRecord[]; vendorName?: string }) => void
): () => void {
  const activeDocRef = doc(db, WORKSPACE_COLLECTION, ACTIVE_WORKSPACE_DOC);

  let lastKnownVersion = 0;

  return onSnapshot(activeDocRef, async (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      const currentVersion = Number(data.version) || 0;

      // Avoid infinite loop if this was our own write
      if (currentVersion !== 0 && currentVersion === lastKnownVersion) {
        return;
      }
      lastKnownVersion = currentVersion;

      // If invoices are embedded in snapshot, use them immediately
      if (Array.isArray(data.invoices) && data.invoices.length > 0) {
        const sanitizedInvoices = data.invoices.map((i: any, idx: number) => sanitizeInvoice(i, idx));
        const sanitizedPayments = Array.isArray(data.payments) 
          ? data.payments.map((p: any, idx: number) => sanitizePayment(p, idx))
          : [];

        onUpdate({
          invoices: sanitizedInvoices,
          payments: sanitizedPayments,
          vendorName: data.vendorName
        });
        return;
      }

      // Otherwise fetch the collection
      try {
        const fullDataset = await loadDatasetFromCloud();
        if (fullDataset && (fullDataset.invoices.length > 0 || fullDataset.payments.length > 0)) {
          onUpdate(fullDataset);
        }
      } catch (err) {
        console.warn('[Cloud Sync] Live reload fetch notice:', err);
      }
    }
  }, (err) => {
    console.warn('[Cloud Sync] Real-time subscription notice:', err);
  });
}

/**
 * Clear all data from Cloud Firestore (both collection documents and workspace doc)
 */
export async function clearCloudData(): Promise<void> {
  await ensureAuth();
  try {
    const activeDocRef = doc(db, WORKSPACE_COLLECTION, ACTIVE_WORKSPACE_DOC);
    await deleteDoc(activeDocRef);

    // Clear invoices
    const invSnap = await getDocs(collection(db, INVOICES_COLLECTION));
    const invDocs = invSnap.docs;
    for (let i = 0; i < invDocs.length; i += 200) {
      const batch = writeBatch(db);
      invDocs.slice(i, i + 200).forEach(d => batch.delete(d.ref));
      await batch.commit();
    }

    // Clear payments
    const pmtSnap = await getDocs(collection(db, PAYMENTS_COLLECTION));
    const pmtDocs = pmtSnap.docs;
    for (let i = 0; i < pmtDocs.length; i += 200) {
      const batch = writeBatch(db);
      pmtDocs.slice(i, i + 200).forEach(d => batch.delete(d.ref));
      await batch.commit();
    }

    console.log('[Cloud Sync] Cloud Firestore collections completely purged.');
  } catch (err) {
    console.warn('[Cloud Sync] Clear cloud data warning:', err);
  }
}
