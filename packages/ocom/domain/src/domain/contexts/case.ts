/**
 * Case Context - Aggregate Exports
 * 
 * This file serves as the single entry point for all Case context exports.
 * It consolidates exports from entities, value objects, repositories, and unit of work types.
 */

//#region Exports

// ServiceTicketV1 Aggregate
export {
	ServiceTicketV1,
	type ServiceTicketV1EntityReference,
	type ServiceTicketV1Props,
} from './case/service-ticket/v1/service-ticket-v1.aggregate.ts';

// ServiceTicketV1 Repository & Unit of Work
export type { ServiceTicketV1Repository } from './case/service-ticket/v1/service-ticket-v1.repository.ts';
export type { ServiceTicketV1UnitOfWork } from './case/service-ticket/v1/service-ticket-v1.uow.ts';

// ServiceTicketV1 Entities
export type { ServiceTicketV1ActivityDetailProps } from './case/service-ticket/v1/service-ticket-v1-activity-detail.entity.ts';
export type { ServiceTicketV1MessageProps } from './case/service-ticket/v1/service-ticket-v1-message.entity.ts';

// ServiceTicketV1 Visa
export type { ServiceTicketV1Visa } from './case/service-ticket/v1/service-ticket-v1.visa.ts';

// ViolationTicketV1 Aggregate
export {
	ViolationTicketV1,
	type ViolationTicketV1EntityReference,
	type ViolationTicketV1Props,
} from './case/violation-ticket/v1/violation-ticket-v1.aggregate.ts';

// ViolationTicketV1 Repository & Unit of Work
export type { ViolationTicketV1Repository } from './case/violation-ticket/v1/violation-ticket-v1.repository.ts';
export type { ViolationTicketV1UnitOfWork } from './case/violation-ticket/v1/violation-ticket-v1.uow.ts';

// ViolationTicketV1 Entities
export type {
	ViolationTicketV1ActivityDetailEntityReference,
	ViolationTicketV1ActivityDetailProps,
} from './case/violation-ticket/v1/violation-ticket-v1-activity-detail.ts';
export type {
	ViolationTicketV1FinanceDetailEntityReference,
	ViolationTicketV1FinanceDetailProps,
} from './case/violation-ticket/v1/violation-ticket-v1-finance-details.ts';
export type {
	ViolationTicketV1FinanceDetailsAdhocTransactionsEntityReference,
	ViolationTicketV1FinanceDetailsAdhocTransactionsProps,
} from './case/violation-ticket/v1/violation-ticket-v1-finance-details-adhoc-transactions.ts';
export {
	ViolationTicketV1FinanceDetailsAdhocTransactionsApproval,
	type ViolationTicketV1FinanceDetailsAdhocTransactionsApprovalEntityReference,
	type ViolationTicketV1FinanceDetailsAdhocTransactionsApprovalProps,
} from './case/violation-ticket/v1/violation-ticket-v1-finance-details-adhoc-transactions-approval.ts';
export {
	ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReference,
	type ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReferenceEntityReference,
	type ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReferenceProps,
} from './case/violation-ticket/v1/violation-ticket-v1-finance-details-adhoc-transactions-finance-reference.ts';
export {
	ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReference,
	type ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReferenceEntityReference,
	type ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReferenceProps,
} from './case/violation-ticket/v1/violation-ticket-v1-finance-details-adhoc-transactions-transaction-reference.ts';
export {
	ViolationTicketV1FinanceDetailsGlTransaction,
	type ViolationTicketV1FinanceDetailsGlTransactionEntityReference,
	type ViolationTicketV1FinanceDetailsGlTransactionProps,
} from './case/violation-ticket/v1/violation-ticket-v1-finance-details-gl-transaction.ts';
export {
	ViolationTicketV1FinanceDetailsRevenueRecognition,
	type ViolationTicketV1FinanceDetailsRevenueRecognitionEntityReference,
	type ViolationTicketV1FinanceDetailsRevenueRecognitionProps,
} from './case/violation-ticket/v1/violation-ticket-v1-finance-details-revenue-recognition.ts';
export {
	ViolationTicketV1FinanceDetailsTransactions,
	type ViolationTicketV1FinanceDetailsTransactionsEntityReference,
	type ViolationTicketV1FinanceDetailsTransactionsProps,
} from './case/violation-ticket/v1/violation-ticket-v1-finance-details-transactions.ts';
export {
	ViolationTicketV1FinanceDetailsTransactionsSubmission,
	type ViolationTicketV1FinanceDetailsTransactionsSubmissionEntityReference,
	type ViolationTicketV1FinanceDetailsTransactionsSubmissionProps,
} from './case/violation-ticket/v1/violation-ticket-v1-finance-details-transactions-submission.ts';
export {
	ViolationTicketV1FinanceDetailsTransactionsSubmissionTransactionReference,
	type ViolationTicketV1FinanceDetailsTransactionsSubmissionTransactionReferenceEntityReference,
	type ViolationTicketV1FinanceDetailsTransactionsSubmissionTransactionReferenceProps,
} from './case/violation-ticket/v1/violation-ticket-v1-finance-details-transactions-submission-transaction-reference.ts';
export type {
	ViolationTicketV1MessageEntityReference,
	ViolationTicketV1MessageProps,
} from './case/violation-ticket/v1/violation-ticket-v1-message.ts';
export type {
	ViolationTicketV1PhotoEntityReference,
	ViolationTicketV1PhotoProps,
} from './case/violation-ticket/v1/violation-ticket-v1-photo.ts';
export type {
	ViolationTicketV1RevisionRequestEntityReference,
	ViolationTicketV1RevisionRequestProps,
} from './case/violation-ticket/v1/violation-ticket-v1-revision-request.ts';

// ViolationTicketV1 Visa
export type { ViolationTicketV1Visa } from './case/violation-ticket/v1/violation-ticket-v1.visa.ts';

// Passport & Visa
export type { CasePassport } from './case/case.passport.ts';
export type { CaseVisa } from './case/case.visa.ts';

// Domain Permissions
export type { CaseDomainPermissions } from './case/case.domain-permissions.ts';

//#endregion
