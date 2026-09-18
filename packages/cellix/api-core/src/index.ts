/**
 * Azure Functions application bootstrap for Cellix API applications.
 *
 * @remarks
 * Import `Cellix` from the package root and start configuration with
 * {@link Cellix.initializeInfrastructureServices}. The fluent chain then defines
 * infrastructure context, the request-scoped application services host, HTTP handlers,
 * and Azure Functions lifecycle hooks.
 *
 * @returns A fluent bootstrap facade created through {@link Cellix.initializeInfrastructureServices}.
 *
 * @example
 * ```ts
 * import { Cellix } from '@cellix/api-core';
 *
 * await Cellix.initializeInfrastructureServices((registry) => {
 *   registry.registerInfrastructureService(new MongooseService(url, options));
 * })
 *   .setContext((registry) => ({ mongoose: registry.getInfrastructureService(MongooseService) }))
 *   .initializeApplicationServices((context) => createAppHost(context))
 *   .registerAzureFunctionHttpHandler('graphql', { route: 'graphql' }, (host) => async (request, fnContext) => {
 *     const appServices = await host.forRequest(request.headers.get('authorization') ?? undefined);
 *     return appServices.GraphQL.handle(request, fnContext);
 *   })
 *   .startUp();
 * ```
 */
export { Cellix } from './cellix.ts';
export type {
	AppHost,
	ApplicationServicesInitializer,
	AzureFunctionHandlerRegistry,
	ContextBuilder,
	InfrastructureServiceRegistry,
	InitializedServiceRegistry,
	ServiceKey,
	StartedApplication,
} from './types.ts';
