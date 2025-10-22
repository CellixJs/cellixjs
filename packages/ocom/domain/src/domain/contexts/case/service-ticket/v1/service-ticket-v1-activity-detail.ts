import { DomainSeedwork } from '@cellix/domain-seedwork';
import type { MemberEntityReference } from '../../../community/member/member.ts';


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
  //#endregion Fields

  //#region Constructor
  //#endregion Constructor

  //#region Methods
  async loadActivityBy(): Promise<MemberEntityReference> {
    return await this.props.loadActivityBy();
  }
  //#endregion Methods

  //#region Properties
  get activityType(): string {
    return this.props.activityType;
  }

  get activityDescription(): string {
    return this.props.activityDescription;
  }
  set activityDescription(activityDescription: string) {
    // Permission check would be added here
    this.props.activityDescription = activityDescription;
  }

  get activityBy(): MemberEntityReference {
    return this.props.activityBy;
  }

  set ActivityType(activityTypeCode: string) {
    // Permission check would be added here
    this.props.activityType = activityTypeCode;
    // Domain event handling would be added here
  }
  //#endregion Properties
}