import { VOString } from '@lucaspaganini/value-objects';

export class RoleName extends VOString({
	trim: true,
	maxLength: 50,
	minLength: 1,
}) {}
