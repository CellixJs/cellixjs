import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
// @ts-ignore [TS7]
import  { type Model, type ObjectId, type PopulatedDoc, Schema, type SchemaDefinition, type Types } from 'mongoose';
import { Patterns } from '../../patterns.ts';
import * as Community from '../community/community.model.ts';
import * as EndUserRole from '../role/end-user-role.model.ts';
import * as EndUser from '../user/end-user.model.ts';

export interface MemberAccount extends MongooseSeedwork.SubdocumentBase {
  firstName: string;
  lastName?: string;
  user: PopulatedDoc<EndUser.EndUser> | ObjectId;
  statusCode: string;
  createdBy: PopulatedDoc<EndUser.EndUser> | ObjectId;
}

export interface MemberCustomView extends MongooseSeedwork.SubdocumentBase {
  name: string;
  type: string;
  filters: string[];
  sortOrder: string;
  columnsToDisplay: string[];
}

const MemberAccountSchema = new Schema<MemberAccount, Model<MemberAccount>, MemberAccount>(
  {
    firstName: { type: String, required: true, maxlength: 500 },
    lastName: { type: String, required: false, maxlength: 500 },
    user: { type: Schema.Types.ObjectId, ref: EndUser.EndUserModelName, required: false, index: true },
    statusCode: {
      type: String,
      enum: ['CREATED', 'ACCEPTED', 'REJECTED'],
      required: false,
      default: 'CREATED',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: EndUser.EndUserModelName, required: false, index: true },
  },
  {
    timestamps: true,
    versionKey: 'version',
  }
);

const MemberCustomViewSchema = new Schema<MemberCustomView, Model<MemberCustomView>, MemberCustomView>({
  name: { type: String, required: true, maxlength: 500 },
  type: { type: String, required: true, maxlength: 500 },
  filters: { type: [{ type: String, maxlength: 100 }], required: false, default: [] },
  sortOrder: { type: String, required: false },
  columnsToDisplay: { type: [{ type: String, maxlength: 30 }], required: false, default: [] },
});

export interface MemberProfile extends MongooseSeedwork.NestedPath {
  name: string;
  email: string;
  bio: string;
  avatarDocumentId: string;
  interests: string[];
  showInterests: boolean;
  showEmail: boolean;
  showPhone: boolean;
  showProfile: boolean;
  showLocation: boolean;
  showProperties: boolean;
}

export interface Member extends MongooseSeedwork.Base {
  memberName: string;
  community: PopulatedDoc<Community.Community> | ObjectId;
  accounts: Types.DocumentArray<MemberAccount>;
  cybersourceCustomerId: string;
  customViews: Types.DocumentArray<MemberCustomView>;
  role?: PopulatedDoc<EndUserRole.EndUserRole> | ObjectId;
  profile: MemberProfile;
}

const MemberSchema = new Schema<Member, Model<Member>, Member>(
  {
    schemaVersion: {
      type: String,
      default: '1.0.0',
      required: false,
    },
    memberName: { type: String, required: true, maxlength: 200 },
    community: { type: Schema.Types.ObjectId, ref: Community.CommunityModelName, required: true, index: true },
    role: { type: Schema.Types.ObjectId, ref: EndUserRole.EndUserRoleModelName, required: false, index: true },
    accounts: { type: [MemberAccountSchema], required: true },
    customViews: { type: [MemberCustomViewSchema], required: false },
    cybersourceCustomerId: { type: String, required: false, maxlength: 50 },
    profile: {
      name: { type: String, required: false, maxlength: 500 },
      email: { type: String, required: false, match: Patterns.EMAIL_PATTERN, maxlength: 254 },
      bio: { type: String, required: false, maxlength: 2000 },
      avatarDocumentId: { type: String, required: false },
      interests: { type: [{ type: String, maxlength: 40 }], required: false, default: [] },
      showInterests: { type: Boolean, required: false, default: false },
      showEmail: { type: Boolean, required: false, default: false },
      showProfile: { type: Boolean, required: false, default: false },
      showLocation: { type: Boolean, required: false, default: false },
      showProperties: { type: Boolean, required: false, default: false },
    } as SchemaDefinition<MemberProfile>,
  },
  {
    timestamps: true,
    versionKey: 'version',
    shardKey: { community: 1 },
  }
).index({ community: 1, memberName: 1, 'accounts.user': 1 }, { unique: true });

export const MemberModelName: string = 'Member';
export const MemberModelFactory = MongooseSeedwork.modelFactory<Member>(
    MemberModelName,
    MemberSchema
);
export type MemberModelType = ReturnType<typeof MemberModelFactory>;
