import { type Model, Schema, type SchemaDefinition } from 'mongoose';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { Patterns } from '../../patterns.ts';
import { type User, type UserModelType, userOptions } from './user.model.ts';

export interface VendorUserContactInformation extends MongooseSeedwork.NestedPath {
	email: string | undefined;
}

const VendorUserContactInformationType:
	SchemaDefinition<VendorUserContactInformation> = {
	email: {
		type: String,
		match: Patterns.EMAIL_PATTERN,
		maxlength: 254,
		required: false,
	},
};

export interface VendorUserIdentityDetails extends MongooseSeedwork.NestedPath {
	lastName: string;
	legalNameConsistsOfOneName: boolean;
	restOfName: string | undefined;
}

const VendorUserIdentityDetailsType:
	SchemaDefinition<VendorUserIdentityDetails> = {
	lastName: { type: String, required: true, maxlength: 50 },
	legalNameConsistsOfOneName: {
		type: Boolean,
		required: true,
		default: false,
	},
	restOfName: { type: String, required: false, maxlength: 50 },
};

export interface VendorUserPersonalInformation
	extends MongooseSeedwork.NestedPath {
	identityDetails: VendorUserIdentityDetails;
	contactInformation: VendorUserContactInformation;
}

const VendorUserPersonalInformationType:
	SchemaDefinition<VendorUserPersonalInformation> = {
	identityDetails: {
		type: VendorUserIdentityDetailsType,
		required: true,
		...MongooseSeedwork.NestedPathOptions,
	},
	contactInformation: {
		type: VendorUserContactInformationType,
		required: true,
		...MongooseSeedwork.NestedPathOptions,
	},
};

export interface VendorUser extends User {
	personalInformation: VendorUserPersonalInformation;

	email: string | undefined;
	displayName: string;
	externalId: string;
	userType?: string;
	accessBlocked: boolean;
	tags: string[] | undefined;
}

const VendorUserSchema = new Schema<
	VendorUser,
	Model<VendorUser>,
	VendorUser
>(
	{
		personalInformation: {
			type: VendorUserPersonalInformationType,
			required: true,
			...MongooseSeedwork.NestedPathOptions,
		},
		schemaVersion: {
			type: String,
			default: '1.0.0',
			required: false,
		},
		email: {
			type: String,
			match: Patterns.EMAIL_PATTERN,
			maxlength: 254,
			required: false,
		},
		externalId: {
			type: String,
			match: Patterns.GUID_PATTERN,
			minlength: [36, 'External ID must be 36 characters long'],
			maxlength: [36, 'External ID must be 36 characters long'],
			required: true,
			index: true,
			unique: true,
		},
		displayName: {
			type: String,
			required: true,
			maxlength: 500,
		},
		accessBlocked: {
			type: Boolean,
			required: true,
			default: false,
		},
		tags: {
			type: [String],
			required: false,
		},
	},
	userOptions,
).index({ 'personalInformation.contactInformation.email': 1 }, { sparse: true });

const VendorUserModelName: string = 'vendor-user';

export const VendorUserModelFactory = (UserModel: UserModelType) => {
	return UserModel.discriminator(VendorUserModelName, VendorUserSchema);
};

export type VendorUserModelType = ReturnType<typeof VendorUserModelFactory>;
