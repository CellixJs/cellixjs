import { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import type { PaymentOperations } from '@ocom/service-payment';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { processSubscriptionCharge } from './process-subscription-charge.ts';
import { querySubscription } from './query-subscription.ts';
import { updateSubscriptionTier } from './update-subscription-tier.ts';

vi.mock('@ocom/domain', async () => {
	const actual = await vi.importActual<typeof import('@ocom/domain')>('@ocom/domain');
	return actual;
});

function makePaymentService(overrides: Partial<PaymentOperations> = {}): PaymentOperations {
	return {
		createPaymentInstrument: vi.fn(),
		updatePaymentInstrument: vi.fn(),
		getPaymentInstrument: vi.fn(),
		processPayment: vi.fn().mockResolvedValue({
			vendor: 'mock',
			isSuccess: true,
			transactionId: 'txn-1',
			completedAt: new Date(),
			lastRequestedAt: new Date(),
		}),
		...overrides,
	};
}

describe('community billing application services', () => {
	let community: {
		finance: {
			subscriptionTier: string;
			paymentInstrumentId: string | null;
			transactions: Array<{ amount: number; transactionReference: { isSuccess?: boolean | null } }>;
		};
		requestNewTransaction: ReturnType<typeof vi.fn>;
	};
	let savedCommunity: unknown;
	let dataSources: DataSources;

	beforeEach(() => {
		community = {
			finance: {
				subscriptionTier: 'pro',
				paymentInstrumentId: 'pi_1',
				transactions: [],
			},
			requestNewTransaction: vi.fn(() => {
				const transaction = {
					amount: 0,
					transactionReference: {},
				};
				community.finance.transactions.push(transaction);
				return transaction;
			}),
		};
		savedCommunity = community;
		dataSources = {
			readonlyDataSource: {
				User: {
					EndUser: {
						EndUserReadRepo: {
							getByExternalId: vi.fn().mockResolvedValue({ id: 'user-1' }),
						},
					},
				},
				Community: {
					Community: {
						CommunityReadRepo: {
							getById: vi.fn().mockResolvedValue(community),
						},
					},
					CommunityConfig: {
						CommunityConfigReadRepo: {
							getLatestEffective: vi.fn().mockResolvedValue({
								subscription: { pricePerMember: 1000, currency: 'USD' },
							}),
						},
					},
					Member: {
						MemberReadRepo: {
							getByCommunityId: vi.fn().mockResolvedValue([{ id: 'member-1' }]),
							getMembersForEndUserExternalId: vi.fn().mockResolvedValue([{ id: 'member-1', communityId: 'community-1' }]),
							getByIdWithCommunityAndRoleAndUser: vi.fn().mockResolvedValue({
								id: 'member-1',
								communityId: 'community-1',
								community: { id: 'community-1' },
								role: {
									permissions: {
										communityPermissions: {
											canManageCommunitySettings: true,
										},
									},
								},
							}),
						},
					},
				},
			},
			domainDataSource: {
				Community: {
					Community: {
						CommunityUnitOfWork: {
							withTransaction: vi.fn(async (_passport, callback: (repo: { get: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> }) => Promise<void>) => {
								await callback({
									get: vi.fn().mockResolvedValue(community),
									save: vi.fn((value) => {
										savedCommunity = value;
										return Promise.resolve(value);
									}),
								});
							}),
						},
					},
				},
			},
		} as unknown as DataSources;
	});

	it('charges memberCount times pricePerMember', async () => {
		const paymentService = makePaymentService();
		vi.spyOn(Domain.PassportFactory, 'forSystem').mockReturnValue({} as Domain.Passport);
		await processSubscriptionCharge(
			dataSources,
			paymentService,
		)({
			communityId: 'community-1',
			useSystemPassport: true,
		});
		expect(paymentService.processPayment).toHaveBeenCalledWith({
			paymentInstrumentId: 'pi_1',
			amount: 1000,
			currency: 'USD',
			referenceId: 'community-1',
		});
		expect(community.finance.transactions[0]?.amount).toBe(1000);
	});

	it('persists a failed payment transaction', async () => {
		const paymentService = makePaymentService({
			processPayment: vi.fn().mockResolvedValue({
				vendor: 'mock',
				isSuccess: false,
				errorCode: 'CHARGE_FAILED',
				errorMessage: 'declined',
			}),
		});
		vi.spyOn(Domain.PassportFactory, 'forSystem').mockReturnValue({} as Domain.Passport);
		await processSubscriptionCharge(
			dataSources,
			paymentService,
		)({
			communityId: 'community-1',
			useSystemPassport: true,
		});
		expect(community.finance.transactions[0]?.transactionReference.isSuccess).toBe(false);
		expect(savedCommunity).toBe(community);
	});

	it('does not create a transaction when changing tiers', async () => {
		vi.spyOn(Domain.PassportFactory, 'forMember').mockReturnValue({
			community: {
				forCommunity: () => ({
					determineIf: (fn: (permissions: { canManageCommunitySettings: boolean; isSystemAccount: boolean }) => boolean) => fn({ canManageCommunitySettings: true, isSystemAccount: false }),
				}),
			},
		} as unknown as Domain.Passport);
		await updateSubscriptionTier(dataSources)({
			communityId: 'community-1',
			subscriptionTier: 'enterprise',
			endUserExternalId: 'alice',
		});
		expect(community.finance.subscriptionTier).toBe('enterprise');
		expect(community.requestNewTransaction).not.toHaveBeenCalled();
	});

	it('computes subscription amount from member count and latest config', async () => {
		(dataSources.readonlyDataSource.Community.Member.MemberReadRepo.getByCommunityId as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: '1' }, { id: '2' }, { id: '3' }]);
		const view = await querySubscription(dataSources)({ communityId: 'community-1' });
		expect(view).toMatchObject({
			tier: 'pro',
			pricePerMember: 1000,
			currency: 'USD',
			memberCount: 3,
			amount: 3000,
		});
	});

	it('rejects charges without a payment instrument', async () => {
		community.finance.paymentInstrumentId = null;
		vi.spyOn(Domain.PassportFactory, 'forSystem').mockReturnValue({} as Domain.Passport);
		await expect(
			processSubscriptionCharge(
				dataSources,
				makePaymentService(),
			)({
				communityId: 'community-1',
				useSystemPassport: true,
			}),
		).rejects.toThrow(/payment instrument/);
	});
});
