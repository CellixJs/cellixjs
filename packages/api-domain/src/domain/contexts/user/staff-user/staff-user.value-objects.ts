import { VOString } from '@lucaspaganini/value-objects';
export { Email, ExternalId } from '../../value-objects.ts';
export class FirstName extends VOString({ trim: true, maxLength: 50, minLength: 1 }) {}
export class LastName extends VOString({ trim: true, maxLength: 50, minLength: 1 }) {}
export class DisplayName extends VOString({ trim: true, maxLength: 100, minLength: 1 }) {}
