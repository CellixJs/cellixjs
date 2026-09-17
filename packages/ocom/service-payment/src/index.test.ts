import { describe, expect, it } from 'vitest';
import { CHARGE_FAILURE_PAYMENT_TOKEN, ServicePayment } from './index.ts';

describe('@ocom/service-payment', () => {
	it('creates and retrieves a visa instrument', async () => {
		const service = new ServicePayment();
		await service.startUp();
		const created = await service.createPaymentInstrument({
			paymentToken: 'tok_visa',
			billingName: 'Alice Owner',
			billingEmail: 'owner@test.example',
		});
		expect(created.brand).toBe('visa');
		expect(created.maskedCardNumber).toBe('****1111');
		const loaded = await service.getPaymentInstrument(created.id);
		expect(loaded).toMatchObject({
			id: created.id,
			brand: 'visa',
			maskedCardNumber: '****1111',
		});
		await service.shutDown();
	});

	it('updates an instrument to mastercard', async () => {
		const service = new ServicePayment();
		const created = await service.createPaymentInstrument({ paymentToken: 'tok_visa' });
		const updated = await service.updatePaymentInstrument(created.id, { paymentToken: 'tok_mastercard' });
		expect(updated.brand).toBe('mastercard');
		expect(updated.maskedCardNumber).toBe('****4444');
	});

	it('processes a successful payment', async () => {
		const service = new ServicePayment();
		const created = await service.createPaymentInstrument({ paymentToken: 'tok_visa' });
		const result = await service.processPayment({
			paymentInstrumentId: created.id,
			amount: 1000,
			currency: 'USD',
			referenceId: 'community-1',
		});
		expect(result).toMatchObject({
			vendor: 'mock',
			isSuccess: true,
			referenceId: 'community-1',
		});
		expect(result.transactionId).toBeDefined();
		expect(result.completedAt).toBeInstanceOf(Date);
	});

	it('records a failed charge for the sentinel token without rejecting the instrument', async () => {
		const service = new ServicePayment();
		const created = await service.createPaymentInstrument({ paymentToken: CHARGE_FAILURE_PAYMENT_TOKEN });
		expect(created.id).toBeDefined();
		const result = await service.processPayment({
			paymentInstrumentId: created.id,
			amount: 1000,
			currency: 'USD',
		});
		expect(result.isSuccess).toBe(false);
		expect(result.errorCode).toBe('CHARGE_FAILED');
		expect(result.errorMessage).toBeDefined();
		expect(result.errorOccurredAt).toBeInstanceOf(Date);
	});
});

describe('ServicePayment reference idempotency', () => {
	it('returns the recorded result instead of charging twice for one reference', async () => {
		const service = new ServicePayment();
		const instrument = await service.createPaymentInstrument({ paymentToken: 'tok_visa' });

		const first = await service.processPayment({ paymentInstrumentId: instrument.id, amount: 1000, currency: 'USD', referenceId: 'community-1:2026-04:0' });
		const second = await service.processPayment({ paymentInstrumentId: instrument.id, amount: 1000, currency: 'USD', referenceId: 'community-1:2026-04:0' });

		expect(second).toBe(first);
	});

	it('treats a different reference as a separate charge', async () => {
		const service = new ServicePayment();
		const instrument = await service.createPaymentInstrument({ paymentToken: 'tok_visa' });

		const first = await service.processPayment({ paymentInstrumentId: instrument.id, amount: 1000, currency: 'USD', referenceId: 'community-1:2026-04:0' });
		const second = await service.processPayment({ paymentInstrumentId: instrument.id, amount: 1000, currency: 'USD', referenceId: 'community-1:2026-04:1' });

		expect(second).not.toBe(first);
		expect(second.isSuccess).toBe(true);
	});
});
