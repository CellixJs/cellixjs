import { HeaderMap, } from '@apollo/server';
// eslint-disable-next-line @typescript-eslint/require-await
const defaultContext = async () => ({});
export function startServerAndCreateHandler(server, options) {
    server.startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests();
    return async (req, context) => {
        const contextFunction = options?.context ?? defaultContext;
        try {
            const normalizedRequest = await normalizeRequest(req);
            const { body, headers, status } = await server.executeHTTPGraphQLRequest({
                httpGraphQLRequest: normalizedRequest,
                context: () => contextFunction({ context, req }),
            });
            if (body.kind === 'chunked') {
                return {
                    status: 501,
                    headers: {
                        'content-type': 'application/json',
                    },
                    body: JSON.stringify({
                        errors: [
                            {
                                message: 'Incremental delivery (chunked responses) is not implemented.',
                            },
                        ],
                    }),
                };
            }
            return {
                status: status ?? 200,
                headers: {
                    ...Object.fromEntries(headers),
                    'content-length': Buffer.byteLength(body.string).toString(),
                },
                body: body.string,
            };
        }
        catch (e) {
            context.error('Failure processing GraphQL request', e);
            return {
                status: 400,
                body: e.message,
            };
        }
    };
}
async function normalizeRequest(req) {
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
async function parseBody(req) {
    const isValidContentType = req.headers
        .get('content-type')
        ?.startsWith('application/json');
    const isValidPostRequest = req.method === 'POST' && isValidContentType;
    if (isValidPostRequest) {
        return await req.json();
    }
    return null;
}
function normalizeHeaders(req) {
    const headerMap = new HeaderMap();
    for (const [key, value] of req.headers.entries()) {
        headerMap.set(key, value);
    }
    return headerMap;
}
//# sourceMappingURL=azure-functions.js.map