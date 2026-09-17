import type { Community } from '@ocom/data-sources-mongoose-models/community';
import { describe, expect, it, vi } from 'vitest';
import { CommunityDomainAdapter } from './community.domain-adapter.ts';

function makeCommunityDoc(overrides: Partial<Community> = {}) {
	const base = {
		name: 'Test Community',
		domain: 'test.com',
		whiteLabelDomain: 'white.test.com',
		handle: 'test-handle',
		createdBy: undefined,
		finance: {
			subscriptionTier: 'pro',
			paymentInstrumentId: undefined,
			transactions: [],
		},
		set: vi.fn(function (this: Community, key: keyof Community, value: unknown) {
			(this as Community)[key] = value as never;
		}),
		...overrides,
	} as Community;
	return vi.mocked(base);
}

describe('CommunityDomainAdapter finance mapping', () => {
	it('exposes default Pro finance when the nested path is missing', () => {
		const doc = makeCommunityDoc({ finance: undefined as unknown as Community['finance'] });
		const adapter = new CommunityDomainAdapter(doc);
		expect(adapter.finance.subscriptionTier).toBe('pro');
		expect(adapter.finance.paymentInstrumentId).toBeNull();
	});

	it('unsets the payment instrument id through the document rather than deleting the nested path', () => {
		const doc = makeCommunityDoc({
			finance: {
				subscriptionTier: 'pro',
				paymentInstrumentId: 'pi_1',
				transactions: [],
			} as unknown as Community['finance'],
		});
		const adapter = new CommunityDomainAdapter(doc);

		adapter.finance.paymentInstrumentId = null;

		expect(doc.set).toHaveBeenCalledWith('finance.paymentInstrumentId', undefined);
		expect(adapter.finance.paymentInstrumentId).toBeNull();
	});

	it('maps paymentInstrumentId and transactions', () => {
		const doc = makeCommunityDoc({
			finance: {
				subscriptionTier: 'enterprise',
				paymentInstrumentId: 'pi_1',
				transactions: [
					{
						_id: { toString: () => 'txn-1' },
						amount: 2000,
						transactionReference: { vendor: 'mock', isSuccess: true },
						createdAt: new Date('2020-01-01T00:00:00Z'),
						updatedAt: new Date('2020-01-01T00:00:00Z'),
					},
				],
			} as unknown as Community['finance'],
		});
		const adapter = new CommunityDomainAdapter(doc);
		expect(adapter.finance.subscriptionTier).toBe('enterprise');
		expect(adapter.finance.paymentInstrumentId).toBe('pi_1');
		expect(adapter.finance.transactions.items[0]?.amount).toBe(2000);
	});
});
