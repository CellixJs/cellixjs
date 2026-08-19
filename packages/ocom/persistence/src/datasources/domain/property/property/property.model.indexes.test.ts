import { PropertyModelFactory } from '@ocom/data-sources-mongoose-models/property';
import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';

/**
 * Verifies the Property schema's index definitions. The persistence package
 * tests run against mocks (no real mongod), so the runtime behavior of the
 * partial unique index — duplicate active names rejected with E11000 while a
 * soft-deleted property's name can be reused — is exercised end-to-end by the
 * acceptance-api suite, which runs against the mongodb-memory-server backed
 * mock server.
 */
describe('Property model indexes', () => {
	// A dedicated mongoose instance keeps the compiled model out of the global registry.
	const model = PropertyModelFactory({ service: new mongoose.Mongoose() });
	const indexes = model.schema.indexes() as [Record<string, unknown>, Record<string, unknown>][];

	it('scopes the unique community+propertyName index to active documents', () => {
		const compoundIndex = indexes.find(([keys]) => keys['community'] === 1 && keys['propertyName'] === 1);

		expect(compoundIndex).toBeDefined();
		const [, options] = compoundIndex as [Record<string, unknown>, Record<string, unknown>];
		expect(options['unique']).toBe(true);
		// `$eq` is required here: `$ne` is unsupported in partial filter expressions.
		expect(options['partialFilterExpression']).toEqual({ isDeleted: { $eq: false } });
	});

	it('keeps the 2dsphere index on the location position', () => {
		const geoIndex = indexes.find(([keys]) => keys['location.position'] === '2dsphere');

		expect(geoIndex).toBeDefined();
	});
});
