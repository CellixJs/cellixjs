import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import {
	ServiceTicketV1CreatedEvent,
	type ServiceTicketV1CreatedProps,
} from '../../../../events/types/service-ticket-v1-created.ts';
import {
	ServiceTicketV1DeletedEvent,
	type ServiceTicketV1DeletedProps,
} from '../../../../events/types/service-ticket-v1-deleted.ts';
import {
	ServiceTicketV1UpdatedEvent,
	type ServiceTicketV1UpdatedProps,
} from '../../../../events/types/service-ticket-v1-updated.ts';
import type { MemberEntityReference } from '../../../community/member/index.ts';
import type { Passport } from '../../../passport.ts';
import * as ValueObjects from './service-ticket-v1.value-objects.ts';
import type { ServiceTicketV1Visa } from './service-ticket-v1.visa.ts';
import {
	ServiceTicketV1ActivityDetail,
	type ServiceTicketV1ActivityDetailEntityReference,
	type ServiceTicketV1ActivityDetailProps,
} from './service-ticket-v1-activity-detail.entity.ts';
import * as ActivityDetailValueObjects from './service-ticket-v1-activity-detail.value-objects.ts';
import {
	ServiceTicketV1Message,
	type ServiceTicketV1MessageEntityReference,
	type ServiceTicketV1MessageProps,
} from './service-ticket-v1-message.entity.ts';

/**
 * Props for ServiceTicket aggregate
 */
export interface ServiceTicketV1Props extends DomainSeedwork.DomainEntityProps {
	title: string;
	description: string;
	status: string;
	priority: number;
	ticketType: string | undefined;
	communityId: string;
	propertyId: string | undefined;
	requestorId: string;
	assignedToId: string | undefined;
	serviceId: string | undefined;
	activityLog: DomainSeedwork.PropArray<ServiceTicketV1ActivityDetailProps>;
	messages: DomainSeedwork.PropArray<ServiceTicketV1MessageProps>;
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
export interface ServiceTicketV1EntityReference
	extends Readonly<Omit<ServiceTicketV1Props, 'activityLog' | 'messages'>> {
	readonly activityLog: ReadonlyArray<ServiceTicketV1ActivityDetailEntityReference>;
	readonly messages: ReadonlyArray<ServiceTicketV1MessageEntityReference>;
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
		title: ValueObjects.Title,
		description: ValueObjects.Description,
		communityId: string,
		requestorId: string,
		propertyId?: string,
	): ServiceTicketV1<props> {
		const serviceTicket = new ServiceTicketV1(newProps, passport);
		serviceTicket.markAsNew();
		serviceTicket.title = title;
		serviceTicket.description = description;
		serviceTicket.communityId = communityId;
		serviceTicket.requestorId = requestorId;
		if (propertyId) {
			serviceTicket.propertyId = propertyId;
		}
		serviceTicket.status = ValueObjects.StatusCodes.Draft;
		serviceTicket.priority = new ValueObjects.Priority(3);
		serviceTicket.isNew = false;

		return serviceTicket;
	}

	private markAsNew(): void {
		this.isNew = true;
		this.addIntegrationEvent<
			ServiceTicketV1CreatedProps,
			ServiceTicketV1CreatedEvent
		>(ServiceTicketV1CreatedEvent, {
			id: this.props.id,
		});
	}

	public requestNewActivityDetail(
		activityBy: MemberEntityReference,
	): ServiceTicketV1ActivityDetail {
		const activityDetailProps = this.props.activityLog.getNewItem();
		return ServiceTicketV1ActivityDetail.getNewInstance(
			activityDetailProps,
			activityBy,
		);
	}

