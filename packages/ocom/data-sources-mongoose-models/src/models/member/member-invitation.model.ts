import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { type Model, type ObjectId, type PopulatedDoc, Schema } from 'mongoose';
import * as EndUser from '../user/end-user.model.ts';

export interface MemberInvitation extends MongooseSeedwork.Base {
	communityId: string;
	email: string;
	message: string;
	status: string;
	expiresAt: Date;
	invitedBy: PopulatedDoc<EndUser.EndUser> | ObjectId;
	acceptedBy?: PopulatedDoc<EndUser.EndUser> | ObjectId;
}

const MemberInvitationSchema = new Schema<MemberInvitation, Model<MemberInvitation>, MemberInvitation>(
	{
		schemaVersion: {
			type: String,
			default: '1.0.0',
			required: false,
		},
		communityId: { type: String, required: true, index: true },
		email: { type: String, required: true, maxlength: 254, index: true },
		message: { type: String, required: false, maxlength: 1000, default: '' },
		status: {
			type: String,
			enum: ['PENDING', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
			required: true,
			default: 'PENDING',
		},
		expiresAt: { type: Date, required: true },
		invitedBy: { type: Schema.Types.ObjectId, ref: EndUser.EndUserModelName, required: true },
		acceptedBy: { type: Schema.Types.ObjectId, ref: EndUser.EndUserModelName, required: false },
	},
	{
		timestamps: true,
		versionKey: 'version',
		shardKey: { communityId: 1 },
	},
).index({ communityId: 1, email: 1 });

export const MemberInvitationModelName: string = 'MemberInvitation';
export const MemberInvitationModelFactory = MongooseSeedwork.modelFactory<MemberInvitation>(MemberInvitationModelName, MemberInvitationSchema);
export type MemberInvitationModelType = ReturnType<typeof MemberInvitationModelFactory>;
