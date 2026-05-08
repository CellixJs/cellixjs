import { describe, expect, it } from 'vitest';
import { extractRoles, StaffAppRoles, staffRouteRoles } from './staff-app-roles.ts';

describe('StaffAppRoles', () => {
	it('contains the four expected Entra app role values', () => {
		expect(StaffAppRoles.TechAdmin).toBe('Staff.TechAdmin');
		expect(StaffAppRoles.Finance).toBe('Staff.Finance');
		expect(StaffAppRoles.ServiceLineOwner).toBe('Staff.ServiceLineOwner');
		expect(StaffAppRoles.CaseManager).toBe('Staff.CaseManager');
	});
});

describe('staffRouteRoles', () => {
	it('gates /staff/community-management to CaseManager, ServiceLineOwner, and TechAdmin', () => {
		expect(staffRouteRoles['/staff/community-management']).toContain(StaffAppRoles.CaseManager);
		expect(staffRouteRoles['/staff/community-management']).toContain(StaffAppRoles.ServiceLineOwner);
		expect(staffRouteRoles['/staff/community-management']).toContain(StaffAppRoles.TechAdmin);
	});

	it('gates /staff/user-management to CaseManager, ServiceLineOwner, and TechAdmin', () => {
		expect(staffRouteRoles['/staff/user-management']).toContain(StaffAppRoles.CaseManager);
		expect(staffRouteRoles['/staff/user-management']).toContain(StaffAppRoles.ServiceLineOwner);
		expect(staffRouteRoles['/staff/user-management']).toContain(StaffAppRoles.TechAdmin);
	});

	it('gates /staff/finance to Finance and TechAdmin', () => {
		expect(staffRouteRoles['/staff/finance']).toEqual([StaffAppRoles.Finance, StaffAppRoles.TechAdmin]);
	});

	it('gates /staff/tech to TechAdmin only', () => {
		expect(staffRouteRoles['/staff/tech']).toEqual([StaffAppRoles.TechAdmin]);
	});
});

describe('extractRoles', () => {
	it('returns undefined for undefined input', () => {
		expect(extractRoles(undefined)).toBeUndefined();
	});

	it('returns undefined for empty raw object', () => {
		expect(extractRoles({})).toBeUndefined();
	});

	it('extracts roles from the "roles" claim', () => {
		const result = extractRoles({ roles: ['Staff.TechAdmin', 'Staff.Finance'] });
		expect(result).toContain('Staff.TechAdmin');
		expect(result).toContain('Staff.Finance');
	});

	it('extracts a single role string from the "roles" claim', () => {
		const result = extractRoles({ roles: 'Staff.CaseManager' });
		expect(result).toEqual(['Staff.CaseManager']);
	});

	it('extracts roles from the "app_roles" claim', () => {
		const result = extractRoles({ app_roles: ['Staff.Finance'] });
		expect(result).toContain('Staff.Finance');
	});

	it('extracts roles from realm_access.roles', () => {
		const result = extractRoles({ realm_access: { roles: ['Staff.ServiceLineOwner'] } });
		expect(result).toContain('Staff.ServiceLineOwner');
	});

	it('deduplicates roles across multiple claims', () => {
		const result = extractRoles({ roles: ['Staff.TechAdmin'], role: 'Staff.TechAdmin' });
		expect(result).toEqual(['Staff.TechAdmin']);
	});
});
