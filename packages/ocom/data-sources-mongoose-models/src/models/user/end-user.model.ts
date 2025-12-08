// @ts-ignore [TS7]
import { type Model, Schema, type SchemaDefinition } from 'mongoose';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { type User, type UserModelType, userOptions } from './user.model.ts';
import { Patterns } from '../../patterns.ts';

export interface EndUserContactInformation extends MongooseSeedwork.NestedPath {
	email: string;
}

const EndUserContactInformationType: SchemaDefinition<EndUserContactInformation> = {
	email: {
		type: String,
		match: Patterns.EMAIL_PATTERN,
		maxlength: 254,
		required: false,
	},
};

export interface EndUserIdentityDetails extends MongooseSeedwork.NestedPath {
	lastName: string;
	legalNameConsistsOfOneName: boolean;
	restOfName: string | undefined;
}

const EndUserIdentityDetailsType: SchemaDefinition<EndUserIdentityDetails> = {
	lastName: { type: String, required: true, maxlength: 50 },
	legalNameConsistsOfOneName: { type: Boolean, required: true, default: false },
	restOfName: { type: String, required: false, maxlength: 50 },
};

export interface EndUserPersonalInformation
	extends MongooseSeedwork.NestedPath {
	identityDetails: EndUserIdentityDetails;
	contactInformation: EndUserContactInformation;
}

const EndUserPersonalInformationType: SchemaDefinition<EndUserPersonalInformation> = {
	identityDetails: {
		type: EndUserIdentityDetailsType,
		required: true,
		...MongooseSeedwork.NestedPathOptions,
	},
	contactInformation: {
		type: EndUserContactInformationType,
		required: true,
		...MongooseSeedwork.NestedPathOptions,
	},
};

export interface EndUser extends User {
	personalInformation: EndUserPersonalInformation;

	email: string | undefined;
	displayName: string;
	externalId: string;
	userType: string;
	accessBlocked: boolean;
	tags: string[] | undefined;
}

const EndUserSchema = new Schema<EndUser, Model<EndUser>, EndUser>(
	{
		personalInformation: {
			type: EndUserPersonalInformationType,
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
).index(
	{ 'personalInformation.contactInformation.email': 1 },
	{ sparse: true },
);

export const EndUserModelName: string = 'end-users'; //TODO: This should be in singular form

export const EndUserModelFactory = (UserModel: UserModelType) => {
	return UserModel.discriminator(EndUserModelName, EndUserSchema);
};

export type EndUserModelType = ReturnType<typeof EndUserModelFactory>;
