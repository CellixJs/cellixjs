import { DomainSeedwork } from '@cellix/domain-seedwork';
import type { Passport } from '../../../passport.ts';
import type { ServiceTicketV1Visa } from './service-ticket-v1.visa.js';
import { ServiceTicketV1ActivityDetail, type ServiceTicketV1ActivityDetailEntityReference, type ServiceTicketV1ActivityDetailProps } from './service-ticket-v1-activity-detail.js';
import * as ValueObjects from './service-ticket-v1.value-objects.js';

/**
 * Props for ServiceTicket aggregate
 */
export interface ServiceTicketV1Props extends DomainSeedwork.DomainEntityProps {
  title: string;
  description: string;
  status: ValueObjects.StatusCode;
  priority: ValueObjects.Priority;
  ticketType: string | undefined;
  communityId: string;
  propertyId: string | undefined;
  requestorId: string;
  assignedToId: string | undefined;
  serviceId: string | undefined;
  activityLog: DomainSeedwork.PropArray<ServiceTicketV1ActivityDetailProps>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly schemaVersion: string;
  hash: string;
  lastIndexed: Date | undefined;
  updateIndexFailedDate: Date | undefined;
}

/**
 * Entity reference for ServiceTicket
 */
export interface ServiceTicketV1EntityReference extends Readonly<
  Omit<ServiceTicketV1Props, 'activityLog'>
> {
  readonly activityLog: ReadonlyArray<ServiceTicketV1ActivityDetailEntityReference>;
}

/**
 * ServiceTicket aggregate root
 */
