import { app, type HttpFunctionOptions, type HttpHandler } from '@azure/functions';
import type { ServiceBase } from '@cellix/api-services-spec';
import api, { SpanStatusCode, type Tracer, trace } from '@opentelemetry/api';

export interface InfrastructureServiceRegistry<ContextType = unknown, AppServices = unknown> {
    /**
     * Registers an infrastructure service with the application.
     *
     * @remarks
     * Must be called during the {@link Phase | 'infrastructure'} phase. Each
     * constructor key can be registered at most once.
     *
     * @typeParam T - The concrete service type.
     * @param service - The service instance to register.
     * @returns The registry (for chaining).
     *
     * @throws Error - If called outside the infrastructure phase or the service key is already registered.
     */
	registerInfrastructureService<T extends ServiceBase>(service: T): InfrastructureServiceRegistry<ContextType, AppServices>;
}

export interface ContextBuilder<ContextType = unknown, AppServices = unknown> {
    /**
     * Defines the infrastructure context available for the application.
     *
     * @remarks
     * Must be called during the {@link Phase | 'infrastructure'} phase. Stores the `contextCreator`
     * and transitions the application to the {@link Phase | 'context'} phase. The provided function
     * will be invoked during {@link startUp} (inside the Azure Functions `appStart` hook) after all
     * infrastructure services have successfully started. Note that `ContextType` is defined in the
     * `api-context-spec` package.
     *
     * @param contextCreator - Function that builds the infrastructure context from the initialized service registry.
     * @returns An {@link ApplicationServicesInitializer} for configuring application services.
     *
     * @throws Error - If called outside the 'infrastructure' phase.
     */
	setContext(
		contextCreator: (serviceRegistry: InitializedServiceRegistry) => ContextType,
	): ApplicationServicesInitializer<ContextType, AppServices>;
}

export interface ApplicationServicesInitializer<ContextType, AppServices = unknown> {
    /**
     * Registers the factory that creates the request-scoped application services host.
     *
     * @remarks
     * Must be called during the {@link Phase | 'context'} phase, after {@link setContext}. Stores the
     * factory and transitions the application to the {@link Phase | 'app-services'} phase. The factory
     * will be invoked during {@link startUp} to produce an {@link AppHost} that can build
     * request-scoped services via {@link AppHost.forRequest}. Note that `AppServices` is defined in the
     * `api-application-services` package.
     *
     * @param factory - Function that produces the application services host from the infrastructure context.
     * @returns An {@link AzureFunctionHandlerRegistry} for registering HTTP handlers or starting the app.
     *
     * @throws Error - If the context creator has not been set via {@link setContext}, or if called outside the 'context' phase.
     *
     * @example
     * ```ts
     * initializeApplicationServices((infraCtx) => createAppHost(infraCtx))
     *   .registerAzureFunctionHttpHandler('health', { authLevel: 'anonymous' }, (host) => async (req, fnCtx) => {
     *     const app = await host.forRequest();
     *     return app.Health.handle(req, fnCtx);
     *   });
     * ```
     */
	initializeApplicationServices(
		factory: (infrastructureContext: ContextType) => AppHost<AppServices>
	): AzureFunctionHandlerRegistry<ContextType, AppServices>;
}

export interface AzureFunctionHandlerRegistry<ContextType = unknown, AppServices = unknown> {
    /**
     * Registers an Azure Function HTTP endpoint.
     *
     * @remarks
     * The `handlerCreator` is invoked per request and receives the application services host.
     * Use it to create a request-scoped handler (e.g., to build per-request context).
     * Registration is allowed in phases `'app-services'` and `'handlers'`.
     *
     * @param name - Function name to bind in Azure Functions.
     * @param options - Azure Functions HTTP options (excluding the handler).
     * @param handlerCreator - Factory that, given the app services host, returns an `HttpHandler`.
     * @returns The registry (for chaining).
     *
     * @throws Error - If called before application services are initialized.
     *
     * @example
     * ```ts
     * registerAzureFunctionHttpHandler('graphql', { authLevel: 'anonymous' }, (host) => {
     *   return async (req, ctx) => {
     *     const app = await host.forRequest(req.headers.get('authorization') ?? undefined);
     *     return app.GraphQL.handle(req, ctx);
     *   };
     * });
     * ```
     */
	registerAzureFunctionHttpHandler(
		name: string,
		options: Omit<HttpFunctionOptions, 'handler'>,
		handlerCreator: (
			applicationServicesHost: AppHost<AppServices>,
		) => HttpHandler,
	): AzureFunctionHandlerRegistry<ContextType, AppServices>;
    /**
     * Finalizes configuration and starts the application.
     *
     * @remarks
     * This registers function handlers with Azure Functions, starts all infrastructure
     * services (in parallel), builds the infrastructure context, and initializes
     * application services. After this resolves, the application is in the `'started'` phase.
     *
     * @returns A promise that resolves to the started application facade.
     *
     * @throws Error - If the context builder or application services factory have not been configured.
     */
	startUp(): Promise<StartedApplication<ContextType>>;
}

