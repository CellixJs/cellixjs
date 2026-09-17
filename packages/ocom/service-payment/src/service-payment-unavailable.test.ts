import { describe, expect, it } from 'vitest';
import { ServicePaymentUnavailable } from './service-payment-unavailable.ts';

describe('ServicePaymentUnavailable', () => {
	const service = new ServicePaymentUnavailable();

	it('exposes itself as the payment service', async () => {
		expect(service.service).toBe(service);
		await expect(service.startUp()).resolves.toBe(service);
		await expect(service.shutDown()).resolves.toBeUndefined();
	});

	it('fails every billing operation instead of pretending to succeed', async () => {
		const unavailable = /No payment gateway is configured/;
		await expect(service.createPaymentInstrument({ paymentToken: 'tok_visa' })).rejects.toThrow(unavailable);
		await expect(service.updatePaymentInstrument('pi_1', { paymentToken: 'tok_visa' })).rejects.toThrow(unavailable);
		await expect(service.getPaymentInstrument('pi_1')).rejects.toThrow(unavailable);
		await expect(service.processPayment({ paymentInstrumentId: 'pi_1', amount: 1000, currency: 'USD' })).rejects.toThrow(unavailable);
	});
});
