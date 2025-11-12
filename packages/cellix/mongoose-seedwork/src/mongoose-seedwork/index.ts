/**
 * Mongoose Seedwork - Database persistence utilities for domain-driven design
 * 
 * This module provides base classes and utilities for implementing repositories,
 * unit of work, and domain adapters using Mongoose.
 */

import { ObjectId as MongoObjectId } from 'mongodb';
import { type Base, type NestedPath, NestedPathOptions, type SubdocumentBase } from './base.ts';
import { type MongooseContextFactory, modelFactory } from './mongo-connection.ts';
import { MongooseDomainAdapter } from './mongo-domain-adapter.ts';
import { MongoosePropArray } from './mongoose-prop-array.ts';
import { MongoRepositoryBase } from './mongo-repository.ts';
import { MongoTypeConverter } from './mongo-type-converter.ts';
import { getInitializedUnitOfWork, MongoUnitOfWork } from './mongo-unit-of-work.ts';

export { MongoObjectId as ObjectId };
export type { Base, NestedPath, SubdocumentBase };
export { NestedPathOptions };
export type { MongooseContextFactory };
export { modelFactory };
export { MongooseDomainAdapter };
export { MongoosePropArray };
export { MongoRepositoryBase };
export { MongoTypeConverter };
export { getInitializedUnitOfWork, MongoUnitOfWork };