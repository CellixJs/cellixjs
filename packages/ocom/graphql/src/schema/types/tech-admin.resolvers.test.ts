import type { GraphQLResolveInfo } from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import type { GraphContext } from '../context.ts';
import techAdminResolvers from './tech-admin.resolvers.ts';

const info = {} as GraphQLResolveInfo;

function createContext() {
	const listQueues = vi.fn().mockResolvedValue([{ name: 'community-creation' }]);
	const getMessageCount = vi.fn().mockResolvedValue({ value: 3 });

	return {
		context: {
			applicationServices: {
				verifiedUser: { verifiedJwt: {} },
				TechAdmin: { Queue: { listQueues, getMessageCount } },
			},
		} as unknown as GraphContext,
		listQueues,
		getMessageCount,
	};
}

describe('tech admin queue resolvers', () => {
	it('returns registered queues without resolving their message counts', async () => {
		const { context, listQueues, getMessageCount } = createContext();
		const resolver = techAdminResolvers.Query?.techAdminQueues as (parent: object, args: object, context: GraphContext, info: GraphQLResolveInfo) => Promise<unknown>;

		await expect(resolver({}, {}, context, info)).resolves.toEqual([{ name: 'community-creation', messageCount: null }]);
		expect(listQueues).toHaveBeenCalledOnce();
		expect(getMessageCount).not.toHaveBeenCalled();
	});

	it('resolves a selected queue message count through the application service', async () => {
		const { context, getMessageCount } = createContext();
		const resolver = techAdminResolvers.TechAdminQueue?.messageCount as (parent: { name: string }, args: object, context: GraphContext, info: GraphQLResolveInfo) => Promise<unknown>;

		await expect(resolver({ name: 'community-creation' }, {}, context, info)).resolves.toEqual({ value: 3 });
		expect(getMessageCount).toHaveBeenCalledWith({ queueName: 'community-creation' });
	});
});
