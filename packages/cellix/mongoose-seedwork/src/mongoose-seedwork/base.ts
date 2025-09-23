import type { Document, SchemaOptions, Types } from 'mongoose';

export interface MongoBase {
	id: Types.ObjectId | undefined;
	schemaVersion: string;
	createdAt: Date | undefined;
	updatedAt: Date | undefined;
	version: number;
}

/**
 * This _should not_ extend document, but because of this issue we're stuck: https://github.com/GraphQLGuide/apollo-datasource-mongodb/issues/78
 *
 * Can also change type to "any" in the data source but loose type safety
 */
export interface Base extends Document, MongoBase {
	id: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}
export const BaseOptions: SchemaOptions = {
	timestamps: true,
	versionKey: 'version',
};

/**
 * This interface is to be used for all Mongoose Subdocuments, either inside an array or as a single document
 * While defining the Mongoose Schema, Subdocument object should be defined as a separate Schema
 */
export interface SubdocumentBase
	extends Omit<Document, 'id'>,
		Omit<MongoBase, 'schemaVersion'> {}
export const SubdocumentBaseOptions: SchemaOptions = BaseOptions;

/**
 * This interface can only be used for defining a grouping of properties inside a path ina document
 * This should NOT be used for defining array elements, as they will be automatically converted to Subdocuments
 * While defining the Mongoose Schema, NestedPath object should be defined inline with the parent schema
 */
// [NN] [ESLINT] disabling @typrscrip-eslint/no-empty-object-type
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface NestedPath extends Document {}
export const NestedPathOptions: SchemaOptions = {
	_id: false,
};
