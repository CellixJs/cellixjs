import { DEFAULT_TEST_PAYMENT_INSTRUMENT } from '@ocom-verification/verification-shared/test-data';
import { Task, the } from '@serenity-js/core';
import { CreateCommunity } from './create-community.ts';

export const EnsureCommunityWithBilling = (plan: string) =>
	Task.where(the`#actor has a community on the "${plan}" plan with a payment instrument`, CreateCommunity({ name: `${plan} Subscription Community`, plan, ...DEFAULT_TEST_PAYMENT_INSTRUMENT }));

export const EnsureCommunityWithoutPaymentInstrument = () => Task.where(the`#actor has a community without a payment instrument`, CreateCommunity({ name: 'Uninstrumented Community' }));
