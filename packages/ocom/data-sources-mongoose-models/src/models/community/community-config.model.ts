import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { type Model, Schema, type SchemaDefinition } from 'mongoose';

export interface CommunityConfigSubscription extends MongooseSeedwork.NestedPath {
	pricePerMember: number;
	currency: string;
}

export interface CommunityConfigLimits extends MongooseSeedwork.NestedPath {
	maxMembers: number;
	maxAdmins: number;
}

export interface CommunityConfig extends MongooseSeedwork.Base {
	subscriptionTier: 'pro' | 'enterprise';
	subscription: CommunityConfigSubscription;
	limits: CommunityConfigLimits;
	effectiveDate: Date;
}

const CommunityConfigSchema = new Schema<CommunityConfig, Model<CommunityConfig>, CommunityConfig>(
	{
		schemaVersion: { type: String, default: '1.0.0' },
		subscriptionTier: {
			type: String,
			enum: ['pro', 'enterprise'],
			required: true,
		},
		subscription: {
			pricePerMember: { type: Number, required: true },
			currency: { type: String, required: true, default: 'USD' },
		} as SchemaDefinition<CommunityConfigSubscription>,
		limits: {
			maxMembers: { type: Number, required: true },
			maxAdmins: { type: Number, required: true },
		} as SchemaDefinition<CommunityConfigLimits>,
		effectiveDate: { type: Date, required: true },
	},
	{
		collection: 'communityconfigs',
		timestamps: true,
		versionKey: 'version',
	},
)
	.index({ subscriptionTier: 1, effectiveDate: -1 })
	// One configuration per tier per effective date, so concurrent writers cannot
	// create duplicate rows. Declared as its own index rather than by making the index
	// above unique, which would conflict with the index already built on deployed
	// databases.
	.index({ subscriptionTier: 1, effectiveDate: 1 }, { unique: true });

export const CommunityConfigModelName = 'CommunityConfig';
export const CommunityConfigModelFactory = MongooseSeedwork.modelFactory<CommunityConfig>(CommunityConfigModelName, CommunityConfigSchema);
export type CommunityConfigModelType = ReturnType<typeof CommunityConfigModelFactory>;
