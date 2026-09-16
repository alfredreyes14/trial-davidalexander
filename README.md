# payment-allocation

A single headless function, `allocatePayment`, that applies a loan payment
across principal (capped at the month's scheduled principal), interest,
escrow, and fees, in that order.

## Usage

```js
const { allocatePayment } = require('./allocatePayment');

const result = allocatePayment({
  currentPrincipalBalance: 10_000_000, // cents
  scheduledPrincipal: 4_424,
  scheduledInterest: 65_776,
  scheduledEscrow: 20_000,
  outstandingFees: 5_000,
  paymentReceived: 70_000,
});

// result.allocation -> { principal, interest, escrow, fees }
// result.balances   -> { principalBalance, unpaidInterest, escrowShortage, remainingFees }
// result.unallocated
```

All monetary values must be integer cents; non-integer or negative inputs
throw a `TypeError`.

## Running the tests

```bash
npm test
```

Uses Node's built-in test runner (`node --test`) — no dependencies to
install. Requires Node 18+.

See [NOTES.md](./NOTES.md) for design details, test coverage, and AI-usage notes.