export interface StartedApplication<ContextType = unknown>
	extends InitializedServiceRegistry {
	get context(): ContextType;
}

export interface InitializedServiceRegistry {
    /**
     * Retrieves a registered infrastructure service by its constructor key.
     *
     * @remarks
     * Services are keyed by their constructor identity (not by name), which is
     * minification-safe. You must pass the same class you used when registering
     * the service; base classes or interfaces will not match.
     *
     * @typeParam T - The concrete service type.
     * @param serviceKey - The service class (constructor) used at registration time.
     * @returns The registered service instance.
     *
     * @throws Error - If no service is registered for the provided key.
     *
     * @example
     * ```ts
     * // registration
     * registry.registerInfrastructureService(new BlobStorageService(...));
     *
     * // lookup
     * const blob = app.getInfrastructureService(BlobStorageService);
     * await blob.startUp();
     * ```
     */
	getInfrastructureService<T extends ServiceBase>(serviceKey: ServiceKey<T>): T;
	get servicesInitialized(): boolean;
}

export type UninitializedServiceRegistry<ContextType = unknown, AppServices = unknown> = InfrastructureServiceRegistry<ContextType, AppServices>;


type RequestScopedHost<S, H = unknown> = {
  forRequest(rawAuthHeader?: string, hints?: H): Promise<S>;
};

export type AppHost<AppServices> = RequestScopedHost<AppServices, unknown>;

interface PendingHandler<AppServices> {
	name: string;
	options: Omit<HttpFunctionOptions, 'handler'>;
	handlerCreator: (applicationServicesHost: AppHost<AppServices>) => HttpHandler;
}

type Phase = 'infrastructure' | 'context' | 'app-services' | 'handlers' | 'started';

/**
 * Minification-safe key for service lookup: the service class (constructor).
 *
 * @remarks
 * Keys are compared by constructor identity. Pass the same class used at registration time.
 */
type ServiceKey<T extends ServiceBase = ServiceBase> = { prototype: T };

