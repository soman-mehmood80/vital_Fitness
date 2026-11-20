/**
 * Shared date utilities for consistent timezone handling.
 * 
 * RULE: Frontend should ALWAYS send local date as "YYYY-MM-DD".
 * Backend normalizes to UTC midnight for DB storage.
 */

/**
 * Normalize any date to UTC midnight.
 * @param {Date|string} d - Input date (Date, ISO string, or YYYY-MM-DD)
 * @returns {Date} UTC midnight
 */
const normalizeDateUTC = (d) => {
    if (!d) throw new Error("Date is required");
    const date = new Date(d);
    if (isNaN(date.getTime())) throw new Error("Invalid date");
    date.setUTCHours(0, 0, 0, 0);
    return date;
};

/**
 * Get today's date in UTC midnight.
 * If localDateStr provided (YYYY-MM-DD from frontend), use that.
 * Otherwise use server's current date.
 * @param {string} [localDateStr] - Optional "YYYY-MM-DD" from frontend
 * @returns {Date} UTC midnight
 */
const getTodayUTC = (localDateStr) => {
    if (localDateStr) return normalizeDateUTC(localDateStr);
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d;
};

/**
 * Get date N days ago in UTC midnight.
 * @param {number} days - Number of days back
 * @returns {Date} UTC midnight
 */
const getDaysAgoUTC = (days) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - days);
    d.setUTCHours(0, 0, 0, 0);
    return d;
};

module.exports = {
    normalizeDateUTC,
    getTodayUTC,
    getDaysAgoUTC
};