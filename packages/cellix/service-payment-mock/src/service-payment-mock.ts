import type { ServiceBase } from '@cellix/api-services-spec';
import type {
	CreatePaymentInstrumentRequest,
	CreateRecurringPaymentPlanRequest,
	PaymentAmount,
	PaymentInstrumentReference,
	PaymentInstrumentRegistration,
	PaymentService,
	PaymentTransactionLookup,
	PaymentTransactionReference,
	PaymentTransactionRefundSubmission,
	PaymentTransactionSubmission,
	RecurringPaymentPlan,
	RecurringPaymentPlanLookup,
	RecurringPaymentPlanReference,
	RecurringPaymentPlanSubmission,
	SubscriptionLookup,
	SubscriptionReference,
	SubscriptionSubmission,
	SubscriptionUpdate,
} from '@cellix/service-payment';

const mockVendor = 'mock';

/**
 * Provider-style outcomes that can be explicitly simulated by ServicePaymentMock.
 */
export type ServicePaymentMockFailure = 'declined' | 'processing-error' | 'provider-unavailable' | 'invalid-payment-instrument' | 'token-invalid' | 'token-expired';

/** A mock-only provider-style failure while registering a payment instrument. */
export interface ServicePaymentMockRegistrationFailure {
	vendor: string;
	isSuccess: false;
	errorOccurredAt: Date;
	errorCode: string;
	errorMessage: string;
}

/** The mock-only result of a payment instrument registration attempt. */
export type ServicePaymentMockRegistrationResult = PaymentInstrumentReference | ServicePaymentMockRegistrationFailure;

interface MockRefund {
	originalTransactionReferenceId: string;
	transaction: PaymentTransactionReference;
}

/**
 * In-memory implementation of the Cellix payment-service contract for development and testing.
 *
 * The service preserves instrument and transaction state for its own lifetime. It accepts only
 * instruments registered by the same instance and intentionally never stores registration payloads.
 *
 * An explicit mock failure argument on instrument registration, charge, refund, and recurring-
 * payment creation returns a normalized failure result. Invalid requests and missing resources
 * still reject.
 *
 * @returns A service whose payment methods resolve with Cellix payment contract types or reject
 * when an instrument or transaction is not valid for the requested operation.
 *
 * @example
 * ```ts
 * const service = new ServicePaymentMock();
 * const paymentInstrument = await service.createPaymentInstrument({
 * 	paymentInstrumentRegistration: {
 * 		paymentToken: 'vendor-token',
 * 		payload: { providerData: 'opaque' },
 * 	},
 * });
 * await service.chargePayment({ referenceId: 'billing-attempt-123', amount: { amount: 1250, currency: 'USD' }, paymentInstrument });
 * ```
 */
export class ServicePaymentMock implements ServiceBase<PaymentService>, PaymentService {
	private readonly instruments = new Map<string, PaymentInstrumentReference>();
	private readonly transactions = new Map<string, PaymentTransactionReference>();
	private readonly chargedInstrumentIds = new Map<string, string>();
	private readonly refundedTransactionReferenceIds = new Set<string>();
	private readonly recurringPaymentPlans = new Map<string, RecurringPaymentPlan>();
	private readonly subscriptions = new Map<string, SubscriptionReference>();
	private readonly refunds = new Map<string, MockRefund>();
	private readonly refundedAmounts = new Map<string, number>();
	private paymentInstrumentSequence = 0;
	private transactionSequence = 0;
	private recurringPaymentPlanSequence = 0;
	private subscriptionSequence = 0;

	public async startUp(): Promise<PaymentService> {
		await Promise.resolve();
		return this;
	}

	public async shutDown(): Promise<void> {
		await Promise.resolve();
	}

