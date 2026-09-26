/**
 * Indian mobile / WhatsApp number validation + normalization.
 * Accepts: 9876543210, +91 98765 43210, 09876543210, with spaces/dashes.
 */
export function normalizePhone(raw: string): string | null {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (/^[6-9]\d{9}$/.test(d)) return d;
  return null;
}