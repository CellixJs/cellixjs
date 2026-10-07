import type { GraphQLResolveInfo } from 'graphql';
import type {
	Resolvers,
	VideoAttachCaptionInput,
	VideoCaptionKind,
	VideoCompleteUploadInput,
	VideoRecordEncodingResultInput,
	VideoRecordProgressInput,
	VideoRemoveCaptionInput,
	VideoRequestOutputUploadsInput,
	VideoRequestUploadInput,
	VideoStartEncodingInput,
} from '../builder/generated.ts';
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

/** Staff operations are not community-scoped; the domain checks the caller can encode videos. */
const requireSignedIn = (context: GraphContext): void => {
	if (!context.applicationServices.verifiedUser?.verifiedJwt) {
		throw new Error('Unauthorized');
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

/** Domain caption kinds are lowercase; the GraphQL enum is uppercase. */
const toCaptionKind = (kind: string): VideoCaptionKind => (kind === 'subtitles' ? 'SUBTITLES' : 'CAPTIONS');
const fromCaptionKind = (kind: VideoCaptionKind): string => kind.toLowerCase();

/** Throws unless the video belongs to the community the request is scoped to. */
const ensureInCurrentCommunity = async (context: GraphContext, videoId: string): Promise<void> => {
	const communityId = currentCommunityId(context);
	const found = await context.applicationServices.Video.Video.queryById({ id: videoId });
	if (found?.community.id !== communityId) {
		throw new Error('Video not found');
	}
};

const video: Resolvers = {
	Video: {
		communityId: async (parent) => {
			return await Promise.resolve(parent.community.id);
		},
		communityName: async (parent) => {
			return await Promise.resolve(parent.community.name ?? null);
		},
		captionTracks: async (parent) => {
			return await Promise.resolve(parent.captionTracks.map((track) => ({ language: track.language, label: track.label, kind: toCaptionKind(track.kind) })));
		},
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
			const playback = await context.applicationServices.Video.Video.getPlayback({ videoId: args.id });
			return { ...playback, captionTracks: playback.captionTracks.map((track) => ({ ...track, kind: toCaptionKind(track.kind) })) };
		},
		videosAwaitingEncoding: async (_parent, _args, context: GraphContext, _info: GraphQLResolveInfo) => {
			requireSignedIn(context);
			return await context.applicationServices.Video.Video.queryAwaitingEncoding();
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
		videoAttachCaption: async (_parent, args: { input: VideoAttachCaptionInput }, context: GraphContext) => {
			try {
				const { id, language, label, kind, content } = args.input;
				await ensureInCurrentCommunity(context, id);
				return { status: { success: true }, video: await context.applicationServices.Video.Video.attachCaption({ videoId: id, language, label, kind: fromCaptionKind(kind), content }) };
			} catch (error) {
				return failure(error);
			}
		},
		videoRemoveCaption: async (_parent, args: { input: VideoRemoveCaptionInput }, context: GraphContext) => {
			try {
				await ensureInCurrentCommunity(context, args.input.id);
				return { status: { success: true }, video: await context.applicationServices.Video.Video.removeCaption({ videoId: args.input.id, language: args.input.language }) };
			} catch (error) {
				return failure(error);
			}
		},
		videoRecordProgress: async (_parent, args: { input: VideoRecordProgressInput }, context: GraphContext) => {
			try {
				const memberId = currentMemberId(context);
				await ensureInCurrentCommunity(context, args.input.id);
				const viewing = await context.applicationServices.Video.VideoViewing.recordProgress({
					videoId: args.input.id,
					memberId,
					ranges: args.input.ranges.map(({ start, end }) => ({ start, end })),
				});
				return { status: { success: true }, viewing };
			} catch (error) {
				return failure(error);
			}
		},
		videoStartEncoding: async (_parent, args: { input: VideoStartEncodingInput }, context: GraphContext) => {
			try {
				requireSignedIn(context);
				const { video: started, ...encoding } = await context.applicationServices.Video.Video.startEncoding({ videoId: args.input.id });
				return { status: { success: true }, video: started, encoding };
			} catch (error) {
				return failure(error);
			}
		},
		videoRequestOutputUploads: async (_parent, args: { input: VideoRequestOutputUploadsInput }, context: GraphContext) => {
			try {
				requireSignedIn(context);
				return { status: { success: true }, uploads: await context.applicationServices.Video.Video.requestOutputUploads({ videoId: args.input.id, paths: args.input.paths }) };
			} catch (error) {
				return failure(error);
			}
		},
		videoRecordEncodingResult: async (_parent, args: { input: VideoRecordEncodingResultInput }, context: GraphContext) => {
			try {
				requireSignedIn(context);
				const { id, succeeded, failed } = args.input;
				if (Boolean(succeeded) === Boolean(failed)) {
					throw new Error('Provide exactly one of succeeded or failed');
				}
				const recorded = succeeded
					? await context.applicationServices.Video.Video.recordEncodingResult({ videoId: id, succeeded })
					: await context.applicationServices.Video.Video.recordEncodingResult({ videoId: id, failed: failed as { code: string; message: string } });
				return { status: { success: true }, video: recorded };
			} catch (error) {
				return failure(error);
			}
		},
	},
};

export default video;
