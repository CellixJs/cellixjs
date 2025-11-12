import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { MemberEntityReference } from '../../../community/member/index.ts';
import type { ViolationTicketV1Visa } from './violation-ticket-v1.visa.ts';
import type * as ValueObjects from './violation-ticket-v1-activity-detail.value-objects.ts';

export interface ViolationTicketV1ActivityDetailProps extends DomainSeedwork.DomainEntityProps {
  activityType: string;
  activityDescription: string;
  activityBy: MemberEntityReference;
  loadActivityBy: () => Promise<MemberEntityReference>;
}

export interface ViolationTicketV1ActivityDetailEntityReference extends Readonly<ViolationTicketV1ActivityDetailProps> {}

export class ViolationTicketV1ActivityDetail extends DomainSeedwork.DomainEntity<ViolationTicketV1ActivityDetailProps>
  implements ViolationTicketV1ActivityDetailEntityReference
{
  private readonly visa: ViolationTicketV1Visa;
  //#region Constructor
  constructor(props: ViolationTicketV1ActivityDetailProps, visa: ViolationTicketV1Visa) {
    super(props);
    this.visa = visa;
  }
  //#endregion Constructor

  //#region Methods
  public static getNewInstance(
    newProps: ViolationTicketV1ActivityDetailProps,
    activityBy: MemberEntityReference,
    visa: ViolationTicketV1Visa,
  ): ViolationTicketV1ActivityDetail {
    const instance = new ViolationTicketV1ActivityDetail(newProps, visa);
    instance.activityBy = activityBy;
    return instance;
  }

  async loadActivityBy(): Promise<MemberEntityReference> {
    return await this.props.loadActivityBy();
  }
  //#endregion Methods

  //#region Properties
  get activityType(): string {
    return this.props.activityType;
  }

  set activityType(activityTypeCode: ValueObjects.ActivityTypeCode) {
    if (!this.visa.determineIf((permissions) => permissions.isSystemAccount || permissions.canManageTickets)) {
      throw new DomainSeedwork.PermissionError('You do not have permission to modify this activity detail');
    }
    this.props.activityType = activityTypeCode.valueOf();
  }

  get activityDescription(): string {
    return this.props.activityDescription;
  }

  set activityDescription(activityDescription: ValueObjects.Description) {
    if (!this.visa.determineIf((permissions) => permissions.isSystemAccount || permissions.canManageTickets)) {
      throw new DomainSeedwork.PermissionError('You do not have permission to modify this activity detail');
    }
    this.props.activityDescription = activityDescription.valueOf();
  }

  get activityBy(): MemberEntityReference {
    return this.props.activityBy;
  }

  private set activityBy(activityBy: MemberEntityReference) {
    this.props.activityBy = activityBy;
  }
  //#endregion Properties
}