import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import type { Base } from './base.ts';

export interface MongooseDomainAdapterType<T extends Base>
	extends DomainEntityProps {
	readonly doc: T;
}

export abstract class MongooseDomainAdapter<T extends Base>
	implements MongooseDomainAdapterType<T>
{
	public readonly doc: T;
	constructor(doc: T) {
		this.doc = doc;
	}
	get id() {
		if (!this.doc._id) {
            throw new Error(`${this.constructor.name} document is missing _id`);
        }
        return this.doc._id.toString();
	}
	get createdAt() {
		return this.doc.createdAt;
	}
	get updatedAt() {
		return this.doc.updatedAt;
	}
	get schemaVersion() {
		return this.doc.schemaVersion;
	}
}
