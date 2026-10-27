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

// Automatically sign in anonymously to satisfy request.auth in Firestore rules
let isAuthInit = false;
export async function ensureAuth() {
  if (isAuthInit) return;
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
    isAuthInit = true;
  } catch (err) {
    console.warn('Anonymous sign-in warning:', err);
  }
}
ensureAuth();

// Initialize Firestore with the provisioned custom database ID
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Validate connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'workspace', 'ping'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is running in offline client mode.');
    }
  }
}
testConnection();

const INVOICES_COLLECTION = 'invoices';
const PAYMENTS_COLLECTION = 'payments';
const WORKSPACE_COLLECTION = 'workspace';
const ACTIVE_WORKSPACE_DOC = 'active_ledger';

/**
 * Save all invoices to Firestore (both batch collection and fast snapshot for cross-device sync)
 */
export async function saveInvoicesToCloud(invoices: InvoiceRecord[], vendorName?: string): Promise<void> {
  await ensureAuth();
  try {
    // 1. Fast snapshot update in active_ledger document (instant cross-device sync)
    const activeDocRef = doc(db, WORKSPACE_COLLECTION, ACTIVE_WORKSPACE_DOC);
    await setDoc(activeDocRef, {
      invoices,
      vendorName: vendorName || invoices[0]?.vendorName || '',
      totalInvoices: invoices.length,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // 2. Also write individual records in batches of 400 for granular querying
    const BATCH_SIZE = 400;
    for (let i = 0; i < invoices.length; i += BATCH_SIZE) {
      const chunk = invoices.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      for (const inv of chunk) {
        const ref = doc(db, INVOICES_COLLECTION, inv.id);
        batch.set(ref, { ...inv, updatedAt: new Date().toISOString() });
      }
      await batch.commit();
    }
  } catch (err) {
    console.error('Failed to sync invoices to Firestore:', err);
    throw err;
  }
}

/**
 * Save all payments to Firestore
 */
export async function savePaymentsToCloud(payments: PaymentRecord[]): Promise<void> {
  await ensureAuth();
  try {
    const activeDocRef = doc(db, WORKSPACE_COLLECTION, ACTIVE_WORKSPACE_DOC);
    await setDoc(activeDocRef, {
      payments,
      totalPayments: payments.length,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    const BATCH_SIZE = 400;
    for (let i = 0; i < payments.length; i += BATCH_SIZE) {
      const chunk = payments.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      for (const pmt of chunk) {
        const ref = doc(db, PAYMENTS_COLLECTION, pmt.id);
        batch.set(ref, { ...pmt, updatedAt: new Date().toISOString() });
      }
      await batch.commit();
    }
  } catch (err) {
    console.error('Failed to sync payments to Firestore:', err);
    throw err;
  }
}

/**
 * Update a single invoice in cloud (e.g. Mark as Paid or Edit)
 */
export async function updateSingleInvoiceInCloud(invoice: InvoiceRecord): Promise<void> {
  await ensureAuth();
  try {
    const ref = doc(db, INVOICES_COLLECTION, invoice.id);
    await setDoc(ref, { ...invoice, updatedAt: new Date().toISOString() }, { merge: true });

    // Also update snapshot document if present
    const activeDocRef = doc(db, WORKSPACE_COLLECTION, ACTIVE_WORKSPACE_DOC);
    const snap = await getDoc(activeDocRef);
    if (snap.exists()) {
      const data = snap.data();
      const currentInvoices: InvoiceRecord[] = data.invoices || [];
      const updated = currentInvoices.map(i => i.id === invoice.id ? invoice : i);
      await setDoc(activeDocRef, { invoices: updated, updatedAt: new Date().toISOString() }, { merge: true });
    }
  } catch (err) {
    console.warn('Failed to update single invoice in cloud:', err);
  }
}

/**
 * Load initial dataset from cloud (used when opening on any new device or Vercel)
 */
export async function loadDatasetFromCloud(): Promise<{ invoices: InvoiceRecord[]; payments: PaymentRecord[]; vendorName?: string } | null> {
  await ensureAuth();
  try {
    const activeDocRef = doc(db, WORKSPACE_COLLECTION, ACTIVE_WORKSPACE_DOC);
    const snap = await getDoc(activeDocRef);
    
    if (snap.exists()) {
      const data = snap.data();
      const invoices: InvoiceRecord[] = data.invoices || [];
      const payments: PaymentRecord[] = data.payments || [];
      if (invoices.length > 0 || payments.length > 0) {
        return {
          invoices,
          payments,
          vendorName: data.vendorName
        };
      }
    }

    // Fallback: check individual collections
    const invSnap = await getDocs(collection(db, INVOICES_COLLECTION));
    const pmtSnap = await getDocs(collection(db, PAYMENTS_COLLECTION));
    const invoices: InvoiceRecord[] = [];
    const payments: PaymentRecord[] = [];

    invSnap.forEach(d => invoices.push(d.data() as InvoiceRecord));
    pmtSnap.forEach(d => payments.push(d.data() as PaymentRecord));

    if (invoices.length > 0 || payments.length > 0) {
      return { invoices, payments };
    }
  } catch (err) {
    console.warn('Error loading dataset from Firestore cloud:', err);
  }
  return null;
}

/**
 * Real-time subscription to cloud dataset across all devices
 */
export function subscribeToCloudLedger(
  onUpdate: (data: { invoices: InvoiceRecord[]; payments: PaymentRecord[]; vendorName?: string }) => void
): () => void {
  const activeDocRef = doc(db, WORKSPACE_COLLECTION, ACTIVE_WORKSPACE_DOC);
  return onSnapshot(activeDocRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.invoices) || Array.isArray(data.payments)) {
        onUpdate({
          invoices: data.invoices || [],
          payments: data.payments || [],
          vendorName: data.vendorName
        });
      }
    }
  }, (err) => {
    console.warn('Firestore live subscription listener notice:', err);
  });
}

/**
 * Clear all cloud data (when user confirms Clear Data)
 */
export async function clearCloudData(): Promise<void> {
  await ensureAuth();
  try {
    const activeDocRef = doc(db, WORKSPACE_COLLECTION, ACTIVE_WORKSPACE_DOC);
    await deleteDoc(activeDocRef);

    // Delete invoices collection
    const invSnap = await getDocs(collection(db, INVOICES_COLLECTION));
    const batch1 = writeBatch(db);
    invSnap.forEach(d => batch1.delete(d.ref));
    await batch1.commit();

    // Delete payments collection
    const pmtSnap = await getDocs(collection(db, PAYMENTS_COLLECTION));
    const batch2 = writeBatch(db);
    pmtSnap.forEach(d => batch2.delete(d.ref));
    await batch2.commit();
  } catch (err) {
    console.warn('Clear cloud data warning:', err);
  }
}
