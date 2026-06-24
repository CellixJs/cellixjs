import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { DomainEntity, PermissionError } from '@cellix/domain-seedwork/domain-entity';
import type { UserVisa } from '../user.visa.ts';
import type * as ValueObjects from './staff-user-activity-log.value-objects.ts';

export interface StaffUserActivityLogProps extends DomainEntityProps {
	activityType: string;
	activityDescription: string;
	activityByStaffUserId: string;
	readonly createdAt: Date;
	readonly updatedAt: Date;
}

export interface StaffUserActivityLogEntityReference extends Readonly<StaffUserActivityLogProps> {}

export interface StaffUserActivityLogCreateProps {
	activityType: ValueObjects.ActivityTypeCode;
	activityDescription: ValueObjects.Description;
	activityByStaffUserId: string;
}

export class StaffUserActivityLog extends DomainEntity<StaffUserActivityLogProps> implements StaffUserActivityLogEntityReference {
	private readonly visa: UserVisa;
	private isNew: boolean = false;

	constructor(props: StaffUserActivityLogProps, visa: UserVisa, createProps?: StaffUserActivityLogCreateProps) {
		super(props);
		this.visa = visa;

		if (createProps) {
			this.isNew = true;
			this.activityType = createProps.activityType;
			this.activityDescription = createProps.activityDescription;
			this.activityByStaffUserId = createProps.activityByStaffUserId;
			this.isNew = false;
		}
	}

	public static getNewInstance(newProps: StaffUserActivityLogProps, visa: UserVisa, createProps: StaffUserActivityLogCreateProps): StaffUserActivityLog {
		return new StaffUserActivityLog(newProps, visa, createProps);
	}

	private validateVisa(): void {
		if (this.isNew) {
			return;
		}
		if (!this.visa.determineIf((permissions) => permissions.isSystemAccount || permissions.canManageStaffRolesAndPermissions)) {
			throw new PermissionError('Unauthorized');
		}
	}

	get activityType(): string {
		return this.props.activityType;
	}
	set activityType(activityTypeCode: ValueObjects.ActivityTypeCode) {
		this.validateVisa();
		this.props.activityType = activityTypeCode.valueOf();
	}

	get activityDescription(): string {
		return this.props.activityDescription;
	}
	set activityDescription(activityDescription: ValueObjects.Description) {
		this.validateVisa();
		this.props.activityDescription = activityDescription.valueOf();
	}

	get activityByStaffUserId(): string {
		return this.props.activityByStaffUserId;
	}
	private set activityByStaffUserId(id: string) {
		if (!this.isNew) {
			throw new Error('activityByStaffUserId can only be set during creation');
		}
		this.validateVisa();
		this.props.activityByStaffUserId = id;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}
	get updatedAt(): Date {
		return this.props.updatedAt;
	}
}
