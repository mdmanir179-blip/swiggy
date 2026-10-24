import { InvoiceRecord, PaymentRecord } from '../types';

export interface SharedDatasetPayload {
  version: number;
  createdAt: string;
  vendorName: string;
  note?: string;
  invoices: InvoiceRecord[];
  payments: PaymentRecord[];
}

/**
 * Robust string to Base64URL encoding
 */
function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Base64URL to Uint8Array decoding
 */
function base64UrlToUint8Array(base64Url: string): Uint8Array {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Compress dataset using native browser CompressionStream (GZIP)
 * with graceful fallback
 */
export async function compressDataset(payload: SharedDatasetPayload): Promise<string> {
  const jsonStr = JSON.stringify(payload);

  if (typeof CompressionStream !== 'undefined') {
    try {
      const stream = new Blob([jsonStr]).stream();
      const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
      const response = new Response(compressedStream);
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();
      return 'gz:' + uint8ArrayToBase64Url(new Uint8Array(buffer));
    } catch (err) {
      console.warn('CompressionStream failed, using raw base64 fallback', err);
    }
  }

  // Fallback: UTF-8 safe base64
  const bytes = new TextEncoder().encode(jsonStr);
  return 'raw:' + uint8ArrayToBase64Url(bytes);
}

/**
 * Decompress dataset using native DecompressionStream (GZIP)
 */
export async function decompressDataset(encoded: string): Promise<SharedDatasetPayload | null> {
  try {
    if (encoded.startsWith('gz:')) {
      const rawBase64 = encoded.slice(3);
      const bytes = base64UrlToUint8Array(rawBase64);
      if (typeof DecompressionStream !== 'undefined') {
        const stream = new Blob([bytes as any]).stream();
        const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
        const response = new Response(decompressedStream);
        const jsonStr = await response.text();
        return JSON.parse(jsonStr);
      }
    } else if (encoded.startsWith('raw:')) {
      const rawBase64 = encoded.slice(4);
      const bytes = base64UrlToUint8Array(rawBase64);
      const jsonStr = new TextDecoder().decode(bytes);
      return JSON.parse(jsonStr);
    } else {
      // Legacy or raw JSON attempt
      const bytes = base64UrlToUint8Array(encoded);
      const jsonStr = new TextDecoder().decode(bytes);
      return JSON.parse(jsonStr);
    }
  } catch (err) {
    console.error('Failed to decompress dataset:', err);
    return null;
  }
  return null;
}

/**
 * Create shareable link: saves via server API and/or encodes to hash
 */
export async function createShareableLink(
  invoices: InvoiceRecord[],
  payments: PaymentRecord[],
  note?: string
): Promise<{ url: string; shareId?: string; isCloudSaved: boolean }> {
  const vendorName = invoices[0]?.vendorName || payments[0]?.vendorName || 'Instamart Vendor';
  const payload: SharedDatasetPayload = {
    version: 1,
    createdAt: new Date().toISOString(),
    vendorName,
    note: note || '',
    invoices,
    payments,
  };

  let shareId: string | undefined;
  let isCloudSaved = false;

  // 1. Try server storage
  try {
    const res = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.shareId) {
        shareId = data.shareId;
        isCloudSaved = true;
      }
    }
  } catch {
    // server API unavailable, fall back to pure URL hash
  }

  // 2. Also generate compressed hash for instant client-side decoding
  const compressed = await compressDataset(payload);

  const origin = window.location.origin;
  const pathname = window.location.pathname;

  let url = `${origin}${pathname}`;
  if (shareId) {
    url += `?share=${encodeURIComponent(shareId)}`;
  }
  // Append hash data if payload size allows reasonable URL length
  if (compressed.length < 32000) {
    url += `#data=${compressed}`;
  }

  return {
    url,
    shareId,
    isCloudSaved,
  };
}

/**
 * Load shared dataset from URL (checks hash #data=... and ?share=...)
 */
export async function loadSharedDatasetFromUrl(): Promise<SharedDatasetPayload | null> {
  if (typeof window === 'undefined') return null;

  // 1. Check URL Hash #data=...
  const hash = window.location.hash;
  if (hash && hash.includes('data=')) {
    const match = hash.match(/data=([^&]+)/);
    if (match && match[1]) {
      const decoded = await decompressDataset(match[1]);
      if (decoded && (Array.isArray(decoded.invoices) || Array.isArray(decoded.payments))) {
        return decoded;
      }
    }
  }

  // 2. Check URL search param ?share=...
  const searchParams = new URLSearchParams(window.location.search);
  const shareId = searchParams.get('share') || searchParams.get('shareId');
  if (shareId) {
    try {
      const res = await fetch(`/api/share/${encodeURIComponent(shareId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && (Array.isArray(data.invoices) || Array.isArray(data.payments))) {
          return {
            version: 1,
            createdAt: data.createdAt || new Date().toISOString(),
            vendorName: data.vendorName || 'Shared Vendor',
            note: data.note || '',
            invoices: data.invoices || [],
            payments: data.payments || [],
          };
        }
      }
    } catch (err) {
      console.warn('Could not fetch share from server API:', err);
    }
  }

  return null;
}
