import type { Response } from 'playwright';

/** Shape of a GraphQL response payload with optional top-level errors. */
type GraphqlPayload<TData> = {
	data?: TData;
	errors?: Array<{ message?: string }>;
};

/**
 * Playwright response predicate that matches the GraphQL POST carrying the
 * given operation name.
 */
export const hasGraphqlOperation = (operationName: string) => (response: Response) => {
	if (!response.url().includes('/api/graphql') || response.request().method() !== 'POST') {
		return false;
	}

	return response.request().postData()?.includes(operationName) ?? false;
};

/**
 * Picks the payload that carries the expected data from a possibly batched
 * GraphQL HTTP response.
 */
export const selectGraphqlPayload = <TData>(payload: GraphqlPayload<TData> | Array<GraphqlPayload<TData>> | null, hasExpectedData: (data: TData | undefined) => boolean): GraphqlPayload<TData> | null => {
	if (!Array.isArray(payload)) {
		return payload;
	}

	return payload.find((item) => hasExpectedData(item.data)) ?? payload.find((item) => item.errors?.length) ?? null;
};

/** Joins the messages of any top-level GraphQL errors in the payload. */
export const graphqlErrors = (payload: { errors?: Array<{ message?: string }> } | null): string | undefined =>
	payload?.errors
		?.map((error) => error.message)
		.filter(Boolean)
		.join('; ');
