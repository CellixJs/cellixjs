import type { DomainSeedwork } from '@cellix/domain-seedwork';
import type { CommunityEntityReference } from '../../../community/community/index.ts';
import type { MemberEntityReference } from '../../../community/member/index.ts';
import type { PropertyEntityReference } from '../../../property/property/index.ts';
import type { ViolationTicketV1, ViolationTicketV1Props } from './violation-ticket-v1.aggregate.ts';

export interface ViolationTicketV1Repository<props extends ViolationTicketV1Props> extends DomainSeedwork.Repository<ViolationTicketV1<props>> {
  getNewInstance(
    title: string,
    description: string,
    community: CommunityEntityReference,
    property: PropertyEntityReference,
    requestor: MemberEntityReference,
    penaltyAmount: number
  ): Promise<ViolationTicketV1<props>>;

  getById(id: string): Promise<ViolationTicketV1<props>>;
}