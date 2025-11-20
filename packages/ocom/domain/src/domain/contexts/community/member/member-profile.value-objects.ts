import { VOArray, VOString } from '@lucaspaganini/value-objects';

// biome-ignore lint/performance/noBarrelFile: Re-exporting shared value object for convenience
export { NullableEmail } from '../../value-objects.ts';

export class Name extends VOString({
	trim: true,
	maxLength: 500,
	minLength: 1,
}) {}
export class Bio extends VOString({ trim: true, maxLength: 2000 }) {}

class Interest extends VOString({ trim: true, maxLength: 40 }) {}
export class Interests extends VOArray(Interest, { maxLength: 20 }) {}
