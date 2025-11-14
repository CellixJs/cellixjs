import { VOString } from '@lucaspaganini/value-objects';
import { Email as EmailImport, ExternalId as ExternalIdImport } from '../../value-objects.ts';
export const Email = EmailImport;
export const ExternalId = ExternalIdImport;
export class FirstName extends VOString({ trim: true, maxLength: 50, minLength: 1 }) {}
export class LastName extends VOString({ trim: true, maxLength: 50, minLength: 1 }) {}
export class DisplayName extends VOString({ trim: true, maxLength: 100, minLength: 1 }) {}
