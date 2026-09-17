# @cellix/service-payment

Vendor-neutral TypeScript contracts for payment instruments, transactions, recurring-payment plans, and subscriptions.

## Subscriptions

Create a subscription with a stored payment instrument, recurring-payment plan terms, an application reference, and the provider-facing start date. A successful result always includes the vendor subscription ID. Creation errors reject rather than returning an incomplete subscription reference.

```ts
import type { PaymentService } from '@cellix/service-payment';

const subscription = await paymentService.createSubscription({
	paymentInstrument,
	plan: { vendorPlan },
	referenceId: 'community-membership-123',
	startAt: new Date('2026-10-01T00:00:00.000Z'),
});

const currentSubscription = await paymentService.getSubscription({
	vendor: subscription.vendor,
	subscriptionId: subscription.subscriptionId,
});

await paymentService.updateSubscription({
	subscription: { vendor: subscription.vendor, subscriptionId: subscription.subscriptionId },
	amount: { amount: 2500, currency: 'USD' },
});
```

`updateSubscription` only changes the amount. Changing a subscription's assigned plan or payment instrument is outside this contract because payment providers can attach provider-specific side effects to those changes.

Subscription state is normalized as `created`, `pending`, `active`, `suspended`, `delinquent`, `cancelled`, or `completed`. A newly created subscription is `created` until its first payment is processed.