import type { PaymentAmount, PaymentInstrumentReference, PaymentInstrumentRegistration, PaymentService } from '@cellix/service-payment';
import { ServicePaymentMock, type ServicePaymentMockFailure, type ServicePaymentMockRegistrationResult } from '@cellix/service-payment-mock';
import { describe, expect, it } from 'vitest';

describe('ServicePaymentMock', () => {
	it('starts and shuts down as an infrastructure service', async () => {
		const service = new ServicePaymentMock();

		await expect(service.startUp()).resolves.toBe(service);
		await expect(service.shutDown()).resolves.toBeUndefined();
	});

	it('rejects payment instrument registrations without a provider token', async () => {
		const service: Pick<PaymentService, 'createPaymentInstrument'> = new ServicePaymentMock();

		await expect(
			service.createPaymentInstrument({
				paymentInstrumentRegistration: {
					paymentToken: '',
					payload: { providerData: 'opaque' },
				},
			}),
		).rejects.toThrow('Payment token must be a non-empty string');
	});

	it('returns a normalized configured payment instrument registration failure', async () => {
		const service = new ServicePaymentMock();

		await expect(service.createPaymentInstrument({ paymentInstrumentRegistration: paymentInstrumentRegistration('expired-token') }, 'token-invalid')).resolves.toMatchObject({
			vendor: 'mock',
			isSuccess: false,
			errorCode: 'token-invalid',
			errorMessage: 'Mock payment token was rejected by the provider',
			errorOccurredAt: expect.any(Date),
		});
		await expect(service.createPaymentInstrument({ paymentInstrumentRegistration: paymentInstrumentRegistration('valid-token') })).resolves.toEqual({
			vendor: 'mock',
			paymentInstrumentId: 'mock-payment-instrument-1',
		});
	});

	it('charges a stored payment instrument and retrieves the resulting transaction', async () => {
		const service: Pick<PaymentService, 'createPaymentInstrument' | 'chargePayment' | 'getPaymentTransaction'> = new ServicePaymentMock();
		const paymentInstrument = requirePaymentInstrument(await service.createPaymentInstrument({ paymentInstrumentRegistration: paymentInstrumentRegistration('opaque-token') }));
		const charge = await service.chargePayment({ referenceId: 'community-billing-123', amount: usd(1250), paymentInstrument });

		expect(charge).toMatchObject({
			vendor: 'mock',
			isSuccess: true,
			referenceId: 'community-billing-123',
			amount: usd(1250),
			transactionId: 'mock-payment-transaction-1',
		});
		await expect(service.getPaymentTransaction({ vendor: 'mock', referenceId: charge.referenceId })).resolves.toEqual(charge);
		await expect(service.chargePayment({ referenceId: 'community-billing-123', amount: usd(1250), paymentInstrument })).resolves.toEqual(charge);
		await expect(service.chargePayment({ referenceId: 'community-billing-123', amount: usd(2500), paymentInstrument })).rejects.toThrow('does not match the original submission');
		const anotherPaymentInstrument = requirePaymentInstrument(await service.createPaymentInstrument({ paymentInstrumentRegistration: paymentInstrumentRegistration('another-opaque-token') }));
		await expect(service.chargePayment({ referenceId: 'community-billing-123', amount: usd(1250), paymentInstrument: anotherPaymentInstrument })).rejects.toThrow('does not match the original submission');
	});

	it('returns a normalized configured charge failure without affecting ordinary charges', async () => {
		const service = new ServicePaymentMock();
		const paymentInstrument = requirePaymentInstrument(await service.createPaymentInstrument({ paymentInstrumentRegistration: paymentInstrumentRegistration('opaque-token') }));
		const failure: ServicePaymentMockFailure = 'declined';

		const failedCharge = await service.chargePayment({ referenceId: 'declined-charge', amount: usd(1250), paymentInstrument }, failure);

		expect(failedCharge).toMatchObject({
			vendor: 'mock',
			isSuccess: false,
			referenceId: 'declined-charge',
			amount: usd(1250),
			errorCode: 'declined',
			errorMessage: 'Mock payment was declined',
			errorOccurredAt: expect.any(Date),
		});
		expect(failedCharge).not.toHaveProperty('transactionId');
		expect(failedCharge).not.toHaveProperty('completedAt');
		await expect(service.chargePayment({ referenceId: 'rejected-instrument-charge', amount: usd(1250), paymentInstrument }, 'invalid-payment-instrument')).resolves.toMatchObject({
			isSuccess: false,
			errorCode: 'invalid-payment-instrument',
			errorMessage: 'Mock payment instrument was rejected by the provider',
		});
		await expect(service.chargePayment({ referenceId: 'declined-charge', amount: usd(1250), paymentInstrument })).resolves.toEqual(failedCharge);
		await expect(service.chargePayment({ referenceId: 'declined-charge', amount: usd(2500), paymentInstrument })).rejects.toThrow('does not match the original submission');
		await expect(
			service.refundPayment({
				amount: usd(1250),
				referenceId: 'failed-charge-refund',
				transaction: { vendor: 'mock', referenceId: failedCharge.referenceId },
			}),
		).rejects.toThrow('Only completed successful payment transactions can be refunded');
		await expect(service.chargePayment({ referenceId: 'ordinary-charge', amount: usd(1250), paymentInstrument })).resolves.toMatchObject({
			isSuccess: true,
		});
	});

	it('returns a configured refund failure without consuming the refundable amount', async () => {
		const service = new ServicePaymentMock();
		const paymentInstrument = requirePaymentInstrument(await service.createPaymentInstrument({ paymentInstrumentRegistration: paymentInstrumentRegistration('opaque-token') }));
		const charge = await service.chargePayment({ referenceId: 'successful-charge', amount: usd(1250), paymentInstrument });
		const failedRefund = await service.refundPayment(
			{
				amount: usd(1250),
				referenceId: 'failed-refund',
				transaction: { vendor: 'mock', referenceId: charge.referenceId },
			},
			'provider-unavailable',
		);

		expect(failedRefund).toMatchObject({
			isSuccess: false,
			referenceId: 'failed-refund',
			errorCode: 'provider-unavailable',
			errorMessage: 'Mock payment provider is unavailable',
			errorOccurredAt: expect.any(Date),
		});
		expect(failedRefund).not.toHaveProperty('transactionId');
		await expect(
			service.refundPayment({
				amount: usd(1250),
				referenceId: 'successful-refund',
				transaction: { vendor: 'mock', referenceId: charge.referenceId },
			}),
		).resolves.toMatchObject({ isSuccess: true, amount: usd(1250) });
	});

	it('processes idempotent partial refunds for a completed transaction', async () => {
		const service: Pick<PaymentService, 'createPaymentInstrument' | 'chargePayment' | 'refundPayment'> = new ServicePaymentMock();
		const paymentInstrument = requirePaymentInstrument(await service.createPaymentInstrument({ paymentInstrumentRegistration: paymentInstrumentRegistration('opaque-token') }));
		const charge = await service.chargePayment({ referenceId: 'community-billing-123', amount: usd(1250), paymentInstrument });

		await expect(
			service.refundPayment({
				amount: usd(500),
				referenceId: 'mock-payment-refund-reference',
				transaction: { vendor: 'mock', referenceId: charge.referenceId },
			}),
		).resolves.toMatchObject({
			vendor: 'mock',
			isSuccess: true,
			referenceId: 'mock-payment-refund-reference',
			amount: usd(500),
		});
		await expect(
			service.refundPayment({
				amount: usd(500),
				referenceId: 'mock-payment-refund-reference',
				transaction: { vendor: 'mock', referenceId: charge.referenceId },
			}),
		).resolves.toMatchObject({ referenceId: 'mock-payment-refund-reference', amount: usd(500) });

		await expect(
			service.refundPayment({
				amount: usd(751),
				referenceId: 'another-refund-reference',
				transaction: { vendor: 'mock', referenceId: charge.referenceId },
			}),
		).rejects.toThrow('exceeds the remaining refundable amount');
		await expect(
			service.refundPayment({
				amount: { amount: 1, currency: 'CAD' },
				referenceId: 'wrong-currency-refund-reference',
				transaction: { vendor: 'mock', referenceId: charge.referenceId },
			}),
		).rejects.toThrow('currency must match the original transaction');
		await expect(
			service.refundPayment({
				amount: usd(1),
				referenceId: 'refund-of-refund-reference',
				transaction: { vendor: 'mock', referenceId: 'mock-payment-refund-reference' },
			}),
		).rejects.toThrow("Payment transaction 'mock-payment-refund-reference' cannot be refunded because it is already a refund");
	});

	it('rejects invalid charge amounts and references that collide with refunds', async () => {
		const service: Pick<PaymentService, 'createPaymentInstrument' | 'chargePayment' | 'refundPayment'> = new ServicePaymentMock();
		const paymentInstrument = requirePaymentInstrument(await service.createPaymentInstrument({ paymentInstrumentRegistration: paymentInstrumentRegistration('opaque-token') }));
		const charge = await service.chargePayment({ referenceId: 'charge-reference', amount: usd(1250), paymentInstrument });
		await service.refundPayment({
			amount: usd(500),
			referenceId: 'refund-reference',
			transaction: { vendor: 'mock', referenceId: charge.referenceId },
		});

		await expect(service.chargePayment({ referenceId: 'invalid-amount', amount: { amount: 12.5, currency: 'USD' }, paymentInstrument })).rejects.toThrow('Payment amount must be a positive integer');
		await expect(service.chargePayment({ referenceId: 'refund-reference', amount: usd(1250), paymentInstrument })).rejects.toThrow('already belongs to a refund');
		await expect(
			service.refundPayment({
				amount: usd(1),
				referenceId: 'charge-reference',
				transaction: { vendor: 'mock', referenceId: charge.referenceId },
			}),
		).rejects.toThrow('already belongs to a transaction');
	});

	it('creates and retrieves recurring payment plans', async () => {
		const service: Pick<PaymentService, 'createRecurringPaymentPlan' | 'getRecurringPaymentPlan'> = new ServicePaymentMock();
		const firstPlan = await service.createRecurringPaymentPlan({
			amount: usd(1250),
			schedule: { billingCycle: { unit: 'month', every: 1 } },
		});
		const secondPlan = await service.createRecurringPaymentPlan({
			amount: usd(2500),
			schedule: { billingCycle: { unit: 'month', every: 1 }, maximumCycles: 12 },
		});

		expect(firstPlan).toEqual({ vendor: 'mock', planId: 'mock-recurring-payment-plan-1' });
		await expect(service.getRecurringPaymentPlan(firstPlan)).resolves.toEqual({
			vendorPlan: firstPlan,
			amount: usd(1250),
			schedule: { billingCycle: { unit: 'month', every: 1 } },
		});
		await expect(service.getRecurringPaymentPlan(secondPlan)).resolves.toMatchObject({
			amount: usd(2500),
			schedule: { maximumCycles: 12 },
		});
	});

	it('rejects recurring plans with invalid payment amounts or schedules', async () => {
		const service: Pick<PaymentService, 'createRecurringPaymentPlan'> = new ServicePaymentMock();

		await expect(
			service.createRecurringPaymentPlan({
				amount: { amount: 0, currency: 'USD' },
				schedule: { billingCycle: { unit: 'month', every: 1 } },
			}),
		).rejects.toThrow('Payment amount must be a positive integer');
		await expect(
			service.createRecurringPaymentPlan({
				amount: usd(1250),
				schedule: { billingCycle: { unit: 'month', every: 0 } },
			}),
		).rejects.toThrow('Billing cycle interval must be a positive integer');
	});

	it('creates, updates, and cancels a recurring payment using a stored instrument', async () => {
		const service: Pick<PaymentService, 'createPaymentInstrument' | 'createRecurringPaymentPlan' | 'createRecurringPayment' | 'updateRecurringPayment' | 'cancelRecurringPayment'> = new ServicePaymentMock();
		const paymentInstrument = requirePaymentInstrument(await service.createPaymentInstrument({ paymentInstrumentRegistration: paymentInstrumentRegistration('opaque-token') }));
		const plan = await service.createRecurringPaymentPlan({
			amount: usd(1250),
			schedule: { billingCycle: { unit: 'month', every: 1 } },
		});
		const recurringPayment = await service.createRecurringPayment({
			paymentInstrument,
			plan: { vendorPlan: plan },
			referenceId: 'community-billing-123',
		});

		expect(recurringPayment).toMatchObject({
			vendor: 'mock',
			referenceId: 'community-billing-123',
			subscriptionId: 'mock-recurring-payment-1',
			status: 'active',
			paymentInstrument,
			plan: { vendorPlan: plan, amount: usd(1250) },
			completedBillingCycles: 0,
		});

		const updatedPlan = await service.updateRecurringPayment({
			recurringPayment: { vendor: 'mock', referenceId: recurringPayment.referenceId },
			plan: {
				amount: usd(2500),
				schedule: { billingCycle: { unit: 'month', every: 1 } },
			},
		});
		expect(updatedPlan).toMatchObject({ paymentInstrument });
		expect(updatedPlan.plan).toEqual({
			amount: usd(2500),
			schedule: { billingCycle: { unit: 'month', every: 1 } },
		});
		const replacementInstrument = requirePaymentInstrument(await service.createPaymentInstrument({ paymentInstrumentRegistration: paymentInstrumentRegistration('replacement-opaque-token') }));
		const updatedInstrument = await service.updateRecurringPayment({
			recurringPayment: { vendor: 'mock', referenceId: recurringPayment.referenceId },
			paymentInstrument: replacementInstrument,
		});
		expect(updatedInstrument).toMatchObject({
			paymentInstrument: replacementInstrument,
			plan: updatedPlan.plan,
		});

		await expect(service.cancelRecurringPayment({ vendor: 'mock', referenceId: recurringPayment.referenceId })).resolves.toMatchObject({
			status: 'cancelled',
			cancelledAt: expect.any(Date),
		});
	});

	it('returns a configured recurring payment creation failure without provider identifiers', async () => {
		const service = new ServicePaymentMock();
		const paymentInstrument = await service.createPaymentInstrument({ paymentInstrumentRegistration: paymentInstrumentRegistration('opaque-token') });
		const failedRecurringPayment = await service.createRecurringPayment(
			{
				paymentInstrument,
				plan: { amount: usd(1250), schedule: { billingCycle: { unit: 'month', every: 1 } } },
				referenceId: 'failed-recurring-payment',
			},
			'processing-error',
		);

		expect(failedRecurringPayment).toMatchObject({
			status: 'failed',
			referenceId: 'failed-recurring-payment',
			errorCode: 'processing-error',
			errorMessage: 'Mock payment provider could not process the request',
			paymentInstrument,
			completedBillingCycles: 0,
		});
		expect(failedRecurringPayment).not.toHaveProperty('subscriptionId');
		expect(failedRecurringPayment).not.toHaveProperty('startedAt');
	});

	it('rejects recurring payments with unknown resources and updates to cancelled payments', async () => {
		const service: Pick<PaymentService, 'createRecurringPayment' | 'cancelRecurringPayment' | 'updateRecurringPayment'> = new ServicePaymentMock();

		await expect(
			service.createRecurringPayment({
				paymentInstrument: { vendor: 'mock', paymentInstrumentId: 'missing' },
				plan: { vendorPlan: { vendor: 'mock', planId: 'missing' } },
				referenceId: 'missing-resources',
			}),
		).rejects.toThrow("Payment instrument 'missing' was not found");
		await expect(service.cancelRecurringPayment({ vendor: 'mock', referenceId: 'missing' })).rejects.toThrow('Recurring payment was not found');

		const activePayment = await createActiveRecurringPayment();
		const cancelledPayment = await activePayment.service.cancelRecurringPayment({ vendor: 'mock', referenceId: activePayment.recurringPayment.referenceId });
		await expect(
			activePayment.service.updateRecurringPayment({
				recurringPayment: { vendor: 'mock', referenceId: cancelledPayment.referenceId },
				paymentInstrument: activePayment.paymentInstrument,
			}),
		).rejects.toThrow('Cancelled recurring payments cannot be updated');
	});

	it('rejects transactions and lookups for unknown resources', async () => {
		const service: Pick<PaymentService, 'chargePayment' | 'getPaymentTransaction'> = new ServicePaymentMock();

		await expect(
			service.chargePayment({
				referenceId: 'missing-instrument-charge',
				amount: usd(1250),
				paymentInstrument: { vendor: 'mock', paymentInstrumentId: 'missing' },
			}),
		).rejects.toThrow("Payment instrument 'missing' was not found");
		await expect(service.getPaymentTransaction({ vendor: 'mock', referenceId: 'missing' })).rejects.toThrow('Payment transaction was not found');
	});
});

