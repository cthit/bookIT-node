import { format, isValid } from "date-fns";
export function parseDate(value: string): Date {
  const date = /^\d+$/.test(value) ? new Date(Number(value)) : new Date(value);
  if (!isValid(date)) throw new Error("Invalid date received from the server.");
  return date;
}
export function localInput(value: Date) {
  return format(value, "yyyy-MM-dd'T'HH:mm");
}
