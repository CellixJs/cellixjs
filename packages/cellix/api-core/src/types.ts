import type { HttpFunctionOptions, HttpHandler } from '@azure/functions';
import type { ServiceBase } from '@cellix/api-services-spec';

/**
 * Minification-safe key for constructor-based infrastructure service lookup.
 *
 * @remarks
 * Keys are compared by constructor identity. Pass the same class used at registration time
 * when no semantic name was supplied.
 */
export type ServiceKey<T extends ServiceBase = ServiceBase> = { prototype: T };

/**
 * Request-scoped application services host created during bootstrap.
 *
 * @remarks
 * `forRequest` builds the per-request application services graph. HTTP handler factories
 * receive this host and typically call it with the inbound `Authorization` header.
 *
 * @typeParam AppServices - The request-scoped application services type produced for each request.
 */
export type AppHost<AppServices> = {
	forRequest(rawAuthHeader?: string, hints?: unknown): Promise<AppServices>;
};

/**
 * Register-time infrastructure service registry used while the application is still in the
 * infrastructure phase.
 *
 * @remarks
 * Services may be stored by constructor identity or by an optional semantic name. Named
 * registration is how multiple instances of the same constructor coexist.
 *
 * @typeParam ContextType - Infrastructure context type created later by {@link ContextBuilder.setContext}.
 * @typeParam AppServices - Application services type produced later by {@link ApplicationServicesInitializer.initializeApplicationServices}.
 */
export interface InfrastructureServiceRegistry<ContextType = unknown, AppServices = unknown> {
	/**
	 * Registers an infrastructure service with the application.
	 *
	 * @remarks
	 * Must be called during the infrastructure phase. By default, services are keyed by
	 * constructor identity (minification-safe). Pass `name` to register multiple instances
	 * of the same constructor under distinct string keys.
	 *
	 * @typeParam T - The concrete service type.
	 * @param service - The service instance to register.
	 * @param name - Optional semantic name. When provided, the service is retrievable by that
	 * name via {@link InitializedServiceRegistry.getInfrastructureService}.
	 * @returns The registry, for chaining.
	 *
	 * @throws Error If called outside the infrastructure phase, the constructor key is already
	 * registered when `name` is omitted, or the provided name is already registered.
	 */
	registerInfrastructureService<T extends ServiceBase>(service: T, name?: string): InfrastructureServiceRegistry<ContextType, AppServices>;
}

/**
 * Lookup-time registry available after services have been registered.
 *
 * @remarks
 * Context builders and HTTP handler factories use this surface to resolve infrastructure
 * services by constructor or by the semantic name used at registration.
 */
export interface InitializedServiceRegistry {
	/**
	 * Retrieves a registered infrastructure service by constructor key or semantic name.
	 *
	 * @typeParam T - The concrete service type.
	 * @param serviceKeyOrName - The service class used at registration time, or the string name
	 * used with named registration.
	 * @returns The registered service instance.
	 *
	 * @throws Error If no service is registered for the provided key or name.
	 */
	getInfrastructureService<T extends ServiceBase>(serviceKeyOrName: ServiceKey<T> | string): T;
	/**
	 * Whether the Azure Functions `appStart` hook has finished starting infrastructure services.
	 */
	readonly servicesInitialized: boolean;
}

/**
 * Fluent stage that defines how the infrastructure context is built from started services.
 *
 * @typeParam ContextType - The infrastructure context type returned by the context creator.
 * @typeParam AppServices - The application services type that will be produced later in the chain.
 */
export interface ContextBuilder<ContextType = unknown, AppServices = unknown> {
	/**
	 * Stores the infrastructure context creator and advances bootstrap to the context phase.
	 *
	 * @remarks
	 * The creator runs later, inside the Azure Functions `appStart` hook, after every
	 * infrastructure service has started successfully.
	 *
	 * @param contextCreator - Function that builds the infrastructure context from the service registry.
	 * @returns The application-services initializer for the next bootstrap step.
	 *
	 * @throws Error If called outside the infrastructure phase.
	 */
	setContext(contextCreator: (serviceRegistry: InitializedServiceRegistry) => ContextType): ApplicationServicesInitializer<ContextType, AppServices>;
}

