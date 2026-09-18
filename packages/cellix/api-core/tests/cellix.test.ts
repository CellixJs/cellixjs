import { app, type HttpRequest, type InvocationContext } from '@azure/functions';
import { type AppHost, type AzureFunctionHandlerRegistry, Cellix, type InfrastructureServiceRegistry, type InitializedServiceRegistry, type ServiceKey, type StartedApplication } from '@cellix/api-core';
import type { ServiceBase } from '@cellix/api-services-spec';
import api, { SpanStatusCode, trace } from '@opentelemetry/api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockSpan } = vi.hoisted(() => ({
	mockSpan: {
		end: vi.fn(),
		recordException: vi.fn(),
		setStatus: vi.fn(),
	},
}));

vi.mock('@azure/functions', () => ({
	app: {
		http: vi.fn(),
		hook: {
			appStart: vi.fn(),
			appTerminate: vi.fn(),
		},
	},
}));

vi.mock('@opentelemetry/api', () => {
	const mockApi = {
		SpanStatusCode: {
			ERROR: 2,
			OK: 1,
			UNSET: 0,
		},
		context: {
			active: vi.fn(() => ({})),
			with: vi.fn((_ctx: unknown, callback: () => unknown) => callback()),
		},
		trace: {
			getTracer: vi.fn(() => ({
				startActiveSpan: vi.fn((_name: string, callback: (span: typeof mockSpan) => unknown) => callback(mockSpan)),
			})),
		},
	};

	return {
		default: mockApi,
		...mockApi,
	};
});

type TestContext = { marker: string };
type TestAppServices = { handle: string };

class MockService implements ServiceBase {
	public readonly shutDown = vi.fn().mockResolvedValue(undefined);
	public readonly startUp = vi.fn().mockResolvedValue(undefined);
}

class OtherMockService implements ServiceBase {
	public readonly shutDown = vi.fn().mockResolvedValue(undefined);
	public readonly startUp = vi.fn().mockResolvedValue(undefined);
}

