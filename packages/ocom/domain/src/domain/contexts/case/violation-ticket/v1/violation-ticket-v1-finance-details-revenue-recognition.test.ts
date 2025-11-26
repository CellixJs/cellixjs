import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { ViolationTicketV1FinanceDetailsGlTransactionEntityReference } from './violation-ticket-v1-finance-details-gl-transaction.ts';
import {
	ViolationTicketV1FinanceDetailsRevenueRecognition,
	type ViolationTicketV1FinanceDetailsRevenueRecognitionProps,
} from './violation-ticket-v1-finance-details-revenue-recognition.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(
		__dirname,
		'features/violation-ticket-v1-finance-details-revenue-recognition.feature',
	),
);

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let revenueRecognition: ViolationTicketV1FinanceDetailsRevenueRecognition;
	let props: ViolationTicketV1FinanceDetailsRevenueRecognitionProps;
	let submission: ViolationTicketV1FinanceDetailsGlTransactionEntityReference;
	let recognition: ViolationTicketV1FinanceDetailsGlTransactionEntityReference;

	BeforeEachScenario(() => {
		submission = {
			id: 'submission-123',
		// biome-ignore lint/plugin/no-type-assertion: test file
		} as unknown as ViolationTicketV1FinanceDetailsGlTransactionEntityReference;
		recognition = {
			id: 'recognition-123',
		// biome-ignore lint/plugin/no-type-assertion: test file
		} as unknown as ViolationTicketV1FinanceDetailsGlTransactionEntityReference;

		props = {
			submission: submission,
			recognition: recognition,
		};
	});

	Scenario(
		'Creating a new ViolationTicketV1FinanceDetailsRevenueRecognition instance',
		({ When, Then, And }) => {
			When(
				'I create a new ViolationTicketV1FinanceDetailsRevenueRecognition with valid properties',
				() => {
					revenueRecognition =
						new ViolationTicketV1FinanceDetailsRevenueRecognition(props);
				},
			);

			Then('the instance should be created successfully', () => {
				expect(revenueRecognition).toBeDefined();
			});

			And('the submission should be set correctly', () => {
				expect(revenueRecognition.submission).toBe(submission);
			});

			And('the recognition should be set correctly', () => {
				expect(revenueRecognition.recognition).toBe(recognition);
			});
		},
	);
});
