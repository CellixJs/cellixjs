import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { type Model, type ObjectId, type PopulatedDoc, Schema, type SchemaDefinition, type Types } from 'mongoose';
import * as EndUser from '../user/end-user.model.ts';

export interface CommunityTransactionReference extends MongooseSeedwork.NestedPath {
	vendor?: string;
	isSuccess?: boolean;
	lastRequestedAt?: Date;
	referenceId?: string;
	transactionId?: string;
	reconciliationId?: string;
	completedAt?: Date;
	errorOccurredAt?: Date;
	errorCode?: string;
	errorMessage?: string;
}

export interface CommunityTransaction extends MongooseSeedwork.SubdocumentBase {
	amount: number;
	transactionReference: CommunityTransactionReference;
}

export interface CommunityFinance extends MongooseSeedwork.NestedPath {
	subscriptionTier: 'pro' | 'enterprise';
	paymentInstrumentId?: string;
	transactions: Types.DocumentArray<CommunityTransaction>;
}

export interface Community extends MongooseSeedwork.Base {
	name: string;
	domain: string;
	whiteLabelDomain: string;
	handle: string;
	createdBy: PopulatedDoc<EndUser.EndUser> | ObjectId;
	finance: CommunityFinance;
}

const CommunityTransactionSchema = new Schema<CommunityTransaction, Model<CommunityTransaction>, CommunityTransaction>(
	{
		amount: { type: Number, required: true },
		transactionReference: {
			vendor: { type: String, required: false },
			isSuccess: { type: Boolean, required: false },
			lastRequestedAt: { type: Date, required: false },
			referenceId: { type: String, required: false },
			transactionId: { type: String, required: false },
			reconciliationId: { type: String, required: false },
			completedAt: { type: Date, required: false },
			errorOccurredAt: { type: Date, required: false },
			errorCode: { type: String, required: false },
			errorMessage: { type: String, required: false },
		} as SchemaDefinition<CommunityTransactionReference>,
	},
	{
		timestamps: true,
		versionKey: 'version',
	},
);

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
		finance: {
			subscriptionTier: {
				type: String,
				enum: ['pro', 'enterprise'],
				required: true,
				default: 'pro',
			},
			paymentInstrumentId: { type: String, required: false },
			transactions: { type: [CommunityTransactionSchema], required: false, default: [] },
		} as SchemaDefinition<CommunityFinance>,
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
	)
	// One charge per reference. The reference is derived from the community and billing
	// period, so this is the database-level guarantee that a resubmitted or retried
	// charge cannot be recorded twice, independently of the application check.
	.index(
		{ 'finance.transactions.transactionReference.referenceId': 1 },
		{
			unique: true,
			partialFilterExpression: {
				'finance.transactions.transactionReference.referenceId': { $type: 'string' },
			},
		},
	);

export const CommunityModelName = 'Community';
export const CommunityModelFactory = MongooseSeedwork.modelFactory<Community>(CommunityModelName, CommunitySchema);
export type CommunityModelType = ReturnType<typeof CommunityModelFactory>;
