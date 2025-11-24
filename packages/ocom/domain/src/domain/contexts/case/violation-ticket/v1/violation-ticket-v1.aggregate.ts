import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import type { PropArray } from '@cellix/domain-seedwork/prop-array';
import {
	ViolationTicketV1CreatedEvent,
	type ViolationTicketV1CreatedProps,
} from '../../../../events/types/violation-ticket-v1-created.ts';
import {
	ViolationTicketV1DeletedEvent,
	type ViolationTicketV1DeletedEventProps,
} from '../../../../events/types/violation-ticket-v1-deleted.ts';
import {
	ViolationTicketV1UpdatedEvent,
	type ViolationTicketV1UpdatedProps,
} from '../../../../events/types/violation-ticket-v1-updated.ts';
import type { MemberEntityReference } from '../../../community/member/index.ts';
import type { Passport } from '../../../passport.ts';
import * as ValueObjects from './violation-ticket-v1.value-objects.ts';
import type { ViolationTicketV1Visa } from './violation-ticket-v1.visa.ts';
import {
	ViolationTicketV1ActivityDetail,
	type ViolationTicketV1ActivityDetailEntityReference,
	type ViolationTicketV1ActivityDetailProps,
} from './violation-ticket-v1-activity-detail.ts';
import * as ActivityDetailValueObjects from './violation-ticket-v1-activity-detail.value-objects.ts';
import {
	type ViolationTicketV1FinanceDetailEntityReference,
	type ViolationTicketV1FinanceDetailProps,
	ViolationTicketV1FinanceDetails,
} from './violation-ticket-v1-finance-details.ts';
import {
	ViolationTicketV1Message,
	type ViolationTicketV1MessageEntityReference,
	type ViolationTicketV1MessageProps,
} from './violation-ticket-v1-message.ts';
// import type { PhotoProps, PhotoEntityReference } from '../service-ticket/v1/photo.ts';
import {
	ViolationTicketV1Photo,
	type ViolationTicketV1PhotoEntityReference,
	type ViolationTicketV1PhotoProps,
} from './violation-ticket-v1-photo.ts';
import {
	ViolationTicketV1RevisionRequest,
	type ViolationTicketV1RevisionRequestEntityReference,
	type ViolationTicketV1RevisionRequestProps,
} from './violation-ticket-v1-revision-request.ts';

/**
 * Props for ViolationTicket aggregate
 */
export interface ViolationTicketV1Props extends DomainEntityProps {
	communityId: string;
	propertyId: string | undefined;
	requestorId: string;
	assignedToId: string | undefined;
	serviceId: string | undefined;
	title: string;
	description: string;
	status: string;
	priority: number;
	ticketType: string | undefined;
	activityLog: PropArray<ViolationTicketV1ActivityDetailProps>;
	messages: PropArray<ViolationTicketV1MessageProps>;
	photos: PropArray<ViolationTicketV1PhotoProps>;
	financeDetails: ViolationTicketV1FinanceDetailProps;
	revisionRequest: ViolationTicketV1RevisionRequestProps | undefined;
	readonly createdAt: Date;
	readonly updatedAt: Date;
	readonly schemaVersion: string;
	hash: string;
	lastIndexed: Date | undefined;
	updateIndexFailedDate: Date | undefined;
}

/**
 * Entity reference for ViolationTicket
 */
export interface ViolationTicketV1EntityReference
	extends Readonly<
		Omit<
			ViolationTicketV1Props,
			| 'activityLog'
			| 'messages'
			| 'photos'
			| 'financeDetails'
			| 'revisionRequest'
		>
	> {
	readonly activityLog: ReadonlyArray<ViolationTicketV1ActivityDetailEntityReference>;
	readonly messages: ReadonlyArray<ViolationTicketV1MessageEntityReference>;
	readonly photos: ReadonlyArray<ViolationTicketV1PhotoEntityReference>;
	readonly financeDetails: ViolationTicketV1FinanceDetailEntityReference;
	readonly revisionRequest:
		| ViolationTicketV1RevisionRequestEntityReference
		| undefined;
}

