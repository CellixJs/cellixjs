import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
	ViolationTicketV1FinanceDetailsTransactionsSubmission,
	type ViolationTicketV1FinanceDetailsTransactionsSubmissionProps,
} from './violation-ticket-v1-finance-details-transactions-submission.ts';
import type { ViolationTicketV1FinanceDetailsTransactionsSubmissionTransactionReferenceEntityReference } from './violation-ticket-v1-finance-details-transactions-submission-transaction-reference.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(
		__dirname,
		'features/violation-ticket-v1-finance-details-transactions-submission.feature',
	),
);

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let submission: ViolationTicketV1FinanceDetailsTransactionsSubmission;
	let props: ViolationTicketV1FinanceDetailsTransactionsSubmissionProps;
	let transactionReference: ViolationTicketV1FinanceDetailsTransactionsSubmissionTransactionReferenceEntityReference;

	BeforeEachScenario(() => {
		transactionReference = {
			referenceId: 'ref-123',
			completedOn: new Date('2023-01-01'),
			vendor: 'Test Vendor',
		} as unknown as ViolationTicketV1FinanceDetailsTransactionsSubmissionTransactionReferenceEntityReference;

		props = {
			amount: 100.5,
			transactionReference: transactionReference,
		};
	});

	Scenario(
		'Creating a new ViolationTicketV1FinanceDetailsTransactionsSubmission instance',
		({ When, Then, And }) => {
			When(
				'I create a new ViolationTicketV1FinanceDetailsTransactionsSubmission with valid properties',
				() => {
					submission =
						new ViolationTicketV1FinanceDetailsTransactionsSubmission(props);
				},
			);

			Then('the amount should be accessible', () => {
				expect(submission.amount).toBe(100.5);
			});

			And('the transaction reference should be accessible', () => {
				expect(submission.transactionReference).toEqual(transactionReference);
			});
		},
	);

	Scenario('Setting amount', ({ Given, When, Then }) => {
		Given(
			'I have a ViolationTicketV1FinanceDetailsTransactionsSubmission instance',
			() => {
				submission = new ViolationTicketV1FinanceDetailsTransactionsSubmission(
					props,
				);
			},
		);

		When('I set the amount to 200.75', () => {
			submission.amount = 200.75;
		});

		Then('the amount should be 200.75', () => {
			expect(submission.amount).toBe(200.75);
		});
	});
});
