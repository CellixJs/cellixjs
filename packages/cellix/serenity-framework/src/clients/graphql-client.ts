import { Ability } from '@serenity-js/core';

/** GraphQL error shape returned by common GraphQL HTTP servers. */
export interface GraphQLResponseError {
	/** Human-readable error message. */
	message: string;
}

/** Result returned from {@link GraphQLClient.execute}. */
export interface GraphQLResponse<TData extends Record<string, unknown> = Record<string, unknown>> {
	/** GraphQL response data. */
	data: TData;

	/** Optional GraphQL errors returned by the server. */
	errors?: GraphQLResponseError[];
}

/** Options used to create a GraphQL Serenity ability. */
export interface GraphQLClientOptions {
	/** GraphQL HTTP endpoint URL. */
	apiUrl: string;

	/** Headers applied to every request. */
	headers?: Record<string, string> | (() => Record<string, string>);

	/** Fetch implementation. Defaults to `globalThis.fetch`. */
	fetch?: typeof fetch;
}

/**
 * Serenity ability for executing GraphQL operations over HTTP.
 *
 * Consumers provide the endpoint and any app-specific headers, such as test
 * authorization tokens. GraphQL errors are raised as JavaScript `Error`s so
 * Screenplay questions and tasks fail the scenario clearly.
 */
export class GraphQLClient extends Ability {
	private readonly apiUrl: string;
	private readonly fetcher: typeof fetch;
	private readonly headers: Record<string, string> | (() => Record<string, string>) | undefined;

	/**
	 * @param options Endpoint, headers, and optional fetch implementation.
	 */
	constructor(options: GraphQLClientOptions) {
		super();
		this.apiUrl = options.apiUrl;
		this.headers = options.headers;
		this.fetcher = options.fetch ?? globalThis.fetch;
	}

	/**
	 * Create a GraphQL ability for a specific endpoint.
	 *
	 * @param apiUrl GraphQL HTTP endpoint URL.
	 * @param headers Optional static or lazy headers applied to each request.
	 */
	static at(apiUrl: string, headers?: Record<string, string> | (() => Record<string, string>)): GraphQLClient {
		return new GraphQLClient({ apiUrl, ...(headers && { headers }) });
	}

	/**
	 * Execute a GraphQL query or mutation.
	 *
	 * @param query GraphQL document text.
	 * @param variables Variables supplied to the operation.
	 * @throws Error when the HTTP response is not OK or the GraphQL result contains errors.
	 */
	async execute<TData extends Record<string, unknown> = Record<string, unknown>>(query: string, variables: Record<string, unknown> = {}): Promise<GraphQLResponse<TData>> {
		const response = await this.fetcher(this.apiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...this.resolveHeaders(),
			},
			body: JSON.stringify({ query, variables }),
		});

		let result: GraphQLResponse<TData>;
		try {
			result = (await response.json()) as GraphQLResponse<TData>;
		} catch (parseError) {
			if (!response.ok) {
				throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
			}
			throw parseError;
		}

		if (result.errors?.length) {
			throw new Error(result.errors.map((error) => error.message ?? 'Unknown error').join('; '));
		}

		if (!response.ok) {
			throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
		}

		return result;
	}

	private resolveHeaders(): Record<string, string> {
		if (!this.headers) {
			return {};
		}

		return typeof this.headers === 'function' ? this.headers() : this.headers;
	}
}
