import { DEFAULT_TEST_PAYMENT_INSTRUMENT } from '@ocom-verification/verification-shared/test-data';
import type { Task } from '@serenity-js/core';
import { CreateCommunity } from './create-community.ts';

export const EnsureCommunityWithBilling = (plan: string): Task =>
	CreateCommunity({
		name: `${plan} Subscription Community`,
		plan,
		...DEFAULT_TEST_PAYMENT_INSTRUMENT,
	});

export const EnsureCommunityWithoutPaymentInstrument = (): Task => CreateCommunity({ name: 'Uninstrumented Community' });
