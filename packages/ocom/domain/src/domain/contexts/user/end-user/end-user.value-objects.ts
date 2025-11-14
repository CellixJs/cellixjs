import { VOOptional, VOString } from '@lucaspaganini/value-objects';
import { Email as EmailBase } from '../../value-objects.ts';
import { ExternalId as ExternalIdImport } from '../../value-objects.ts';
export const ExternalId = ExternalIdImport;

class RestOfNameBase extends VOString({ trim: true, maxLength: 50, minLength: 1 }) {}
export class RestOfName extends VOOptional(RestOfNameBase, [undefined]) {}
export class LastName extends VOString({ trim: true, maxLength: 50, minLength: 1 }) {}
export class DisplayName extends VOString({ trim: true, maxLength: 100, minLength: 1 }) {}

export class Email extends VOOptional(EmailBase, [undefined]) {}
