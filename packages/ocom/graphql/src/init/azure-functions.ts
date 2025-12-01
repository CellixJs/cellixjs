import {
	type ApolloServer,
	type BaseContext,
	type ContextFunction,
    HeaderMap,
	type HTTPGraphQLRequest,
} from '@apollo/server';
import type { WithRequired } from '@apollo/utils.withrequired';
import type {
	HttpHandler,
	HttpRequest,
	HttpResponseInit,
	InvocationContext,
} from '@azure/functions';

export type { WithRequired } from '@apollo/utils.withrequired';

interface AzureFunctionsContextFunctionArgument {
	context: InvocationContext;
	req: HttpRequest;
}

export interface AzureFunctionsMiddlewareOptions<TContext extends BaseContext> {
	context?: ContextFunction<[AzureFunctionsContextFunctionArgument], TContext>;
}

// eslint-disable-next-line @typescript-eslint/require-await
const defaultContext: ContextFunction<
	[AzureFunctionsContextFunctionArgument]
> = async () => ({});

export function startServerAndCreateHandler(
	server: ApolloServer,
	options?: AzureFunctionsMiddlewareOptions<BaseContext>,
): HttpHandler;
export function startServerAndCreateHandler<TContext extends BaseContext>(
	server: ApolloServer<TContext>,
	options: WithRequired<AzureFunctionsMiddlewareOptions<TContext>, 'context'>,
): HttpHandler;
export function startServerAndCreateHandler<TContext extends BaseContext>(
	server: ApolloServer<TContext>,
	options?: AzureFunctionsMiddlewareOptions<TContext>,
): HttpHandler {
	server.startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests();
	return async (req: HttpRequest, context: InvocationContext) => {
		const contextFunction = options?.context ?? defaultContext;
		try {
			const normalizedRequest = await normalizeRequest(req);

			const contextPromise: () => Promise<TContext> = async () => contextFunction({ context, req }) as TContext;
			const { body, headers, status } = await server.executeHTTPGraphQLRequest({
				httpGraphQLRequest: normalizedRequest,
				context: contextPromise,
			});

			if (body.kind === 'chunked') {
				const response: HttpResponseInit = {
					status: 501,
					headers: {
						'content-type': 'application/json',
					},
					body: JSON.stringify({
						errors: [
							{
								message:
									'Incremental delivery (chunked responses) is not implemented.',
							},
						],
					}),
				};
				return response;
			}

			const response: HttpResponseInit = {
				status: status ?? 200,
				headers: {
					...Object.fromEntries(headers),
					'content-length': Buffer.byteLength(body.string).toString(),
				},
				body: body.string,
			};
			return response;
		} catch (e) {
			context.error('Failure processing GraphQL request', e);
			const errorMessage = e instanceof Error ? e.message : 'Unknown error';
			const errorResponse: HttpResponseInit = {
				status: 400,
				body: errorMessage,
			};
			return errorResponse;
		}
	};
}

async function normalizeRequest(req: HttpRequest): Promise<HTTPGraphQLRequest> {
	if (!req.method) {
		throw new Error('No method');
	}

	return {
		method: req.method,
		headers: normalizeHeaders(req),
		search: new URL(req.url).search,
		body: await parseBody(req),
	};
}

async function parseBody(req: HttpRequest): Promise<unknown> {
	const isValidContentType = req.headers
		.get('content-type')
		?.startsWith('application/json');
	const isValidPostRequest = req.method === 'POST' && isValidContentType;

	if (isValidPostRequest) {
		return await req.json();
	}

	return null;
}

function normalizeHeaders(req: HttpRequest): HeaderMap {
	const headerMap = new HeaderMap();

	for (const [key, value] of req.headers.entries()) {
		headerMap.set(key, value);
	}
	return headerMap;
}