	public requestAddStatusUpdate(
		description: string,
		by: MemberEntityReference,
	): void {
		if (
			!this.isNew &&
			!this.visa.determineIf(
				(permissions) =>
					permissions.isSystemAccount ||
					(permissions.canCreateTickets && permissions.isEditingOwnTicket) ||
					(permissions.canWorkOnTickets &&
						permissions.isEditingAssignedTicket) ||
					permissions.canManageTickets ||
					permissions.canAssignTickets,
			)
		) {
			throw new DomainSeedwork.PermissionError(
				'You do not have permission to update this service ticket',
			);
		}
		const activityDetail = this.requestNewActivityDetail(by);
		activityDetail.activityType =
			ActivityDetailValueObjects.ActivityTypeCodes.Updated;
		activityDetail.activityDescription = description;
	}
	public requestAddStatusTransition(
		newStatus: ValueObjects.StatusCode,
		description: string,
		by: MemberEntityReference,
	): void {
		if (
			!this.visa.determineIf(
				(permissions) =>
					permissions.isSystemAccount ||
					((this.validStatusTransitions
						.get(this.status)
						?.includes(newStatus.valueOf()) ??
						false) &&
						(permissions.canManageTickets ||
							permissions.canAssignTickets ||
							(permissions.canCreateTickets &&
								permissions.isEditingOwnTicket) ||
							(permissions.canWorkOnTickets &&
								permissions.isEditingAssignedTicket))),
			)
		) {
			throw new DomainSeedwork.PermissionError(
				'You do not have permission to change the status of this service ticket or the status transition is invalid',
			);
		}

		this.props.status = newStatus.valueOf();
		const activityDetail = this.requestNewActivityDetail(by);
		activityDetail.activityDescription = description;
		activityDetail.activityType =
			this.statusMappings.get(newStatus.valueOf()) ||
			ActivityDetailValueObjects.ActivityTypeCodes.Updated;
	}

	private readonly validStatusTransitions = new Map<string, string[]>([
		[ValueObjects.StatusCodes.Draft, [ValueObjects.StatusCodes.Submitted]],
		[
			ValueObjects.StatusCodes.Submitted,
			[ValueObjects.StatusCodes.Draft, ValueObjects.StatusCodes.Assigned],
		],
		[
			ValueObjects.StatusCodes.Assigned,
			[ValueObjects.StatusCodes.Submitted, ValueObjects.StatusCodes.InProgress],
		],
		[
			ValueObjects.StatusCodes.InProgress,
			[ValueObjects.StatusCodes.Assigned, ValueObjects.StatusCodes.Completed],
		],
		[
			ValueObjects.StatusCodes.Completed,
			[ValueObjects.StatusCodes.InProgress, ValueObjects.StatusCodes.Closed],
		],
		[ValueObjects.StatusCodes.Closed, [ValueObjects.StatusCodes.InProgress]],
	]);
	private readonly statusMappings = new Map<string, string>([
		[
			ValueObjects.StatusCodes.Draft,
			ActivityDetailValueObjects.ActivityTypeCodes.Created,
		],
		[
			ValueObjects.StatusCodes.Submitted,
			ActivityDetailValueObjects.ActivityTypeCodes.Submitted,
		],
		[
			ValueObjects.StatusCodes.Assigned,
			ActivityDetailValueObjects.ActivityTypeCodes.Assigned,
		],
		[
			ValueObjects.StatusCodes.InProgress,
			ActivityDetailValueObjects.ActivityTypeCodes.InProgress,
		],
		[
			ValueObjects.StatusCodes.Completed,
			ActivityDetailValueObjects.ActivityTypeCodes.Completed,
		],
		[
			ValueObjects.StatusCodes.Closed,
			ActivityDetailValueObjects.ActivityTypeCodes.Closed,
		],
	]);

	public requestDelete(): void {
		if (
			!this.isDeleted &&
			!this.visa.determineIf(
				(permissions) =>
					permissions.isSystemAccount || permissions.canManageTickets,
			)
		) {
			throw new DomainSeedwork.PermissionError(
				'You do not have permission to delete this property',
			);
		}
		super.isDeleted = true;
		this.addIntegrationEvent<
			ServiceTicketV1DeletedProps,
			ServiceTicketV1DeletedEvent
		>(ServiceTicketV1DeletedEvent, { id: this.props.id });
	}

	public override onSave(isModified: boolean): void {
		if (isModified && !super.isDeleted) {
			this.addIntegrationEvent<
				ServiceTicketV1UpdatedProps,
				ServiceTicketV1UpdatedEvent
			>(ServiceTicketV1UpdatedEvent, {
				id: this.props.id,
			});
		}
	}
	//#endregion Methods

