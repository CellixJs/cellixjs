import type { ServiceBase } from '@cellix/api-services-spec';
import type { PaymentInstrumentDisplay, PaymentInstrumentInput, PaymentOperations, ProcessPaymentRequest, TransactionReference } from './payment.contract.ts';

export const CHARGE_FAILURE_PAYMENT_TOKEN = 'tok_charge_failure';

interface StoredPaymentInstrument extends PaymentInstrumentDisplay {
	paymentToken: string;
}

function displayForToken(token: string, id: string): PaymentInstrumentDisplay {
	const normalized = token.trim().toLowerCase();
	if (normalized.includes('mastercard')) {
		return {
			id,
			maskedCardNumber: '****4444',
			brand: 'mastercard',
			expirationMonth: '12',
			expirationYear: '2030',
		};
	}
	if (normalized.includes('visa') || normalized === CHARGE_FAILURE_PAYMENT_TOKEN) {
		return {
			id,
			maskedCardNumber: normalized === CHARGE_FAILURE_PAYMENT_TOKEN ? '****0000' : '****1111',
			brand: 'visa',
			expirationMonth: '12',
			expirationYear: '2030',
		};
	}
	return {
		id,
		maskedCardNumber: '****4242',
		brand: 'card',
		expirationMonth: '12',
		expirationYear: '2030',
	};
}

export class ServicePayment implements ServiceBase<PaymentOperations>, PaymentOperations {
	private readonly instruments = new Map<string, StoredPaymentInstrument>();
	private nextId = 1;

	startUp(): Promise<PaymentOperations> {
		return Promise.resolve(this);
	}

	shutDown(): Promise<void> {
		this.instruments.clear();
		this.nextId = 1;
		return Promise.resolve();
	}

	createPaymentInstrument(input: PaymentInstrumentInput): Promise<PaymentInstrumentDisplay> {
		const paymentToken = input.paymentToken?.trim() ?? '';
		if (!paymentToken) {
			return Promise.reject(new Error('A payment instrument token is required'));
		}
		const id = `pi_mock_${this.nextId}`;
		this.nextId += 1;
		const display = displayForToken(paymentToken, id);
		this.instruments.set(id, { ...display, paymentToken });
		return Promise.resolve(display);
	}

	updatePaymentInstrument(id: string, input: PaymentInstrumentInput): Promise<PaymentInstrumentDisplay> {
		const existing = this.instruments.get(id);
		if (!existing) {
			return Promise.reject(new Error(`Payment instrument ${id} was not found`));
		}
		const paymentToken = input.paymentToken?.trim() ?? '';
		if (!paymentToken) {
			return Promise.reject(new Error('A payment instrument token is required'));
		}
		const display = displayForToken(paymentToken, id);
		this.instruments.set(id, { ...display, paymentToken });
		return Promise.resolve(display);
	}

	getPaymentInstrument(id: string): Promise<PaymentInstrumentDisplay | null> {
		const stored = this.instruments.get(id);
		if (!stored) {
			return Promise.resolve(null);
		}
		const { paymentToken: _paymentToken, ...display } = stored;
		return Promise.resolve(display);
	}

	processPayment(request: ProcessPaymentRequest): Promise<TransactionReference> {
		const instrument = this.instruments.get(request.paymentInstrumentId);
		const now = new Date();
		if (!instrument) {
			return Promise.resolve({
				vendor: 'mock',
				isSuccess: false,
				lastRequestedAt: now,
				referenceId: request.referenceId,
				errorOccurredAt: now,
				errorCode: 'INSTRUMENT_NOT_FOUND',
				errorMessage: `Payment instrument ${request.paymentInstrumentId} was not found`,
			});
		}
		if (instrument.paymentToken === CHARGE_FAILURE_PAYMENT_TOKEN) {
			return Promise.resolve({
				vendor: 'mock',
				isSuccess: false,
				lastRequestedAt: now,
				referenceId: request.referenceId,
				errorOccurredAt: now,
				errorCode: 'CHARGE_FAILED',
				errorMessage: 'The payment instrument was declined',
			});
		}
		return Promise.resolve({
			vendor: 'mock',
			isSuccess: true,
			lastRequestedAt: now,
			referenceId: request.referenceId,
			transactionId: `txn_mock_${now.getTime()}`,
			reconciliationId: `rec_mock_${now.getTime()}`,
			completedAt: now,
		});
	}
}
