import { VOSet, VOString } from '@lucaspaganini/value-objects';

export class RoleName extends VOString({
	trim: true,
	maxLength: 50,
	minLength: 1,
}) {}

export const EnterpriseAppRoleNames = {
	CaseManager: 'Staff.CaseManager',
	ServiceLineOwner: 'Staff.ServiceLineOwner',
	Finance: 'Staff.Finance',
	TechAdmin: 'Staff.TechAdmin',
} as const;

export class EnterpriseAppRole extends VOSet(Object.values(EnterpriseAppRoleNames)) {}
