import mongoose from 'mongoose';

export const { ObjectId } = mongoose.Types;
export type ObjectId = mongoose.Types.ObjectId;
export { type Base, type NestedPath, NestedPathOptions, type SubdocumentBase } from './base.ts';
export { type MongooseContextFactory, modelFactory} from './mongo-connection.ts';
export { MongooseDomainAdapter } from './mongo-domain-adapter.ts';
export { MongoosePropArray } from './mongoose-prop-array.ts';
export { MongoRepositoryBase } from './mongo-repository.ts';
export { MongoTypeConverter } from './mongo-type-converter.ts';
export { getInitializedUnitOfWork, MongoUnitOfWork } from './mongo-unit-of-work.ts';