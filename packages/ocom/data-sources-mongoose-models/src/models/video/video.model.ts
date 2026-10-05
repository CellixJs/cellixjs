import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { type Model, type ObjectId, type PopulatedDoc, Schema } from 'mongoose';
import * as Community from '../community/community.model.ts';

export interface Video extends MongooseSeedwork.Base {
	community: PopulatedDoc<Community.Community> | ObjectId;
	title: string;
	status: string;

	sourceContainerName: string;
	sourceBlobName: string;
	sourceContentType: string;
	sourceSizeBytes: number;

	outputContainerName: string | null;
	outputPrefix: string | null;
	dashManifestBlobName: string | null;
	hlsManifestBlobName: string | null;
	durationSeconds: number | null;
	renditionHeights: number[];

	failureCode: string | null;
	failureMessage: string | null;
}

const VideoSchema = new Schema<Video, Model<Video>, Video>(
	{
		schemaVersion: { type: String, default: '1.0.0' },
		community: {
			type: Schema.Types.ObjectId,
			ref: Community.CommunityModelName,
			required: true,
			index: true,
		},
		title: { type: String, required: true, maxlength: 200 },
		status: {
			type: String,
			required: true,
			enum: ['AWAITING_UPLOAD', 'UPLOADED', 'ENCODING', 'READY', 'FAILED'],
		},
		sourceContainerName: { type: String, required: true, maxlength: 63 },
		sourceBlobName: { type: String, required: true, maxlength: 1024 },
		sourceContentType: { type: String, required: true, maxlength: 100 },
		sourceSizeBytes: { type: Number, required: true, min: 1 },
		outputContainerName: { type: String, required: false, default: null, maxlength: 63 },
		outputPrefix: { type: String, required: false, default: null, maxlength: 1024 },
		dashManifestBlobName: { type: String, required: false, default: null, maxlength: 1024 },
		hlsManifestBlobName: { type: String, required: false, default: null, maxlength: 1024 },
		durationSeconds: { type: Number, required: false, default: null, min: 0 },
		renditionHeights: { type: [Number], default: [] },
		failureCode: { type: String, required: false, default: null, maxlength: 64 },
		failureMessage: { type: String, required: false, default: null, maxlength: 2000 },
	},
	{
		timestamps: true,
		versionKey: 'version',
	},
).index({ community: 1, createdAt: -1 });

export const VideoModelName = 'Video';
export const VideoModelFactory = MongooseSeedwork.modelFactory<Video>(VideoModelName, VideoSchema);
export type VideoModelType = ReturnType<typeof VideoModelFactory>;