	//#region Properties

	get title(): string {
		return this.props.title;
	}

	set title(title: ValueObjects.Title) {
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
			throw new DomainSeedwork.PermissionError(
				'You do not have permission to update this service ticket',
			);
		}
		this.props.title = title.valueOf();
	}

	get description(): string {
		return this.props.description;
	}

	set description(description: ValueObjects.Description) {
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
			throw new DomainSeedwork.PermissionError(
				'You do not have permission to update this service ticket',
			);
		}
		this.props.description = description.valueOf();
	}

	get status(): string {
		return this.props.status;
	}

	set status(status: ValueObjects.StatusCode) {
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
			throw new DomainSeedwork.PermissionError(
				'You do not have permission to change the status of this service ticket',
			);
		}
		this.props.status = status.valueOf();
	}

	get priority(): number {
		return this.props.priority;
	}

	set priority(priority: ValueObjects.Priority) {
		if (
			!this.isNew &&
			!this.visa.determineIf(
				(permissions) =>
					permissions.isSystemAccount ||
					permissions.canManageTickets ||
					permissions.canAssignTickets,
			)
		) {
			throw new DomainSeedwork.PermissionError(
				'You do not have permission to change the priority of this service ticket',
			);
		}
		this.props.priority = priority.valueOf();
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
				(permissions) =>
					permissions.isSystemAccount || permissions.canManageTickets,
			)
		) {
			throw new DomainSeedwork.PermissionError(
				'You do not have permission to change the community of this service ticket',
			);
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
				(permissions) =>
					permissions.isSystemAccount || permissions.canManageTickets,
			)
		) {
			throw new DomainSeedwork.PermissionError(
				'You do not have permission to change the property of this service ticket',
			);
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
				(permissions) =>
					permissions.isSystemAccount || permissions.canManageTickets,
			)
		) {
			throw new DomainSeedwork.PermissionError(
				'You do not have permission to change the requestor of this service ticket',
			);
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
			throw new DomainSeedwork.PermissionError(
				'You do not have permission to assign this service ticket',
			);
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
			throw new DomainSeedwork.PermissionError(
				'You do not have permission to change the service of this service ticket',
			);
		}
		this.props.serviceId = value;
	}

	get activityLog(): ReadonlyArray<ServiceTicketV1ActivityDetailEntityReference> {
		return this.props.activityLog.items.map(
			(item) => new ServiceTicketV1ActivityDetail(item),
		);
	}

	get messages(): ReadonlyArray<ServiceTicketV1MessageEntityReference> {
		return this.props.messages.items.map(
			(item) => new ServiceTicketV1Message(item, this.visa),
		);
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

	set hash(value: string) {
		this.props.hash = value;
	}

	get lastIndexed(): Date | undefined {
		return this.props.lastIndexed;
	}

	set lastIndexed(value: Date | undefined) {
		this.props.lastIndexed = value;
	}

	get updateIndexFailedDate(): Date | undefined {
		return this.props.updateIndexFailedDate;
	}

	set updateIndexFailedDate(value: Date | undefined) {
		this.props.updateIndexFailedDate = value;
	}
	//#endregion Properties
}

// Placeholder events - these would be defined properly

import type { ServiceTicketV1Repository } from './service-ticket-v1.repository.ts';
import type { ServiceTicketV1UnitOfWork } from './service-ticket-v1.uow.ts';
//#region Exports
import * as ValueObjects from './service-ticket-v1.value-objects.ts';
import type { ServiceTicketV1ActivityDetailProps } from './service-ticket-v1-activity-detail.entity.ts';
import type { ServiceTicketV1MessageProps } from './service-ticket-v1-message.entity.ts';

export { ValueObjects };
export type {
	ServiceTicketV1ActivityDetailProps,
	ServiceTicketV1MessageProps,
	ServiceTicketV1Repository,
	ServiceTicketV1UnitOfWork,
};
//#endregion Exports
