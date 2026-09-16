'use strict';

/**
 * Applies a mortgage-style payment to a loan in the order:
 * principal (capped at the month's scheduled principal), then interest,
 * then escrow, then fees. Any amount left after fees is unallocated.
 *
 * All monetary values must be integer cents.
 *
 * @param {Object} input
 * @param {number} input.currentPrincipalBalance - Outstanding principal before this payment.
 * @param {number} input.scheduledPrincipal - This month's scheduled principal due (the cap).
 * @param {number} input.scheduledInterest - This month's scheduled interest due.
 * @param {number} input.scheduledEscrow - This month's scheduled escrow due.
 * @param {number} input.outstandingFees - Fees owed before this payment.
 * @param {number} input.paymentReceived - The payment being applied.
 * @returns {{
 *   allocation: { principal: number, interest: number, escrow: number, fees: number },
 *   balances: {
 *     principalBalance: number,
 *     unpaidInterest: number,
 *     escrowShortage: number,
 *     remainingFees: number
 *   },
 *   unallocated: number
 * }}
 */
function allocatePayment(input) {
  const {
    currentPrincipalBalance,
    scheduledPrincipal,
    scheduledInterest,
    scheduledEscrow,
    outstandingFees,
    paymentReceived,
  } = input;

  for (const [name, value] of Object.entries({
    currentPrincipalBalance,
    scheduledPrincipal,
    scheduledInterest,
    scheduledEscrow,
    outstandingFees,
    paymentReceived,
  })) {
    if (!Number.isInteger(value) || value < 0) {
      throw new TypeError(`${name} must be a non-negative integer number of cents, got ${value}`);
    }
  }

  let remaining = paymentReceived;

  const principalApplied = Math.min(remaining, scheduledPrincipal);
  remaining -= principalApplied;

  const interestApplied = Math.min(remaining, scheduledInterest);
  remaining -= interestApplied;

  const escrowApplied = Math.min(remaining, scheduledEscrow);
  remaining -= escrowApplied;

  const feesApplied = Math.min(remaining, outstandingFees);
  remaining -= feesApplied;

  return {
    allocation: {
      principal: principalApplied,
      interest: interestApplied,
      escrow: escrowApplied,
      fees: feesApplied,
    },
    balances: {
      principalBalance: currentPrincipalBalance - principalApplied,
      unpaidInterest: scheduledInterest - interestApplied,
      escrowShortage: scheduledEscrow - escrowApplied,
      remainingFees: outstandingFees - feesApplied,
    },
    unallocated: remaining,
  };
}

module.exports = { allocatePayment };
