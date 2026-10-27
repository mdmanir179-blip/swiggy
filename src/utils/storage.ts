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
export async function saveInvoicesToStorage(invoices: InvoiceRecord[], vendorName?: string): Promise<void> {
  // 1. Try IndexedDB
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
    console.warn('IndexedDB save invoices failed, using localStorage fallback', err);
  }

  // 2. LocalStorage sync
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
  try {
    if (invoices.length > 0) {
      await saveInvoicesToCloud(invoices, vendorName);
    }
  } catch (err) {
    console.warn('Firebase cloud sync notice (will retry on reconnect):', err);
  }
}

/**
 * Load invoices from IndexedDB, localStorage, or Firebase Cloud Database
 */
export async function loadInvoicesFromStorage(): Promise<InvoiceRecord[]> {
  // 1. Try IndexedDB
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_INVOICES, 'readonly');
    const store = tx.objectStore(STORE_INVOICES);
    const request = store.getAll();

    const result = await new Promise<InvoiceRecord[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    if (Array.isArray(result) && result.length > 0) {
      return result;
    }
  } catch (err) {
    console.warn('IndexedDB load invoices notice, checking cloud and localStorage', err);
  }

  // 2. Check localStorage
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_INVOICES) || localStorage.getItem('instamart_invoices');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('localStorage invoice read notice:', err);
  }

  // 3. If opening on a new device or fresh browser (e.g. Vercel deployment), fetch from Cloud Firestore!
  try {
    const cloudDataset = await loadDatasetFromCloud();
    if (cloudDataset && cloudDataset.invoices && cloudDataset.invoices.length > 0) {
      // Cache locally for offline availability
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_INVOICES, JSON.stringify(cloudDataset.invoices));
      } catch {}
      return cloudDataset.invoices;
    }
  } catch (err) {
    console.warn('Cloud dataset fetch notice:', err);
  }

  return [];
}

/**
 * Save payments to IndexedDB, LocalStorage, and Firebase Cloud Database
 */
export async function savePaymentsToStorage(payments: PaymentRecord[]): Promise<void> {
  // 1. IndexedDB
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
    console.warn('IndexedDB save payments failed, using localStorage fallback', err);
  }

  // 2. LocalStorage sync
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
  try {
    if (payments.length > 0) {
      await savePaymentsToCloud(payments);
    }
  } catch (err) {
    console.warn('Firebase cloud sync notice for payments:', err);
  }
}

/**
 * Load payments from IndexedDB, LocalStorage, or Firebase Cloud Database
 */
export async function loadPaymentsFromStorage(): Promise<PaymentRecord[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_PAYMENTS, 'readonly');
    const store = tx.objectStore(STORE_PAYMENTS);
    const request = store.getAll();

    const result = await new Promise<PaymentRecord[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    if (Array.isArray(result) && result.length > 0) {
      return result;
    }
  } catch (err) {
    console.warn('IndexedDB load payments notice:', err);
  }

  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_PAYMENTS) || localStorage.getItem('instamart_payments');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('localStorage payments read error:', err);
  }

  // Fallback to Cloud Firestore
  try {
    const cloudDataset = await loadDatasetFromCloud();
    if (cloudDataset && cloudDataset.payments && cloudDataset.payments.length > 0) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_PAYMENTS, JSON.stringify(cloudDataset.payments));
      } catch {}
      return cloudDataset.payments;
    }
  } catch (err) {
    console.warn('Cloud dataset fetch notice for payments:', err);
  }

  return [];
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
