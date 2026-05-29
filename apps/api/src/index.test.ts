import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
	registerInfrastructureService,
	setContext,
	initializeApplicationServices,
	registerAzureFunctionHttpHandler,
	startUp,
	initializeInfrastructureServices,
	registerEventHandlers,
	MockServiceApolloServer,
	MockServiceBlobStorage,
	MockServiceMongoose,
	MockServiceTokenValidation,
} = vi.hoisted(() => {
	class HoistedServiceMongoose {
		public readonly service: string;

		constructor(_connectionString: string, _options: unknown) {
			this.service = 'mongoose';
		}
	}

	class HoistedServiceTokenValidation {
		public readonly service: string;

		constructor(_portalTokens: unknown) {
			this.service = 'token-validation';
		}
	}

	class HoistedServiceApolloServer {
		public readonly service: string;

		constructor(_options: unknown) {
			this.service = 'apollo';
		}
	}

	class HoistedServiceBlobStorage {
		public readonly service: string;

		constructor(_options: unknown) {
			this.service = 'blob-storage';
		}
	}

	return {
		registerInfrastructureService: vi.fn(),
		setContext: vi.fn(),
		initializeApplicationServices: vi.fn(),
		registerAzureFunctionHttpHandler: vi.fn(),
		startUp: vi.fn(),
		initializeInfrastructureServices: vi.fn(),
		registerEventHandlers: vi.fn(),
		MockServiceApolloServer: HoistedServiceApolloServer,
		MockServiceBlobStorage: HoistedServiceBlobStorage,
		MockServiceMongoose: HoistedServiceMongoose,
		MockServiceTokenValidation: HoistedServiceTokenValidation,
	};
});

const dataSourcesFactory = {
	withSystemPassport: vi.fn(() => ({
		domainDataSource: { domain: 'data-source' },
	})),
};
const serviceRegistry = {
	registerInfrastructureService,
	getInfrastructureService: vi.fn(),
};

vi.mock('./service-config/otel-starter.ts', () => ({}));
vi.mock('./cellix.ts', () => ({
	Cellix: {
		initializeInfrastructureServices,
	},
}));
vi.mock('@ocom/service-blob-storage', () => ({
	ServiceBlobStorage: MockServiceBlobStorage,
}));
vi.mock('@ocom/service-mongoose', () => ({
	ServiceMongoose: MockServiceMongoose,
}));
vi.mock('@ocom/service-token-validation', () => ({
	ServiceTokenValidation: MockServiceTokenValidation,
}));
vi.mock('@ocom/service-apollo-server', () => ({
	ServiceApolloServer: MockServiceApolloServer,
}));
vi.mock('@ocom/application-services', () => ({
	buildApplicationServicesFactory: vi.fn(() => ({ forRequest: vi.fn() })),
}));
vi.mock('@ocom/event-handler', () => ({
	RegisterEventHandlers: registerEventHandlers,
}));
vi.mock('./service-config/mongoose/index.ts', () => ({
	mongooseConnectionString: 'mongodb://example.test/cellix',
	mongooseConnectOptions: { serverSelectionTimeoutMS: 1000 },
	mongooseContextBuilder: vi.fn(() => dataSourcesFactory),
}));
vi.mock('./service-config/blob-storage/index.ts', () => ({
	accountName: 'devstoreaccount1',
	connectionString: 'UseDevelopmentStorage=true;AccountName=devstoreaccount1;AccountKey=abc123=',
}));
vi.mock('./service-config/token-validation/index.ts', () => ({
	portalTokens: new Map([['AccountPortal', 'ACCOUNT_PORTAL']]),
}));
vi.mock('./service-config/apollo-server/index.ts', () => ({
	apolloServerOptions: { schema: {} },
}));
vi.mock('@ocom/graphql-handler', () => ({
	graphHandlerCreator: vi.fn(),
}));
vi.mock('@ocom/rest', () => ({
	restHandlerCreator: vi.fn(),
}));

describe('apps/api bootstrap', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		registerInfrastructureService.mockReturnThis();
		setContext.mockReturnValue({
			initializeApplicationServices,
		});
		initializeApplicationServices.mockReturnValue({
			registerAzureFunctionHttpHandler,
		});
		registerAzureFunctionHttpHandler.mockReturnValue({
			registerAzureFunctionHttpHandler,
			startUp,
		});
		initializeInfrastructureServices.mockReturnValue({
			setContext,
		});
	});

	it('registers the OCOM blob storage service and exposes the scoped adapter contract in ApiContext', async () => {
		await import('./index.ts');

		expect(initializeInfrastructureServices).toHaveBeenCalledTimes(1);
		const registerServices = initializeInfrastructureServices.mock.calls[0]?.[0];
		expect(registerServices).toBeTypeOf('function');

		registerServices?.(serviceRegistry);

		expect(registerInfrastructureService).toHaveBeenCalledTimes(5);
		// Find the registered blob services by the semantic registration name instead of relying on call order.
		const registeredBlobService = registerInfrastructureService.mock.calls.find((c) => c?.[1] === 'BlobStorageService')?.[0];
		const registeredClientOpsService = registerInfrastructureService.mock.calls.find((c) => c?.[1] === 'ClientOperationsService')?.[0];
		// Sanity: ensure we found instances of the mocked blob storage
		expect(registeredBlobService).toBeInstanceOf(MockServiceBlobStorage);
		expect(registeredClientOpsService).toBeInstanceOf(MockServiceBlobStorage);

		const contextBuilder = setContext.mock.calls[0]?.[0];
		expect(contextBuilder).toBeTypeOf('function');

		serviceRegistry.getInfrastructureService.mockImplementation((serviceKey: unknown) => {
			if (typeof serviceKey === 'string') {
				if (serviceKey === 'BlobStorageService') return registeredBlobService;
				if (serviceKey === 'ClientOperationsService') return registeredClientOpsService;
				return undefined;
			}
			if (serviceKey === MockServiceBlobStorage) {
				return registeredBlobService;
			}
			if (serviceKey === MockServiceTokenValidation) {
				return new MockServiceTokenValidation(undefined);
			}
			if (serviceKey === MockServiceApolloServer) {
				return new MockServiceApolloServer(undefined);
			}
			if (serviceKey === MockServiceMongoose) {
				return new MockServiceMongoose('', undefined);
			}
			return undefined;
		});

		const context = contextBuilder?.(serviceRegistry);

		expect(context).toMatchObject({
			dataSourcesFactory,
			blobStorageService: registeredBlobService,
			clientOperationsService: registeredClientOpsService,
			tokenValidationService: { service: 'token-validation' },
			apolloServerService: { service: 'apollo' },
		});
		expect(registerEventHandlers).toHaveBeenCalledWith({ domain: 'data-source' });
	});
});
