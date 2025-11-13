import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
	ViolationTicketV1FinanceDetailsGlTransaction,
	type ViolationTicketV1FinanceDetailsGlTransactionProps,
} from './violation-ticket-v1-finance-details-gl-transaction.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(
		__dirname,
		'features/violation-ticket-v1-finance-details-gl-transaction.feature',
	),
);

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let glTransaction: ViolationTicketV1FinanceDetailsGlTransaction;
	let props: ViolationTicketV1FinanceDetailsGlTransactionProps;

	BeforeEachScenario(() => {
		props = {
			debitGlAccount: '1000',
			creditGlAccount: '2000',
			amount: 150.25,
			recognitionDate: new Date('2023-01-01'),
			completedOn: new Date('2023-01-02'),
		};
	});

	Scenario(
		'Creating a new ViolationTicketV1FinanceDetailsGlTransaction instance',
		({ When, Then, And }) => {
			When(
				'I create a new ViolationTicketV1FinanceDetailsGlTransaction with valid properties',
				() => {
					glTransaction = new ViolationTicketV1FinanceDetailsGlTransaction(
						props,
					);
				},
			);

			Then('the debit GL account should be accessible', () => {
				expect(glTransaction.debitGlAccount).toBe('1000');
			});

			And('the credit GL account should be accessible', () => {
				expect(glTransaction.creditGlAccount).toBe('2000');
			});

			And('the amount should be accessible', () => {
				expect(glTransaction.amount).toBe(150.25);
			});

			And('the recognition date should be accessible', () => {
				expect(glTransaction.recognitionDate).toEqual(new Date('2023-01-01'));
			});

			And('the completed on date should be accessible', () => {
				expect(glTransaction.completedOn).toEqual(new Date('2023-01-02'));
			});
		},
	);

	Scenario('Setting debit GL account', ({ Given, When, Then }) => {
		Given(
			'I have a ViolationTicketV1FinanceDetailsGlTransaction instance',
			() => {
				glTransaction = new ViolationTicketV1FinanceDetailsGlTransaction(props);
			},
		);

		When('I set the debit GL account to "3000"', () => {
			glTransaction.debitGlAccount = '3000';
		});

		Then('the debit GL account should be "3000"', () => {
			expect(glTransaction.debitGlAccount).toBe('3000');
		});
	});

	Scenario('Setting credit GL account', ({ Given, When, Then }) => {
		Given(
			'I have a ViolationTicketV1FinanceDetailsGlTransaction instance',
			() => {
				glTransaction = new ViolationTicketV1FinanceDetailsGlTransaction(props);
			},
		);

		When('I set the credit GL account to "4000"', () => {
			glTransaction.creditGlAccount = '4000';
		});

		Then('the credit GL account should be "4000"', () => {
			expect(glTransaction.creditGlAccount).toBe('4000');
		});
	});

	Scenario('Setting amount', ({ Given, When, Then }) => {
		Given(
			'I have a ViolationTicketV1FinanceDetailsGlTransaction instance',
			() => {
				glTransaction = new ViolationTicketV1FinanceDetailsGlTransaction(props);
			},
		);

		When('I set the amount to 250.50', () => {
			glTransaction.amount = 250.5;
		});

		Then('the amount should be 250.50', () => {
			expect(glTransaction.amount).toBe(250.5);
		});
	});

	Scenario('Setting recognition date', ({ Given, When, Then }) => {
		Given(
			'I have a ViolationTicketV1FinanceDetailsGlTransaction instance',
			() => {
				glTransaction = new ViolationTicketV1FinanceDetailsGlTransaction(props);
			},
		);

		When('I set the recognition date to a new date', () => {
			const newDate = new Date('2023-02-01');
			glTransaction.recognitionDate = newDate;
		});

		Then('the recognition date should be the new date', () => {
			expect(glTransaction.recognitionDate).toEqual(new Date('2023-02-01'));
		});
	});

	Scenario('Setting completed on date', ({ Given, When, Then }) => {
		Given(
			'I have a ViolationTicketV1FinanceDetailsGlTransaction instance',
			() => {
				glTransaction = new ViolationTicketV1FinanceDetailsGlTransaction(props);
			},
		);

		When('I set the completed on date to undefined', () => {
			glTransaction.completedOn = undefined;
		});

		Then('the completed on date should be undefined', () => {
			expect(glTransaction.completedOn).toBeUndefined();
		});
	});
});
