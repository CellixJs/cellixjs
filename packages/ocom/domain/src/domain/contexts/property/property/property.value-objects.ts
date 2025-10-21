import { VOString } from '@lucaspaganini/value-objects';

export class PropertyName extends VOString({ trim: true, maxLength: 100, minLength: 1 }) {}
export class PropertyType extends VOString({ trim: true, maxLength: 100, minLength: 1 }) {}