	public createPaymentInstrument(request: CreatePaymentInstrumentRequest): Promise<PaymentInstrumentReference>;
	public createPaymentInstrument(request: CreatePaymentInstrumentRequest, failure: ServicePaymentMockFailure): Promise<ServicePaymentMockRegistrationFailure>;
	public async createPaymentInstrument(request: CreatePaymentInstrumentRequest, failure?: ServicePaymentMockFailure): Promise<ServicePaymentMockRegistrationResult> {
		await Promise.resolve();
		this.requirePaymentInstrumentRegistration(request.paymentInstrumentRegistration);
		if (failure !== undefined) {
			return { vendor: mockVendor, isSuccess: false, errorOccurredAt: new Date(), ...mockFailureDetails(failure) };
		}
		const paymentInstrument: PaymentInstrumentReference = {
			vendor: mockVendor,
			paymentInstrumentId: `mock-payment-instrument-${++this.paymentInstrumentSequence}`,
		};

		this.instruments.set(paymentInstrument.paymentInstrumentId, paymentInstrument);
		return { ...paymentInstrument };
	}

	public chargePayment(transaction: PaymentTransactionSubmission): Promise<PaymentTransactionReference>;
	public chargePayment(transaction: PaymentTransactionSubmission, failure: ServicePaymentMockFailure): Promise<PaymentTransactionReference>;
	public async chargePayment(transaction: PaymentTransactionSubmission, failure?: ServicePaymentMockFailure): Promise<PaymentTransactionReference> {
		await Promise.resolve();
		if (this.refunds.has(transaction.referenceId)) {
			throw new Error(`Payment reference '${transaction.referenceId}' already belongs to a refund`);
		}
		const existingTransaction = this.transactions.get(transaction.referenceId);
		if (existingTransaction) {
			this.requireMatchingChargeSubmission(existingTransaction, transaction);
			return cloneTransaction(existingTransaction);
		}
		this.requireInstrument(transaction.paymentInstrument);
		this.requirePaymentAmount(transaction.amount);

		const now = new Date();
		const paymentTransaction: PaymentTransactionReference = {
			vendor: mockVendor,
			isSuccess: failure === undefined,
			lastRequestedAt: now,
			referenceId: transaction.referenceId,
			amount: { ...transaction.amount },
			...(failure === undefined ? { transactionId: `mock-payment-transaction-${++this.transactionSequence}`, completedAt: now } : { errorOccurredAt: now, ...mockFailureDetails(failure) }),
		};

		this.transactions.set(paymentTransaction.referenceId, paymentTransaction);
		this.chargedInstrumentIds.set(paymentTransaction.referenceId, transaction.paymentInstrument.paymentInstrumentId);
		return cloneTransaction(paymentTransaction);
	}

	public refundPayment(refund: PaymentTransactionRefundSubmission): Promise<PaymentTransactionReference>;
	public refundPayment(refund: PaymentTransactionRefundSubmission, failure: ServicePaymentMockFailure): Promise<PaymentTransactionReference>;
	public async refundPayment(refund: PaymentTransactionRefundSubmission, failure?: ServicePaymentMockFailure): Promise<PaymentTransactionReference> {
		await Promise.resolve();
		const transaction = this.findTransaction(refund.transaction);
		if (this.refundedTransactionReferenceIds.has(transaction.referenceId)) {
			throw new Error(`Payment transaction '${transaction.referenceId}' cannot be refunded because it is already a refund`);
		}
		if (!transaction.isSuccess || !transaction.completedAt) {
			throw new Error('Only completed successful payment transactions can be refunded');
		}
		const existingRefund = this.refunds.get(refund.referenceId);
		if (existingRefund) {
			this.requireMatchingRefundSubmission(existingRefund, transaction, refund);
			return cloneTransaction(existingRefund.transaction);
		}
		if (this.transactions.has(refund.referenceId)) {
			throw new Error(`Payment reference '${refund.referenceId}' already belongs to a transaction`);
		}
		this.requireRefundAmount(transaction, refund);

		const now = new Date();
		const refundedTransaction: PaymentTransactionReference = {
			vendor: mockVendor,
			isSuccess: failure === undefined,
			lastRequestedAt: now,
			referenceId: refund.referenceId,
			amount: { ...refund.amount },
			...(failure === undefined ? { transactionId: `mock-payment-refund-${++this.transactionSequence}`, completedAt: now } : { errorOccurredAt: now, ...mockFailureDetails(failure) }),
		};
		this.transactions.set(refundedTransaction.referenceId, refundedTransaction);
		this.refunds.set(refund.referenceId, { originalTransactionReferenceId: transaction.referenceId, transaction: refundedTransaction });
		this.refundedTransactionReferenceIds.add(refundedTransaction.referenceId);
		if (refundedTransaction.isSuccess) {
			this.refundedAmounts.set(transaction.referenceId, (this.refundedAmounts.get(transaction.referenceId) ?? 0) + refund.amount.amount);
		}

		return cloneTransaction(refundedTransaction);
	}

