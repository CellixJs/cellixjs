/**
 * Schema Validator
 * 
 * Validates queue message payloads against JSON schemas using AJV.
 */

import { Ajv, type JSONSchemaType, type ValidateFunction } from 'ajv';
import { MessageValidationError } from './types.ts';

/**
 * Validates message payloads using JSON Schema
 */
export class SchemaValidator {
	private readonly ajv: Ajv;
	private readonly validators: Map<string, ValidateFunction<unknown>>;
	
	constructor() {
		this.ajv = new Ajv({
			allErrors: true,
			useDefaults: true,
			coerceTypes: false,
			strict: true,
		});
		this.validators = new Map();
	}
	
	/**
	 * Registers a schema for a specific queue
	 * 
	 * @param queueName - Name of the queue
	 * @param schema - JSON schema for the payload
	 */
	registerSchema<TPayload = unknown>(
		queueName: string,
		schema: JSONSchemaType<TPayload>,
	): void {
		const validator = this.ajv.compile(schema);
		this.validators.set(queueName, validator as ValidateFunction<unknown>);
	}
	
	/**
	 * Validates a payload against the registered schema for a queue
	 * 
	 * @param queueName - Name of the queue
	 * @param payload - The payload to validate
	 * @returns The validated payload (typed)
	 * @throws MessageValidationError if validation fails
	 */
	validate<TPayload = unknown>(queueName: string, payload: unknown): TPayload {
		const validator = this.validators.get(queueName);
		if (!validator) {
			throw new Error(`No schema registered for queue: ${queueName}`);
		}
		
		if (!validator(payload)) {
			throw new MessageValidationError(
				`Message validation failed for queue ${queueName}`,
				validator.errors ?? [],
			);
		}
		
		return payload as TPayload;
	}
	
	/**
	 * Checks if a schema is registered for a queue
	 * 
	 * @param queueName - Name of the queue
	 * @returns true if a schema is registered, false otherwise
	 */
	hasSchema(queueName: string): boolean {
		return this.validators.has(queueName);
	}
}
