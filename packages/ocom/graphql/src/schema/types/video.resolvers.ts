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

/** Runs a video mutation and wraps its payload in a success status, or the error in a failure status. */
const VideoMutationResolver = async <T extends object>(getPayload: Promise<T>) => {
	try {
		return {
			status: { success: true },
			...(await getPayload),
		};
	} catch (error) {
		console.error('Video > Mutation : ', error);
		const { message } = error as Error;
		return {
			status: { success: false, errorMessage: message },
		};
	}
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
		canManage: async (parent) => {
			return await Promise.resolve(parent.canManage());
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
		videoRequestUpload: (_parent, args: { input: VideoRequestUploadInput }, context: GraphContext) =>
			VideoMutationResolver(
				(async () => {
					const { video: created, upload } = await context.applicationServices.Video.Video.requestUpload({
						communityId: currentCommunityId(context),
						title: args.input.title,
						contentType: args.input.contentType,
						sizeBytes: args.input.sizeBytes,
					});
					return {
						video: created,
						upload: { url: upload.url, headers: Object.entries(upload.headers).map(([name, value]) => ({ name, value })) },
					};
				})(),
			),
		videoCompleteUpload: (_parent, args: { input: VideoCompleteUploadInput }, context: GraphContext) =>
			VideoMutationResolver(
				(async () => {
					await ensureInCurrentCommunity(context, args.input.id);
					return { video: await context.applicationServices.Video.Video.completeUpload({ videoId: args.input.id }) };
				})(),
			),
		videoAttachCaption: (_parent, args: { input: VideoAttachCaptionInput }, context: GraphContext) =>
			VideoMutationResolver(
				(async () => {
					const { id, language, label, kind, content } = args.input;
					await ensureInCurrentCommunity(context, id);
					return { video: await context.applicationServices.Video.Video.attachCaption({ videoId: id, language, label, kind: fromCaptionKind(kind), content }) };
				})(),
			),
		videoRemoveCaption: (_parent, args: { input: VideoRemoveCaptionInput }, context: GraphContext) =>
			VideoMutationResolver(
				(async () => {
					await ensureInCurrentCommunity(context, args.input.id);
					return { video: await context.applicationServices.Video.Video.removeCaption({ videoId: args.input.id, language: args.input.language }) };
				})(),
			),
		videoRecordProgress: (_parent, args: { input: VideoRecordProgressInput }, context: GraphContext) =>
			VideoMutationResolver(
				(async () => {
					const memberId = currentMemberId(context);
					await ensureInCurrentCommunity(context, args.input.id);
					const viewing = await context.applicationServices.Video.VideoViewing.recordProgress({
						videoId: args.input.id,
						memberId,
						ranges: args.input.ranges.map(({ start, end }) => ({ start, end })),
						position: args.input.position ?? undefined,
					});
					return { viewing };
				})(),
			),
		videoStartEncoding: (_parent, args: { input: VideoStartEncodingInput }, context: GraphContext) =>
			VideoMutationResolver(
				(async () => {
					requireSignedIn(context);
					const { video: started, ...encoding } = await context.applicationServices.Video.Video.startEncoding({ videoId: args.input.id });
					return { video: started, encoding };
				})(),
			),
		videoRequestOutputUploads: (_parent, args: { input: VideoRequestOutputUploadsInput }, context: GraphContext) =>
			VideoMutationResolver(
				(async () => {
					requireSignedIn(context);
					return { uploads: await context.applicationServices.Video.Video.requestOutputUploads({ videoId: args.input.id, paths: args.input.paths }) };
				})(),
			),
		videoRecordEncodingResult: (_parent, args: { input: VideoRecordEncodingResultInput }, context: GraphContext) =>
			VideoMutationResolver(
				(async () => {
					requireSignedIn(context);
					const { id, succeeded, failed } = args.input;
					if (Boolean(succeeded) === Boolean(failed)) {
						throw new Error('Provide exactly one of succeeded or failed');
					}
					const recorded = succeeded
						? await context.applicationServices.Video.Video.recordEncodingResult({ videoId: id, succeeded })
						: await context.applicationServices.Video.Video.recordEncodingResult({ videoId: id, failed: failed as { code: string; message: string } });
					return { video: recorded };
				})(),
			),
	},
};

export default video;
