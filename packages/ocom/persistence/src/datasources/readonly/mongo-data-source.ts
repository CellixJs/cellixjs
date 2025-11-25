import type { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { type FilterQuery, type FlattenMaps, isValidObjectId, type Model, type PipelineStage, type QueryOptions, type Require_id } from 'mongoose';

type LeanBase<T> = Readonly<Require_id<FlattenMaps<T>>>;
type Lean<T> = LeanBase<T> & { id: string };

export type FindOptions = {
  fields?: string[] | undefined;
  projectionMode?: 'include' | 'exclude';
  populateFields?: string[] | undefined;
  limit?: number;
  skip?: number;
  sort?: Partial<Record<string, 1 | -1>>;
};

export type FindOneOptions = Omit<FindOptions, 'limit' | 'skip' | 'sort'>;
export interface MongoDataSource<TDoc extends MongooseSeedwork.Base> {
    find(filter: Partial<TDoc>, options?: FindOptions): Promise<Lean<TDoc>[]>;
    findOne(filter: Partial<TDoc>, options?: FindOneOptions): Promise<Lean<TDoc> | null>;
    findById(id: string, options?: FindOneOptions): Promise<Lean<TDoc> | null>;
    aggregate(pipeline: PipelineStage[]): Promise<Lean<TDoc>[]>;
}

export class MongoDataSourceImpl<TDoc extends MongooseSeedwork.Base> implements MongoDataSource<TDoc> {
    private readonly model: Model<TDoc>;
    constructor(model: Model<TDoc>) {
        this.model = model;
    }

    private buildProjection(fields?: string[] | undefined, projectionMode: 'include' | 'exclude' = "include"): Record<string, 1 | 0> {
        const projection: Record<string, 1 | 0> = {};
        if (fields) {
            for (const key of fields) {
                projection[key] = projectionMode === 'include' ? 1 : 0;
            }
        }
        return projection;
    }

    private buildFilterQuery(filter: Partial<TDoc>): FilterQuery<TDoc> {
        const query: FilterQuery<TDoc> = {};
        for (const key of Object.keys(filter)) {
            const value = filter[key as keyof TDoc];
            if (value !== undefined) {
                query[key as keyof FilterQuery<TDoc>] = value as FilterQuery<TDoc>[keyof TDoc];
            }
        }
        return query;
    }

    private appendId(doc: LeanBase<TDoc>): Lean<TDoc> {
        return {
            ...doc,
            id: String(doc._id)
        };
    };

    private buildQueryOptions(options?: FindOptions): QueryOptions {
        const findOptions: QueryOptions = {};
        if (options?.limit) { findOptions.limit = options.limit; }
        if (options?.skip) { findOptions.skip = options.skip; }
        if (options?.sort) { findOptions.sort = options.sort; }
        return findOptions;
    }

    async find(filter: Partial<TDoc>, options?: FindOptions): Promise<Lean<TDoc>[]> {
        const queryOptions = this.buildQueryOptions(options);
        const docs = await this.model.find(this.buildFilterQuery(filter), this.buildProjection(options?.fields, options?.projectionMode), queryOptions).lean<LeanBase<TDoc>[]>()
        return docs.map(doc => this.appendId(doc));
    }

    async findOne(filter: Partial<TDoc>, options?: FindOneOptions): Promise<Lean<TDoc> | null> {
        let query = this.model.findOne(this.buildFilterQuery(filter), this.buildProjection(options?.fields, options?.projectionMode));
        if (options?.populateFields?.length) {
            for (const field of options.populateFields) {
                query = query.populate(field);
            }
        }
        const doc = await query.lean<LeanBase<TDoc>>();
        return doc ? this.appendId(doc) : null;
    }

    async findById(id: string, options?: FindOneOptions): Promise<Lean<TDoc> | null> {
        if (!isValidObjectId(id)) { return null };
        let query = this.model.findById(id, this.buildProjection(options?.fields, options?.projectionMode));
        if (options?.populateFields?.length) {
            query = query.populate(options.populateFields);
        }
        const doc = await query.lean<LeanBase<TDoc>>();
        return doc ? this.appendId(doc) : null;
    }

    async aggregate(pipeline: PipelineStage[]): Promise<Lean<TDoc>[]> {
        const docs = await this.model.aggregate(pipeline).exec();
        return docs.map(doc => this.appendId(doc));
    }
}