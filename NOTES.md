# Small Allocation Function — Notes

## What this is

A single headless function, `allocatePayment`, that applies a loan payment in the
required order — principal (capped at the month's scheduled principal), then
interest, then escrow, then fees — and returns both the allocation and the
resulting balances. No UI, database, API, or deployment.

## How it works

The function takes one payment and walks the four buckets in order. For each
bucket it applies `min(remaining payment, amount owed in that bucket)`, then
subtracts that from what's left before moving to the next bucket. Principal is
capped by `scheduledPrincipal`, not by the full outstanding balance, per the
spec. Whatever is left after fees is returned as `unallocated`, so every cent
of the payment is accounted for (verified directly by a test that asserts
`sum(allocation) + unallocated === paymentReceived`).

All amounts are integer cents. There is no division, rounding, or floating
point arithmetic anywhere in the function — only integer subtraction and
`Math.min`. Inputs are validated as non-negative integers up front and the
function throws a `TypeError` on anything else (e.g. a float or a negative
value), so bad money representations fail loudly instead of silently
corrupting a balance.

## Running the tests

```bash
cd payment-allocation
npm test
```

Uses Node's built-in test runner (`node --test`), so there are no
dependencies to install. Requires Node 18+ (developed/verified on Node 20).

## Test coverage

- The exact scenario from the assignment (payment covers the capped principal
  and part of interest, escrow/fees get nothing).
- Principal cap holds even when the payment is far larger than the cap.
- A payment large enough to fully cover every bucket, with a nonzero
  unallocated remainder.
- A zero payment (no-op, balances unchanged).
- A payment that only partially covers principal (nothing flows to later
  buckets).
- A generic reconciliation check that allocation + unallocated always equals
  the payment received, for an arbitrary input.
- Rejection of floating point and negative monetary inputs.

## AI tools used and how output was verified

I used Claude (Claude Code) to help draft the function and test suite from
the assignment's stated allocation rule. I verified the output by:

1. Running the test suite (`npm test`) and confirming all cases pass.
2. Manually tracing the assignment's test scenario by hand against the
   allocation order in the spec (principal capped at 4,424 → interest →
   escrow → fees) and confirming it matches the function's output
   (principal 4,424 / interest 65,576 / escrow 0 / fees 0; new principal
   balance 9,995,576; unpaid interest 17,757; escrow shortage 20,000;
   remaining fees 5,000; unallocated 0).
3. Reading through the full implementation myself to confirm there is no
   floating point arithmetic anywhere and that every code path is covered by
   a test.
