import { type ApolloServer, type BaseContext, type ContextFunction } from '@apollo/server';
import type { WithRequired } from '@apollo/utils.withrequired';
import type { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions-v4';
export type { WithRequired } from '@apollo/utils.withrequired';
export interface AzureFunctionsContextFunctionArgument {
    context: InvocationContext;
    req: HttpRequest;
}
export interface AzureFunctionsMiddlewareOptions<TContext extends BaseContext> {
    context?: ContextFunction<[AzureFunctionsContextFunctionArgument], TContext>;
}
export declare function startServerAndCreateHandler(server: ApolloServer, options?: AzureFunctionsMiddlewareOptions<BaseContext>): HttpHandler;
export declare function startServerAndCreateHandler<TContext extends BaseContext>(server: ApolloServer<TContext>, options: WithRequired<AzureFunctionsMiddlewareOptions<TContext>, 'context'>): HttpHandler;
