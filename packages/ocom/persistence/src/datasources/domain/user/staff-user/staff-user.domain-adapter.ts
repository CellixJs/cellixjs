import type { PropArray } from '@cellix/domain-seedwork/prop-array';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';

import { Domain } from '@ocom/domain';
import { StaffRoleDomainAdapter } from '../staff-role/staff-role.domain-adapter.ts';
import type { StaffRole } from '@ocom/data-sources-mongoose-models/role/staff-role';
import type { StaffUser, StaffUserActivityDetail } from '@ocom/data-sources-mongoose-models/user/staff-user';

export class StaffUserDomainAdapter extends MongooseSeedwork.MongooseDomainAdapter<StaffUser> implements Domain.Contexts.User.StaffUser.StaffUserProps {
	get role(): Domain.Contexts.User.StaffRole.StaffRoleProps {
		if (!this.doc.role) {
			return undefined as unknown as Domain.Contexts.User.StaffRole.StaffRoleProps;
		}
		if (this.doc.role instanceof MongooseSeedwork.ObjectId) {
			return undefined as unknown as Domain.Contexts.User.StaffRole.StaffRoleProps;
		}
		return new StaffRoleDomainAdapter(this.doc.role as StaffRole);
	}

	setRoleRef(role: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | Domain.Contexts.User.StaffRole.StaffRole<StaffRoleDomainAdapter> | undefined): void {
		if (!role) {
			this.doc.set('role', undefined);
			return;
		}

		if (role instanceof Domain.Contexts.User.StaffRole.StaffRole) {
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

	get activityLog(): PropArray<Domain.Contexts.User.StaffUser.StaffUserActivityLogProps> {
		return new MongooseSeedwork.MongoosePropArray(this.doc.activityLog, StaffUserActivityLogDomainAdapter);
	}
}

class StaffUserActivityLogDomainAdapter implements Domain.Contexts.User.StaffUser.StaffUserActivityLogProps {
	public readonly doc: StaffUserActivityDetail;

	constructor(doc: StaffUserActivityDetail) {
		this.doc = doc;
	}

	get id(): string {
		return this.doc.id?.valueOf() as string;
	}

	get activityType(): string {
		return this.doc.activityType;
	}
	set activityType(activityType: string) {
		this.doc.activityType = activityType;
	}

	get activityDescription(): string {
		return this.doc.activityDescription;
	}
	set activityDescription(activityDescription: string) {
		this.doc.activityDescription = activityDescription;
	}

	get activityByStaffUserId(): string {
		return this.doc.activityBy?.valueOf() as string;
	}
	set activityByStaffUserId(id: string) {
		this.doc.set('activityBy', new MongooseSeedwork.ObjectId(id));
	}

	get createdAt(): Date {
		return this.doc.createdAt;
	}

	get updatedAt(): Date {
		return this.doc.updatedAt;
	}
}

export class StaffUserConverter extends MongooseSeedwork.MongoTypeConverter<StaffUser, StaffUserDomainAdapter, Domain.Passport, Domain.Contexts.User.StaffUser.StaffUser<StaffUserDomainAdapter>> {
	constructor() {
		super(StaffUserDomainAdapter, Domain.Contexts.User.StaffUser.StaffUser);
	}
}
