import { VOString } from '@lucaspaganini/value-objects';

export class ServiceName extends VOString({
	trim: true,
	maxLength: 100,
	minLength: 3,
}) {}
export class Description extends VOString({
	trim: true,
	maxLength: 500,
	minLength: 1,
}) {}