async function createActiveRecurringPayment() {
	const service: Pick<PaymentService, 'createPaymentInstrument' | 'createRecurringPaymentPlan' | 'createRecurringPayment' | 'cancelRecurringPayment' | 'updateRecurringPayment'> = new ServicePaymentMock();
	const paymentInstrument = requirePaymentInstrument(await service.createPaymentInstrument({ paymentInstrumentRegistration: paymentInstrumentRegistration('opaque-token') }));
	const plan = await service.createRecurringPaymentPlan({
		amount: usd(1250),
		schedule: { billingCycle: { unit: 'month', every: 1 } },
	});
	const recurringPayment = await service.createRecurringPayment({
		paymentInstrument,
		plan: { vendorPlan: plan },
		referenceId: 'active-recurring-payment',
	});

	return { service, paymentInstrument, plan, recurringPayment };
}

function paymentInstrumentRegistration(paymentToken: string): PaymentInstrumentRegistration {
	return {
		paymentToken,
		payload: { providerData: 'opaque' },
	};
}

function requirePaymentInstrument(result: ServicePaymentMockRegistrationResult): PaymentInstrumentReference {
	if ('isSuccess' in result) {
		throw new Error(`Payment instrument registration failed: ${result.errorCode}`);
	}

	return result;
}

function usd(amount: number): PaymentAmount {
	return { amount, currency: 'USD' };
}
