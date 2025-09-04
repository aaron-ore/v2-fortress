import { isValid, parseISO } from "date-fns"; // Import parseISO

/**
 * Safely parses a date string into a Date object.
 * Returns a valid Date object if the string is valid, otherwise returns null.
 * It handles ISO 8601 strings robustly.
 * @param dateString The date string to parse.
 * @returns A Date object or null.
 */
export const parseAndValidateDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString || dateString.trim() === '') { // Also check for empty string
    return null;
  }
  // Try parsing as ISO string first, as most of our dates are ISO or YYYY-MM-DD
  const date = parseISO(dateString);
  if (isValid(date)) {
    return date;
  }
  // Fallback to new Date() for other formats if parseISO fails, then validate
  const fallbackDate = new Date(dateString);
  return isValid(fallbackDate) ? fallbackDate : null;
};