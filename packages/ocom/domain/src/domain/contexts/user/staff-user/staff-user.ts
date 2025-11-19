import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { StaffUserCreatedEvent, type StaffUserCreatedProps } from '../../../events/types/staff-user-created.ts';
import type { Passport } from '../../passport.ts';
import {
	StaffRole,
	type StaffRoleEntityReference,
	type StaffRoleProps,
} from '../staff-role/staff-role.ts';
import type { UserVisa } from '../user.visa.ts';
import * as ValueObjects from './staff-user.value-objects.ts';

export interface StaffUserProps extends DomainEntityProps {
	readonly role?: StaffRoleProps;
	setRoleRef: (role: StaffRoleEntityReference | undefined) => void;
	firstName: string;
	lastName: string;
	email: string;

	displayName: string;
	externalId: string;
	accessBlocked: boolean;
	tags: string[];
	readonly userType: string;
	readonly createdAt: Date;
	readonly updatedAt: Date;
	readonly schemaVersion: string;
}

export interface StaffUserEntityReference
	extends Readonly<Omit<StaffUserProps, 'role' | 'setRoleRef'>> {
	readonly role: StaffRoleEntityReference | undefined;
}

export class StaffUser<props extends StaffUserProps>
	extends AggregateRoot<props, Passport>
	implements StaffUserEntityReference
{
	private isNew: boolean = false;
	private readonly visa: UserVisa;

	constructor(props: props, passport: Passport) {
		super(props, passport);
		this.visa = passport.user.forStaffUser(this);
	}

	public static getNewUser<props extends StaffUserProps>(
		newProps: props,
		passport: Passport,
		externalId: string,
		firstName: string,
		lastName: string,
		email: string,
	): StaffUser<props> {
		newProps.externalId = externalId;
		const user = new StaffUser(newProps, passport);
		user.markAsNew();
		user.externalId = externalId;
		user.firstName = firstName;
		user.lastName = lastName;
		user.displayName = `${firstName} ${lastName}`;
		user.email = email;
		user.isNew = false;
		return user;
	}

	private markAsNew(): void {
		this.isNew = true;
		this.addIntegrationEvent<StaffUserCreatedProps, StaffUserCreatedEvent>(StaffUserCreatedEvent, {
			externalId: this.props.externalId,
		});
	}

	private validateVisa(): void {
		if (
			!this.isNew &&
			!this.visa.determineIf(
				(permissions) => permissions.canManageStaffRolesAndPermissions,
			)
		) {
			throw new PermissionError('Unauthorized');
		}
	}

	get role(): StaffRoleEntityReference | undefined {
		return this.props.role
			? new StaffRole(this.props.role, this.passport)
			: undefined;
	}
	set role(role: StaffRoleEntityReference | undefined) {
		this.validateVisa();
		this.props.setRoleRef(role);
	}

	get firstName(): string {
		return this.props.firstName;
	}
	set firstName(firstName: string) {
		this.validateVisa();
		this.props.firstName = new ValueObjects.FirstName(firstName).valueOf();
	}

	get lastName(): string {
		return this.props.lastName;
	}
	set lastName(lastName: string) {
		this.validateVisa();
		this.props.lastName = new ValueObjects.LastName(lastName).valueOf();
	}

	get email(): string {
		return this.props.email;
	}
	set email(email: string) {
		this.validateVisa();
		this.props.email = new ValueObjects.Email(email).valueOf();
	}

	get displayName(): string {
		return this.props.displayName;
	}
	set displayName(displayName: string) {
		this.validateVisa();
		this.props.displayName = new ValueObjects.DisplayName(
			displayName,
		).valueOf();
	}

	get externalId(): string {
		return this.props.externalId;
	}
	set externalId(externalId: string) {
		this.validateVisa();
		this.props.externalId = new ValueObjects.ExternalId(externalId).valueOf();
	}

	get accessBlocked(): boolean {
		return this.props.accessBlocked;
	}
	set accessBlocked(accessBlocked: boolean) {
		this.validateVisa();
		this.props.accessBlocked = accessBlocked;
	}

	get tags(): string[] {
		return this.props.tags;
	}
	set tags(tags: string[]) {
		this.validateVisa();
		this.props.tags = tags;
	}

	get userType(): string {
		return this.props.userType;
	}
	get updatedAt(): Date {
		return this.props.updatedAt;
	}
	get createdAt(): Date {
		return this.props.createdAt;
	}
	get schemaVersion(): string {
		return this.props.schemaVersion;
	}
}

//#region Exports
export type { StaffUserRepository } from './staff-user.repository.ts';
export type { StaffUserUnitOfWork } from './staff-user.uow.ts';
//#endregion
