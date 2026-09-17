import { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import type { BlobStorageOperations } from '@ocom/service-blob-storage';
import type { PaymentOperations } from '@ocom/service-payment';
import type { QueueStorageOperations } from '@ocom/service-queue-storage';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { create } from './create.ts';

vi.spyOn(Domain.Services.Community.CommunityProvisioningService, 'provisionMemberAndDefaultRole').mockResolvedValue(undefined);

describe('community create', () => {
	let getLatestEffective: ReturnType<typeof vi.fn>;
	let configSave: ReturnType<typeof vi.fn>;
	let communitySave: ReturnType<typeof vi.fn>;
	let paymentService: PaymentOperations;
	let dataSources: DataSources;

	beforeEach(() => {
		vi.spyOn(Domain.PassportFactory, 'forSystem').mockReturnValue({} as Domain.Passport);
		getLatestEffective = vi.fn();
		configSave = vi.fn();
		const community = { id: 'community-1', name: 'Beach Community', createdBy: { id: 'user-1' }, finance: { subscriptionTier: 'pro', paymentInstrumentId: null } };
		communitySave = vi.fn(async () => community);
		paymentService = {
			createPaymentInstrument: vi.fn(async () => ({ id: 'pi_1', maskedCardNumber: '****1111', brand: 'visa', expirationMonth: '12', expirationYear: '2030' })),
			updatePaymentInstrument: vi.fn(),
			getPaymentInstrument: vi.fn(),
			processPayment: vi.fn(),
		};

		dataSources = {
			readonlyDataSource: {
				User: { EndUser: { EndUserReadRepo: { getByExternalId: vi.fn(async () => ({ id: 'user-1', displayName: 'Test Owner' })) } } },
				Community: {
					CommunityConfig: { CommunityConfigReadRepo: { getLatestEffective } },
				},
			},
			domainDataSource: {
				Community: {
					CommunityConfig: {
						CommunityConfigUnitOfWork: {
							withTransaction: async (_p: unknown, handler: (repo: unknown) => Promise<void>) => {
								await handler({ getNewInstance: vi.fn(async () => ({}) as never), save: configSave });
							},
						},
					},
					Community: {
						CommunityUnitOfWork: {
							withTransaction: async (_p: unknown, handler: (repo: unknown) => Promise<void>) => {
								await handler({ getNewInstance: vi.fn(async () => community), save: communitySave });
							},
						},
					},
				},
			},
		} as unknown as DataSources;
	});

	const blobStorageService = { uploadText: vi.fn() } as unknown as BlobStorageOperations;
	const queueStorageService = { sendMessageToCommunityCreationQueue: vi.fn() } as unknown as QueueStorageOperations;

	it('creates the default plan configuration when the environment has none', async () => {
		// no configuration on the first read, then the freshly created one
		getLatestEffective
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce(null)
			.mockResolvedValue({ subscription: { pricePerMember: 1000, currency: 'USD' } });

		await create(dataSources, blobStorageService, queueStorageService, paymentService)({ name: 'Beach Community', endUserExternalId: 'external-1' });

		expect(configSave).toHaveBeenCalled();
		expect(communitySave).toHaveBeenCalled();
	});

	it('refuses before vaulting or writing anything when the plan cannot be resolved', async () => {
		getLatestEffective.mockResolvedValue(null);
		// the seeding step reports success but the tier still cannot be resolved
		configSave.mockResolvedValue(undefined);

		await expect(
			create(
				dataSources,
				blobStorageService,
				queueStorageService,
				paymentService,
			)({
				name: 'Beach Community',
				endUserExternalId: 'external-1',
				subscriptionTier: 'enterprise',
				paymentInstrument: { paymentToken: 'tok_visa' },
			}),
		).rejects.toThrow(/No community config found for subscription tier enterprise/);

		expect(paymentService.createPaymentInstrument).not.toHaveBeenCalled();
		expect(communitySave).not.toHaveBeenCalled();
	});
});
