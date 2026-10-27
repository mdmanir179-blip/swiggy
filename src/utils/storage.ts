import { InvoiceRecord, PaymentRecord } from '../types';
import { 
  saveInvoicesToCloud, 
  savePaymentsToCloud, 
  loadDatasetFromCloud, 
  clearCloudData 
} from './firebase';

const DB_NAME = 'InstamartTrackerDB';
const DB_VERSION = 1;
const STORE_INVOICES = 'invoices';
const STORE_PAYMENTS = 'payments';
const STORE_META = 'metadata';

const LOCAL_STORAGE_KEY_INVOICES = 'instamart_invoices_data';
const LOCAL_STORAGE_KEY_PAYMENTS = 'instamart_payments_data';
const LOCAL_STORAGE_KEY_SHEET_META = 'instamart_uploaded_sheets';

export interface SheetMetadata {
  id: string;
  fileName: string;
  uploadedAt: string;
  rowCount: number;
  type: 'invoice' | 'payment' | 'manual';
}

/**
 * Open or create IndexedDB instance
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_INVOICES)) {
        db.createObjectStore(STORE_INVOICES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_PAYMENTS)) {
        db.createObjectStore(STORE_PAYMENTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save invoices to IndexedDB, LocalStorage, and Firebase Cloud Database for multi-device sync
 */
export async function saveInvoicesToStorage(
  invoices: InvoiceRecord[], 
  vendorName?: string, 
  skipCloud = false
): Promise<void> {
  // 1. IndexedDB cache
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_INVOICES, 'readwrite');
    const store = tx.objectStore(STORE_INVOICES);
    
    store.clear();
    for (const inv of invoices) {
      store.put(inv);
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB save invoices notice:', err);
  }

  // 2. LocalStorage cache
  try {
    if (invoices.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY_INVOICES, JSON.stringify(invoices));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY_INVOICES);
    }
  } catch (err) {
    console.warn('localStorage invoice sync warning:', err);
  }

  // 3. Multi-device Cloud Firestore sync
  if (!skipCloud && invoices.length > 0) {
    try {
      await saveInvoicesToCloud(invoices, vendorName);
    } catch (err) {
      console.warn('Firebase cloud sync notice (will retry on reconnect):', err);
    }
  }
}

/**
 * Save payments to IndexedDB, LocalStorage, and Firebase Cloud Database
 */
export async function savePaymentsToStorage(
  payments: PaymentRecord[], 
  skipCloud = false
): Promise<void> {
  // 1. IndexedDB cache
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_PAYMENTS, 'readwrite');
    const store = tx.objectStore(STORE_PAYMENTS);
    store.clear();
    for (const p of payments) {
      store.put(p);
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB save payments notice:', err);
  }

  // 2. LocalStorage cache
  try {
    if (payments.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY_PAYMENTS, JSON.stringify(payments));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY_PAYMENTS);
    }
  } catch (err) {
    console.warn('localStorage payments sync error:', err);
  }

  // 3. Cloud Firestore sync
  if (!skipCloud && payments.length > 0) {
    try {
      await savePaymentsToCloud(payments);
    } catch (err) {
      console.warn('Firebase cloud sync notice for payments:', err);
    }
  }
}

/**
 * Load complete dataset (invoices + payments) prioritizing Cloud Firestore for multi-device parity
 */
