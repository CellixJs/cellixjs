import { VOInteger, VOString } from '@lucaspaganini/value-objects';
import { SubscriptionTier } from '../community/community.value-objects.ts';

export { SubscriptionTier };

export class Currency extends VOString({
	trim: true,
	minLength: 3,
	maxLength: 3,
}) {}

export class PricePerMember extends VOInteger({
	min: 0,
}) {}

export class MaxMembers extends VOInteger({
	min: 0,
}) {}

export class MaxAdmins extends VOInteger({
	min: 0,
}) {}
