import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { type Model, Schema, type Types } from 'mongoose';
import * as Community from '../community/community.model.ts';
import * as Member from '../member/member.model.ts';
import * as Video from './video.model.ts';

/** A run of consecutive played buckets, by index, inclusive at both ends. */
export interface VideoViewingBucketRange {
	start: number;
	end: number;
}

/** How much of a video one member has watched (ADR 0037). */
export interface VideoViewing extends MongooseSeedwork.Base {
	community: Types.ObjectId;
	video: Types.ObjectId;
	member: Types.ObjectId;
	durationSeconds: number;
	bucketSeconds: number;
	bucketCount: number;
	watchedBuckets: VideoViewingBucketRange[];
	watchedBucketCount: number;
	creditSeconds: number;
	lastReportAt: Date | null;
	/** Where the member's player last was, in seconds, for resuming. */
	lastPositionSeconds: number | null;
	completedAt: Date | null;
}

const VideoViewingSchema = new Schema<VideoViewing, Model<VideoViewing>, VideoViewing>(
	{
		schemaVersion: { type: String, default: '1.0.0' },
		community: { type: Schema.Types.ObjectId, ref: Community.CommunityModelName, required: true },
		video: { type: Schema.Types.ObjectId, ref: Video.VideoModelName, required: true },
		member: { type: Schema.Types.ObjectId, ref: Member.MemberModelName, required: true },
		durationSeconds: { type: Number, required: true, min: 0 },
		bucketSeconds: { type: Number, required: true, min: 1 },
		bucketCount: { type: Number, required: true, min: 1 },
		watchedBuckets: {
			type: [
				new Schema<VideoViewingBucketRange>(
					{
						start: { type: Number, required: true, min: 0 },
						end: { type: Number, required: true, min: 0 },
					},
					{ _id: false },
				),
			],
			default: [],
		},
		watchedBucketCount: { type: Number, required: true, default: 0, min: 0 },
		creditSeconds: { type: Number, required: true, default: 0, min: 0 },
		lastReportAt: { type: Date, required: false, default: null },
		lastPositionSeconds: { type: Number, required: false, default: null, min: 0 },
		completedAt: { type: Date, required: false, default: null },
	},
	{
		timestamps: true,
		versionKey: 'version',
	},
)
	.index({ video: 1, member: 1 }, { unique: true })
	.index({ community: 1, member: 1 });

export const VideoViewingModelName = 'VideoViewing';
export const VideoViewingModelFactory = MongooseSeedwork.modelFactory<VideoViewing>(VideoViewingModelName, VideoViewingSchema);
export type VideoViewingModelType = ReturnType<typeof VideoViewingModelFactory>;
