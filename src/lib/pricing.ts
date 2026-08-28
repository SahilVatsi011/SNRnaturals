import { DEFAULTS } from "./constants";

/**
 * Price calculator — the admin sets the FINAL price the customer pays (P).
 * Razorpay's ~2.36% fee and the per-order SMS cost are subtracted from P to
 * yield the net revenue the business actually receives. This makes sure fees
 * aren't silently eating into margins.
 *
 *   netReceived = P - (P * razorpayFeeRate) - smsCostPerOrder
 */

export interface FeeConfig {
  razorpayFeeRate: number;
  smsCostPerOrder: number;
}

export function getFeeConfig(overrides?: Partial<FeeConfig>): FeeConfig {
  return {
    razorpayFeeRate: overrides?.razorpayFeeRate ?? DEFAULTS.razorpayFeeRate,
    smsCostPerOrder: overrides?.smsCostPerOrder ?? DEFAULTS.smsCostPerOrder,
  };
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export interface PriceBreakdown {
  finalPrice: number; // what the customer pays (P)
  razorpayFee: number; // P * rate
  smsFee: number; // flat per-order sms cost
  totalFees: number; // razorpayFee + smsFee
  netReceived: number; // finalPrice - totalFees (amount business keeps)
}

export function computePriceBreakdown(
  finalPrice: number,
  config?: FeeConfig
): PriceBreakdown {
  const { razorpayFeeRate, smsCostPerOrder } = getFeeConfig(config);

  const razorpayFee = round2(finalPrice * razorpayFeeRate);
  const smsFee = round2(smsCostPerOrder);
  const totalFees = round2(razorpayFee + smsFee);
  const netReceived = round2(finalPrice - totalFees);

  return { finalPrice, razorpayFee, smsFee, totalFees, netReceived };
}

/**
 * Given a target net (how much you want to actually keep), compute the final
 * price to charge the customer so that net = target+ fees.
 *   P = (target + smsCost) / (1 - razorpayFeeRate)
 */
export function finalPriceForNet(
  targetNet: number,
  config?: FeeConfig
): number {
  const { razorpayFeeRate, smsCostPerOrder } = getFeeConfig(config);
  if (razorpayFeeRate >= 1) return targetNet;
  const p = (targetNet + smsCostPerOrder) / (1 - razorpayFeeRate);
  return round2(p);
}
