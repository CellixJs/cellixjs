import * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import { type Model, type ObjectId, type PopulatedDoc, Schema } from 'mongoose';
import * as EndUser from '../user/end-user.model.ts';

export interface Community extends MongooseSeedwork.Base {
	name: string;
	domain: string;
	whiteLabelDomain: string;
	handle: string;
	createdBy: PopulatedDoc<EndUser.EndUser> | ObjectId;
}

//export const CommunityModel = model<Community>('Community',
const CommunitySchema = new Schema<Community, Model<Community>, Community>(
	{
		schemaVersion: { type: String, default: '1.0.0' },
		name: {
			type: String,
			required: true,
			maxlength: 200,
		},
		domain: { type: String, required: false, maxlength: 500 },
		whiteLabelDomain: { type: String, required: false, maxlength: 500 },
		handle: {
			type: String,
			required: false,
			maxlength: 50,
		},
		createdBy: {
			type: Schema.Types.ObjectId,
			ref: EndUser.EndUserModelName,
			required: true,
		},
	},
    { 
        timestamps: true,
        versionKey: 'version',
    }
)
	.index(
		{ domain: 1 },
		{
			unique: true,
			partialFilterExpression: {
				domain: { $exists: true },
			},
		},
	)
	.index(
		{ whiteLabelDomain: 1 },
		{
			unique: true,
			partialFilterExpression: {
				whiteLabelDomain: { $exists: true },
			},
		},
	)
	.index(
		{ handle: 1 },
		{
			unique: true,
			partialFilterExpression: {
				handle: { $exists: true },
			},
		},
	);

export const CommunityModelName = 'Community';
export const CommunityModelFactory = MongooseSeedwork.modelFactory<Community>(
	CommunityModelName,
	CommunitySchema,
);
export type CommunityModelType = ReturnType<typeof CommunityModelFactory>;
