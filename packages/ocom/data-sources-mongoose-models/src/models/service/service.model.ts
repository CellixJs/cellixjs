import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { type Model, type ObjectId, type PopulatedDoc, Schema } from 'mongoose';
import * as Community from '../community/community.model.ts';

export interface Service extends MongooseSeedwork.Base {
	serviceName: string;
	description: string;
	isActive: boolean;
	community: PopulatedDoc<Community.Community> | ObjectId;
}

//export const ServiceModel = model<Service>('Service',
const ServiceSchema = new Schema<Service, Model<Service>, Service>(
	{
		schemaVersion: { type: String, default: '1.0.0' },
		serviceName: {
			type: String,
			required: true,
			maxlength: 100,
			minlength: 3,
		},
		description: {
			type: String,
			required: true,
			maxlength: 500,
			minlength: 1,
		},
		isActive: {
			type: Boolean,
			required: true,
			default: true,
		},
		community: {
			type: Schema.Types.ObjectId,
			ref: Community.CommunityModelName,
			required: true,
		},
	},

	{
		timestamps: true,
		versionKey: 'version',
	},
);

export const ServiceModelName = 'Service';
export const ServiceModelFactory = MongooseSeedwork.modelFactory<Service>(
	ServiceModelName,
	ServiceSchema,
);
export type ServiceModelType = ReturnType<typeof ServiceModelFactory>;