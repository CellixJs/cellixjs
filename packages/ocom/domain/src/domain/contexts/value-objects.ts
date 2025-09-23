import { VOString } from '@lucaspaganini/value-objects';

/* Regex Source: https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address */
const EMAIL_PATTERN =
	/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const NULLABLE_EMAIL_PATTERN =
	/^$|^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export class Email extends VOString({
	trim: true,
	maxLength: 254,
	pattern: EMAIL_PATTERN,
}) {}

export class NullableEmail extends VOString({
	trim: true,
	maxLength: 254,
	pattern: NULLABLE_EMAIL_PATTERN,
}) {}

const GUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export class ExternalId extends VOString({
	trim: true,
	minLength: 36,
	maxLength: 36,
	pattern: GUID_PATTERN,
}) {}