/**
 * Fluent stage that registers the request-scoped application services host factory.
 *
 * @typeParam ContextType - The infrastructure context type supplied to the factory.
 * @typeParam AppServices - The application services type produced by {@link AppHost.forRequest}.
 */
export interface ApplicationServicesInitializer<ContextType, AppServices = unknown> {
	/**
	 * Stores the factory that creates the request-scoped application services host.
	 *
	 * @remarks
	 * Must be called during the context phase. The factory runs during Azure Functions
	 * `appStart` after the infrastructure context has been created.
	 *
	 * @param factory - Function that produces the application services host from the infrastructure context.
	 * @returns The Azure Functions HTTP handler registry for the next bootstrap step.
	 *
	 * @throws Error If called outside the context phase.
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
	initializeApplicationServices(factory: (infrastructureContext: ContextType) => AppHost<AppServices>): AzureFunctionHandlerRegistry<ContextType, AppServices>;
}

/**
 * Fluent stage that registers Azure Functions HTTP handlers and starts the application.
 *
 * @typeParam ContextType - The infrastructure context type available after startup.
 * @typeParam AppServices - The application services type provided to handler factories.
 */
export interface AzureFunctionHandlerRegistry<ContextType = unknown, AppServices = unknown> {
	/**
	 * Registers an Azure Function HTTP endpoint.
	 *
	 * @remarks
	 * The `handlerCreator` is invoked per request and receives the application services host
	 * and infrastructure registry. Use it to create a request-scoped handler.
	 * Registration is allowed in the `app-services` and `handlers` phases.
	 *
	 * @param name - Function name to bind in Azure Functions.
	 * @param options - Azure Functions HTTP options, excluding the handler.
	 * @param handlerCreator - Factory that, given the app services host and infrastructure registry, returns an `HttpHandler`.
	 * @returns The registry, for chaining.
	 *
	 * @throws Error If called before application services are initialized.
	 *
	 * @example
	 * ```ts
	 * registerAzureFunctionHttpHandler('graphql', { authLevel: 'anonymous' }, (host, infra) => {
	 *   return async (req, ctx) => {
	 *     const app = await host.forRequest(req.headers.get('authorization') ?? undefined);
	 *     const apollo = infra.getInfrastructureService(ServiceApolloServer);
	 *     return app.GraphQL.handle(req, ctx);
	 *   };
	 * });
	 * ```
	 */
	registerAzureFunctionHttpHandler(
		name: string,
		options: Omit<HttpFunctionOptions, 'handler'>,
		handlerCreator: (applicationServicesHost: AppHost<AppServices>, infrastructureRegistry: InitializedServiceRegistry) => HttpHandler,
	): AzureFunctionHandlerRegistry<ContextType, AppServices>;
	/**
	 * Registers handlers and lifecycle hooks with the Azure Functions host.
	 *
	 * @remarks
	 * This does not start infrastructure services immediately. Service `startUp()`, context
	 * creation, and application-host creation run later in the Azure Functions `appStart`
	 * hook. After `startUp()` resolves, the application is in the `started` phase.
	 *
	 * @returns A promise that resolves to the started application facade.
	 *
	 * @throws Error If called before application services have been initialized.
	 */
	startUp(): Promise<StartedApplication<ContextType, AppServices>>;
}

/**
 * Started application facade returned by {@link AzureFunctionHandlerRegistry.startUp}.
 *
 * @remarks
 * HTTP handlers are registered and lifecycle hooks are bound, but `context`,
 * `applicationServices`, and `servicesInitialized` only become available after the Azure
 * Functions `appStart` hook finishes.
 *
 * @typeParam ContextType - The infrastructure context type created during `appStart`.
 * @typeParam AppServices - The request-scoped application services type.
 */
export interface StartedApplication<ContextType = unknown, AppServices = unknown> extends InitializedServiceRegistry {
	/**
	 * Infrastructure context created during the Azure Functions `appStart` hook.
	 *
	 * @throws Error If accessed before `appStart` has created the context.
	 */
	readonly context: ContextType;
	/**
	 * Request-scoped application services host created during `appStart`.
	 *
	 * @throws Error If accessed before `appStart` has created the host.
	 */
	readonly applicationServices: AppHost<AppServices>;
}