/**
 * ViolationTicket aggregate root
 */
export class ViolationTicketV1<props extends ViolationTicketV1Props>
	extends AggregateRoot<props, Passport>
	implements ViolationTicketV1EntityReference
{
	//#region Fields
	private readonly visa: ViolationTicketV1Visa;
	private isNew: boolean = false;
	private readonly validStatusTransitions = new Map<ValueObjects.StatusCode, ValueObjects.StatusCode[]>([
		[ValueObjects.StatusCodes.Draft, [ValueObjects.StatusCodes.Submitted]],
		[
			ValueObjects.StatusCodes.Submitted,
			[ValueObjects.StatusCodes.Draft, ValueObjects.StatusCodes.Assigned],
		],
		[
			ValueObjects.StatusCodes.Assigned,
			[ValueObjects.StatusCodes.Submitted, ValueObjects.StatusCodes.Paid],
		],
		[
			ValueObjects.StatusCodes.Paid,
			[ValueObjects.StatusCodes.Assigned, ValueObjects.StatusCodes.Closed],
		],
		[ValueObjects.StatusCodes.Closed, [ValueObjects.StatusCodes.Assigned]],
	]);

	private readonly statusMappings = new Map<ValueObjects.StatusCode, ActivityDetailValueObjects.ActivityTypeCode>([
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
			ValueObjects.StatusCodes.Paid,
			ActivityDetailValueObjects.ActivityTypeCodes.Paid,
		],
		[
			ValueObjects.StatusCodes.Closed,
			ActivityDetailValueObjects.ActivityTypeCodes.Closed,
		],
	]);

	//#endregion Fields

	//#region Constructor
	constructor(props: props, passport: Passport) {
		super(props, passport);
		this.visa = passport.case.forViolationTicketV1(this);
	}
	//#endregion Constructor

	//#region Methods
	public static getNewInstance<props extends ViolationTicketV1Props>(
		newProps: props,
		passport: Passport,
		title: string,
		description: string,
		communityId: string,
		requestorId: string,
		penaltyAmount: number,
		propertyId?: string,
	): ViolationTicketV1<props> {
		const violationTicket = new ViolationTicketV1(newProps, passport);
		violationTicket.markAsNew();
		violationTicket.title = title;
		violationTicket.description = description;
		violationTicket.communityId = communityId;
		violationTicket.requestorId = requestorId;
		violationTicket.status = ValueObjects.StatusCodes.Draft;
		violationTicket.priority = new ValueObjects.Priority(5).valueOf();
		violationTicket.financeDetails.serviceFee = penaltyAmount;
		if (propertyId) {
			violationTicket.propertyId = propertyId;
		}
		violationTicket.isNew = false;

		return violationTicket;
	}

	private markAsNew(): void {
		this.isNew = true;
		this.addIntegrationEvent<
			ViolationTicketV1CreatedProps,
			ViolationTicketV1CreatedEvent
		>(ViolationTicketV1CreatedEvent, {
			id: this.props.id,
		});
	}

	public requestDelete(): void {
		if (
			!this.visa.determineIf(
				(permissions) =>
					permissions.isSystemAccount || permissions.canManageTickets,
			)
		) {
			throw new PermissionError(
				'You do not have permission to delete this violation ticket',
			);
		}
		this.isDeleted = true;
		this.addIntegrationEvent<
			ViolationTicketV1DeletedEventProps,
			ViolationTicketV1DeletedEvent
		>(ViolationTicketV1DeletedEvent, { id: this.props.id });
	}

	public requestNewActivityDetail(
		activityBy: MemberEntityReference,
	): ViolationTicketV1ActivityDetail {
		const activityDetailProps = this.props.activityLog.getNewItem();
		return ViolationTicketV1ActivityDetail.getNewInstance(
			activityDetailProps,
			activityBy,
			this.visa,
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
			throw new PermissionError(
				'You do not have permission to update this violation ticket',
			);
		}
		const activityDetail = this.requestNewActivityDetail(by);
		activityDetail.activityType =
			ActivityDetailValueObjects.ActivityTypeCodes.Updated;
		activityDetail.activityDescription = description;
	}

	public requestAddMessage(
		message: string,
		sentBy: string,
		embedding: string,
		initiatedBy?: MemberEntityReference,
	): void {
		if (
			!this.visa.determineIf(
				(permissions) =>
					permissions.isSystemAccount ||
					(permissions.canCreateTickets && permissions.isEditingOwnTicket) ||
					(permissions.canWorkOnTickets &&
						permissions.isEditingAssignedTicket) ||
					permissions.canManageTickets,
			)
		) {
			throw new PermissionError(
				'You do not have permission to add messages to this violation ticket',
			);
		}
		const messageProps = this.props.messages.getNewItem();
		ViolationTicketV1Message.getNewInstance(
			messageProps,
			this.visa,
			message,
			sentBy,
			embedding,
			initiatedBy,
		);
		// The message is automatically added to the prop array
	}

	public requestAddPhoto(documentId: string, description: string): void {
		if (
			!this.visa.determineIf(
				(permissions) =>
					permissions.isSystemAccount ||
					(permissions.canCreateTickets && permissions.isEditingOwnTicket) ||
					(permissions.canWorkOnTickets &&
						permissions.isEditingAssignedTicket) ||
					permissions.canManageTickets,
			)
		) {
			throw new PermissionError(
				'You do not have permission to add photos to this violation ticket',
			);
		}
		const photoProps = this.props.photos.getNewItem();
		ViolationTicketV1Photo.getNewInstance(
			photoProps,
			documentId,
			description,
			this.visa,
		);
		// The photo is automatically added to the prop array
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
			throw new PermissionError(
				'You do not have permission to change the status of this violation ticket or the status transition is invalid',
			);
		}

		this.props.status = newStatus.valueOf();
		const activityDetail = this.requestNewActivityDetail(by);
		activityDetail.activityDescription = description;
		activityDetail.activityType =
			this.statusMappings.get(newStatus.valueOf()) ||
			ActivityDetailValueObjects.ActivityTypeCodes.Updated;
	}

	public override onSave(isModified: boolean): void {
		if (isModified && !super.isDeleted) {
			this.addIntegrationEvent<
				ViolationTicketV1UpdatedProps,
				ViolationTicketV1UpdatedEvent
			>(ViolationTicketV1UpdatedEvent, { id: this.props.id });
		}
	}
	//#endregion Methods

	//#region Properties
	get communityId(): string {
		return this.props.communityId;
	}

	set communityId(value: string) {
		if (!this.isNew) {
			throw new PermissionError(
				'You do not have permission to change the community',
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
					permissions.isSystemAccount ||
					permissions.canManageTickets ||
					(permissions.canCreateTickets && permissions.isEditingOwnTicket),
			)
		) {
			throw new PermissionError(
				'You do not have permission to change the property',
			);
		}
		this.props.propertyId = value;
	}

	get requestorId(): string {
		return this.props.requestorId;
	}
	private set requestorId(value: string) {
		if (!this.isNew) {
			throw new PermissionError(
				'You do not have permission to change the requestor',
			);
		}
		this.props.requestorId = value;
	}

	get assignedToId(): string | undefined {
		return this.props.assignedToId;
	}

	set assignedToId(value: string | undefined) {
		if (
			!this.isNew &&
			!this.visa.determineIf(
				(permissions) =>
					permissions.isSystemAccount || permissions.canAssignTickets,
			)
		) {
			throw new PermissionError(
				'You do not have permission to assign this violation ticket',
			);
		}
		this.props.assignedToId = value;
	}

	get serviceId(): string | undefined {
		return this.props.serviceId;
	}

	set serviceId(value: string | undefined) {
		if (
			!this.isNew &&
			!this.visa.determineIf(
				(permissions) =>
					permissions.isSystemAccount ||
					permissions.canManageTickets ||
					(permissions.canCreateTickets && permissions.isEditingOwnTicket),
			)
		) {
			throw new PermissionError(
				'You do not have permission to change the service',
			);
		}
		this.props.serviceId = value;
	}

	get title(): string {
		return this.props.title;
	}

	set title(value: string) {
		if (
			!this.isNew &&
			!this.visa.determineIf(
				(permissions) =>
					permissions.isSystemAccount ||
					permissions.canManageTickets ||
					(permissions.canCreateTickets && permissions.isEditingOwnTicket),
			)
		) {
			throw new PermissionError(
				'You do not have permission to change the title',
			);
		}
		this.props.title = new ValueObjects.Title(value).valueOf();
	}

	get description(): string {
		return this.props.description;
	}

	set description(value: string) {
		if (
			!this.isNew &&
			!this.visa.determineIf(
				(permissions) =>
					permissions.isSystemAccount ||
					permissions.canManageTickets ||
					(permissions.canCreateTickets && permissions.isEditingOwnTicket),
			)
		) {
			throw new PermissionError(
				'You do not have permission to change the description',
			);
		}
		this.props.description = new ValueObjects.Description(value).valueOf();
	}

	get ticketType(): string | undefined {
		return this.props.ticketType;
	}

	set ticketType(value: string | undefined) {
		if (
			!this.isNew &&
			!this.visa.determineIf(
				(permissions) =>
					permissions.isSystemAccount || permissions.canManageTickets,
			)
		) {
			throw new PermissionError(
				'You do not have permission to change the ticket type',
			);
		}
		this.props.ticketType = value;
	}

	get status(): string {
		return this.props.status;
	}

	set status(value: string) {
		if (
			!this.isNew &&
			!this.visa.determineIf((permissions) => permissions.isSystemAccount)
		) {
			throw new PermissionError(
				'You do not have permission to change the status',
			);
		}
		this.props.status = new ValueObjects.StatusCode(value).valueOf();
	}

	get priority(): number {
		return this.props.priority;
	}

	set priority(value: number) {
		if (
			!this.isNew &&
			!this.visa.determineIf(
				(permissions) =>
					permissions.isSystemAccount ||
					(permissions.canCreateTickets && permissions.isEditingOwnTicket) ||
					permissions.canManageTickets,
			)
		) {
			throw new PermissionError(
				'You do not have permission to change the priority',
			);
		}
		this.props.priority = new ValueObjects.Priority(value).valueOf();
	}

	get activityLog(): ReadonlyArray<ViolationTicketV1ActivityDetailEntityReference> {
		return this.props.activityLog.items.map(
			(item) => new ViolationTicketV1ActivityDetail(item, this.visa),
		);
	}

	get messages(): ReadonlyArray<ViolationTicketV1MessageEntityReference> {
		return this.props.messages.items.map(
			(item) => new ViolationTicketV1Message(item, this.visa),
		);
	}

	get photos(): ReadonlyArray<ViolationTicketV1PhotoEntityReference> {
		return this.props.photos.items.map(
			(item) => new ViolationTicketV1Photo(item, this.visa),
		);
	}

	get financeDetails(): ViolationTicketV1FinanceDetailProps {
		return new ViolationTicketV1FinanceDetails(this.props.financeDetails);
	}

	get revisionRequest():
		| ViolationTicketV1RevisionRequestEntityReference
		| undefined {
		return this.props.revisionRequest
			? new ViolationTicketV1RevisionRequest(
					this.props.revisionRequest,
					this.visa,
				)
			: undefined;
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
			throw new PermissionError(
				'You do not have permission to change the hash',
			);
		}
		this.props.hash = value;
	}

	get lastIndexed(): Date | undefined {
		return this.props.lastIndexed;
	}

	set lastIndexed(value: Date | undefined) {
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
			throw new PermissionError(
				'You do not have permission to change the last indexed date',
			);
		}
		this.props.lastIndexed = value;
	}

	get updateIndexFailedDate(): Date | undefined {
		return this.props.updateIndexFailedDate;
	}

	set updateIndexFailedDate(value: Date | undefined) {
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
			throw new PermissionError(
				'You do not have permission to change the update index failed date',
			);
		}
		this.props.updateIndexFailedDate = value;
	}
	//#endregion Properties
}
