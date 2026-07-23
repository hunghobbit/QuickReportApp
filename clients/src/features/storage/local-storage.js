// clients/src/features/storage/local-storage.js
//
// Temporary draft storage using localStorage.
//
// Reports are saved as drafts (pending) in localStorage so they persist
// across browser sessions until the user explicitly saves them as completed
// (which will eventually go to SQLite via the API).
//
// localStorage is chosen over IndexedDB because:
//   1. Each report is a small object (~1-2 KB) — localStorage (5-10 MB) is ample.
//   2. Synchronous API gives immediate save feedback without async complexity.
//   3. The project is moving toward SQLite (P2) for permanent persistence.
//   4. PROJECT_CONTEXT.md states PWA/offline draft is deferred until
//      persistence and sync are clear.

const STORAGE_KEY = "quick-report:drafts";

/**
 * Read the raw drafts array from localStorage.
 * @returns {Array} Array of draft report objects (empty if none).
 */
function readDrafts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Write the drafts array to localStorage.
 * @param {Array} drafts - Array of draft report objects.
 */
function writeDrafts(drafts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  } catch (err) {
    console.error("[storage/local-storage] Failed to write drafts:", err);
  }
}

/**
 * Save a draft report (create or update by id).
 * @param {object} report - The draft report object. Must have an `id`.
 * @returns {object} The saved report.
 */
export function saveDraftReport(report) {
  if (!report || !report.id) {
    throw new Error("saveDraftReport: report must have an id");
  }

  const drafts = readDrafts();
  const index = drafts.findIndex((r) => r.id === report.id);

  if (index >= 0) {
    drafts[index] = { ...report, updatedAt: new Date().toISOString() };
  } else {
    drafts.push({ ...report, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  writeDrafts(drafts);
  return report;
}

/**
 * Get all draft reports.
 * @returns {Array} Array of draft report objects.
 */
export function getDraftReports() {
  return readDrafts();
}

/**
 * Get a single draft report by id.
 * @param {string} id - The report id.
 * @returns {object|undefined} The draft report, or undefined if not found.
 */
export function getDraftReport(id) {
  return readDrafts().find((r) => r.id === id);
}

/**
 * Update an existing draft report.
 * @param {string} id - The report id.
 * @param {object} updates - Partial updates to apply.
 * @returns {object|null} The updated report, or null if not found.
 */
export function updateDraftReport(id, updates) {
  const drafts = readDrafts();
  const index = drafts.findIndex((r) => r.id === id);

  if (index < 0) return null;

  drafts[index] = {
    ...drafts[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  writeDrafts(drafts);
  return drafts[index];
}

/**
 * Delete a draft report by id.
 * @param {string} id - The report id.
 * @returns {boolean} True if a report was deleted, false if not found.
 */
export function deleteDraftReport(id) {
  const drafts = readDrafts();
  const index = drafts.findIndex((r) => r.id === id);

  if (index < 0) return false;

  drafts.splice(index, 1);
  writeDrafts(drafts);
  return true;
}

/**
 * Clear all draft reports.
 */
export function clearDraftReports() {
  writeDrafts([]);
}
