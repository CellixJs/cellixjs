import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { type Model, Schema} from 'mongoose';

export interface Role extends MongooseSeedwork.Base {
	discriminatorKey: string;
}

// TODO: Discriminator key and Version can't exist together, if we don't use version key it will fall back to __v
export const roleOptions = {
	discriminatorKey: 'roleType',
	timestamps: true,
	// versionKey: 'version',
};

const RoleSchema = new Schema<Role, Model<Role>, Role>({}, roleOptions);
const RoleModelName = 'Role';

export const RoleModelFactory = MongooseSeedwork.modelFactory<Role>(
    RoleModelName,
    RoleSchema
);
export type RoleModelType = ReturnType<typeof RoleModelFactory>;
