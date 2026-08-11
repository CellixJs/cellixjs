import { buildApplicationServicesFactory } from '@ocom/application-services';
import { describe, expect, it, vi } from 'vitest';

describe('buildApplicationServicesFactory rate-limit principal', () => {
	it('does not trust a client-supplied community hint as rate-limit scope', async () => {
		const verifyJwt = vi.fn().mockResolvedValue({
			openIdConfigKey: 'AccountPortal',
			verifiedJwt: {
				given_name: 'Account',
				family_name: 'User',
				email: 'account@example.test',
				sub: 'account-1',
			},
		});
		const getCommunityById = vi.fn().mockResolvedValue({ id: 'client-controlled-community' });
		const dataSources = {} as never;
		const context = {
			tokenValidationService: { verifyJwt },
			dataSourcesFactory: {
				withSystemPassport: () => ({
					readonlyDataSource: {
						User: { EndUser: { EndUserReadRepo: { getByExternalId: vi.fn().mockResolvedValue(null) } } },
						Community: { Community: { CommunityReadRepo: { getById: getCommunityById } } },
					},
				}),
				withPassport: () => dataSources,
			},
			blobStorageService: {},
			queueStorageService: {},
			rateLimitingService: { consume: vi.fn() },
		} as never;

		const services = await buildApplicationServicesFactory(context).forRequest('Bearer token', {
			communityId: 'client-controlled-community',
			memberId: undefined,
		});

		expect(getCommunityById).toHaveBeenCalledWith('client-controlled-community');
		expect(services.rateLimitPrincipal).toEqual({ id: 'account-1', accountType: 'account' });
	});
});
