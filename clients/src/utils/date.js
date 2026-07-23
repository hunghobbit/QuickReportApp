/**
 * Format a Date object or ISO string to YYYY-MM-DD.
 * @param {Date|string} [date] - Defaults to today.
 * @returns {string} Formatted date string.
 */
export function formatDate(date) {
  const d = date ? new Date(date) : new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Get today's date as YYYY-MM-DD string.
 * @returns {string}
 */
export function today() {
  return formatDate();
}

/**
 * Format a YYYY-MM-DD string for display (DD/MM/YYYY).
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {string}
 */
export function displayDate(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}