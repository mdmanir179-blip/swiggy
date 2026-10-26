import { InvoiceRecord, PaymentRecord } from '../types';

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
 * Save invoices to IndexedDB with localStorage fallback
 */
export async function saveInvoicesToStorage(invoices: InvoiceRecord[]): Promise<void> {
  // 1. Try IndexedDB
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_INVOICES, 'readwrite');
    const store = tx.objectStore(STORE_INVOICES);
    
    // Clear old items and write all
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

  // 2. Also keep localStorage in sync (with quota safety)
  try {
    if (invoices.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY_INVOICES, JSON.stringify(invoices));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY_INVOICES);
    }
  } catch (err) {
    console.warn('localStorage invoice sync warning (likely quota exceeded):', err);
  }
}

/**
 * Load invoices from IndexedDB or localStorage
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
    console.warn('IndexedDB load invoices failed, attempting localStorage', err);
  }

  // 2. Fallback to localStorage
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_INVOICES) || localStorage.getItem('instamart_invoices');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('localStorage invoice read error:', err);
  }

  return [];
}

/**
 * Save payments to IndexedDB with localStorage fallback
 */
export async function savePaymentsToStorage(payments: PaymentRecord[]): Promise<void> {
  // 1. Try IndexedDB
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
}

/**
 * Load payments from IndexedDB or localStorage
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
    console.warn('IndexedDB load payments failed, attempting localStorage', err);
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

  return [];
}

/**
 * Clear all stored data from IndexedDB and localStorage
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
}
