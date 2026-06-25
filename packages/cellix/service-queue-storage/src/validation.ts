import type { ErrorObject, ValidateFunction } from 'ajv';

export type QueuePayloadValidator = ValidateFunction<unknown>;

export function formatQueueValidationErrors(errors: ErrorObject[] | null | undefined): string {
	if (!errors?.length) {
		return 'validation failed';
	}

	return errors
		.map((error) => {
			const path = error.instancePath || '/';
			if (error.keyword === 'required' && 'missingProperty' in error.params) {
				const missingProperty = (error.params as { missingProperty: unknown }).missingProperty;
				return `${path} is missing required property "${String(missingProperty)}"`;
			}
			return `${path} ${error.message ?? `failed ${error.keyword} validation`}`;
		})
		.join('; ');
}
