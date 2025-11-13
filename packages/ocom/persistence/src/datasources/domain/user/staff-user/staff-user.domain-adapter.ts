import * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Passport } from '@ocom/domain';
import { StaffRoleDomainAdapter } from '../staff-role/staff-role.domain-adapter.ts';

import { StaffRole } from '@ocom/domain/contexts/user/staff-role';
import { StaffUser } from '@ocom/domain/contexts/user/staff-user';
import type { StaffRoleEntityReference, StaffRoleProps } from '@ocom/domain/contexts/user/staff-role';
import type { StaffUserProps } from '@ocom/domain/contexts/user/staff-user';
export class StaffUserDomainAdapter
	extends MongooseSeedwork.MongooseDomainAdapter<Models.User.StaffUser>
	implements StaffUserProps
{
	get role(): StaffRoleProps {
		if (!this.doc.role) {
			return undefined as unknown as StaffRoleProps;
		}
		if (this.doc.role instanceof MongooseSeedwork.ObjectId) {
			return undefined as unknown as StaffRoleProps;
		}
		return new StaffRoleDomainAdapter(this.doc.role as Models.Role.StaffRole);
	}

	setRoleRef(
		role:
			| StaffRoleEntityReference
			| StaffRole<StaffRoleDomainAdapter>
			| undefined,
	): void {
		if (!role) {
			this.doc.set('role', undefined);
			return;
		}

		if (role instanceof StaffRole) {
			this.doc.set('role', role.props.doc);
			return;
		}

		if (!role.id) {
			throw new Error('role reference is missing id');
		}

		this.doc.set('role', new MongooseSeedwork.ObjectId(role.id));
	}

	get firstName(): string {
		return this.doc.firstName ?? '';
	}
	set firstName(firstName: string) {
		this.doc.firstName = firstName;
	}

	get lastName(): string {
		return this.doc.lastName ?? '';
	}
	set lastName(lastName: string) {
		this.doc.lastName = lastName;
	}

	get email(): string {
		return this.doc.email ?? '';
	}
	set email(email: string) {
		this.doc.email = email;
	}

	get displayName(): string {
		return this.doc.displayName ?? '';
	}
	set displayName(displayName: string) {
		this.doc.displayName = displayName;
	}

	get externalId(): string {
		return this.doc.externalId;
	}
	set externalId(externalId: string) {
		this.doc.externalId = externalId;
	}

	get accessBlocked(): boolean {
		return this.doc.accessBlocked ?? false;
	}
	set accessBlocked(accessBlocked: boolean) {
		this.doc.accessBlocked = accessBlocked;
	}

	get tags(): string[] {
		if (!this.doc.tags) {
			this.doc.set('tags', []);
		}
		return this.doc.tags as string[];
	}
	set tags(tags: string[]) {
		this.doc.tags = tags;
	}

	get userType(): string {
		return this.doc.userType ?? 'staff-user';
	}

	override get createdAt(): Date {
		return this.doc.createdAt as Date;
	}

	override get updatedAt(): Date {
		return this.doc.updatedAt as Date;
	}

	override get schemaVersion(): string {
		return this.doc.schemaVersion ?? '1.0.0';
	}
}

export class StaffUserConverter extends MongooseSeedwork.MongoTypeConverter<
	Models.User.StaffUser,
	StaffUserDomainAdapter,
	Passport,
	StaffUser<StaffUserDomainAdapter>
> {
	constructor() {
		super(
			StaffUserDomainAdapter,
			StaffUser,
		);
	}
}
