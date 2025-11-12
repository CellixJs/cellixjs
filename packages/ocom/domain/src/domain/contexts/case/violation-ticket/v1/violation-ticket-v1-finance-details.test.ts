import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
	type ViolationTicketV1FinanceDetailProps,
	ViolationTicketV1FinanceDetails,
} from './violation-ticket-v1-finance-details.ts';
import type { ViolationTicketV1FinanceDetailsRevenueRecognitionEntityReference } from './violation-ticket-v1-finance-details-revenue-recognition.ts';
import type { ViolationTicketV1FinanceDetailsTransactionsEntityReference } from './violation-ticket-v1-finance-details-transactions.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(
		__dirname,
		'features/violation-ticket-v1-finance-details.feature',
	),
);

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let financeDetails: ViolationTicketV1FinanceDetails;
	let props: ViolationTicketV1FinanceDetailProps;
	let transactions: ViolationTicketV1FinanceDetailsTransactionsEntityReference;
	let revenueRecognition: ViolationTicketV1FinanceDetailsRevenueRecognitionEntityReference;

	BeforeEachScenario(() => {
		transactions = {
			id: 'transactions-123',
		} as unknown as ViolationTicketV1FinanceDetailsTransactionsEntityReference;
		revenueRecognition = {
			id: 'revenue-recognition-123',
		} as unknown as ViolationTicketV1FinanceDetailsRevenueRecognitionEntityReference;

		props = {
			serviceFee: 100.5,
			transactions: transactions,
			revenueRecognition: revenueRecognition,
		};
	});

	Scenario(
		'Creating a new ViolationTicketV1FinanceDetails instance',
		({ When, Then, And }) => {
			When(
				'I create a new ViolationTicketV1FinanceDetails with valid properties',
				() => {
					financeDetails = new ViolationTicketV1FinanceDetails(props);
				},
			);

			Then('the instance should be created successfully', () => {
				expect(financeDetails).toBeDefined();
			});

			And('the service fee should be set correctly', () => {
				expect(financeDetails.serviceFee).toBe(100.5);
			});

			And('the transactions should be set correctly', () => {
				expect(financeDetails.transactions).toBe(transactions);
			});

			And('the revenue recognition should be set correctly', () => {
				expect(financeDetails.revenueRecognition).toBe(revenueRecognition);
			});
		},
	);

	Scenario('Setting service fee', ({ When, Then, And }) => {
		When('I have a ViolationTicketV1FinanceDetails instance', () => {
			financeDetails = new ViolationTicketV1FinanceDetails(props);
		});

		And('I set the service fee', () => {
			financeDetails.serviceFee = 200.75;
		});

		Then('the service fee should be updated', () => {
			expect(financeDetails.serviceFee).toBe(200.75);
		});
	});
});
