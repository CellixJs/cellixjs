/**
 * Schema Validator Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { JSONSchemaType } from 'ajv';
import { SchemaValidator } from './schema-validator.ts';
import { MessageValidationError } from './types.ts';

interface TestPayload {
	name: string;
	age: number;
	email?: string;
}

describe('SchemaValidator', () => {
	let validator: SchemaValidator;
	let schema: JSONSchemaType<TestPayload>;
	
	beforeEach(() => {
		validator = new SchemaValidator();
		schema = {
			type: 'object',
			properties: {
				name: { type: 'string' },
				age: { type: 'number' },
				email: { type: 'string', nullable: true },
			},
			required: ['name', 'age'],
			additionalProperties: false,
		};
	});
	
	it('should register a schema for a queue', () => {
		validator.registerSchema('test-queue', schema);
		expect(validator.hasSchema('test-queue')).toBe(true);
	});
	
	it('should validate a valid payload', () => {
		validator.registerSchema('test-queue', schema);
		const payload = { name: 'John', age: 30 };
		
		const result = validator.validate<TestPayload>('test-queue', payload);
		
		expect(result).toEqual(payload);
	});
	
	it('should validate a valid payload with optional field', () => {
		validator.registerSchema('test-queue', schema);
		const payload = { name: 'Jane', age: 25, email: 'jane@example.com' };
		
		const result = validator.validate<TestPayload>('test-queue', payload);
		
		expect(result).toEqual(payload);
	});
	
	it('should throw MessageValidationError for invalid payload', () => {
		validator.registerSchema('test-queue', schema);
		const invalidPayload = { name: 'John' }; // missing required 'age'
		
		expect(() => validator.validate('test-queue', invalidPayload))
			.toThrow(MessageValidationError);
	});
	
	it('should throw MessageValidationError for wrong type', () => {
		validator.registerSchema('test-queue', schema);
		const invalidPayload = { name: 'John', age: 'thirty' }; // age should be number
		
		expect(() => validator.validate('test-queue', invalidPayload))
			.toThrow(MessageValidationError);
	});
	
	it('should throw error if no schema is registered for queue', () => {
		const payload = { name: 'John', age: 30 };
		
		expect(() => validator.validate('unknown-queue', payload))
			.toThrow('No schema registered for queue: unknown-queue');
	});
	
	it('should return false for hasSchema if queue not registered', () => {
		expect(validator.hasSchema('non-existent-queue')).toBe(false);
	});
});
