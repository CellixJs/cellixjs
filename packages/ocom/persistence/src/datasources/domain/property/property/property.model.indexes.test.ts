import { PropertyModelFactory } from '@ocom/data-sources-mongoose-models/property';
import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';

/**
 * The property repository soft-deletes documents (see property.repository.ts),
 * so the community/name uniqueness rule must only apply to non-deleted
 * documents; otherwise a deleted property would keep its name reserved forever.
 */
describe('Property model indexes', () => {
	const model = PropertyModelFactory({ service: new mongoose.Mongoose() });
	const indexes = model.schema.indexes() as ReadonlyArray<[Record<string, unknown>, Record<string, unknown>]>;

	it('scopes the unique community/name index to non-deleted documents', () => {
		const uniqueNameIndex = indexes.find(([keys]) => keys['community'] === 1 && keys['propertyName'] === 1);
		expect(uniqueNameIndex).toBeDefined();
		const [, options] = uniqueNameIndex as [Record<string, unknown>, Record<string, unknown>];
		expect(options['unique']).toBe(true);
		expect(options['partialFilterExpression']).toEqual({ isDeleted: false });
	});

	it('keeps an index usable by community listing queries that exclude soft-deleted documents', () => {
		const communityListingIndex = indexes.find(([keys]) => keys['community'] === 1 && keys['isDeleted'] === 1);
		expect(communityListingIndex).toBeDefined();
	});
});
