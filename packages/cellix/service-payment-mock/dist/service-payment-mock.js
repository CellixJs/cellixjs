const mockVendor = 'mock';
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
export class ServicePaymentMock {
    instruments = new Map();
    transactions = new Map();
    chargedInstrumentIds = new Map();
    refundedTransactionReferenceIds = new Set();
    recurringPaymentPlans = new Map();
    recurringPayments = new Map();
    refunds = new Map();
    refundedAmounts = new Map();
    paymentInstrumentSequence = 0;
    transactionSequence = 0;
    recurringPaymentPlanSequence = 0;
    recurringPaymentSequence = 0;
    async startUp() {
        await Promise.resolve();
        return this;
    }
    async shutDown() {
        await Promise.resolve();
    }
    async createPaymentInstrument(request, failure) {
        await Promise.resolve();
        this.requirePaymentInstrumentRegistration(request.paymentInstrumentRegistration);
        if (failure !== undefined) {
            return { vendor: mockVendor, isSuccess: false, errorOccurredAt: new Date(), ...mockFailureDetails(failure) };
        }
        const paymentInstrument = {
            vendor: mockVendor,
            paymentInstrumentId: `mock-payment-instrument-${++this.paymentInstrumentSequence}`,
        };
        this.instruments.set(paymentInstrument.paymentInstrumentId, paymentInstrument);
        return { ...paymentInstrument };
    }
    async chargePayment(transaction, failure) {
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
        const paymentTransaction = {
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
    async refundPayment(refund, failure) {
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
        const refundedTransaction = {
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
    async getPaymentTransaction(lookup) {
        await Promise.resolve();
        return cloneTransaction(this.findTransaction(lookup));
    }
    async createRecurringPaymentPlan(request) {
        await Promise.resolve();
        this.requireRecurringPaymentPlan(request);
        const planReference = {
            vendor: mockVendor,
            planId: `mock-recurring-payment-plan-${++this.recurringPaymentPlanSequence}`,
        };
        const plan = {
            vendorPlan: planReference,
            amount: request.amount,
            schedule: request.schedule,
        };
        this.recurringPaymentPlans.set(planReference.planId, cloneRecurringPaymentPlan(plan));
        return { ...planReference };
    }
    async getRecurringPaymentPlan(lookup) {
        await Promise.resolve();
        return cloneRecurringPaymentPlan(this.findRecurringPaymentPlan(lookup));
    }
    async createRecurringPayment(recurringPayment, failure) {
        await Promise.resolve();
        this.requireInstrument(recurringPayment.paymentInstrument);
        if (this.recurringPayments.has(recurringPayment.referenceId)) {
            throw new Error(`Recurring payment '${recurringPayment.referenceId}' already exists`);
        }
        const plan = this.resolveRecurringPaymentPlan(recurringPayment.plan);
        const payment = {
            vendor: mockVendor,
            referenceId: recurringPayment.referenceId,
            status: failure === undefined ? 'active' : 'failed',
            paymentInstrument: { ...recurringPayment.paymentInstrument },
            plan,
            completedBillingCycles: 0,
            ...(failure === undefined ? { subscriptionId: `mock-recurring-payment-${++this.recurringPaymentSequence}`, startedAt: new Date() } : mockFailureDetails(failure)),
        };
        this.recurringPayments.set(payment.referenceId, cloneRecurringPayment(payment));
        return cloneRecurringPayment(payment);
    }
    async updateRecurringPayment(request) {
        await Promise.resolve();
        const payment = this.findRecurringPayment(request.recurringPayment);
        if (payment.status === 'cancelled') {
            throw new Error('Cancelled recurring payments cannot be updated');
        }
        if (request.paymentInstrument) {
            this.requireInstrument(request.paymentInstrument);
        }
        const updatedPayment = {
            ...payment,
            paymentInstrument: request.paymentInstrument ? { ...request.paymentInstrument } : payment.paymentInstrument,
            plan: request.plan ? this.resolveRecurringPaymentPlan(request.plan) : payment.plan,
        };
        this.recurringPayments.set(updatedPayment.referenceId, cloneRecurringPayment(updatedPayment));
        return cloneRecurringPayment(updatedPayment);
    }
    async cancelRecurringPayment(lookup) {
        await Promise.resolve();
        const payment = this.findRecurringPayment(lookup);
        if (payment.status === 'cancelled') {
            throw new Error(`Recurring payment '${payment.referenceId}' has already been cancelled`);
        }
        const cancelledPayment = {
            ...payment,
            status: 'cancelled',
            cancelledAt: new Date(),
        };
        this.recurringPayments.set(cancelledPayment.referenceId, cloneRecurringPayment(cancelledPayment));
        return cloneRecurringPayment(cancelledPayment);
    }
    requireInstrument(paymentInstrument) {
        if (paymentInstrument.vendor !== mockVendor || !this.instruments.has(paymentInstrument.paymentInstrumentId)) {
            throw new Error(`Payment instrument '${paymentInstrument.paymentInstrumentId}' was not found`);
        }
    }
    requirePaymentInstrumentRegistration(registration) {
        if (typeof registration.paymentToken !== 'string' || registration.paymentToken.length === 0) {
            throw new Error('Payment token must be a non-empty string');
        }
    }
    requirePaymentAmount(amount) {
        if (!Number.isInteger(amount.amount) || amount.amount <= 0) {
            throw new Error('Payment amount must be a positive integer');
        }
        if (!/^[A-Z]{3}$/.test(amount.currency)) {
            throw new Error('Payment currency must be an uppercase ISO 4217 code');
        }
    }
    requireRecurringPaymentPlan(plan) {
        this.requirePaymentAmount(plan.amount);
        if (!Number.isInteger(plan.schedule.billingCycle.every) || plan.schedule.billingCycle.every <= 0) {
            throw new Error('Billing cycle interval must be a positive integer');
        }
        if (plan.schedule.maximumCycles !== undefined && (!Number.isInteger(plan.schedule.maximumCycles) || plan.schedule.maximumCycles <= 0)) {
            throw new Error('Maximum billing cycles must be a positive integer');
        }
    }
    findTransaction(lookup) {
        if (lookup.vendor !== mockVendor) {
            throw new Error(`Payment transaction for vendor '${lookup.vendor}' was not found`);
        }
        for (const transaction of this.transactions.values()) {
            if ((lookup.referenceId && transaction.referenceId === lookup.referenceId) ||
                (lookup.transactionId && transaction.transactionId === lookup.transactionId) ||
                (lookup.reconciliationId && transaction.reconciliationId === lookup.reconciliationId)) {
                return transaction;
            }
        }
        throw new Error('Payment transaction was not found');
    }
    requireMatchingChargeSubmission(existingTransaction, transaction) {
        if (existingTransaction.amount.amount !== transaction.amount.amount ||
            existingTransaction.amount.currency !== transaction.amount.currency ||
            this.chargedInstrumentIds.get(existingTransaction.referenceId) !== transaction.paymentInstrument.paymentInstrumentId) {
            throw new Error(`Charge reference '${transaction.referenceId}' does not match the original submission`);
        }
    }
    requireMatchingRefundSubmission(existingRefund, transaction, refund) {
        if (existingRefund.originalTransactionReferenceId !== transaction.referenceId || existingRefund.transaction.amount.amount !== refund.amount.amount || existingRefund.transaction.amount.currency !== refund.amount.currency) {
            throw new Error(`Refund reference '${refund.referenceId}' does not match the original submission`);
        }
    }
    requireRefundAmount(transaction, refund) {
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
    findRecurringPaymentPlan(lookup) {
        if (lookup.vendor !== mockVendor || !this.recurringPaymentPlans.has(lookup.planId)) {
            throw new Error(`Recurring payment plan '${lookup.planId}' was not found`);
        }
        return this.recurringPaymentPlans.get(lookup.planId);
    }
    resolveRecurringPaymentPlan(submission) {
        if ('vendorPlan' in submission) {
            return cloneRecurringPaymentPlan(this.findRecurringPaymentPlan(submission.vendorPlan));
        }
        this.requireRecurringPaymentPlan(submission);
        return cloneRecurringPaymentPlan({
            amount: submission.amount,
            schedule: submission.schedule,
        });
    }
    findRecurringPayment(lookup) {
        if (lookup.vendor !== mockVendor) {
            throw new Error(`Recurring payment for vendor '${lookup.vendor}' was not found`);
        }
        for (const payment of this.recurringPayments.values()) {
            if ((lookup.referenceId && payment.referenceId === lookup.referenceId) || (lookup.subscriptionId && payment.subscriptionId === lookup.subscriptionId)) {
                return payment;
            }
        }
        throw new Error('Recurring payment was not found');
    }
}
function cloneTransaction(transaction) {
    return {
        ...transaction,
        amount: { ...transaction.amount },
        lastRequestedAt: new Date(transaction.lastRequestedAt),
        ...(transaction.completedAt ? { completedAt: new Date(transaction.completedAt) } : {}),
        ...(transaction.errorOccurredAt ? { errorOccurredAt: new Date(transaction.errorOccurredAt) } : {}),
    };
}
function cloneRecurringPaymentPlan(plan) {
    return {
        ...(plan.vendorPlan ? { vendorPlan: { ...plan.vendorPlan } } : {}),
        amount: { ...plan.amount },
        schedule: {
            billingCycle: { ...plan.schedule.billingCycle },
            ...(plan.schedule.maximumCycles === undefined ? {} : { maximumCycles: plan.schedule.maximumCycles }),
        },
    };
}
function cloneRecurringPayment(payment) {
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
function mockFailureDetails(failure) {
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
//# sourceMappingURL=service-payment-mock.js.map