export async function loadInitialDataset(): Promise<{
  invoices: InvoiceRecord[];
  payments: PaymentRecord[];
  vendorName?: string;
  source: 'cloud' | 'indexedDB' | 'localStorage' | 'none';
}> {
  // 1. Check Cloud Firestore FIRST (if online) to guarantee across-device consistency
  if (typeof navigator === 'undefined' || navigator.onLine !== false) {
    try {
      const cloudData = await loadDatasetFromCloud();
      if (cloudData && (cloudData.invoices.length > 0 || cloudData.payments.length > 0)) {
        // Cache locally for fast offline access next time
        await saveInvoicesToStorage(cloudData.invoices, cloudData.vendorName, true);
        await savePaymentsToStorage(cloudData.payments, true);

        return {
          invoices: cloudData.invoices,
          payments: cloudData.payments,
          vendorName: cloudData.vendorName,
          source: 'cloud'
        };
      }
    } catch (err) {
      console.warn('Cloud dataset startup fetch warning, falling back to offline cache:', err);
    }
  }

  // 2. Offline Fallback: IndexedDB
  try {
    const db = await openDB();
    const invTx = db.transaction(STORE_INVOICES, 'readonly');
    const invStore = invTx.objectStore(STORE_INVOICES);
    const invReq = invStore.getAll();
    const storedInvoices = await new Promise<InvoiceRecord[]>((resolve, reject) => {
      invReq.onsuccess = () => resolve(invReq.result || []);
      invReq.onerror = () => reject(invReq.error);
    });

    const pmtTx = db.transaction(STORE_PAYMENTS, 'readonly');
    const pmtStore = pmtTx.objectStore(STORE_PAYMENTS);
    const pmtReq = pmtStore.getAll();
    const storedPayments = await new Promise<PaymentRecord[]>((resolve, reject) => {
      pmtReq.onsuccess = () => resolve(pmtReq.result || []);
      pmtReq.onerror = () => reject(pmtReq.error);
    });

    if (storedInvoices.length > 0 || storedPayments.length > 0) {
      return {
        invoices: storedInvoices,
        payments: storedPayments,
        source: 'indexedDB'
      };
    }
  } catch (err) {
    console.warn('IndexedDB load notice:', err);
  }

  // 3. Offline Fallback: LocalStorage
  try {
    const savedInv = localStorage.getItem(LOCAL_STORAGE_KEY_INVOICES) || localStorage.getItem('instamart_invoices');
    const savedPmt = localStorage.getItem(LOCAL_STORAGE_KEY_PAYMENTS) || localStorage.getItem('instamart_payments');
    const invParsed = savedInv ? JSON.parse(savedInv) : [];
    const pmtParsed = savedPmt ? JSON.parse(savedPmt) : [];

    if (Array.isArray(invParsed) && invParsed.length > 0) {
      return {
        invoices: invParsed,
        payments: Array.isArray(pmtParsed) ? pmtParsed : [],
        source: 'localStorage'
      };
    }
  } catch (err) {
    console.warn('LocalStorage load notice:', err);
  }

  return {
    invoices: [],
    payments: [],
    source: 'none'
  };
}

/**
 * Load invoices helper (backwards compatibility)
 */
export async function loadInvoicesFromStorage(): Promise<InvoiceRecord[]> {
  const result = await loadInitialDataset();
  return result.invoices;
}

/**
 * Load payments helper (backwards compatibility)
 */
export async function loadPaymentsFromStorage(): Promise<PaymentRecord[]> {
  const result = await loadInitialDataset();
  return result.payments;
}

/**
 * Clear all stored data from IndexedDB, localStorage, and Firebase Cloud Database
 */
export async function clearAllPersistentStorage(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_INVOICES, STORE_PAYMENTS, STORE_META], 'readwrite');
    tx.objectStore(STORE_INVOICES).clear();
    tx.objectStore(STORE_PAYMENTS).clear();
    tx.objectStore(STORE_META).clear();
  } catch (err) {
    console.warn('IndexedDB clear error:', err);
  }

  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY_INVOICES);
    localStorage.removeItem(LOCAL_STORAGE_KEY_PAYMENTS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_SHEET_META);
    localStorage.removeItem('instamart_invoices');
    localStorage.removeItem('instamart_payments');
  } catch {
    // ignore
  }

  try {
    await clearCloudData();
  } catch (err) {
    console.warn('Cloud clear error:', err);
  }
}
