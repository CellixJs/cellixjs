export interface PaymentInstrumentInput {
	paymentToken: string;
	billingName?: string | undefined;
	billingEmail?: string | undefined;
	billingAddress?: string | undefined;
	billingCity?: string | undefined;
	billingState?: string | undefined;
	billingPostalCode?: string | undefined;
	billingCountry?: string | undefined;
}

export interface PaymentInstrumentDisplay {
	id: string;
	maskedCardNumber: string;
	brand: string;
	expirationMonth: string;
	expirationYear: string;
}

export interface ProcessPaymentRequest {
	paymentInstrumentId: string;
	amount: number;
	currency: string;
	referenceId?: string | undefined;
}

export interface TransactionReference {
	vendor?: string | undefined;
	isSuccess?: boolean | undefined;
	lastRequestedAt?: Date | undefined;
	referenceId?: string | undefined;
	transactionId?: string | undefined;
	reconciliationId?: string | undefined;
	completedAt?: Date | undefined;
	errorOccurredAt?: Date | undefined;
	errorCode?: string | undefined;
	errorMessage?: string | undefined;
}

export interface PaymentOperations {
	createPaymentInstrument(input: PaymentInstrumentInput): Promise<PaymentInstrumentDisplay>;
	updatePaymentInstrument(id: string, input: PaymentInstrumentInput): Promise<PaymentInstrumentDisplay>;
	getPaymentInstrument(id: string): Promise<PaymentInstrumentDisplay | null>;
	processPayment(request: ProcessPaymentRequest): Promise<TransactionReference>;
}
