import type { GraphQLResolveInfo } from 'graphql';
import type { Resolvers } from '../builder/generated.ts';
import type { GraphContext } from '../context.ts';

const techAdmin: Resolvers = {
	Query: {
		techAdminQueues: async (_parent, _args, context: GraphContext, _info: GraphQLResolveInfo) => {
			ensureAuthenticated(context);
			const queues = await context.applicationServices.TechAdmin.Queue.listQueues();
			return queues.map((queue) => ({ ...queue, messageCount: null }));
		},
		techAdminQueuePeek: async (_parent, args, context: GraphContext, _info: GraphQLResolveInfo) => {
			ensureAuthenticated(context);
			return await context.applicationServices.TechAdmin.Queue.peekMessages({
				queueName: args.input.queueName,
				maxMessages: args.input.maxMessages ?? 32,
			});
		},
	},
	TechAdminQueue: {
		messageCount: (queue, _args, context: GraphContext, _info: GraphQLResolveInfo) => {
			ensureAuthenticated(context);
			return context.applicationServices.TechAdmin.Queue.getMessageCount({ queueName: queue.name });
		},
	},
	Mutation: {
		techAdminQueueSend: async (_parent, args, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				return { status: { success: false, errorMessage: 'Unauthorized' } };
			}

			try {
				await context.applicationServices.TechAdmin.Queue.sendMessage(args.input);
				return { status: { success: true } };
			} catch (error) {
				return { status: { success: false, errorMessage: error instanceof Error ? error.message : String(error) } };
			}
		},
	},
};

export default techAdmin;

function ensureAuthenticated(context: GraphContext): void {
	if (!context.applicationServices.verifiedUser?.verifiedJwt) {
		throw new Error('Unauthorized');
	}
}
