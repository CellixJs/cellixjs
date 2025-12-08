// @ts-ignore [TS7]
import { type Model, type ObjectId, type PopulatedDoc, Schema } from 'mongoose';
import { Patterns } from '../../patterns.ts';
import * as StaffRole from '../role/staff-role.model.ts';
import { type User, type UserModelType, userOptions } from './user.model.ts';

export interface StaffUser extends User {
	role?: PopulatedDoc<StaffRole.StaffRole> | ObjectId;
	firstName: string;
	lastName: string;
	email: string;

	displayName: string;
	externalId: string;
	userType?: string;
	accessBlocked: boolean;
	tags?: string[];
}

const StaffUserSchema = new Schema<
	StaffUser,
	Model<StaffUser>,
	StaffUser
>(
	{
		role: {
			type: Schema.Types.ObjectId,
			ref: StaffRole.StaffRoleModelName,
			required: false,
		},
		firstName: {
			type: String,
			required: false,
			maxlength: 500,
		},
		lastName: {
			type: String,
			required: false,
			maxlength: 500,
		},
		email: {
			type: String,
			match: Patterns.EMAIL_PATTERN,
			maxlength: 254,
			required: false,
		},
		schemaVersion: {
			type: String,
			default: '1.0.0',
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
).index({ email: 1 }, { sparse: true });

const StaffUserModelName: string = 'staff-user';

export const StaffUserModelFactory = (UserModel: UserModelType) => {
	return UserModel.discriminator(StaffUserModelName, StaffUserSchema);
};

export type StaffUserModelType = ReturnType<typeof StaffUserModelFactory>;
