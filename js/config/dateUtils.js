// Layer 1 — Config
// Timezone-safe date utilities.
// All functions use the LOCAL timezone (America/Sao_Paulo, UTC-3).
//
// Problem solved: new Date().toISOString().split('T')[0] uses UTC,
// which returns the NEXT day after 21:00 local time in Brazil.

/**
 * Returns today's date as 'YYYY-MM-DD' in the local timezone.
 */
export function todayLocal() {
  return formatDateLocal(new Date());
}

/**
 * Formats a Date object as 'YYYY-MM-DD' in the local timezone.
 * @param {Date} date
 * @returns {string} 'YYYY-MM-DD'
 */
export function formatDateLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Offset a 'YYYY-MM-DD' date string by N days, returning 'YYYY-MM-DD'.
 * Uses local timezone to avoid UTC day-boundary bugs.
 * @param {string} dateStr 'YYYY-MM-DD'
 * @param {number} days positive or negative
 * @returns {string} 'YYYY-MM-DD'
 */
export function offsetDate(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return formatDateLocal(d);
}
