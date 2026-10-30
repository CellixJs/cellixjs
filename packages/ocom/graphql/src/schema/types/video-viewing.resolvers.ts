import type { Domain } from '@ocom/domain';
import type { Resolvers, VideoRecordProgressInput } from '../builder/generated.ts';
import type { GraphContext } from '../context.ts';
import { ensureInCurrentCommunity } from './video.resolvers.ts';

const VideoViewingMutationResolver = async (getViewing: Promise<Domain.Contexts.Video.VideoViewing.VideoViewingEntityReference>) => {
	try {
		return {
			status: { success: true },
			viewing: await getViewing,
		};
	} catch (error) {
		console.error('VideoViewing > Mutation : ', error);
		const { message } = error as Error;
		return {
			status: { success: false, errorMessage: message },
		};
	}
};

/** The member the request is acting as (from the x-member-id header). Only members watch videos. */
const currentMemberId = (context: GraphContext): string => {
	const memberId = context.applicationServices.verifiedUser?.hints?.memberId;
	if (!context.applicationServices.verifiedUser?.verifiedJwt || !memberId) {
		throw new Error('Unauthorized');
	}
	return memberId;
};

const videoViewing: Resolvers = {
	Video: {
		myViewing: async (parent, _args, context: GraphContext) => {
			const memberId = context.applicationServices.verifiedUser?.hints?.memberId;
			if (!memberId) {
				return null;
			}
			return await context.applicationServices.Video.VideoViewing.queryMine({ videoId: parent.id, memberId });
		},
		viewings: async (parent, _args, context: GraphContext) => {
			return await context.applicationServices.Video.VideoViewing.queryByVideo({ videoId: parent.id });
		},
	},
	VideoViewing: {
		member: async (parent, _args, context: GraphContext) => {
			try {
				return await context.applicationServices.Community.Member.queryById({ id: parent.memberId });
			} catch (error) {
				console.error('VideoViewing > member : ', error);
				return null;
			}
		},
		unwatched: async (parent) => {
			return await Promise.resolve(parent.unwatchedRanges);
		},
	},
	Mutation: {
		videoRecordProgress: (_parent, args: { input: VideoRecordProgressInput }, context: GraphContext) =>
			VideoViewingMutationResolver(
				(async () => {
					const memberId = currentMemberId(context);
					await ensureInCurrentCommunity(context, args.input.id);
					return await context.applicationServices.Video.VideoViewing.recordProgress({
						videoId: args.input.id,
						memberId,
						ranges: args.input.ranges.map(({ start, end }) => ({ start, end })),
						position: args.input.position ?? undefined,
					});
				})(),
			),
	},
};

export default videoViewing;
