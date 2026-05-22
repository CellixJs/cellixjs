import { DomainEntity } from '@cellix/domain-seedwork/domain-entity';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import type * as ValueObjects from './staff-user-activity-detail.value-objects.ts';

export interface StaffUserActivityDetailProps extends DomainEntityProps {
	activityType: string;
	activityDescription: string;
	activityByStaffUserId: string;
	readonly createdAt: Date;
	readonly updatedAt: Date;
}

export interface StaffUserActivityDetailEntityReference extends Readonly<StaffUserActivityDetailProps> {}

export class StaffUserActivityDetail extends DomainEntity<StaffUserActivityDetailProps> implements StaffUserActivityDetailEntityReference {
	private isNew: boolean = false;

	public static getNewInstance(newProps: StaffUserActivityDetailProps, activityByStaffUserId: string): StaffUserActivityDetail {
		const instance = new StaffUserActivityDetail(newProps);
		instance.isNew = true;
		instance.activityByStaffUserId = activityByStaffUserId;
		instance.isNew = false;
		return instance;
	}

	get activityType(): string {
		return this.props.activityType;
	}
	set activityType(activityTypeCode: ValueObjects.ActivityTypeCode) {
		this.props.activityType = activityTypeCode.valueOf();
	}

	get activityDescription(): string {
		return this.props.activityDescription;
	}
	set activityDescription(activityDescription: ValueObjects.Description) {
		this.props.activityDescription = activityDescription.valueOf();
	}

	get activityByStaffUserId(): string {
		return this.props.activityByStaffUserId;
	}
	private set activityByStaffUserId(id: string) {
		if (!this.isNew) {
			throw new Error('activityByStaffUserId can only be set during creation');
		}
		this.props.activityByStaffUserId = id;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}
	get updatedAt(): Date {
		return this.props.updatedAt;
	}
}
