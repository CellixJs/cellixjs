import { app, type HttpFunctionOptions, type HttpHandler } from '@azure/functions';
import type { ServiceBase } from '@cellix/api-services-spec';
import api, { SpanStatusCode, type Tracer, trace } from '@opentelemetry/api';
import { InfrastructureServiceStore } from './infrastructure-service-store.ts';
import type { AppHost, ApplicationServicesInitializer, AzureFunctionHandlerRegistry, ContextBuilder, InfrastructureServiceRegistry, InitializedServiceRegistry, ServiceKey, StartedApplication } from './types.ts';

type Phase = 'infrastructure' | 'context' | 'app-services' | 'handlers' | 'started';

interface PendingHandler<AppServices> {
	name: string;
	options: Omit<HttpFunctionOptions, 'handler'>;
	handlerCreator: (applicationServicesHost: AppHost<AppServices>, infrastructureRegistry: InitializedServiceRegistry) => HttpHandler;
}

/**
 * Azure Functions application bootstrap for Cellix API applications.
 *
 * @remarks
 * `Cellix` is the framework-owned startup facade for API hosts. Applications register
 * infrastructure services, describe how those services become an infrastructure context,
 * supply a request-scoped application services host, bind HTTP handlers, and then hand
 * control to the Azure Functions runtime.
 *
 * Typical flow: {@link Cellix.initializeInfrastructureServices} → {@link setContext} →
 * {@link initializeApplicationServices} → {@link registerAzureFunctionHttpHandler} →
 * {@link startUp}. Infrastructure `startUp()` and context creation run later in the
 * Azure Functions `appStart` hook, not inside {@link startUp}.
 *
 * @returns A fluent bootstrap facade. Construction always starts at
 * {@link Cellix.initializeInfrastructureServices}; the constructor is not part of the
 * public contract.
 *
 * @example
 * ```ts
 * Cellix.initializeInfrastructureServices((registry) => {
 *   registry.registerInfrastructureService(new BlobStorageService(options));
 *   registry.registerInfrastructureService(new TokenValidationService(tokens));
 * })
 *   .setContext((registry) => buildInfraContext(registry))
 *   .initializeApplicationServices((context) => createAppHost(context))
 *   .registerAzureFunctionHttpHandler('graphql', { authLevel: 'anonymous' }, (host) => async (req, fnCtx) => {
 *     const appServices = await host.forRequest(req.headers.get('authorization') ?? undefined);
 *     return appServices.GraphQL.handle(req, fnCtx);
 *   })
 *   .startUp();
 * ```
 */
