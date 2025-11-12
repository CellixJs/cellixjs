import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
	ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReference,
	type ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReferenceProps,
} from './violation-ticket-v1-finance-details-adhoc-transactions-finance-reference.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(
		__dirname,
		'features/violation-ticket-v1-finance-details-adhoc-transactions-finance-reference.feature',
	),
);

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let financeReference: ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReference;
	let props: ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReferenceProps;

	BeforeEachScenario(() => {
		props = {
			debitGlAccount: '1000',
			creditGlAccount: '2000',
			completedOn: new Date('2023-01-01'),
		};
	});

	Scenario(
		'Creating a new ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReference instance',
		({ When, Then, And }) => {
			When(
				'I create a new ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReference with valid properties',
				() => {
					financeReference =
						new ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReference(
							props,
						);
				},
			);

			Then('the debit GL account should be accessible', () => {
				expect(financeReference.debitGlAccount).toBe('1000');
			});

			And('the credit GL account should be accessible', () => {
				expect(financeReference.creditGlAccount).toBe('2000');
			});

			And('the completed on date should be accessible', () => {
				expect(financeReference.completedOn).toEqual(new Date('2023-01-01'));
			});
		},
	);

	Scenario('Setting debit GL account', ({ Given, When, Then }) => {
		Given(
			'I have a ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReference instance',
			() => {
				financeReference =
					new ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReference(
						props,
					);
			},
		);

		When('I set the debit GL account to "3000"', () => {
			financeReference.debitGlAccount = '3000';
		});

		Then('the debit GL account should be "3000"', () => {
			expect(financeReference.debitGlAccount).toBe('3000');
		});
	});

	Scenario('Setting credit GL account', ({ Given, When, Then }) => {
		Given(
			'I have a ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReference instance',
			() => {
				financeReference =
					new ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReference(
						props,
					);
			},
		);

		When('I set the credit GL account to "4000"', () => {
			financeReference.creditGlAccount = '4000';
		});

		Then('the credit GL account should be "4000"', () => {
			expect(financeReference.creditGlAccount).toBe('4000');
		});
	});

	Scenario('Setting completed on date', ({ Given, When, Then }) => {
		Given(
			'I have a ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReference instance',
			() => {
				financeReference =
					new ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReference(
						props,
					);
			},
		);

		When('I set the completed on date to a new date', () => {
			const newDate = new Date('2023-02-01');
			financeReference.completedOn = newDate;
		});

		Then('the completed on date should be the new date', () => {
			expect(financeReference.completedOn).toEqual(new Date('2023-02-01'));
		});
	});
});
