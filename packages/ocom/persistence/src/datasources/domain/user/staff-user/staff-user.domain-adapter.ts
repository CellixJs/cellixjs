import { MongooseSeedwork } from '@cellix/mongoose-seedwork';

import { StaffUser, StaffRole, type StaffUserProps, type StaffRoleProps, type StaffRoleEntityReference, type Passport } from '@ocom/domain';
import { StaffRoleDomainAdapter } from '../staff-role/staff-role.domain-adapter.ts';
import type { StaffRole as StaffRoleModel } from '@ocom/data-sources-mongoose-models/role/staff-role';
import type { StaffUser as StaffUserModel } from '@ocom/data-sources-mongoose-models/user/staff-user';

export class StaffUserDomainAdapter
	extends MongooseSeedwork.MongooseDomainAdapter<StaffUserModel>
	implements StaffUserProps
{
	get role(): StaffRoleProps {
		if (!this.doc.role) {
			return undefined as unknown as StaffRoleProps;
		}
		if (this.doc.role instanceof MongooseSeedwork.ObjectId) {
			return undefined as unknown as StaffRoleProps;
		}
		return new StaffRoleDomainAdapter(this.doc.role as StaffRoleModel);
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
	StaffUserModel,
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
