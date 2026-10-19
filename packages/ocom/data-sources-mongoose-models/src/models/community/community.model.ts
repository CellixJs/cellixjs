import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { type Model, type ObjectId, type PopulatedDoc, Schema, type SchemaDefinition } from 'mongoose';
import * as EndUser from '../user/end-user.model.ts';

/** Community settings, including the client IP and the country resolved from it. */
export interface CommunitySettings extends MongooseSeedwork.NestedPath {
	ipAddress: string | undefined;
	countryCode: string | undefined;
	countryName: string | undefined;
}

const CommunitySettingsType: SchemaDefinition<CommunitySettings> = {
	ipAddress: { type: String, required: false, maxlength: 45 },
	countryCode: { type: String, required: false, minlength: 2, maxlength: 2 },
	countryName: { type: String, required: false, maxlength: 100 },
};

export interface Community extends MongooseSeedwork.Base {
	name: string;
	domain: string;
	whiteLabelDomain: string;
	handle: string;
	settings: CommunitySettings;
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
		settings: {
			type: CommunitySettingsType,
			required: false,
			...MongooseSeedwork.NestedPathOptions,
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
	},
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
export const CommunityModelFactory = MongooseSeedwork.modelFactory<Community>(CommunityModelName, CommunitySchema);
export type CommunityModelType = ReturnType<typeof CommunityModelFactory>;
