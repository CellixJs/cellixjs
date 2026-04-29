import { type ApplicationServicesFactory, buildApplicationServicesFactory } from '@ocom/application-services';
import type { ApiContextSpec } from '@ocom/context-spec';
import { Persistence } from '@ocom/persistence';
import type { ServiceApolloServer } from '@ocom/service-apollo-server';
import type { ServiceMongoose } from '@ocom/service-mongoose';
import type { TokenValidation, TokenValidationResult } from '@ocom/service-token-validation';
import { actors } from '@ocom-verification/verification-shared/test-data';

function createMockTokenValidation(): TokenValidation {
	return {
		verifyJwt: <ClaimsType>(_token: string): Promise<TokenValidationResult<ClaimsType> | null> => {
			const actor = actors.CommunityOwner;
			return Promise.resolve({
				verifiedJwt: {
					given_name: actor.givenName,
					family_name: actor.familyName,
					email: actor.email,
					sub: actor.externalId,
				} as unknown as ClaimsType,
				openIdConfigKey: 'AccountPortal',
			});
		},
	};
}

function createNoOpApolloServerService(): ServiceApolloServer<Record<string, never>> {
	const notImplemented = () => {
		throw new Error('ServiceApolloServer not implemented in test session');
	};
	return {
		startUp: () => Promise.resolve({} as unknown as Awaited<ReturnType<ServiceApolloServer<Record<string, never>>['startUp']>>),
		shutDown: () => Promise.resolve(),
		get service(): never {
			return notImplemented() as never;
		},
	} as unknown as ServiceApolloServer<BaseContext>;
}

export function createMockApplicationServicesFactory(serviceMongoose: ServiceMongoose): ApplicationServicesFactory {
	const dataSourcesFactory = Persistence(serviceMongoose);

	const apiContextSpec: ApiContextSpec = {
		dataSourcesFactory,
		tokenValidationService: createMockTokenValidation(),
		apolloServerService: createNoOpApolloServerService(),
	};

	const mockApplicationServicesFactory = buildApplicationServicesFactory(apiContextSpec);

	return {
		forRequest: (_rawAuthHeader, hints) => {
			return mockApplicationServicesFactory.forRequest('Bearer test-token', hints);
		},
	};
}
