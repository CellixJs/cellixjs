import { VOString } from '@lucaspaganini/value-objects';
import { Email as EmailBase, ExternalId as ExternalIdBase } from '../../value-objects.ts';

export class Email extends EmailBase {}
export class ExternalId extends ExternalIdBase {}
export class FirstName extends VOString({
	trim: true,
	maxLength: 50,
	minLength: 1,
}) {}
export class LastName extends VOString({
	trim: true,
	maxLength: 50,
	minLength: 1,
}) {}
export class DisplayName extends VOString({
	trim: true,
	maxLength: 100,
	minLength: 1,
}) {}
