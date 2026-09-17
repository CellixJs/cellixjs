# @cellix/service-payment-mock

An in-memory `PaymentService` implementation for local development and tests. It supports stored payment instruments, transactions, recurring-payment plans, and subscriptions without accepting or retaining vendor-specific payment details.

The mock is a drop-in implementation for the currently supported `@cellix/service-payment` contract. It keeps all resources only for the lifetime of its `ServicePaymentMock` instance.

## Usage

```ts
import type { PaymentService } from '@cellix/service-payment';
import { ServicePaymentMock } from '@cellix/service-payment-mock';

const paymentService: Pick<PaymentService, 'createPaymentInstrument' | 'chargePayment'> = new ServicePaymentMock();
const paymentInstrument = await paymentService.createPaymentInstrument({
	paymentInstrumentRegistration: {
		paymentToken: 'vendor-token',
		payload: { providerData: 'opaque' },
	},
});
const transaction = await paymentService.chargePayment({
	referenceId: 'community-billing-123',
	amount: { amount: 1250, currency: 'USD' },
	paymentInstrument,
});
```

All monetary values use integer amounts in the currency's smallest unit, so `{ amount: 1250, currency: 'USD' }` represents USD 12.50. Charge `referenceId` values are application-provided idempotency and reconciliation keys: a repeated key returns its existing mock transaction rather than creating another charge.

Mock resource identifiers are deterministic for a service instance. The service rejects unknown instruments and unknown transactions. Refund references are idempotent, support positive partial refunds in the charge currency, and reject refunds that exceed the original charge amount.

## Simulating provider failures

`ServicePaymentMock` exposes the mock-only `ServicePaymentMockFailure` type for tests that need a provider-style failure. Pass one of `'declined'`, `'processing-error'`, `'provider-unavailable'`, or `'invalid-payment-instrument'` as the optional second argument to `chargePayment`, `refundPayment`, or `createSubscription`. Pass `'token-invalid'` or `'token-expired'` to `createPaymentInstrument`:

```ts
import { ServicePaymentMock } from '@cellix/service-payment-mock';

const paymentService = new ServicePaymentMock();
const failedCharge = await paymentService.chargePayment(charge, 'declined');
```

Only an explicit second argument simulates a failure. A failed instrument registration returns the mock-only `ServicePaymentMockRegistrationFailure`; failed transactions return the normal vendor-neutral payment result with `isSuccess: false` and populated error fields. Subscription creation failures reject because a `SubscriptionReference` always represents a successfully created vendor subscription with an ID. It does not return raw vendor response data. Malformed requests and unavailable mock resources continue to reject.

Recurring-payment plans store the current amount. Create a subscription with either a stored plan reference or inline terms and a required `startAt` date. New mock subscriptions begin in the normalized `created` state, before a first payment is processed. Retrieve its current vendor-maintained state with `getSubscription`, update only its amount while active, and cancel it when future billing must stop. Updating a subscription never replaces its assigned plan or payment instrument.

When registering the mock with a Cellix infrastructure registry, call its `startUp()` and `shutDown()` lifecycle methods through that registry. They are intentionally no-op lifecycle boundaries for the in-memory implementation.

## Public export

Import `ServicePaymentMock` and the mock-only `ServicePaymentMockFailure` type from `@cellix/service-payment-mock`. Import `PaymentService` and its request and response types from `@cellix/service-payment`.

## Limitations

This package does not process real payments or retain registration payloads. It does not calculate amounts or execute scheduled billing cycles; consuming application code supplies any updated amount, and a compatible payment-vendor implementation handles production payment processing.