export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

/**
 * Short reference shown on every register entry, derived from the record id
 * (the last four characters, upper-cased). Display only: it is never used to
 * look an item up, and the full id still travels with every request.
 */
export function referenceNumber(id: string): string {
  return `No. ${id.slice(-4).toUpperCase()}`;
}
