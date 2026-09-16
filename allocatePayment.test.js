'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { allocatePayment } = require('./allocatePayment');

test('assignment scenario: payment covers principal cap and interest, nothing for escrow/fees', () => {
  const result = allocatePayment({
    currentPrincipalBalance: 10_000_000,
    scheduledPrincipal: 4_424,
    scheduledInterest: 83_333,
    scheduledEscrow: 20_000,
    outstandingFees: 5_000,
    paymentReceived: 70_000,
  });

  assert.deepEqual(result, {
    allocation: { principal: 4_424, interest: 65_576, escrow: 0, fees: 0 },
    balances: {
      principalBalance: 9_995_576,
      unpaidInterest: 17_757,
      escrowShortage: 20_000,
      remainingFees: 5_000,
    },
    unallocated: 0,
  });
});

test('principal is capped at scheduled principal even when payment is large', () => {
  const result = allocatePayment({
    currentPrincipalBalance: 10_000_000,
    scheduledPrincipal: 4_424,
    scheduledInterest: 1_000,
    scheduledEscrow: 500,
    outstandingFees: 100,
    paymentReceived: 1_000_000,
  });

  // Principal never exceeds the cap, no matter how large the payment is.
  assert.equal(result.allocation.principal, 4_424);
  assert.equal(result.balances.principalBalance, 10_000_000 - 4_424);
});

test('full payment covers everything and leaves an unallocated remainder', () => {
  const result = allocatePayment({
    currentPrincipalBalance: 50_000,
    scheduledPrincipal: 1_000,
    scheduledInterest: 500,
    scheduledEscrow: 300,
    outstandingFees: 200,
    paymentReceived: 5_000,
  });

  assert.deepEqual(result.allocation, { principal: 1_000, interest: 500, escrow: 300, fees: 200 });
  assert.deepEqual(result.balances, {
    principalBalance: 49_000,
    unpaidInterest: 0,
    escrowShortage: 0,
    remainingFees: 0,
  });
  // 5000 - (1000 + 500 + 300 + 200) = 3000 left over, fully accounted for.
  assert.equal(result.unallocated, 3_000);
});

test('zero payment applies nothing and leaves all balances unchanged', () => {
  const result = allocatePayment({
    currentPrincipalBalance: 10_000,
    scheduledPrincipal: 1_000,
    scheduledInterest: 500,
    scheduledEscrow: 200,
    outstandingFees: 100,
    paymentReceived: 0,
  });

  assert.deepEqual(result.allocation, { principal: 0, interest: 0, escrow: 0, fees: 0 });
  assert.deepEqual(result.balances, {
    principalBalance: 10_000,
    unpaidInterest: 500,
    escrowShortage: 200,
    remainingFees: 100,
  });
  assert.equal(result.unallocated, 0);
});

test('payment that only partially covers principal applies nothing further down the order', () => {
  const result = allocatePayment({
    currentPrincipalBalance: 10_000,
    scheduledPrincipal: 1_000,
    scheduledInterest: 500,
    scheduledEscrow: 200,
    outstandingFees: 100,
    paymentReceived: 300,
  });

  assert.deepEqual(result.allocation, { principal: 300, interest: 0, escrow: 0, fees: 0 });
  assert.equal(result.balances.principalBalance, 9_700);
  assert.equal(result.balances.unpaidInterest, 500);
  assert.equal(result.unallocated, 0);
});

test('every payment cent is accounted for: allocation + remaining shortfalls + unallocated reconciles', () => {
  const input = {
    currentPrincipalBalance: 250_000,
    scheduledPrincipal: 2_000,
    scheduledInterest: 900,
    scheduledEscrow: 400,
    outstandingFees: 150,
    paymentReceived: 2_750,
  };
  const result = allocatePayment(input);

  const totalApplied =
    result.allocation.principal +
    result.allocation.interest +
    result.allocation.escrow +
    result.allocation.fees;

  assert.equal(totalApplied + result.unallocated, input.paymentReceived);
});

test('rejects non-integer (floating point) monetary input', () => {
  assert.throws(
    () =>
      allocatePayment({
        currentPrincipalBalance: 10_000.5,
        scheduledPrincipal: 1_000,
        scheduledInterest: 500,
        scheduledEscrow: 200,
        outstandingFees: 100,
        paymentReceived: 300,
      }),
    TypeError
  );
});

test('rejects negative monetary input', () => {
  assert.throws(
    () =>
      allocatePayment({
        currentPrincipalBalance: 10_000,
        scheduledPrincipal: 1_000,
        scheduledInterest: 500,
        scheduledEscrow: 200,
        outstandingFees: 100,
        paymentReceived: -1,
      }),
    TypeError
  );
});
