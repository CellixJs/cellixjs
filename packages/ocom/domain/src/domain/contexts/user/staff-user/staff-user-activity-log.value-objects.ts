import { VOSet, VOString } from '@lucaspaganini/value-objects';

export const ActivityTypeCodes = {
	Created: 'CREATED',
	Updated: 'UPDATED',
	RoleAssigned: 'ROLE_ASSIGNED',
	RoleRemoved: 'ROLE_REMOVED',
	Blocked: 'BLOCKED',
	Unblocked: 'UNBLOCKED',
} as const;

export class Description extends VOString({ trim: true, maxLength: 2000 }) {}
export class ActivityTypeCode extends VOSet(Object.values(ActivityTypeCodes)) {}