describe('Cellix', () => {
	let mockService: MockService;
	let appHost: AppHost<TestAppServices>;

	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, 'log').mockImplementation(() => undefined);
		mockService = new MockService();
		appHost = {
			forRequest: vi.fn().mockResolvedValue({ handle: 'ok' }),
		};
	});

	afterEach(() => {
		vi.mocked(console.log).mockRestore();
	});

	describe('initializeInfrastructureServices', () => {
		it('invokes the registration callback and returns a context builder backed by Cellix', () => {
			let callbackRegistry: unknown;
			const builder = Cellix.initializeInfrastructureServices<TestContext, TestAppServices>((registry) => {
				callbackRegistry = registry;
			});

			expect(builder).toBeInstanceOf(Cellix);
			expect(callbackRegistry).toBe(builder);
			expect(builder.setContext).toBeTypeOf('function');
		});
	});

	describe('registerInfrastructureService', () => {
		it('stores a constructor-keyed service that the context builder can resolve', async () => {
			const started = await startApplication({
				register: (registry) => {
					registry.registerInfrastructureService(mockService);
				},
				contextCreator: (registry) => {
					expect(registry.getInfrastructureService(MockService)).toBe(mockService);
					return { marker: 'from-registry' };
				},
			});
			await triggerAppStart();

			expect(started.context).toEqual({ marker: 'from-registry' });
			expect(started.getInfrastructureService(MockService)).toBe(mockService);
		});

		it('returns the registry for chaining', () => {
			Cellix.initializeInfrastructureServices<TestContext, TestAppServices>((registry) => {
				expect(registry.registerInfrastructureService(mockService)).toBe(registry);
			});
		});

		it('rejects a second constructor-keyed registration of the same class', () => {
			expect(() => {
				Cellix.initializeInfrastructureServices<TestContext, TestAppServices>((registry) => {
					registry.registerInfrastructureService(mockService);
					registry.registerInfrastructureService(new MockService());
				});
			}).toThrow('Service already registered for constructor: MockService');
		});

		it('stores a named service that is retrievable by that name', async () => {
			const started = await startApplication({
				register: (registry) => {
					registry.registerInfrastructureService(mockService, 'blob');
				},
			});

			expect(started.getInfrastructureService('blob')).toBe(mockService);
		});

		it('rejects a duplicate semantic name', () => {
			expect(() => {
				Cellix.initializeInfrastructureServices<TestContext, TestAppServices>((registry) => {
					registry.registerInfrastructureService(mockService, 'blob');
					registry.registerInfrastructureService(new OtherMockService(), 'blob');
				});
			}).toThrow('Service name already registered: blob');
		});

		it('allows the same constructor under distinct names', async () => {
			const first = new MockService();
			const second = new MockService();
			const started = await startApplication({
				register: (registry) => {
					registry.registerInfrastructureService(first, 'one');
					registry.registerInfrastructureService(second, 'two');
				},
			});

			expect(started.getInfrastructureService('one')).toBe(first);
			expect(started.getInfrastructureService('two')).toBe(second);
		});
	});

	describe('setContext', () => {
		it('advances bootstrap to the application-services initializer', () => {
			const initializer = Cellix.initializeInfrastructureServices<TestContext, TestAppServices>(() => undefined).setContext(() => ({ marker: 'ctx' }));

			expect(initializer.initializeApplicationServices).toBeTypeOf('function');
		});

		it('rejects a second setContext call on the same builder', () => {
			const builder = Cellix.initializeInfrastructureServices<TestContext, TestAppServices>(() => undefined);
			builder.setContext(() => ({ marker: 'ctx' }));

			expect(() => builder.setContext(() => ({ marker: 'again' }))).toThrow("Invalid operation in phase 'context'. Allowed phases: infrastructure");
		});
	});

	describe('initializeApplicationServices', () => {
		it('advances bootstrap to the Azure Functions handler registry', () => {
			const registry = Cellix.initializeInfrastructureServices<TestContext, TestAppServices>(() => undefined)
				.setContext(() => ({ marker: 'ctx' }))
				.initializeApplicationServices(() => appHost);

			expect(registry.registerAzureFunctionHttpHandler).toBeTypeOf('function');
			expect(registry.startUp).toBeTypeOf('function');
		});

		it('rejects initialization before setContext', () => {
			const builder = Cellix.initializeInfrastructureServices<TestContext, TestAppServices>(() => undefined);

			expect(() => (builder as unknown as { initializeApplicationServices: (factory: () => AppHost<TestAppServices>) => void }).initializeApplicationServices(() => appHost)).toThrow(
				"Invalid operation in phase 'infrastructure'. Allowed phases: context",
			);
		});
	});

	describe('registerAzureFunctionHttpHandler', () => {
		it('defers Azure Functions registration until startUp', async () => {
			const registry = Cellix.initializeInfrastructureServices<TestContext, TestAppServices>(() => undefined)
				.setContext(() => ({ marker: 'ctx' }))
				.initializeApplicationServices(() => appHost);

			const chained = registry.registerAzureFunctionHttpHandler('health', { authLevel: 'anonymous' }, () => vi.fn());

			expect(chained).toBe(registry);
			expect(app.http).not.toHaveBeenCalled();

			await chained.startUp();

			expect(app.http).toHaveBeenCalledWith(
				'health',
				expect.objectContaining({
					authLevel: 'anonymous',
					handler: expect.any(Function),
				}),
			);
		});

		it('rejects handler registration before application services are initialized', () => {
			const builder = Cellix.initializeInfrastructureServices<TestContext, TestAppServices>(() => undefined);

			expect(() => (builder as unknown as AzureFunctionHandlerRegistry<TestContext, TestAppServices>).registerAzureFunctionHttpHandler('health', { authLevel: 'anonymous' }, () => vi.fn())).toThrow(
				"Invalid operation in phase 'infrastructure'. Allowed phases: app-services, handlers",
			);
		});

		it('allows additional handlers after the first registration', async () => {
			await Cellix.initializeInfrastructureServices<TestContext, TestAppServices>(() => undefined)
				.setContext(() => ({ marker: 'ctx' }))
				.initializeApplicationServices(() => appHost)
				.registerAzureFunctionHttpHandler('graphql', { route: 'graphql' }, () => vi.fn())
				.registerAzureFunctionHttpHandler('rest', { route: 'rest' }, () => vi.fn())
				.startUp();

			expect(vi.mocked(app.http).mock.calls.map((call) => call[0])).toEqual(['graphql', 'rest']);
		});
	});

	describe('startUp', () => {
		it('binds HTTP handlers and Azure Functions lifecycle hooks without starting services yet', async () => {
			const started = await startApplication({
				register: (registry) => {
					registry.registerInfrastructureService(mockService);
				},
			});

			expect(started).toBeInstanceOf(Cellix);
			expect(app.hook.appStart).toHaveBeenCalledTimes(1);
			expect(app.hook.appTerminate).toHaveBeenCalledTimes(1);
			expect(started.servicesInitialized).toBe(false);
			expect(mockService.startUp).not.toHaveBeenCalled();
			expect(() => started.context).toThrow('Context not initialized');
			expect(() => started.applicationServices).toThrow('Application services not initialized');
		});

		it('can start from the app-services phase without HTTP handlers', async () => {
			const started = await Cellix.initializeInfrastructureServices<TestContext, TestAppServices>((registry) => {
				registry.registerInfrastructureService(mockService);
			})
				.setContext(() => ({ marker: 'no-handlers' }))
				.initializeApplicationServices(() => appHost)
				.startUp();

			expect(app.http).not.toHaveBeenCalled();
			await triggerAppStart();
			expect(started.servicesInitialized).toBe(true);
			expect(started.context).toEqual({ marker: 'no-handlers' });
		});

		it('rejects startUp before application services are initialized', () => {
			const builder = Cellix.initializeInfrastructureServices<TestContext, TestAppServices>(() => undefined);

			expect(() => (builder as unknown as AzureFunctionHandlerRegistry<TestContext, TestAppServices>).startUp()).toThrow("Invalid operation in phase 'infrastructure'. Allowed phases: handlers, app-services");
		});
	});

	describe('getInfrastructureService', () => {
		it('throws when the constructor was never registered', async () => {
			const started = await startApplication();

			expect(() => started.getInfrastructureService(MockService)).toThrow('Service not found: MockService');
		});

		it('throws when the semantic name was never registered', async () => {
			const started = await startApplication({
				register: (registry) => {
					registry.registerInfrastructureService(mockService);
				},
			});

			expect(() => started.getInfrastructureService('missing')).toThrow('Service not found: missing');
		});

		it('does not resolve a named-only service by constructor', async () => {
			const started = await startApplication({
				register: (registry) => {
					registry.registerInfrastructureService(mockService, 'blob');
				},
			});

			expect(started.getInfrastructureService('blob')).toBe(mockService);
			expect(() => started.getInfrastructureService(MockService)).toThrow('Service not found: MockService');
		});

		it('uses UnknownService when a constructor-like key has no name', async () => {
			const started = await startApplication();
			const unnamedKey = { prototype: mockService } as ServiceKey<MockService>;

			expect(() => started.getInfrastructureService(unnamedKey)).toThrow('Service not found: UnknownService');
		});
	});

	describe('appStart lifecycle', () => {
		it('preserves a falsy context value created during appStart', async () => {
			const started = await Cellix.initializeInfrastructureServices<number, TestAppServices>(() => undefined)
				.setContext(() => 0)
				.initializeApplicationServices(() => appHost)
				.startUp();

			expect(() => started.context).toThrow('Context not initialized');
			await triggerAppStart();
			expect(started.context).toBe(0);
		});

		it('does not report servicesInitialized when context creation fails', async () => {
			const started = await startApplication({
				register: (registry) => {
					registry.registerInfrastructureService(mockService);
				},
				contextCreator: () => {
					throw new Error('context failed');
				},
			});

			await expect(triggerAppStart()).rejects.toThrow('context failed');
			expect(started.servicesInitialized).toBe(false);
			expect(mockService.startUp).toHaveBeenCalledTimes(1);
			expect(() => started.context).toThrow('Context not initialized');
			expect(() => started.applicationServices).toThrow('Application services not initialized');
		});

		it('does not report servicesInitialized when the application host factory throws', async () => {
			const started = await Cellix.initializeInfrastructureServices<TestContext, TestAppServices>((registry) => {
				registry.registerInfrastructureService(mockService);
			})
				.setContext(() => ({ marker: 'ctx' }))
				.initializeApplicationServices(() => {
					throw new Error('host failed');
				})
				.startUp();

			await expect(triggerAppStart()).rejects.toThrow('host failed');
			expect(started.servicesInitialized).toBe(false);
			expect(started.context).toEqual({ marker: 'ctx' });
			expect(() => started.applicationServices).toThrow('Application services not initialized');
		});

		it('starts unique services, creates context, and initializes the application host', async () => {
			const createdHost = appHost;
			const started = await startApplication({
				register: (registry) => {
					registry.registerInfrastructureService(mockService);
					registry.registerInfrastructureService(mockService, 'alias');
				},
				contextCreator: (registry) => ({
					marker: registry.getInfrastructureService(MockService).constructor.name,
				}),
				host: createdHost,
			});

			await triggerAppStart();

			expect(mockService.startUp).toHaveBeenCalledTimes(1);
			expect(started.servicesInitialized).toBe(true);
			expect(started.context).toEqual({ marker: 'MockService' });
			expect(started.applicationServices).toBe(createdHost);
			expect(console.log).toHaveBeenCalledWith('StartService: Service MockService starting');
			expect(console.log).toHaveBeenCalledWith('StartService: Service MockService started');
			expect(console.log).toHaveBeenCalledWith('Cellix started');
			expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.OK });
			expect(vi.mocked(trace.getTracer)).toHaveBeenCalledWith('cellix:bootstrap');
			expect(vi.mocked(api.context.with)).toHaveBeenCalled();
		});

		it('starts every distinct registered service', async () => {
			const other = new OtherMockService();
			await startApplication({
				register: (registry) => {
					registry.registerInfrastructureService(mockService);
					registry.registerInfrastructureService(other, 'other');
				},
			});

			await triggerAppStart();

			expect(mockService.startUp).toHaveBeenCalledTimes(1);
			expect(other.startUp).toHaveBeenCalledTimes(1);
		});

		it('records and rethrows infrastructure startup failures', async () => {
			const failure = new Error('Service startup failed');
			mockService.startUp.mockRejectedValue(failure);
			await startApplication({
				register: (registry) => {
					registry.registerInfrastructureService(mockService);
				},
			});

			await expect(triggerAppStart()).rejects.toThrow('Service startup failed');
			expect(mockSpan.recordException).toHaveBeenCalledWith(failure);
			expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR, message: 'Service startup failed' });
			expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR });
			expect(mockSpan.end).toHaveBeenCalled();
		});

		it('rethrows non-Error startup failures without recording an exception', async () => {
			mockService.startUp.mockRejectedValue('startup exploded');
			await startApplication({
				register: (registry) => {
					registry.registerInfrastructureService(mockService);
				},
			});

			await expect(triggerAppStart()).rejects.toBe('startup exploded');
			expect(mockSpan.recordException).not.toHaveBeenCalled();
			expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR, message: 'Service operation failed' });
		});
	});

	describe('appTerminate lifecycle', () => {
		it('stops unique services after a successful start', async () => {
			await startApplication({
				register: (registry) => {
					registry.registerInfrastructureService(mockService);
					registry.registerInfrastructureService(mockService, 'alias');
				},
			});
			await triggerAppStart();
			await triggerAppTerminate();

			expect(mockService.shutDown).toHaveBeenCalledTimes(1);
			expect(console.log).toHaveBeenCalledWith('StopService: Service MockService stopping');
			expect(console.log).toHaveBeenCalledWith('StopService: Service MockService stopped');
			expect(console.log).toHaveBeenCalledWith('Cellix stopped');
			expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.OK, message: 'Cellix stopped successfully' });
		});

		it('records and rethrows infrastructure shutdown failures', async () => {
			const failure = new Error('Service shutdown failed');
			mockService.shutDown.mockRejectedValue(failure);
			await startApplication({
				register: (registry) => {
					registry.registerInfrastructureService(mockService);
				},
			});
			await triggerAppStart();

			await expect(triggerAppTerminate()).rejects.toThrow('Service shutdown failed');
			expect(mockSpan.recordException).toHaveBeenCalledWith(failure);
			expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR, message: 'Service shutdown failed' });
			expect(mockSpan.end).toHaveBeenCalled();
		});

		it('labels non-Error shutdown failures as Shutdown failed', async () => {
			mockService.shutDown.mockRejectedValue('stop exploded');
			await startApplication({
				register: (registry) => {
					registry.registerInfrastructureService(mockService);
				},
			});
			await triggerAppStart();
			mockSpan.recordException.mockClear();
			mockSpan.setStatus.mockClear();

			await expect(triggerAppTerminate()).rejects.toBe('stop exploded');
			expect(mockSpan.recordException).not.toHaveBeenCalled();
			expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR, message: 'Service operation failed' });
			expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR, message: 'Shutdown failed' });
		});
	});

	describe('HTTP handler execution', () => {
		it('creates a request handler from the host and infrastructure registry', async () => {
			const httpHandler = vi.fn().mockResolvedValue({ status: 200 });
			const handlerCreator = vi.fn().mockReturnValue(httpHandler);
			const started = await startApplication({
				register: (registry) => {
					registry.registerInfrastructureService(mockService);
				},
				handlerCreator,
			});
			await triggerAppStart();

			const boundHandler = getBoundHttpHandler('health');
			const request = { headers: new Headers() } as HttpRequest;
			const invocationContext = {} as InvocationContext;
			const result = await boundHandler(request, invocationContext);

			expect(handlerCreator).toHaveBeenCalledTimes(1);
			expect(handlerCreator).toHaveBeenCalledWith(started.applicationServices, started);
			expect(httpHandler).toHaveBeenCalledWith(request, invocationContext);
			expect(result).toEqual({ status: 200 });
		});

		it('invokes the handler creator on every request', async () => {
			const handlerCreator = vi.fn().mockReturnValue(vi.fn().mockResolvedValue({ status: 204 }));
			await startApplication({ handlerCreator });
			await triggerAppStart();
			const boundHandler = getBoundHttpHandler('health');

			await boundHandler({} as HttpRequest, {} as InvocationContext);
			await boundHandler({} as HttpRequest, {} as InvocationContext);

			expect(handlerCreator).toHaveBeenCalledTimes(2);
		});

		it('rejects requests before appStart has created the application host', async () => {
			await startApplication();
			const boundHandler = getBoundHttpHandler('health');

			expect(() => boundHandler({} as HttpRequest, {} as InvocationContext)).toThrow('Application not started yet');
		});
	});
});

