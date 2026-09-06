import { randomBytes } from "node:crypto";

export function generateOrderToken(): string {
  return randomBytes(16).toString("hex");
}

/** Format order_no (bigserial) into a professional display ID like SNR-10001 */
export function formatOrderNo(orderNo: number): string {
  return `SNR-${(10000 + orderNo).toString()}`;
}

/** Parse a user-entered order ID back to the raw order_no. Handles: SNR-10005, #SNR-10005, 10005, #5, 5 */
export function parseOrderInput(input: string): number | null {
  const cleaned = input.trim().replace(/^#/, "");
  const snrMatch = cleaned.match(/^SNR-(\d+)$/i);
  if (snrMatch) {
    const num = parseInt(snrMatch[1], 10) - 10000;
    return num > 0 ? num : null;
  }
  const num = parseInt(cleaned, 10);
  return isNaN(num) || num <= 0 ? null : num;
}