	public async getPaymentTransaction(lookup: PaymentTransactionLookup): Promise<PaymentTransactionReference> {
		await Promise.resolve();
		return cloneTransaction(this.findTransaction(lookup));
	}

	public async createRecurringPaymentPlan(request: CreateRecurringPaymentPlanRequest): Promise<RecurringPaymentPlanReference> {
		await Promise.resolve();
		this.requireRecurringPaymentPlan(request);
		const planReference: RecurringPaymentPlanReference = {
			vendor: mockVendor,
			planId: `mock-recurring-payment-plan-${++this.recurringPaymentPlanSequence}`,
		};
		const plan: RecurringPaymentPlan = {
			vendorPlan: planReference,
			amount: request.amount,
			schedule: request.schedule,
		};

		this.recurringPaymentPlans.set(planReference.planId, cloneRecurringPaymentPlan(plan));
		return { ...planReference };
	}

	public async getRecurringPaymentPlan(lookup: RecurringPaymentPlanLookup): Promise<RecurringPaymentPlan> {
		await Promise.resolve();
		return cloneRecurringPaymentPlan(this.findRecurringPaymentPlan(lookup));
	}

	public createSubscription(subscription: SubscriptionSubmission): Promise<SubscriptionReference>;
	public createSubscription(subscription: SubscriptionSubmission, failure: ServicePaymentMockFailure): Promise<SubscriptionReference>;
	public async createSubscription(subscription: SubscriptionSubmission, failure?: ServicePaymentMockFailure): Promise<SubscriptionReference> {
		await Promise.resolve();
		this.requireInstrument(subscription.paymentInstrument);
		if (this.subscriptions.has(subscription.referenceId)) {
			throw new Error(`Subscription '${subscription.referenceId}' already exists`);
		}
		if (failure !== undefined) {
			throw new Error(mockFailureDetails(failure).errorMessage);
		}

		const plan = this.resolveRecurringPaymentPlan(subscription.plan);
		const payment: SubscriptionReference = {
			vendor: mockVendor,
			referenceId: subscription.referenceId,
			subscriptionId: `mock-subscription-${++this.subscriptionSequence}`,
			status: 'created',
			paymentInstrument: { ...subscription.paymentInstrument },
			plan,
			completedBillingCycles: 0,
			startedAt: new Date(subscription.startAt),
		};
		this.subscriptions.set(payment.referenceId, cloneSubscription(payment));

		return cloneSubscription(payment);
	}

	public async getSubscription(lookup: SubscriptionLookup): Promise<SubscriptionReference> {
		await Promise.resolve();
		return cloneSubscription(this.findSubscription(lookup));
	}

	public async updateSubscription(request: SubscriptionUpdate): Promise<SubscriptionReference> {
		await Promise.resolve();
		const payment = this.findSubscription(request.subscription);
		if (payment.status === 'cancelled') {
			throw new Error('Cancelled subscriptions cannot be updated');
		}
		this.requirePaymentAmount(request.amount);

		const updatedPayment: SubscriptionReference = {
			...payment,
			plan: { ...payment.plan, amount: { ...request.amount } },
		};
		this.subscriptions.set(updatedPayment.referenceId, cloneSubscription(updatedPayment));

		return cloneSubscription(updatedPayment);
	}