export class ServiceTicketV1<props extends ServiceTicketV1Props>
  extends DomainSeedwork.AggregateRoot<props, Passport>
  implements ServiceTicketV1EntityReference
{
  //#region Fields
  private readonly visa: ServiceTicketV1Visa;
  private isNew: boolean = false;
  //#endregion Fields

  //#region Constructor
  constructor(props: props, passport: Passport) {
    super(props, passport);
    this.visa = passport.case.forServiceTicketV1(this);
  }
  //#endregion Constructor

  //#region Methods
  public static getNewInstance<props extends ServiceTicketV1Props>(
    newProps: props,
    passport: Passport,
    title: string,
    description: string,
    communityId: string,
    requestorId: string,
    propertyId?: string,
  ): ServiceTicketV1<props> {
    const serviceTicket = new ServiceTicketV1(newProps, passport);
    serviceTicket.isNew = true;
    serviceTicket.Title = title;
    serviceTicket.Description = description;
    serviceTicket.communityId = communityId;
    serviceTicket.requestorId = requestorId;
    if (propertyId) {
      serviceTicket.propertyId = propertyId;
    }
    serviceTicket.Status = ValueObjects.StatusCodes.Draft;
    serviceTicket.Priority = new ValueObjects.Priority(3);
    serviceTicket.isNew = false;

    return serviceTicket;
  }

  public requestNewActivityDetail(): ServiceTicketV1ActivityDetail {
    const activityDetailProps = this.props.activityLog.getNewItem();
    return new ServiceTicketV1ActivityDetail(activityDetailProps);
  }

  public requestDelete(): void {
    if (
      !this.visa.determineIf(
        (permissions) =>
          permissions.isSystemAccount || permissions.canManageTickets,
      )
    ) {
      throw new DomainSeedwork.PermissionError('You do not have permission to delete this service ticket');
    }
    super.isDeleted = true;
  }

  public override onSave(isModified: boolean): void {
    if (isModified && !super.isDeleted) {
      // TODO: Add integration event when event classes are defined
      // this.addIntegrationEvent(ServiceTicketUpdatedEvent, { id: this.props.id });
    }
  }
  //#endregion Methods

  //#region Properties

  get title(): string {
    return this.props.title;
  }

  set Title(value: string) {
    if (
      !this.isNew &&
      !this.visa.determineIf(
        (permissions) =>
          permissions.isSystemAccount ||
          permissions.canManageTickets ||
          (permissions.canCreateTickets && permissions.isEditingOwnTicket) ||
          (permissions.canWorkOnTickets && permissions.isEditingAssignedTicket),
      )
    ) {
      throw new DomainSeedwork.PermissionError('You do not have permission to update this service ticket');
    }
    this.props.title = value;
  }

  get description(): string {
    return this.props.description;
  }

  set Description(value: string) {
    if (
      !this.isNew &&
      !this.visa.determineIf(
        (permissions) =>
          permissions.isSystemAccount ||
          permissions.canManageTickets ||
          (permissions.canCreateTickets && permissions.isEditingOwnTicket) ||
          (permissions.canWorkOnTickets && permissions.isEditingAssignedTicket),
      )
    ) {
      throw new DomainSeedwork.PermissionError('You do not have permission to update this service ticket');
    }
    this.props.description = value;
  }

  get status(): ValueObjects.StatusCode {
    return this.props.status;
  }

  set Status(value: ValueObjects.StatusCode) {
    if (
      !this.isNew &&
      !this.visa.determineIf(
        (permissions) =>
          permissions.isSystemAccount ||
          permissions.canManageTickets ||
          permissions.canAssignTickets ||
          (permissions.canWorkOnTickets && permissions.isEditingAssignedTicket),
      )
    ) {
      throw new DomainSeedwork.PermissionError('You do not have permission to change the status of this service ticket');
    }
    this.props.status = value;
  }

  get priority(): ValueObjects.Priority {
    return this.props.priority;
  }

  set Priority(value: ValueObjects.Priority) {
    if (
      !this.isNew &&
      !this.visa.determineIf(
        (permissions) =>
          permissions.isSystemAccount ||
          permissions.canManageTickets ||
          permissions.canAssignTickets,
      )
    ) {
      throw new DomainSeedwork.PermissionError('You do not have permission to change the priority of this service ticket');
    }
    this.props.priority = value;
  }

  get ticketType(): string | undefined {
    return this.props.ticketType;
  }

  get communityId(): string {
    return this.props.communityId;
  }

  set communityId(value: string) {
    if (
      !this.isNew &&
      !this.visa.determineIf(
        (permissions) => permissions.isSystemAccount || permissions.canManageTickets,
      )
    ) {
      throw new DomainSeedwork.PermissionError('You do not have permission to change the community of this service ticket');
    }
    this.props.communityId = value;
  }

  get propertyId(): string | undefined {
    return this.props.propertyId;
  }

  set propertyId(value: string | undefined) {
    if (
      !this.isNew &&
      !this.visa.determineIf(
        (permissions) => permissions.isSystemAccount || permissions.canManageTickets,
      )
    ) {
      throw new DomainSeedwork.PermissionError('You do not have permission to change the property of this service ticket');
    }
    this.props.propertyId = value;
  }

  get requestorId(): string {
    return this.props.requestorId;
  }

  set requestorId(value: string) {
    if (
      !this.isNew &&
      !this.visa.determineIf(
        (permissions) => permissions.isSystemAccount || permissions.canManageTickets,
      )
    ) {
      throw new DomainSeedwork.PermissionError('You do not have permission to change the requestor of this service ticket');
    }
    this.props.requestorId = value;
  }

  get assignedToId(): string | undefined {
    return this.props.assignedToId;
  }

  set assignedToId(value: string) {
    if (
      !this.visa.determineIf(
        (permissions) =>
          permissions.isSystemAccount ||
          permissions.canManageTickets ||
          permissions.canAssignTickets,
      )
    ) {
      throw new DomainSeedwork.PermissionError('You do not have permission to assign this service ticket');
    }
    this.props.assignedToId = value;
  }

  get serviceId(): string | undefined {
    return this.props.serviceId;
  }

  set serviceId(value: string) {
    if (
      !this.isNew &&
      !this.visa.determineIf(
        (permissions) =>
          permissions.isSystemAccount ||
          permissions.canManageTickets ||
          (permissions.canWorkOnTickets && permissions.isEditingAssignedTicket),
      )
    ) {
      throw new DomainSeedwork.PermissionError('You do not have permission to change the service of this service ticket');
    }
    this.props.serviceId = value;
  }

  get activityLog(): ReadonlyArray<ServiceTicketV1ActivityDetailEntityReference> {
    return this.props.activityLog.items.map((item) => new ServiceTicketV1ActivityDetail(item));
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get schemaVersion(): string {
    return this.props.schemaVersion;
  }

  get hash(): string {
    return this.props.hash;
  }

  set Hash(value: string) {
    this.props.hash = value;
  }

  get lastIndexed(): Date | undefined {
    return this.props.lastIndexed;
  }

  set LastIndexed(value: Date | undefined) {
    this.props.lastIndexed = value;
  }

  get updateIndexFailedDate(): Date | undefined {
    return this.props.updateIndexFailedDate;
  }

  set UpdateIndexFailedDate(value: Date | undefined) {
    this.props.updateIndexFailedDate = value;
  }
  //#endregion Properties
}

// Placeholder events - these would be defined properly