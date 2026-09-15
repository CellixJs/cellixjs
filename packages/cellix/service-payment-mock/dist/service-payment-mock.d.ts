import type { ServiceBase } from '@cellix/api-services-spec';
import type { CreatePaymentInstrumentRequest, CreateRecurringPaymentPlanRequest, PaymentInstrumentReference, PaymentService, PaymentTransactionLookup, PaymentTransactionReference, PaymentTransactionRefundSubmission, PaymentTransactionSubmission, RecurringPaymentLookup, RecurringPaymentPlan, RecurringPaymentPlanLookup, RecurringPaymentPlanReference, RecurringPaymentReference, RecurringPaymentSubmission, RecurringPaymentUpdate } from '@cellix/service-payment';
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
export declare class ServicePaymentMock implements ServiceBase<PaymentService>, PaymentService {
    private readonly instruments;
    private readonly transactions;
    private readonly chargedInstrumentIds;
    private readonly refundedTransactionReferenceIds;
    private readonly recurringPaymentPlans;
    private readonly recurringPayments;
    private readonly refunds;
    private readonly refundedAmounts;
    private paymentInstrumentSequence;
    private transactionSequence;
    private recurringPaymentPlanSequence;
    private recurringPaymentSequence;
    startUp(): Promise<PaymentService>;
    shutDown(): Promise<void>;
    createPaymentInstrument(request: CreatePaymentInstrumentRequest): Promise<PaymentInstrumentReference>;
    createPaymentInstrument(request: CreatePaymentInstrumentRequest, failure: ServicePaymentMockFailure): Promise<ServicePaymentMockRegistrationFailure>;
    chargePayment(transaction: PaymentTransactionSubmission): Promise<PaymentTransactionReference>;
    chargePayment(transaction: PaymentTransactionSubmission, failure: ServicePaymentMockFailure): Promise<PaymentTransactionReference>;
    refundPayment(refund: PaymentTransactionRefundSubmission): Promise<PaymentTransactionReference>;
    refundPayment(refund: PaymentTransactionRefundSubmission, failure: ServicePaymentMockFailure): Promise<PaymentTransactionReference>;
    getPaymentTransaction(lookup: PaymentTransactionLookup): Promise<PaymentTransactionReference>;
    createRecurringPaymentPlan(request: CreateRecurringPaymentPlanRequest): Promise<RecurringPaymentPlanReference>;
    getRecurringPaymentPlan(lookup: RecurringPaymentPlanLookup): Promise<RecurringPaymentPlan>;
    createRecurringPayment(recurringPayment: RecurringPaymentSubmission): Promise<RecurringPaymentReference>;
    createRecurringPayment(recurringPayment: RecurringPaymentSubmission, failure: ServicePaymentMockFailure): Promise<RecurringPaymentReference>;
    updateRecurringPayment(request: RecurringPaymentUpdate): Promise<RecurringPaymentReference>;
    cancelRecurringPayment(lookup: RecurringPaymentLookup): Promise<RecurringPaymentReference>;
    private requireInstrument;
    private requirePaymentInstrumentRegistration;
    private requirePaymentAmount;
    private requireRecurringPaymentPlan;
    private findTransaction;
    private requireMatchingChargeSubmission;
    private requireMatchingRefundSubmission;
    private requireRefundAmount;
    private findRecurringPaymentPlan;
    private resolveRecurringPaymentPlan;
    private findRecurringPayment;
}
