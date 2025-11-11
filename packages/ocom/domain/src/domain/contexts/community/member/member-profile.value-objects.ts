import { VOString, VOArray } from '@lucaspaganini/value-objects';
import { NullableEmail } from '../../value-objects.ts';

export { NullableEmail };

export class Name extends VOString({ trim: true, maxLength: 500, minLength: 1 }) {}
export class Bio extends VOString({ trim: true, maxLength: 2000 }) {}

class Interest extends VOString({ trim: true, maxLength: 40 }) {}
export class Interests extends VOArray(Interest, { maxLength: 20 }) {}
