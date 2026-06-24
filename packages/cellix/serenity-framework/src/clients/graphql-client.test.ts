import { describe, expect, it, vi } from 'vitest';
import { GraphQLClient } from './index.ts';

describe('GraphQLClient', () => {
	it('posts GraphQL operations with configured headers', async () => {
		const fetcher = vi.fn(async () => Response.json({ data: { ok: true } }));
		const client = new GraphQLClient({
			apiUrl: 'https://api.example.test/graphql',
			fetch: fetcher as typeof fetch,
			headers: { Authorization: 'Bearer test' },
		});

		const response = await client.execute<{ ok: boolean }>('query Test { ok }', { id: 1 });

		expect(response.data.ok).toBe(true);
		expect(fetcher).toHaveBeenCalledWith(
			'https://api.example.test/graphql',
			expect.objectContaining({
				body: JSON.stringify({ query: 'query Test { ok }', variables: { id: 1 } }),
				headers: {
					Authorization: 'Bearer test',
					'Content-Type': 'application/json',
				},
				method: 'POST',
			}),
		);
	});

	it('throws when GraphQL errors are returned', async () => {
		const fetcher = vi.fn(async () => Response.json({ data: {}, errors: [{ message: 'Nope' }] }));
		const client = new GraphQLClient({
			apiUrl: 'https://api.example.test/graphql',
			fetch: fetcher as typeof fetch,
		});

		await expect(client.execute('query Test { ok }')).rejects.toThrow('Nope');
	});
});
