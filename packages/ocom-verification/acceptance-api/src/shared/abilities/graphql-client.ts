import { Ability } from '@serenity-js/core';

interface GraphQLResponse {
	data: Record<string, unknown>;
	errors?: Array<{ message: string }>;
}

export class GraphQLClient extends Ability {
	constructor(private readonly apiUrl: string) {
		super();
	}

	static at(apiUrl: string): GraphQLClient {
		return new GraphQLClient(apiUrl);
	}

	async execute(query: string, variables: Record<string, unknown> = {}): Promise<GraphQLResponse> {
		const response = await fetch(this.apiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'Bearer test-token',
			},
			body: JSON.stringify({ query, variables }),
		});

		const result = (await response.json()) as GraphQLResponse;

		if (result.errors && Array.isArray(result.errors)) {
			const errorMessage = result.errors.map((err) => err.message ?? 'Unknown error').join('; ');
			throw new Error(errorMessage);
		}

		if (!response.ok) {
			throw new Error(`GraphQL error: ${response.status} ${response.statusText}`);
		}

		return result;
	}
}
