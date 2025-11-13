import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import { expect, vi } from 'vitest';
import type { ViolationTicketV1Visa } from './violation-ticket-v1.visa.ts';
import type { ViolationTicketV1FinanceDetailsAdhocTransactionsEntityReference } from './violation-ticket-v1-finance-details-adhoc-transactions.ts';
import {
	ViolationTicketV1FinanceDetailsTransactions,
	type ViolationTicketV1FinanceDetailsTransactionsProps,
} from './violation-ticket-v1-finance-details-transactions.ts';
import type { ViolationTicketV1FinanceDetailsTransactionsSubmissionEntityReference } from './violation-ticket-v1-finance-details-transactions-submission.ts';

// Mock PropArray for testing
class MockPropArray<T extends DomainSeedwork.DomainEntityProps>
	implements DomainSeedwork.PropArray<T>
{
	private _items: T[];

	constructor(items: T[] = []) {
		this._items = items;
	}

	addItem(item: T): void {
		this._items.push(item);
	}

	removeItem(item: T): void {
		const index = this._items.indexOf(item);
		if (index > -1) {
			this._items.splice(index, 1);
		}
	}

	removeAll(): void {
		this._items = [];
	}

	get length(): number {
		return this._items.length;
	}

	get items(): readonly T[] {
		return this._items;
	}

	getNewItem(): T {
		// Return a mock item - in real usage this would create a new item
		return { id: 'new-item' } as T;
	}

	add(item: T): void {
		this._items.push(item);
	}

	remove(item: T): void {
		const index = this._items.indexOf(item);
		if (index > -1) {
			this._items.splice(index, 1);
		}
	}
}

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(
		__dirname,
		'features/violation-ticket-v1-finance-details-transactions.feature',
	),
);

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let transactions: ViolationTicketV1FinanceDetailsTransactions;
	let props: ViolationTicketV1FinanceDetailsTransactionsProps;
	let visa: ViolationTicketV1Visa;
	let submission: ViolationTicketV1FinanceDetailsTransactionsSubmissionEntityReference;
	let adhocTransactions: DomainSeedwork.PropArray<ViolationTicketV1FinanceDetailsAdhocTransactionsEntityReference>;

	BeforeEachScenario(() => {
		submission = {
			id: 'submission-123',
		} as unknown as ViolationTicketV1FinanceDetailsTransactionsSubmissionEntityReference;
		adhocTransactions = new MockPropArray([]);

		visa = {
			determineIf: vi.fn(() => true),
		} as unknown as ViolationTicketV1Visa;

		props = {
			submission: submission,
			adhocTransactions: adhocTransactions,
		};
	});

	Scenario(
		'Creating a new ViolationTicketV1FinanceDetailsTransactions instance',
		({ When, Then, And }) => {
			When(
				'I create a new ViolationTicketV1FinanceDetailsTransactions with valid properties',
				() => {
					transactions = new ViolationTicketV1FinanceDetailsTransactions(
						props,
						visa,
					);
				},
			);

			Then('the instance should be created successfully', () => {
				expect(transactions).toBeDefined();
			});

			And('the submission should be set correctly', () => {
				expect(transactions.submission).toBe(submission);
			});

			And('the adhoc transactions should be accessible', () => {
				expect(transactions.adhocTransactions).toEqual([]);
			});
		},
	);

	Scenario('Requesting to add new adhoc transaction', ({ When, Then, And }) => {
		When(
			'I have a ViolationTicketV1FinanceDetailsTransactions instance',
			() => {
				transactions = new ViolationTicketV1FinanceDetailsTransactions(
					props,
					visa,
				);
			},
		);

		And('I request to add a new adhoc transaction', () => {
			const result = transactions.requestAddNewAdhocTransaction();
			expect(result).toBeDefined();
		});

		Then('a new adhoc transaction should be returned', () => {
			// Already checked
		});
	});
});
