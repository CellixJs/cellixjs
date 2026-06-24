import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import { describe, expect, it } from 'vitest';
import type { UserVisa } from '../user.visa.ts';
import { StaffUserActivityLog, type StaffUserActivityLogProps } from './staff-user-activity-log.entity.ts';
import * as ValueObjects from './staff-user-activity-log.value-objects.ts';

function createVisa(isSystemAccount: boolean, canManageStaffRolesAndPermissions = false): UserVisa {
	return {
		determineIf: (func) =>
			func({
				canManageEndUsers: false,
				canManageStaffRolesAndPermissions,
				canManageStaffUsers: false,
				canManageVendorUsers: false,
				isEditingOwnAccount: false,
				isSystemAccount,
			}),
	};
}

function createProps(overrides: Partial<StaffUserActivityLogProps> = {}): StaffUserActivityLogProps {
	return {
		id: 'activity-1',
		activityType: '',
		activityDescription: '',
		activityByStaffUserId: '',
		createdAt: new Date('2020-01-01T00:00:00Z'),
		updatedAt: new Date('2020-01-01T00:00:00Z'),
		...overrides,
	};
}

describe('staff-user-activity-log additional coverage', () => {
	it('creates a new activity log entry when requester is a system account', () => {
		const activityLog = StaffUserActivityLog.getNewInstance(createProps(), createVisa(true), {
			activityType: new ValueObjects.ActivityTypeCode(ValueObjects.ActivityTypeCodes.Created),
			activityDescription: new ValueObjects.Description('User created'),
			activityByStaffUserId: 'staff-99',
		});

		expect(activityLog.activityType).toBe('CREATED');
		expect(activityLog.activityDescription).toBe('User created');
		expect(activityLog.activityByStaffUserId).toBe('staff-99');
	});

	it('creates a new activity log entry for non-system account during creation flow', () => {
		const activityLog = StaffUserActivityLog.getNewInstance(createProps(), createVisa(false), {
			activityType: new ValueObjects.ActivityTypeCode(ValueObjects.ActivityTypeCodes.Created),
			activityDescription: new ValueObjects.Description('User created'),
			activityByStaffUserId: 'staff-99',
		});

		expect(activityLog.activityType).toBe('CREATED');
		expect(activityLog.activityDescription).toBe('User created');
		expect(activityLog.activityByStaffUserId).toBe('staff-99');
	});

	it('throws when non-system account tries to mutate activityType or activityDescription', () => {
		const activityLog = new StaffUserActivityLog(
			createProps({
				activityType: ValueObjects.ActivityTypeCodes.Created,
				activityDescription: 'User created',
				activityByStaffUserId: 'staff-99',
			}),
			createVisa(false),
		);

		expect(() => {
			activityLog.activityType = new ValueObjects.ActivityTypeCode(ValueObjects.ActivityTypeCodes.Updated);
		}).toThrow(PermissionError);

		expect(() => {
			activityLog.activityDescription = new ValueObjects.Description('Updated description');
		}).toThrow(PermissionError);
	});

	it('allows manager account to mutate activityType or activityDescription', () => {
		const activityLog = new StaffUserActivityLog(
			createProps({
				activityType: ValueObjects.ActivityTypeCodes.Created,
				activityDescription: 'User created',
				activityByStaffUserId: 'staff-99',
			}),
			createVisa(false, true),
		);

		activityLog.activityType = new ValueObjects.ActivityTypeCode(ValueObjects.ActivityTypeCodes.Updated);
		activityLog.activityDescription = new ValueObjects.Description('Updated description');

		expect(activityLog.activityType).toBe('UPDATED');
		expect(activityLog.activityDescription).toBe('Updated description');
	});
});
