/**
 * Zero-timezone-shift date formatting utility
 * Preserves the exact calendar date (DD-MM-YYYY) as entered in Excel sheets,
 * completely immune to browser, system, or GMT timezone rollback/rollforward.
 */

const MONTH_NAMES_MAP: Record<string, string> = {
  jan: '01', january: '01',
  feb: '02', february: '02',
  mar: '03', march: '03',
  apr: '04', april: '04',
  may: '05',
  jun: '06', june: '06',
  jul: '07', july: '07',
  aug: '08', august: '08',
  sep: '09', sept: '09', september: '09',
  oct: '10', october: '10',
  nov: '11', november: '11',
  dec: '12', december: '12'
};

export function parseAndFormatDate(val: any): string {
  if (val === null || val === undefined || val === '') {
    return '';
  }

  // 1. JavaScript Date instance (created by SheetJS with cellDates: true or native JS)
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    
    // SheetJS constructs Date objects using Date.UTC(yyyy, mm, dd).
    // Using local getDate() in any negative UTC offset (e.g. US, GMT-x) shifts
    // midnight back by 1 day (e.g. 15th becomes 14th).
    // We inspect UTC first, and handle floating-point precision offsets safely.
    const utcH = val.getUTCHours();
    let targetDate = val;

    if (utcH >= 22) {
      // 23:59:xx floating point precision issue in serial calculation -> round into intended day
      targetDate = new Date(val.getTime() + 3 * 3600 * 1000);
    } else if (val.getHours() === 0 && val.getMinutes() === 0 && utcH !== 0) {
      // Date was constructed explicitly as local midnight (e.g. from user input)
      const dd = String(val.getDate()).padStart(2, '0');
      const mm = String(val.getMonth() + 1).padStart(2, '0');
      const yyyy = val.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    }

    const dd = String(targetDate.getUTCDate()).padStart(2, '0');
    const mm = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = targetDate.getUTCFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  // 2. Numeric Excel serial date (e.g. 45483 or 46214)
  const num = typeof val === 'number' ? val : (typeof val === 'string' && /^\d+(\.\d+)?$/.test(val.trim()) ? Number(val.trim()) : NaN);
  if (!isNaN(num) && num > 25000 && num < 80000) {
    // 25569 is the difference in days between 1900-01-01 and 1970-01-01 (including the 1900 leap bug)
    const dayCount = Math.floor(num) - 25569;
    const date = new Date(dayCount * 86400 * 1000);
    if (!isNaN(date.getTime())) {
      const dd = String(date.getUTCDate()).padStart(2, '0');
      const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
      const yyyy = date.getUTCFullYear();
      return `${dd}-${mm}-${yyyy}`;
    }
  }

  // 3. String representation parsing
  let str = String(val).trim();
  if (!str) return '';

  // Clean surrounding quotes
  str = str.replace(/^["']|["']$/g, '').trim();

  // Strip trailing time portion if present (e.g. "15-10-2026 00:00:00" or "2026-10-15T00:00:00.000Z")
  const dateOnlyStr = str.replace(/[T\s].*$/, '').trim();

  // Pattern A: DD-MM-YYYY, DD/MM/YYYY, or DD.MM.YYYY
  const dmyMatch = dateOnlyStr.match(/^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{4})$/);
  if (dmyMatch) {
    const p1 = dmyMatch[1].padStart(2, '0');
    const p2 = dmyMatch[2].padStart(2, '0');
    return `${p1}-${p2}-${dmyMatch[3]}`;
  }

  // Pattern B: DD-MM-YY, DD/MM/YY, or DD.MM.YY (2-digit year)
  const dmy2Match = dateOnlyStr.match(/^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{2})$/);
  if (dmy2Match) {
    const yr = parseInt(dmy2Match[3], 10);
    const fullYr = yr < 70 ? 2000 + yr : 1900 + yr;
    return `${dmy2Match[1].padStart(2, '0')}-${dmy2Match[2].padStart(2, '0')}-${fullYr}`;
  }

  // Pattern C: YYYY-MM-DD, YYYY/MM/DD, or YYYY.MM.DD (ISO format)
  const ymdMatch = dateOnlyStr.match(/^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})$/);
  if (ymdMatch) {
    const dd = ymdMatch[3].padStart(2, '0');
    const mm = ymdMatch[2].padStart(2, '0');
    return `${dd}-${mm}-${ymdMatch[1]}`;
  }

  // Pattern D: Textual month names like "15-Oct-2026", "15 Oct 2026", "15-October-2026", "15-Oct-26"
  const namedMatch1 = str.match(/^(\d{1,2})[-\s/]+([A-Za-z]{3,9})[-\s/]+(\d{2,4})/);
  if (namedMatch1) {
    const day = namedMatch1[1].padStart(2, '0');
    const mon = MONTH_NAMES_MAP[namedMatch1[2].toLowerCase()];
    let yr = namedMatch1[3];
    if (yr.length === 2) {
      const yNum = parseInt(yr, 10);
      yr = String(yNum < 70 ? 2000 + yNum : 1900 + yNum);
    }
    if (mon) {
      return `${day}-${mon}-${yr}`;
    }
  }

  // Pattern E: Textual month first like "Oct 15, 2026" or "October 15, 2026"
  const namedMatch2 = str.match(/^([A-Za-z]{3,9})[-\s/]+(\d{1,2})[,-\s/]+(\d{2,4})/);
  if (namedMatch2) {
    const mon = MONTH_NAMES_MAP[namedMatch2[1].toLowerCase()];
    const day = namedMatch2[2].padStart(2, '0');
    let yr = namedMatch2[3];
    if (yr.length === 2) {
      const yNum = parseInt(yr, 10);
      yr = String(yNum < 70 ? 2000 + yNum : 1900 + yNum);
    }
    if (mon) {
      return `${day}-${mon}-${yr}`;
    }
  }

  // Pattern F: Compact 8-digit format "15102026" or "20261015"
  if (/^\d{8}$/.test(str)) {
    if (str.startsWith('20') || str.startsWith('19')) {
      // YYYYMMDD
      const yyyy = str.substring(0, 4);
      const mm = str.substring(4, 6);
      const dd = str.substring(6, 8);
      return `${dd}-${mm}-${yyyy}`;
    } else {
      // DDMMYYYY
      const dd = str.substring(0, 2);
      const mm = str.substring(2, 4);
      const yyyy = str.substring(4, 8);
      const mNum = parseInt(mm, 10);
      const dNum = parseInt(dd, 10);
      if (mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31) {
        return `${dd}-${mm}-${yyyy}`;
      }
    }
  }

  // Pattern G: General ISO / Date string fallback using UTC components
  const parsedTimestamp = Date.parse(str);
  if (!isNaN(parsedTimestamp)) {
    const d = new Date(parsedTimestamp);
    // Use UTC to prevent local client timezone day shift
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = d.getUTCFullYear();
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
