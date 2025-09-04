import { isValid } from "date-fns";

/**
 * Safely parses a date string into a Date object.
 * Returns a valid Date object if the string is valid, otherwise returns null.
 * @param dateString The date string to parse.
 * @returns A Date object or null.
 */
export const parseAndValidateDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) {
    return null;
  }
  const date = new Date(dateString);
  return isValid(date) ? date : null;
};