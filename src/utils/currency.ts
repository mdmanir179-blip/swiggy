/**
 * Formats a number according to the Indian Rupee system (INR - ₹)
 * e.g., 102089.85 => "₹1,02,089.85"
 * 1500000 => "₹15,00,000.00"
 */

export function formatINR(val: number | null | undefined, compact: boolean = false): string {
  if (val === null || val === undefined || isNaN(val)) {
    return '₹0.00';
  }

  const isNegative = val < 0;
  const absVal = Math.abs(val);

  if (compact) {
    if (absVal >= 10000000) {
      const cr = (absVal / 10000000).toFixed(2);
      return `${isNegative ? '-' : ''}₹${cr} Cr`;
    }
    if (absVal >= 100000) {
      const lakh = (absVal / 100000).toFixed(2);
      return `${isNegative ? '-' : ''}₹${lakh} L`;
    }
    if (absVal >= 1000) {
      const k = (absVal / 1000).toFixed(1);
      return `${isNegative ? '-' : ''}₹${k} K`;
    }
  }

  // Exact 2 decimal places representation
  const [intPart, decPart] = absVal.toFixed(2).split('.');

  // Indian comma formatting algorithm
  let lastThree = intPart.substring(intPart.length - 3);
  const otherNumbers = intPart.substring(0, intPart.length - 3);
  let formatted = lastThree;

  if (otherNumbers !== '') {
    const formattedOthers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    formatted = formattedOthers + ',' + lastThree;
  }

  return `${isNegative ? '-' : ''}₹${formatted}.${decPart}`;
}

export function parseINR(val: string | number | null | undefined): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const cleaned = String(val).replace(/₹|,|\s/g, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatIndianNumber(val: number): string {
  if (isNaN(val)) return '0';
  const parts = Math.round(val).toString();
  let lastThree = parts.substring(parts.length - 3);
  const otherNumbers = parts.substring(0, parts.length - 3);
  if (otherNumbers !== '') {
    return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  }
  return parts;
}