export class Cellix<ContextType, AppServices = unknown>
	implements
		InfrastructureServiceRegistry<ContextType, AppServices>,
		ContextBuilder<ContextType, AppServices>,
		ApplicationServicesInitializer<ContextType, AppServices>,
		AzureFunctionHandlerRegistry<ContextType, AppServices>,
		StartedApplication<ContextType, AppServices>
{
	private contextInternal: ContextType | undefined;
	private appServicesHostInternal: AppHost<AppServices> | undefined;
	private contextCreatorInternal: ((serviceRegistry: InitializedServiceRegistry) => ContextType) | undefined;
	private appServicesHostBuilder: ((infrastructureContext: ContextType) => AppHost<AppServices>) | undefined;
	private readonly tracer: Tracer;
	private readonly services: InfrastructureServiceStore = new InfrastructureServiceStore();
	private readonly pendingHandlers: Array<PendingHandler<AppServices>> = [];
	private serviceInitializedInternal = false;
	private phase: Phase = 'infrastructure';

	private constructor() {
		this.tracer = trace.getTracer('cellix:bootstrap');
	}

	/**
	 * Begins configuring a Cellix API application by registering infrastructure services.
	 *
	 * @remarks
	 * Constructs a new Cellix instance in the infrastructure phase, invokes `registerServices`
	 * once, and returns a {@link ContextBuilder} so the caller can define the infrastructure
	 * context. This is the only supported way to create a Cellix application.
	 *
	 * @typeParam ContextType - Infrastructure context created later by {@link setContext}.
	 * @typeParam AppServices - Request-scoped application services produced by {@link initializeApplicationServices}.
	 * @param registerServices - Callback invoked once to register infrastructure services.
	 * @returns A {@link ContextBuilder} for defining the infrastructure context.
	 *
	 * @example
	 * ```ts
	 * const builder = Cellix.initializeInfrastructureServices<AppContext, AppServices>((registry) => {
	 *   registry.registerInfrastructureService(new MongooseService(url, options));
	 * });
	 * ```
	 */
	public static initializeInfrastructureServices<ContextType, AppServices = unknown>(registerServices: (registry: InfrastructureServiceRegistry<ContextType, AppServices>) => void): ContextBuilder<ContextType, AppServices> {
		const instance = new Cellix<ContextType, AppServices>();
		registerServices(instance);
		return instance;
	}

	public registerInfrastructureService<T extends ServiceBase>(service: T, name?: string): InfrastructureServiceRegistry<ContextType, AppServices> {
		this.ensurePhase('infrastructure');
		this.services.register(service, name);
		return this;
	}

	public setContext(contextCreator: (serviceRegistry: InitializedServiceRegistry) => ContextType): ApplicationServicesInitializer<ContextType, AppServices> {
		this.ensurePhase('infrastructure');
		this.contextCreatorInternal = contextCreator;
		this.phase = 'context';
		return this;
	}

	public initializeApplicationServices(factory: (infrastructureContext: ContextType) => AppHost<AppServices>): AzureFunctionHandlerRegistry<ContextType, AppServices> {
		this.ensurePhase('context');
		this.appServicesHostBuilder = factory;
		this.phase = 'app-services';
		return this;
	}

	public registerAzureFunctionHttpHandler(
		name: string,
		options: Omit<HttpFunctionOptions, 'handler'>,
		handlerCreator: (applicationServicesHost: AppHost<AppServices>, infrastructureRegistry: InitializedServiceRegistry) => HttpHandler,
	): AzureFunctionHandlerRegistry<ContextType, AppServices> {
		this.ensurePhase('app-services', 'handlers');
		this.pendingHandlers.push({ name, options, handlerCreator });
		this.phase = 'handlers';
		return this;
	}

	public startUp(): Promise<StartedApplication<ContextType, AppServices>> {
		this.ensurePhase('handlers', 'app-services');
		this.bindAzureFunctionsRuntime();
		this.phase = 'started';
		return Promise.resolve(this);
	}

	public getInfrastructureService<T extends ServiceBase>(serviceKeyOrName: ServiceKey<T> | string): T {
		return this.services.get(serviceKeyOrName);
	}

	public get servicesInitialized(): boolean {
		return this.serviceInitializedInternal;
	}

	public get context(): ContextType {
		if (!this.contextInternal) {
			throw new Error('Context not initialized');
		}
		return this.contextInternal;
	}

	public get applicationServices(): AppHost<AppServices> {
		if (!this.appServicesHostInternal) {
			throw new Error('Application services not initialized');
		}
		return this.appServicesHostInternal;
	}

	private bindAzureFunctionsRuntime(): void {
		for (const pending of this.pendingHandlers) {
			app.http(pending.name, {
				...pending.options,
				handler: (request, context) => {
					if (!this.appServicesHostInternal) {
						throw new Error('Application not started yet');
					}
					return pending.handlerCreator(this.appServicesHostInternal, this)(request, context);
				},
			});
		}

		app.hook.appStart(async () => {
			const root = api.context.active();
			await api.context.with(root, async () => {
				await this.tracer.startActiveSpan('cellix.appStart', async (span) => {
					try {
						await this.startAllServicesWithTracing();
						this.serviceInitializedInternal = true;
						if (!this.contextCreatorInternal) {
							throw new Error('Context creator missing at appStart');
						}
						this.contextInternal = this.contextCreatorInternal(this);
						if (!this.appServicesHostBuilder) {
							throw new Error('Application services factory not provided. Call initializeApplicationServices().');
						}
						this.appServicesHostInternal = this.appServicesHostBuilder(this.contextInternal);
						span.setStatus({ code: SpanStatusCode.OK });
						console.log('Cellix started');
					} catch (err) {
						span.setStatus({ code: SpanStatusCode.ERROR });
						if (err instanceof Error) {
							span.recordException(err);
						}
						throw err;
					} finally {
						span.end();
					}
				});
			});
		});

		app.hook.appTerminate(async () => {
			const root = api.context.active();
			await api.context.with(root, async () => {
				await this.tracer.startActiveSpan('cellix.appTerminate', async (span) => {
					try {
						await this.stopAllServicesWithTracing();
						span.setStatus({ code: SpanStatusCode.OK, message: 'Cellix stopped successfully' });
						console.log('Cellix stopped');
					} catch (err) {
						span.setStatus({ code: SpanStatusCode.ERROR, message: err instanceof Error ? err.message : 'Shutdown failed' });
						if (err instanceof Error) {
							span.recordException(err);
						}
						throw err;
					} finally {
						span.end();
					}
				});
			});
		});
	}

	private ensurePhase(...allowed: Phase[]): void {
		if (!allowed.includes(this.phase)) {
			throw new Error(`Invalid operation in phase '${this.phase}'. Allowed phases: ${allowed.join(', ')}`);
		}
	}

	private async startAllServicesWithTracing(): Promise<void> {
		await this.iterateServicesWithTracing(this.services.unique(), 'start', 'startUp');
	}

	private async stopAllServicesWithTracing(): Promise<void> {
		await this.iterateServicesWithTracing(this.services.unique(), 'stop', 'shutDown');
	}

	private async iterateServicesWithTracing(services: ServiceBase[], operationName: 'start' | 'stop', serviceMethod: 'startUp' | 'shutDown'): Promise<void> {
		const operationFullName = `${operationName.charAt(0).toUpperCase() + operationName.slice(1)}Service`;
		const operationActionPending = operationName === 'start' ? 'starting' : 'stopping';
		const operationActionCompleted = operationName === 'start' ? 'started' : 'stopped';
		await Promise.all(
			services.map((service) =>
				this.tracer.startActiveSpan(`Service ${service.constructor.name} ${operationName}`, async (span) => {
					try {
						const ctorName = service.constructor?.name ?? 'Service';
						console.log(`${operationFullName}: Service ${ctorName} ${operationActionPending}`);
						await service[serviceMethod]();
						span.setStatus({ code: SpanStatusCode.OK, message: `Service ${ctorName} ${operationActionCompleted}` });
						console.log(`${operationFullName}: Service ${ctorName} ${operationActionCompleted}`);
					} catch (err) {
						span.setStatus({ code: SpanStatusCode.ERROR, message: err instanceof Error ? err.message : 'Service operation failed' });
						if (err instanceof Error) {
							span.recordException(err);
						}
						throw err;
					} finally {
						span.end();
					}
				}),
			),
		);
	}
}
