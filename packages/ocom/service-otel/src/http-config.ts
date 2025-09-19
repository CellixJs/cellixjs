import type { IncomingMessage } from 'node:http';
import type { RequestOptions } from 'node:https';
import type { HttpInstrumentationConfig } from '@opentelemetry/instrumentation-http';

export const httpInstrumentationConfig: HttpInstrumentationConfig = {
	enabled: true,
	ignoreIncomingRequestHook: (request: IncomingMessage) => {
		// Ignore OPTIONS incoming requests
		if (request.method === 'OPTIONS') {
			return true;
		}
		return false;
	},
	ignoreOutgoingRequestHook: (options: RequestOptions) => {
		// Ignore outgoing requests with /api/graphql path
		if (options.path?.startsWith('/api/graphql')) {
			return true;
		}
		return false;
	},
};
