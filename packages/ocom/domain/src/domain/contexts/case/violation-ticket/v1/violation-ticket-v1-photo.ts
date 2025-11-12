import { randomBytes } from 'node:crypto';
import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { ViolationTicketV1Visa } from './violation-ticket-v1.visa.ts';

export interface ViolationTicketV1PhotoProps extends DomainSeedwork.DomainEntityProps {
  documentId: string;
  description: string;
}

export interface ViolationTicketV1PhotoEntityReference extends Readonly<ViolationTicketV1PhotoProps> {}

export class ViolationTicketV1Photo extends DomainSeedwork.DomainEntity<ViolationTicketV1PhotoProps>
  implements ViolationTicketV1PhotoEntityReference
{
  private readonly visa: ViolationTicketV1Visa;

  constructor(props: ViolationTicketV1PhotoProps, visa: ViolationTicketV1Visa) {
    super(props);
    this.visa = visa;
  }

  public static getNewInstance(
    props: ViolationTicketV1PhotoProps,
    documentId: string,
    description: string,
    visa: ViolationTicketV1Visa
  ): ViolationTicketV1Photo {
    const photo = new ViolationTicketV1Photo(props, visa);
    photo.documentId = documentId;
    photo.description = description;
    return photo;
  }

  get documentId(): string {
    return this.props.documentId;
  }

  set documentId(value: string) {
    if (!this.visa.determineIf(permissions => permissions.canManageTickets)) {
      throw new DomainSeedwork.PermissionError('You do not have permission to update photo document ID');
    }
    this.props.documentId = value;
  }

  get description(): string {
    return this.props.description;
  }

  set description(value: string) {
    if (!this.visa.determineIf(permissions => permissions.canManageTickets)) {
      throw new DomainSeedwork.PermissionError('You do not have permission to update photo description');
    }
    this.props.description = value;
  }

  getNewDocumentId(): string {
    // Generate a new document ID - implementation can be customized
    return `photo-${Date.now()}-${randomBytes(5).toString('hex').substr(0, 9)}`;
  }
}