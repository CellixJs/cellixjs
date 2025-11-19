import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { RoleDeletedReassignEvent, type RoleDeletedReassignProps } from '../../../events/types/role-deleted-reassign.ts';
import type { Passport } from '../../passport.ts';
import type { UserVisa } from '../user.visa.ts';
import * as ValueObjects from './staff-role.value-objects.ts';
import {
	StaffRolePermissions,
	type StaffRolePermissionsEntityReference,
	type StaffRolePermissionsProps,
} from './staff-role-permissions.ts';

export interface StaffRoleProps extends DomainEntityProps {
	roleName: string;
	isDefault: boolean;
	readonly permissions: StaffRolePermissionsProps;
	readonly roleType: string | null;
	readonly createdAt: Date;
	readonly updatedAt: Date;
	readonly schemaVersion: string;
}

export interface StaffRoleEntityReference
	extends Readonly<Omit<StaffRoleProps, 'permissions'>> {
	readonly permissions: StaffRolePermissionsEntityReference;
}

export class StaffRole<props extends StaffRoleProps>
	extends AggregateRoot<props, Passport>
	implements StaffRoleEntityReference
{
	private isNew: boolean = false;
	private readonly visa: UserVisa;
	constructor(props: props, passport: Passport) {
		super(props, passport);
		this.visa = passport.user.forStaffRole(this);
	}

	public static getNewInstance<props extends StaffRoleProps>(
		newProps: props,
		passport: Passport,
		roleName: string,
		isDefault: boolean,
	): StaffRole<props> {
		const role = new StaffRole(newProps, passport);
		role.isNew = true;
		role.roleName = roleName;
		role.isDefault = isDefault;
		role.isNew = false;
		return role;
	}
	public deleteAndReassignTo(roleRef: StaffRoleEntityReference) {
        if (this.isDefault) {
            throw new PermissionError(
                'You cannot delete a default staff role',
            );
        }
        if (
            !this.isDeleted &&
            !this.visa.determineIf(
                (permissions) => permissions.canManageStaffRolesAndPermissions,
            )
        ) {
            throw new PermissionError(
                'You do not have permission to delete this role',
            );
        }
		super.isDeleted = true;
		this.addIntegrationEvent<RoleDeletedReassignProps, RoleDeletedReassignEvent>(RoleDeletedReassignEvent, {
			deletedRoleId: this.props.id,
			newRoleId: roleRef.id,
		});
	}

	get roleName() {
		return this.props.roleName;
	}
	set roleName(roleName: string) {
		if (
			!this.isNew &&
			!this.visa.determineIf(
				(permissions) =>
					permissions.canManageStaffRolesAndPermissions ||
					permissions.isSystemAccount,
			)
		) {
			throw new PermissionError('Cannot set role name');
		}
		this.props.roleName = new ValueObjects.RoleName(roleName).valueOf();
	}
	get isDefault() {
		return this.props.isDefault;
	}
	set isDefault(isDefault: boolean) {
		if (
			!this.isNew &&
			!this.visa.determineIf(
				(permissions) =>
					permissions.canManageStaffRolesAndPermissions ||
					permissions.isSystemAccount,
			)
		) {
			throw new PermissionError(
				'You do not have permission to update this role',
			);
		}
		this.props.isDefault = isDefault;
	}
	get permissions(): StaffRolePermissions {
		return new StaffRolePermissions(this.props.permissions, this.visa);
	}
	get roleType() {
		return this.props.roleType;
	}
	get createdAt() {
		return this.props.createdAt;
	}
	get updatedAt() {
		return this.props.updatedAt;
	}
	get schemaVersion() {
		return this.props.schemaVersion;
	}
}
