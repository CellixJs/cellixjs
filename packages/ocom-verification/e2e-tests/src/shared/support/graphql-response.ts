import type { Response } from 'playwright';

/** A GraphQL response payload with optional data and top-level errors. */
export type GraphqlPayload<TData> = {
	data?: TData;
	errors?: Array<{ message?: string }>;
};

/**
 * Playwright response predicate that matches a POSTed GraphQL operation by
 * operation name.
 */
export const hasGraphqlOperation = (operationName: string) => (response: Response) => {
	if (!response.url().includes('/api/graphql') || response.request().method() !== 'POST') {
		return false;
	}

	return response.request().postData()?.includes(operationName) ?? false;
};

/**
 * Select the relevant GraphQL payload from a (possibly batched) response body.
 */
export const selectGraphqlPayload = <TData>(payload: GraphqlPayload<TData> | Array<GraphqlPayload<TData>> | null, hasExpectedData: (data: TData | undefined) => boolean): GraphqlPayload<TData> | null => {
	if (!Array.isArray(payload)) {
		return payload;
	}

	return payload.find((item) => hasExpectedData(item.data)) ?? payload.find((item) => item.errors?.length) ?? null;
};

/** Join the top-level GraphQL error messages of a payload, if any. */
export const graphqlErrors = (payload: { errors?: Array<{ message?: string }> } | null): string | undefined =>
	payload?.errors
		?.map((error) => error.message)
		.filter(Boolean)
		.join('; ');