async function startApplication(options?: {
	register?: (registry: InfrastructureServiceRegistry<TestContext, TestAppServices>) => void;
	contextCreator?: (registry: InitializedServiceRegistry) => TestContext;
	host?: AppHost<TestAppServices>;
	handlerCreator?: Parameters<AzureFunctionHandlerRegistry<TestContext, TestAppServices>['registerAzureFunctionHttpHandler']>[2];
}): Promise<StartedApplication<TestContext, TestAppServices>> {
	const host = options?.host ?? {
		forRequest: vi.fn().mockResolvedValue({ handle: 'ok' }),
	};
	const handlerCreator = options?.handlerCreator ?? (() => vi.fn());

	return await Cellix.initializeInfrastructureServices<TestContext, TestAppServices>(options?.register ?? (() => undefined))
		.setContext((registry) => options?.contextCreator?.(registry) ?? { marker: 'ctx' })
		.initializeApplicationServices(() => host)
		.registerAzureFunctionHttpHandler('health', { authLevel: 'anonymous' }, handlerCreator)
		.startUp();
}

async function triggerAppStart(): Promise<void> {
	const callback = vi.mocked(app.hook.appStart).mock.calls[0]?.[0];
	expect(callback).toBeTypeOf('function');
	await callback?.({} as never);
}

async function triggerAppTerminate(): Promise<void> {
	const callback = vi.mocked(app.hook.appTerminate).mock.calls[0]?.[0];
	expect(callback).toBeTypeOf('function');
	await callback?.({} as never);
}

function getBoundHttpHandler(name: string): (request: HttpRequest, context: InvocationContext) => Promise<unknown> {
	const registration = vi.mocked(app.http).mock.calls.find((call) => call[0] === name);
	const handler = registration?.[1]?.handler;
	expect(handler).toBeTypeOf('function');
	return handler as (request: HttpRequest, context: InvocationContext) => Promise<unknown>;
}
