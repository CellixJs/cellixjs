import { VOOptional, VOSet, VOString } from '@lucaspaganini/value-objects';

export class Name extends VOString({
	trim: true,
	maxLength: 200,
	minLength: 1,
}) {}
export class Domain extends VOString({
	trim: true,
	maxLength: 500,
	minLength: 1,
}) {}
class WhiteLabelDomainBase extends VOString({
	trim: true,
	maxLength: 500,
	minLength: 1,
}) {}
export class WhiteLabelDomain extends VOOptional(WhiteLabelDomainBase, [null]) {}
class HandleBase extends VOString({
	trim: true,
	maxLength: 50,
	minLength: 1,
}) {}
export class Handle extends VOOptional(HandleBase, [null]) {}

export const SubscriptionTiers = {
	Pro: 'pro',
	Enterprise: 'enterprise',
} as const;

export class SubscriptionTier extends VOSet(Object.values(SubscriptionTiers)) {}

class PaymentInstrumentIdBase extends VOString({
	trim: true,
	maxLength: 100,
	minLength: 1,
}) {}
export class PaymentInstrumentId extends VOOptional(PaymentInstrumentIdBase, [null]) {}
