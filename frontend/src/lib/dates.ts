import { format, isValid } from "date-fns";

export function parseDate(value: string): Date {
  const date = /^\d+$/.test(value) ? new Date(Number(value)) : new Date(value);

  if (!isValid(date)) {
    throw new Error("Invalid date received from the server.");
  }

  return date;
}

export function localInput(value: Date) {
  return format(value, "yyyy-MM-dd'T'HH:mm");
}

export function bookingSearchDate(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00` : value);

  return isValid(date) && date.getFullYear() >= 1 && date.getFullYear() <= 9999
    ? localInput(date)
    : undefined;
}
