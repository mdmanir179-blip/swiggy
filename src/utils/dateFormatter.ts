/**
 * Robust date formatting utility for Excel serial dates, JS Date objects, and various string formats
 */

export function parseAndFormatDate(val: any): string {
  if (val === null || val === undefined || val === '') {
    return '';
  }

  // 1. JavaScript Date instance
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    const dd = String(val.getDate()).padStart(2, '0');
    const mm = String(val.getMonth() + 1).padStart(2, '0');
    const yyyy = val.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  // 2. Numeric Excel serial date (e.g. 45483 or 46214)
  const num = typeof val === 'number' ? val : Number(String(val).trim());
  if (!isNaN(num) && num > 25000 && num < 80000) {
    // Excel epoch begins Jan 1 1900, with a leap year bug offset (25569 days to 1970)
    const date = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      const dd = String(date.getUTCDate()).padStart(2, '0');
      const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
      const yyyy = date.getUTCFullYear();
      return `${dd}-${mm}-${yyyy}`;
    }
  }

  const str = String(val).trim();
  if (!str) return '';

  // 3. Already DD-MM-YYYY or DD/MM/YYYY
  if (/^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/.test(str)) {
    const parts = str.split(/[-\/]/);
    return `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`;
  }

  // 4. ISO format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const parts = str.slice(0, 10).split('-');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  // 5. YYYY/MM/DD
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(str)) {
    const parts = str.split('/');
    return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
  }

  // 6. Compact 8-digit format DDMMYYYY (e.g. "10072026")
  if (/^\d{8}$/.test(str)) {
    const dd = str.substring(0, 2);
    const mm = str.substring(2, 4);
    const yyyy = str.substring(4, 8);
    const mNum = parseInt(mm, 10);
    const dNum = parseInt(dd, 10);
    if (mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31) {
      return `${dd}-${mm}-${yyyy}`;
    }
  }

  // 7. General date parse fallback (e.g., "11 Jul 2026", "July 11, 2026")
  const parsedTimestamp = Date.parse(str);
  if (!isNaN(parsedTimestamp)) {
    const d = new Date(parsedTimestamp);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  return str;
}

/**
 * Extracts date from GRN number like "VIA000094455##10072026"
 */
export function extractDateFromGrnNo(grnNumber: string): string {
  if (!grnNumber) return '';
  const match = grnNumber.match(/##(\d{2})(\d{2})(\d{4})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return '';
}
