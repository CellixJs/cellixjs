import type { ServiceBase } from '@cellix/api-services-spec';
import type { PaymentInstrumentDisplay, PaymentInstrumentInput, PaymentOperations, ProcessPaymentRequest, TransactionReference } from './payment.contract.ts';

const UNAVAILABLE_MESSAGE = 'No payment gateway is configured for this environment, so billing operations are unavailable.';

/**
 * Payment service used when no gateway implementation is available.
 *
 * Registering this lets the API start without billing support while making every
 * billing operation fail loudly, instead of silently falling back to the in-memory
 * mock and reporting successful charges that never happened.
 */
export class ServicePaymentUnavailable implements ServiceBase<PaymentOperations>, PaymentOperations {
	public get service(): PaymentOperations {
		return this;
	}

	public startUp(): Promise<PaymentOperations> {
		return Promise.resolve(this);
	}

	public shutDown(): Promise<void> {
		return Promise.resolve();
	}

	public createPaymentInstrument(_input: PaymentInstrumentInput): Promise<PaymentInstrumentDisplay> {
		return Promise.reject(new Error(UNAVAILABLE_MESSAGE));
	}

	public updatePaymentInstrument(_id: string, _input: PaymentInstrumentInput): Promise<PaymentInstrumentDisplay> {
		return Promise.reject(new Error(UNAVAILABLE_MESSAGE));
	}

	public getPaymentInstrument(_id: string): Promise<PaymentInstrumentDisplay | null> {
		return Promise.reject(new Error(UNAVAILABLE_MESSAGE));
	}

	public processPayment(_request: ProcessPaymentRequest): Promise<TransactionReference> {
		return Promise.reject(new Error(UNAVAILABLE_MESSAGE));
	}
}
