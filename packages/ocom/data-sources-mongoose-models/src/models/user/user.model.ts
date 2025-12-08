import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
// @ts-ignore [TS7]
import { type Model, Schema } from 'mongoose';

export interface User extends MongooseSeedwork.Base {
	discriminatorKey: string;
}

export const userOptions = {
	discriminatorKey: 'userType',
	timestamps: true,
};

const UserSchema = new Schema<User, Model<User>, User>({}, userOptions);
const UserModelName = 'User';
//export const UserModel = model<User>("User", UserSchema);

export const UserModelFactory = MongooseSeedwork.modelFactory<User>(
	UserModelName,
	UserSchema,
);
export type UserModelType = ReturnType<typeof UserModelFactory>;
