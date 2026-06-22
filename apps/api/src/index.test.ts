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
	MockServiceClientBlobStorage,
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
		public readonly options: unknown;

		constructor(options: unknown) {
			this.service = 'blob-storage';
			this.options = options;
		}
	}

	class HoistedServiceClientBlobStorage {
		public readonly service: string;
		public readonly options: unknown;

		constructor(options: unknown) {
			this.service = 'client-blob-storage';
			this.options = options;
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
		MockServiceClientBlobStorage: HoistedServiceClientBlobStorage,
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
	ServiceClientBlobStorage: MockServiceClientBlobStorage,
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
vi.mock('./service-config/token-validation/index.ts', () => ({
	portalTokens: new Map([['AccountPortal', 'ACCOUNT_PORTAL']]),
}));
vi.mock('./service-config/apollo-server/index.ts', () => ({
	apolloServerOptions: { schema: {} },
}));
vi.mock('./service-config/queue-storage/index.ts', () => ({
	logging: {
		enabled: true,
		container: 'queue-logs',
		await: false,
	},
}));
vi.mock('@ocom/graphql-handler', () => ({
	graphHandlerCreator: vi.fn(),
}));
vi.mock('@ocom/rest', () => ({
	restHandlerCreator: vi.fn(),
}));
vi.mock('@ocom/service-queue-storage', () => ({
	ServiceQueueStorage: vi.fn(function MockServiceQueueStorage() {
		const service = {
			startUp: vi.fn(),
			shutDown: vi.fn(),
			sendMessageToCommunityCreationQueue: vi.fn(),
			receiveFromImportRequestsQueue: vi.fn(),
			peekAtImportRequestsQueue: vi.fn(),
			enableLogging: vi.fn(),
		};
		service.enableLogging.mockReturnValue(service);
		return {
			...service,
		};
	}),
}));

describe('apps/api bootstrap', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		const env = process.env as Partial<Record<'NODE_ENV' | 'AZURE_STORAGE_ACCOUNT_NAME' | 'AZURE_STORAGE_CONNECTION_STRING', string>>;
		delete env.NODE_ENV;
		delete env.AZURE_STORAGE_ACCOUNT_NAME;
		delete env.AZURE_STORAGE_CONNECTION_STRING;
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

	it('registers managed-identity backend blob storage in production', async () => {
		Object.assign(process.env, {
			NODE_ENV: 'production',
			AZURE_STORAGE_ACCOUNT_NAME: 'prod-account',
			AZURE_STORAGE_CONNECTION_STRING: 'ProdConnectionString',
		});

		await importApiBootstrap();

		expect(initializeInfrastructureServices).toHaveBeenCalledTimes(1);
		const registerServices = initializeInfrastructureServices.mock.calls[0]?.[0];
		expect(registerServices).toBeTypeOf('function');

		registerServices?.(serviceRegistry);

		expect(registerInfrastructureService).toHaveBeenCalledTimes(6);
		const registeredBlobService = registerInfrastructureService.mock.calls.find((c) => c?.[1] === 'BlobStorageService')?.[0];
		const registeredClientOpsService = registerInfrastructureService.mock.calls.find((c) => c?.[1] === 'ClientOperationsService')?.[0];
        const registeredQueueService = registerInfrastructureService.mock.calls.find((c) => c?.[1] == null && c?.[0] && 'enableLogging' in (c[0] as object) && 'sendMessageToCommunityCreationQueue' in (c[0] as object))?.[0] as
            | { enableLogging: ReturnType<typeof vi.fn> }
            | undefined;
		expect(registeredBlobService).toBeInstanceOf(MockServiceBlobStorage);
		expect(registeredClientOpsService).toBeInstanceOf(MockServiceClientBlobStorage);
		expect(registeredBlobService).toMatchObject({
			options: {
				accountName: 'prod-account',
			},
		});
		expect(registeredClientOpsService).toMatchObject({
			options: {
				accountName: 'prod-account',
				signingConnectionString: 'ProdConnectionString',
			},
		});

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
			if (serviceKey === MockServiceClientBlobStorage) {
				return registeredClientOpsService;
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
			if (registeredQueueService && serviceKey && typeof serviceKey === 'function') {
				return registeredQueueService;
			}
			return undefined;
		});

		const context = contextBuilder?.(serviceRegistry);

		expect(registeredQueueService?.enableLogging).toHaveBeenCalledWith(registeredBlobService, {
			enabled: true,
			container: 'queue-logs',
			await: false,
		});
		expect(context).toMatchObject({
			dataSourcesFactory,
			blobStorageService: registeredBlobService,
			clientOperationsService: registeredClientOpsService,
			queueStorageService: registeredQueueService,
			tokenValidationService: { service: 'token-validation' },
			apolloServerService: { service: 'apollo' },
		});
		expect(registerEventHandlers).toHaveBeenCalledWith({ domain: 'data-source' });
	});

	it('registers client-signing blob storage for backend use outside production', async () => {
		Object.assign(process.env, {
			NODE_ENV: 'development',
			AZURE_STORAGE_ACCOUNT_NAME: 'devstoreaccount1',
			AZURE_STORAGE_CONNECTION_STRING: 'UseDevelopmentStorage=true;AccountName=devstoreaccount1;AccountKey=abc123=',
		});

		await importApiBootstrap();

		expect(initializeInfrastructureServices).toHaveBeenCalledTimes(1);
		const registerServices = initializeInfrastructureServices.mock.calls[0]?.[0];
		expect(registerServices).toBeTypeOf('function');

		registerServices?.(serviceRegistry);

		const registeredBlobService = registerInfrastructureService.mock.calls.find((c) => c?.[1] === 'BlobStorageService')?.[0];
		const registeredClientOpsService = registerInfrastructureService.mock.calls.find((c) => c?.[1] === 'ClientOperationsService')?.[0];
		const registeredQueueService = registerInfrastructureService.mock.calls.find((c) => c?.[1] == null && c?.[0] && 'enableLogging' in (c[0] as object) && 'sendMessageToCommunityCreationQueue' in (c[0] as object))?.[0];
		expect(registerInfrastructureService).toHaveBeenCalledTimes(6);
		expect(registeredBlobService).toBeInstanceOf(MockServiceClientBlobStorage);
		expect(registeredClientOpsService).toBeInstanceOf(MockServiceClientBlobStorage);
		expect(registeredQueueService).toBeDefined();
		expect(registeredBlobService).toMatchObject({
			options: {
				accountName: 'devstoreaccount1',
				signingConnectionString: 'UseDevelopmentStorage=true;AccountName=devstoreaccount1;AccountKey=abc123=',
			},
		});
		expect(registeredClientOpsService).toMatchObject({
			options: {
				accountName: 'devstoreaccount1',
				signingConnectionString: 'UseDevelopmentStorage=true;AccountName=devstoreaccount1;AccountKey=abc123=',
			},
		});
	});
});

async function importApiBootstrap(): Promise<void> {
	vi.resetModules();
	await import('./index.ts');
}
