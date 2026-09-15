# @cellix/service-payment-mock Manifest

## Purpose

`@cellix/service-payment-mock` provides an in-memory implementation of the Cellix payment contract for local development and contract tests.

## Scope

- Registration of stored payment-instrument references
- Charges, refunds, and transaction lookup using the `@cellix/service-payment` contract
- Reusable recurring-payment plans and recurring-payment lifecycle operations
- Per-invocation simulation of defined provider-style outcomes for charges, refunds, and recurring-payment creation
- Deterministic mock identifiers and in-memory state for the service lifetime
- `ServiceBase` lifecycle compatibility for Cellix infrastructure registration

## Non-goals

- Payment vendor SDK integrations, credentials, or sensitive payment-data storage
- Application-specific customer or domain-entity associations

## Public API shape

- `ServicePaymentMock` is the only value export and implements the supported payment service methods.
- `ServicePaymentMockFailure` is a mock-only type export with the defined values `declined`, `processing-error`, `provider-unavailable`, `invalid-payment-instrument`, `token-invalid`, and `token-expired`.
- `ServicePaymentMockRegistrationFailure` is a mock-only registration result; `PaymentService` continues to return `PaymentInstrumentReference`.
- Consumer code uses types from `@cellix/service-payment`; vendor implementation details remain internal.

## Core concepts

- A payment-instrument registration requires provider-issued token metadata and an opaque, vendor-defined payload; neither input value is retained or returned.
- A payment instrument is an opaque, vendor-agnostic reference after registration.
- Monetary values use integer amounts in the currency's smallest unit and an ISO currency code; charge references are application-provided idempotency and reconciliation keys.
- A transaction is created only against an instrument registered by the same mock-service instance.
- A completed successful transaction can receive idempotent partial refunds up to its original amount. Both charge and refund results can be retrieved by their normalized identifiers.
- Passing an explicit mock failure to instrument registration, charge, refund, or recurring-payment creation returns a normalized failure result. A failed instrument registration leaves existing instrument state unchanged and is not part of the `PaymentService` contract; a failed refund does not reduce the refundable amount; malformed requests and missing resources still reject.
- A recurring payment uses a registered instrument and either a reusable plan or inline terms with a current amount; a cancelled payment cannot be updated.

## Package boundaries

- This package owns mock-only state, deterministic mock identifiers, explicit failure simulation, and validation of mock resources.
- The `@cellix/service-payment` package owns the vendor-neutral types and `PaymentService` contract.
- This package does not own real payment processing, vendor payload interpretation, customer/domain associations, dynamic-amount calculation, or scheduled billing execution.

## Dependencies / relationships

- Depends only on `@cellix/service-payment` for the public payment contracts.
- Is intended for development and tests where an application needs a drop-in implementation of the supported service methods.

## Testing strategy

- Test observable behavior through the package root entrypoint.
- Cover stored-instrument lifecycle, charge/lookup, refund, reusable plan retrieval, recurring-payment update/cancellation, configured failure outcomes, and invalid resource operations.

## Documentation obligations

- Keep the README focused on direct consumer use through the package root import.
- Keep `ServicePaymentMock` TSDoc aligned with its observable Promise result and failure behavior.
- Update this manifest when the mock's supported contract surface or package boundary changes.

## Release-readiness standards

- Keep `ServicePaymentMock` as the sole value export; do not expose its mutable in-memory storage.
- Preserve compatibility with the supported `@cellix/service-payment` methods and return types.
- Keep recurring-payment lifecycle behavior covered through root-entrypoint tests.