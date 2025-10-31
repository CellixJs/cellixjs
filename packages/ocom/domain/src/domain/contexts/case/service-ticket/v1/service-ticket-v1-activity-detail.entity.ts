import { DomainSeedwork } from '@cellix/domain-seedwork';
import type { MemberEntityReference } from '../../../community/member/member.ts';
import type * as ValueObjects from './service-ticket-v1-activity-detail.value-objects.ts';


export interface ServiceTicketV1ActivityDetailProps extends DomainSeedwork.DomainEntityProps {
  activityType: string;
  activityDescription: string;
  activityBy: MemberEntityReference;
  loadActivityBy: () => Promise<MemberEntityReference>;
}

export interface ServiceTicketV1ActivityDetailEntityReference extends Readonly<ServiceTicketV1ActivityDetailProps> {}
export class ServiceTicketV1ActivityDetail extends DomainSeedwork.DomainEntity<ServiceTicketV1ActivityDetailProps>
  implements ServiceTicketV1ActivityDetailEntityReference
{
  //#region Fields
  private isNew: boolean = false;
  //#endregion Fields

  //#region Constructor
  //#endregion Constructor

  //#region Methods
  public static getNewInstance(
    newProps: ServiceTicketV1ActivityDetailProps,
    activityBy: MemberEntityReference,
  ): ServiceTicketV1ActivityDetail {
    const instance = new ServiceTicketV1ActivityDetail(newProps);
    instance.isNew = true;
    instance.activityBy = activityBy;
    instance.isNew = false;
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
    // Permission check would be added here
    this.props.activityType = activityTypeCode.valueOf();
    // Domain event handling would be added here
  }

  get activityDescription(): string {
    return this.props.activityDescription;
  }
  set activityDescription(activityDescription: ValueObjects.Description) {
    // Permission check would be added here
    this.props.activityDescription = activityDescription.valueOf();
  }

  get activityBy(): MemberEntityReference {
    return this.props.activityBy;
  }
  private set activityBy(activityBy: MemberEntityReference) {
    if (!this.isNew) {
        throw new Error('activityBy can only be set during creation');
    }
    this.props.activityBy = activityBy;
  }
  //#endregion Properties
}