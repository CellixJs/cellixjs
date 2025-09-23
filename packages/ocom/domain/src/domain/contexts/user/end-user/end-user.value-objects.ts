import { VOOptional, VOString } from '@lucaspaganini/value-objects';
import { Email as EmailBase } from '../../value-objects.ts';
export { ExternalId } from '../../value-objects.ts';

class RestOfNameBase extends VOString({ trim: true, maxLength: 50, minLength: 1 }) {}
export class RestOfName extends VOOptional(RestOfNameBase, [undefined]) {}
export class LastName extends VOString({ trim: true, maxLength: 50, minLength: 1 }) {}
export class DisplayName extends VOString({ trim: true, maxLength: 100, minLength: 1 }) {}

export class Email extends VOOptional(EmailBase, [undefined]) {}
