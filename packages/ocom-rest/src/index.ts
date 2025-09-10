import type {
	HttpRequest,
	HttpResponseInit,
	InvocationContext,
} from '@azure/functions';
import type { ApplicationServicesFactory, PrincipalHints } from '@ocom/api-application-services';

export type HttpHandler = (
	request: HttpRequest,
	context: InvocationContext,
) => Promise<HttpResponseInit>;

export const restHandlerCreator = (applicationServicesFactory: ApplicationServicesFactory): HttpHandler => {
	return async (request: HttpRequest, _context: InvocationContext) => {
        const rawAuthHeader = request.headers.get('Authorization') ?? undefined;
        const hints: PrincipalHints = {
            // biome-ignore lint:useLiteralKeys
            memberId: request.params[`memberId`] ?? undefined,
            // biome-ignore lint:useLiteralKeys
            communityId: request.params['communityId'] ?? undefined,
        };
        const applicationServices = await applicationServicesFactory.forRequest(rawAuthHeader, hints);

		return {
			status: 200,
			jsonBody: {
				message: 'Hello World!',
                applicationServices
			},
		};
	};
};