export class Cellix<ContextType, AppServices = unknown>
	implements
		InfrastructureServiceRegistry<ContextType, AppServices>,
		ContextBuilder<ContextType, AppServices>,
		ApplicationServicesInitializer<ContextType, AppServices>,
		AzureFunctionHandlerRegistry<ContextType, AppServices>,
		StartedApplication<ContextType>
{
	private contextInternal: ContextType | undefined;
	private appServicesHostInternal: RequestScopedHost<AppServices, unknown> | undefined;
	private contextCreatorInternal: ((serviceRegistry: InitializedServiceRegistry) => ContextType) | undefined;
	private appServicesHostBuilder: ((infrastructureContext: ContextType) => RequestScopedHost<AppServices, unknown>) | undefined;
	private readonly tracer: Tracer;
	private readonly servicesInternal: Map<ServiceKey<ServiceBase>, ServiceBase> = new Map();
	private readonly pendingHandlers: Array<PendingHandler<AppServices>> = [];
	private serviceInitializedInternal = false;
	private phase: Phase = 'infrastructure';

	private constructor() {
		this.tracer = trace.getTracer('cellix:bootstrap');
	}

    /**
     * Begins configuring a Cellix application by registering infrastructure services.
     *
     * @remarks
     * This is the first step in the bootstrap sequence. It constructs a new Cellix instance in the
     * {@link Phase | 'infrastructure'} phase, invokes your `registerServices` callback to register
     * infrastructure services, and returns a {@link ContextBuilder} to define the infrastructure context.
     *
     * The typical flow is: {@link initializeInfrastructureServices} → {@link setContext} →
     * {@link initializeApplicationServices} → {@link registerAzureFunctionHttpHandler} → {@link startUp}.
     *
     * @typeParam ContextType - The shape of your infrastructure context that will be created in {@link setContext}.
     * @typeParam AppServices - The application services host type produced by {@link initializeApplicationServices}.
     *
     * @param registerServices - Callback invoked once to register infrastructure services.
     * @returns A {@link ContextBuilder} for defining the infrastructure context.
     *
     * @example
     * ```ts
     * Cellix.initializeInfrastructureServices((r) => {
     *   r.registerInfrastructureService(new BlobStorageService(...));
     *   r.registerInfrastructureService(new TokenValidationService(...));
     * })
     * .setContext((registry) => buildInfraContext(registry))
     * .initializeApplicationServices((ctx) => createAppHost(ctx))
     * .registerAzureFunctionHttpHandler('graphql', { authLevel: 'anonymous' }, (host) => async (req, fnCtx) => {
     *   const app = await host.forRequest(req.headers.get('authorization') ?? undefined);
     *   return app.GraphQL.handle(req, fnCtx);
     * })
     * .startUp();
     * ```
     */
	public static initializeInfrastructureServices<ContextType, AppServices = unknown>(
		registerServices: (
			registry: UninitializedServiceRegistry<ContextType, AppServices>,
		) => void,
	): ContextBuilder<ContextType, AppServices> {
		const instance = new Cellix<ContextType, AppServices>();
		registerServices(instance);
		return instance;
	}

	public registerInfrastructureService<T extends ServiceBase>(service: T): InfrastructureServiceRegistry<ContextType, AppServices> {
		this.ensurePhase('infrastructure');
        const key = service.constructor as ServiceKey<ServiceBase>;
		if (this.servicesInternal.has(key)) {
			throw new Error(`Service already registered for constructor: ${service.constructor.name}`);
		}
		this.servicesInternal.set(key, service);
		return this;
	}

	public setContext(contextCreator: (serviceRegistry: InitializedServiceRegistry) => ContextType): ApplicationServicesInitializer<ContextType, AppServices> {
		this.ensurePhase('infrastructure');
		this.contextCreatorInternal = contextCreator;
		this.phase = 'context';
		return this;
	}

	public initializeApplicationServices(
		factory: (infrastructureContext: ContextType) => RequestScopedHost<AppServices, unknown>,
	): AzureFunctionHandlerRegistry<ContextType, AppServices> {
		this.ensurePhase('context');
		if (!this.contextCreatorInternal) {
			throw new Error('Context creator must be set before initializing application services');
		}
		this.appServicesHostBuilder = factory;
		this.phase = 'app-services';
		return this;
	}

	public registerAzureFunctionHttpHandler(
		name: string,
		options: Omit<HttpFunctionOptions, 'handler'>,
		handlerCreator: (
			applicationServicesHost: RequestScopedHost<AppServices, unknown>,
		) => HttpHandler,
	): AzureFunctionHandlerRegistry<ContextType, AppServices> {
		this.ensurePhase('app-services', 'handlers');
		this.pendingHandlers.push({ name, options, handlerCreator });
		this.phase = 'handlers';
		return this;
	}

	public startUp(): Promise<StartedApplication<ContextType>> {
		this.ensurePhase('handlers', 'app-services');
		if (!this.contextCreatorInternal) {
			throw new Error('Context not configured. Call setContext() first.');
		}
		this.setupLifecycle();
		this.phase = 'started';
		return Promise.resolve(this);
	}

	private setupLifecycle(): void {
		// Register function handlers (deferred execution of creators)
		for (const h of this.pendingHandlers) {
			app.http(h.name, {
				...h.options,
				handler: (request, context) => {
					if (!this.appServicesHostInternal) {
						throw new Error('Application not started yet');
					}
					return h.handlerCreator(this.appServicesHostInternal)(request, context);
				},
			});
		}

		// appStart hook
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

		// appTerminate hook
		app.hook.appTerminate(async () => {
			const root = api.context.active();
			await api.context.with(root, async () => {
				await this.tracer.startActiveSpan('cellix.appTerminate', async (span) => {
					try {
						await this.stopAllServicesWithTracing();
						span.setStatus({ code: SpanStatusCode.OK });
						console.log('Cellix stopped');
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
	}

	private ensurePhase(...allowed: Phase[]): void {
		if (!allowed.includes(this.phase)) {
			throw new Error(`Invalid operation in phase '${this.phase}'. Allowed phases: ${allowed.join(', ')}`);
		}
	}

	public getInfrastructureService<T extends ServiceBase>(serviceKey: ServiceKey<T>): T {
		const service = this.servicesInternal.get(serviceKey as ServiceKey<ServiceBase>);
		if (!service) {
			const name = (serviceKey as { name?: string }).name ?? 'UnknownService';
			throw new Error(`Service not found: ${name}`);
		}
		return service as T;
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

	public get applicationServices(): RequestScopedHost<AppServices, unknown> {
		if (!this.appServicesHostInternal) {
			throw new Error('Application services not initialized');
		}
		return this.appServicesHostInternal;
	}

	// Service lifecycle helpers
	private async startAllServicesWithTracing(): Promise<void> {
		await this.iterateServicesWithTracing('start', 'startUp');
	}
	private async stopAllServicesWithTracing(): Promise<void> {
		await this.iterateServicesWithTracing('stop', 'shutDown');
	}
	private async iterateServicesWithTracing(operationName: 'start' | 'stop', serviceMethod: 'startUp' | 'shutDown'): Promise<void> {
		const operationFullName = `${operationName.charAt(0).toUpperCase() + operationName.slice(1)}Service`;
		const operationActionPending = operationName === 'start' ? 'starting' : 'stopping';
		const operationActionCompleted = operationName === 'start' ? 'started' : 'stopped';
		await Promise.all(
			Array.from(this.servicesInternal.entries()).map(([ctor, service]) =>
				this.tracer.startActiveSpan(`Service ${(ctor as unknown as { name?: string }).name ?? 'Service'} ${operationName}`, async (span) => {
					try {
						const ctorName = (ctor as unknown as { name?: string }).name ?? 'Service';
						console.log(`${operationFullName}: Service ${ctorName} ${operationActionPending}`);
						await service[serviceMethod]();
						span.setStatus({ code: SpanStatusCode.OK, message: `Service ${ctorName} ${operationActionCompleted}` });
						console.log(`${operationFullName}: Service ${ctorName} ${operationActionCompleted}`);
					} catch (err) {
						span.setStatus({ code: SpanStatusCode.ERROR });
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
