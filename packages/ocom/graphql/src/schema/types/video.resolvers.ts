import type { GraphQLResolveInfo } from 'graphql';
import type { Resolvers, VideoCompleteUploadInput, VideoRequestUploadInput } from '../builder/generated.ts';
import type { GraphContext } from '../context.ts';

const failure = (error: unknown) => {
	console.error('Video > Mutation : ', error);
	return { status: { success: false, errorMessage: (error as Error).message } };
};

/** The community the request is scoped to (from the x-community-id header). */
const currentCommunityId = (context: GraphContext): string => {
	const communityId = context.applicationServices.verifiedUser?.hints?.communityId;
	if (!context.applicationServices.verifiedUser?.verifiedJwt || !communityId) {
		throw new Error('Unauthorized');
	}
	return communityId;
};

const video: Resolvers = {
	Query: {
		communityVideos: async (_parent, _args, context: GraphContext, _info: GraphQLResolveInfo) => {
			return await context.applicationServices.Video.Video.queryByCommunity({ communityId: currentCommunityId(context) });
		},
		videoById: async (_parent, args: { id: string }, context: GraphContext, _info: GraphQLResolveInfo) => {
			const communityId = currentCommunityId(context);
			const found = await context.applicationServices.Video.Video.queryById({ id: args.id });
			return found?.community.id === communityId ? found : null;
		},
		videoPlayback: async (_parent, args: { id: string }, context: GraphContext, _info: GraphQLResolveInfo) => {
			const communityId = currentCommunityId(context);
			const found = await context.applicationServices.Video.Video.queryById({ id: args.id });
			if (found?.community.id !== communityId) {
				return null;
			}
			return await context.applicationServices.Video.Video.getPlayback({ videoId: args.id });
		},
	},
	Mutation: {
		videoRequestUpload: async (_parent, args: { input: VideoRequestUploadInput }, context: GraphContext) => {
			try {
				const { video: created, upload } = await context.applicationServices.Video.Video.requestUpload({
					communityId: currentCommunityId(context),
					title: args.input.title,
					contentType: args.input.contentType,
					sizeBytes: args.input.sizeBytes,
				});
				return {
					status: { success: true },
					video: created,
					upload: { url: upload.url, headers: Object.entries(upload.headers).map(([name, value]) => ({ name, value })) },
				};
			} catch (error) {
				return failure(error);
			}
		},
		videoCompleteUpload: async (_parent, args: { input: VideoCompleteUploadInput }, context: GraphContext) => {
			try {
				const communityId = currentCommunityId(context);
				const found = await context.applicationServices.Video.Video.queryById({ id: args.input.id });
				if (found?.community.id !== communityId) {
					throw new Error('Video not found');
				}
				return { status: { success: true }, video: await context.applicationServices.Video.Video.completeUpload({ videoId: args.input.id }) };
			} catch (error) {
				return failure(error);
			}
		},
	},
};

export default video;
