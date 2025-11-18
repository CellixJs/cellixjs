import { VOInteger, VOSet, VOString } from '@lucaspaganini/value-objects';

export const StatusCodes = {
	Draft: 'DRAFT',
	Submitted: 'SUBMITTED',
	Assigned: 'ASSIGNED',
	Completed: 'COMPLETED',
	Closed: 'CLOSED',
	Paid: 'PAID',
};

export class Title extends VOString({
	trim: true,
	maxLength: 200,
	minLength: 5,
}) {}
export class Description extends VOString({ trim: true, maxLength: 2000, minLength: 1 }) {}
export class StatusCode extends VOSet(Object.values(StatusCodes)) {}
export class Priority extends VOInteger({ min: 1, max: 5 }) {}
