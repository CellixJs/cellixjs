import { describe, expect, it } from 'vitest';
import { $payload, resolveLoggingFields } from './index.js';

describe('$payload proxy', () => {
	it('returns LoggingFieldSpec objects for any property access', () => {
		const spec = $payload.externalId;
		expect(spec).toEqual({ payloadField: 'externalId' });
	});

	it('works with any field name', () => {
		expect($payload.userId).toEqual({ payloadField: 'userId' });
		expect($payload.email).toEqual({ payloadField: 'email' });
		expect($payload.customField123).toEqual({ payloadField: 'customField123' });
	});

	it('can be used directly in queue definitions', () => {
		const tagsSpec = {
			domain: 'user',
			externalId: $payload.externalId,
			userId: $payload.userId,
		};

		const payload = { externalId: 'ext-123', userId: 'user-456', other: 'value' };
		const resolved = resolveLoggingFields(tagsSpec, payload);

		expect(resolved).toEqual({
			domain: 'user',
			externalId: 'ext-123',
			userId: 'user-456',
		});
	});

	it('omits fields that are undefined in the payload', () => {
		const metadataSpec = {
			source: 'external-api',
			email: $payload.email,
			displayName: $payload.displayName,
		};

		const payload = { email: 'user@example.com' }; // displayName is missing
		const resolved = resolveLoggingFields(metadataSpec, payload);

		expect(resolved).toEqual({
			source: 'external-api',
			email: 'user@example.com',
			// displayName is omitted
		});
	});

	it('omits fields that are null in the payload', () => {
		const spec = {
			externalId: $payload.externalId,
			nullField: $payload.nullField,
		};

		const payload = { externalId: 'ext-123', nullField: null };
		const resolved = resolveLoggingFields(spec, payload);

		expect(resolved).toEqual({
			externalId: 'ext-123',
			// nullField is omitted
		});
	});

	it('converts non-string payload values to strings', () => {
		const spec = {
			count: $payload.count,
			isActive: $payload.isActive,
		};

		const payload = { count: 42, isActive: true };
		const resolved = resolveLoggingFields(spec, payload);

		expect(resolved).toEqual({
			count: '42',
			isActive: 'true',
		});
	});

	it('works alongside hardcoded string values', () => {
		const spec = {
			domain: 'user', // hardcoded
			type: 'update', // hardcoded
			externalId: $payload.externalId, // from payload
			source: 'external-sync', // hardcoded
			email: $payload.email, // from payload
		};

		const payload = { externalId: 'ext-999', email: 'test@example.com' };
		const resolved = resolveLoggingFields(spec, payload);

		expect(resolved).toEqual({
			domain: 'user',
			type: 'update',
			externalId: 'ext-999',
			source: 'external-sync',
			email: 'test@example.com',
		});
	});

	it('handles empty payload gracefully', () => {
		const spec = {
			domain: 'user',
			externalId: $payload.externalId,
		};

		const resolved = resolveLoggingFields(spec, {});

		expect(resolved).toEqual({
			domain: 'user',
			// externalId is omitted
		});
	});

	it('handles undefined spec gracefully', () => {
		const resolved = resolveLoggingFields(undefined, { anything: true });
		expect(resolved).toBeUndefined();
	});
});