	public async cancelSubscription(lookup: SubscriptionLookup): Promise<SubscriptionReference> {
		await Promise.resolve();
		const payment = this.findSubscription(lookup);
		if (payment.status === 'cancelled') {
			throw new Error(`Subscription '${payment.referenceId}' has already been cancelled`);
		}

		const cancelledPayment: SubscriptionReference = {
			...payment,
			status: 'cancelled',
			cancelledAt: new Date(),
		};
		this.subscriptions.set(cancelledPayment.referenceId, cloneSubscription(cancelledPayment));

		return cloneSubscription(cancelledPayment);
	}

	private requireInstrument(paymentInstrument: PaymentInstrumentReference): void {
		if (paymentInstrument.vendor !== mockVendor || !this.instruments.has(paymentInstrument.paymentInstrumentId)) {
			throw new Error(`Payment instrument '${paymentInstrument.paymentInstrumentId}' was not found`);
		}
	}

	private requirePaymentInstrumentRegistration(registration: PaymentInstrumentRegistration): void {
		if (typeof registration.paymentToken !== 'string' || registration.paymentToken.length === 0) {
			throw new Error('Payment token must be a non-empty string');
		}
	}

	private requirePaymentAmount(amount: PaymentAmount): void {
		if (!Number.isInteger(amount.amount) || amount.amount <= 0) {
			throw new Error('Payment amount must be a positive integer');
		}
		if (!/^[A-Z]{3}$/.test(amount.currency)) {
			throw new Error('Payment currency must be an uppercase ISO 4217 code');
		}
	}

	private requireRecurringPaymentPlan(plan: Omit<RecurringPaymentPlan, 'vendorPlan'>): void {
		this.requirePaymentAmount(plan.amount);
		if (!Number.isInteger(plan.schedule.billingCycle.every) || plan.schedule.billingCycle.every <= 0) {
			throw new Error('Billing cycle interval must be a positive integer');
		}
		if (plan.schedule.maximumCycles !== undefined && (!Number.isInteger(plan.schedule.maximumCycles) || plan.schedule.maximumCycles <= 0)) {
			throw new Error('Maximum billing cycles must be a positive integer');
		}
	}

	private findTransaction(lookup: PaymentTransactionLookup): PaymentTransactionReference {
		if (lookup.vendor !== mockVendor) {
			throw new Error(`Payment transaction for vendor '${lookup.vendor}' was not found`);
		}

		for (const transaction of this.transactions.values()) {
			if (
				(lookup.referenceId && transaction.referenceId === lookup.referenceId) ||
				(lookup.transactionId && transaction.transactionId === lookup.transactionId) ||
				(lookup.reconciliationId && transaction.reconciliationId === lookup.reconciliationId)
			) {
				return transaction;
			}
		}

		throw new Error('Payment transaction was not found');
	}

	private requireMatchingChargeSubmission(existingTransaction: PaymentTransactionReference, transaction: PaymentTransactionSubmission): void {
		if (
			existingTransaction.amount.amount !== transaction.amount.amount ||
			existingTransaction.amount.currency !== transaction.amount.currency ||
			this.chargedInstrumentIds.get(existingTransaction.referenceId) !== transaction.paymentInstrument.paymentInstrumentId
		) {
			throw new Error(`Charge reference '${transaction.referenceId}' does not match the original submission`);
		}
	}

	private requireMatchingRefundSubmission(existingRefund: MockRefund, transaction: PaymentTransactionReference, refund: PaymentTransactionRefundSubmission): void {
		if (existingRefund.originalTransactionReferenceId !== transaction.referenceId || existingRefund.transaction.amount.amount !== refund.amount.amount || existingRefund.transaction.amount.currency !== refund.amount.currency) {
			throw new Error(`Refund reference '${refund.referenceId}' does not match the original submission`);
		}
	}

	private requireRefundAmount(transaction: PaymentTransactionReference, refund: PaymentTransactionRefundSubmission): void {
		if (transaction.amount.currency !== refund.amount.currency) {
			throw new Error('Refund currency must match the original transaction');
		}
		if (refund.amount.amount <= 0 || !Number.isInteger(refund.amount.amount)) {
			throw new Error('Refund amount must be a positive integer');
		}
		const refundedAmount = this.refundedAmounts.get(transaction.referenceId) ?? 0;
		if (refund.amount.amount > transaction.amount.amount - refundedAmount) {
			throw new Error('Refund amount exceeds the remaining refundable amount');
		}
	}

