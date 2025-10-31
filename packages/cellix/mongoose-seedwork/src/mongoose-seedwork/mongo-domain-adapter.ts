import type { DomainSeedwork } from '@cellix/domain-seedwork';
import type { Base } from './base.ts';

export interface MongooseDomainAdapterType<T extends Base>
	extends DomainSeedwork.DomainEntityProps {
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
		return this.doc.id.toString();
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