	private findRecurringPaymentPlan(lookup: RecurringPaymentPlanLookup): RecurringPaymentPlan {
		if (lookup.vendor !== mockVendor || !this.recurringPaymentPlans.has(lookup.planId)) {
			throw new Error(`Recurring payment plan '${lookup.planId}' was not found`);
		}

		return this.recurringPaymentPlans.get(lookup.planId) as RecurringPaymentPlan;
	}

	private resolveRecurringPaymentPlan(submission: RecurringPaymentPlanSubmission): RecurringPaymentPlan {
		if ('vendorPlan' in submission) {
			return cloneRecurringPaymentPlan(this.findRecurringPaymentPlan(submission.vendorPlan));
		}
		this.requireRecurringPaymentPlan(submission);

		return cloneRecurringPaymentPlan({
			amount: submission.amount,
			schedule: submission.schedule,
		});
	}

	private findSubscription(lookup: SubscriptionLookup): SubscriptionReference {
		if (lookup.vendor !== mockVendor) {
			throw new Error(`Subscription for vendor '${lookup.vendor}' was not found`);
		}

		for (const payment of this.subscriptions.values()) {
			if ((lookup.referenceId && payment.referenceId === lookup.referenceId) || (lookup.subscriptionId && payment.subscriptionId === lookup.subscriptionId)) {
				return payment;
			}
		}

		throw new Error('Subscription was not found');
	}
}

function cloneTransaction(transaction: PaymentTransactionReference): PaymentTransactionReference {
	return {
		...transaction,
		amount: { ...transaction.amount },
		lastRequestedAt: new Date(transaction.lastRequestedAt),
		...(transaction.completedAt ? { completedAt: new Date(transaction.completedAt) } : {}),
		...(transaction.errorOccurredAt ? { errorOccurredAt: new Date(transaction.errorOccurredAt) } : {}),
	};
}

function cloneRecurringPaymentPlan(plan: RecurringPaymentPlan): RecurringPaymentPlan {
	return {
		...(plan.vendorPlan ? { vendorPlan: { ...plan.vendorPlan } } : {}),
		amount: { ...plan.amount },
		schedule: {
			billingCycle: { ...plan.schedule.billingCycle },
			...(plan.schedule.maximumCycles === undefined ? {} : { maximumCycles: plan.schedule.maximumCycles }),
		},
	};
}

function cloneSubscription(payment: SubscriptionReference): SubscriptionReference {
	return {
		...payment,
		paymentInstrument: { ...payment.paymentInstrument },
		plan: cloneRecurringPaymentPlan(payment.plan),
		...(payment.startedAt ? { startedAt: new Date(payment.startedAt) } : {}),
		...(payment.nextPaymentAt ? { nextPaymentAt: new Date(payment.nextPaymentAt) } : {}),
		...(payment.cancelledAt ? { cancelledAt: new Date(payment.cancelledAt) } : {}),
		...(payment.completedAt ? { completedAt: new Date(payment.completedAt) } : {}),
	};
}

function mockFailureDetails(failure: ServicePaymentMockFailure): { errorCode: string; errorMessage: string } {
	switch (failure) {
		case 'declined':
			return { errorCode: failure, errorMessage: 'Mock payment was declined' };
		case 'processing-error':
			return { errorCode: failure, errorMessage: 'Mock payment provider could not process the request' };
		case 'provider-unavailable':
			return { errorCode: failure, errorMessage: 'Mock payment provider is unavailable' };
		case 'invalid-payment-instrument':
			return { errorCode: failure, errorMessage: 'Mock payment instrument was rejected by the provider' };
		case 'token-invalid':
			return { errorCode: failure, errorMessage: 'Mock payment token was rejected by the provider' };
		case 'token-expired':
			return { errorCode: failure, errorMessage: 'Mock payment token has expired' };
	}
}
