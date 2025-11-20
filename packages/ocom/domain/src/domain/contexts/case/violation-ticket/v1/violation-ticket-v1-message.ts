import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { PermissionError, DomainEntity } from '@cellix/domain-seedwork/domain-entity';
import type { MemberEntityReference } from '../../../community.ts';
import type { ViolationTicketV1Visa } from './violation-ticket-v1.visa.ts';
import * as ValueObjects from './violation-ticket-v1-message.value-objects.ts';

/**
 * Props for ViolationTicketV1Message
 */
export interface ViolationTicketV1MessageProps extends DomainEntityProps {
	sentBy: string;
	initiatedBy: MemberEntityReference;
	loadInitiatedBy: () => Promise<MemberEntityReference>;
	message: string;
	embedding: string | undefined;
	createdAt: Date;
	isHiddenFromApplicant: boolean;
}

export interface ViolationTicketV1MessageEntityReference
	extends Readonly<ViolationTicketV1MessageProps> {}

/**
 * ViolationTicketV1Message entity
 */
export class ViolationTicketV1Message
	extends DomainEntity<ViolationTicketV1MessageProps>
	implements ViolationTicketV1MessageEntityReference
{
	private readonly visa: ViolationTicketV1Visa;
	//#region Constructor
	constructor(
		props: ViolationTicketV1MessageProps,
		visa: ViolationTicketV1Visa,
	) {
		super(props);
		this.visa = visa;
	}
	//#endregion Constructor

	//#region Methods
	public static getNewInstance(
		messageProps: ViolationTicketV1MessageProps,
		visa: ViolationTicketV1Visa,
		message: string,
		sentBy: string,
		embedding: string,
		initiatedBy?: MemberEntityReference,
	): ViolationTicketV1Message {
		const instance = new ViolationTicketV1Message(messageProps, visa);
		instance.sentBy = new ValueObjects.SentBy(sentBy);
		instance.message = new ValueObjects.Message(message);
		if (embedding !== undefined) {
			instance.embedding = new ValueObjects.Embedding(embedding);
		}
		if (initiatedBy !== undefined) {
			instance.initiatedBy = initiatedBy;
		}
		instance.createdAt = new Date();
		instance.isHiddenFromApplicant = false;
		return instance;
	}

	async loadInitiatedBy(): Promise<MemberEntityReference> {
		return await this.props.loadInitiatedBy();
	}
	//#endregion Methods

	//#region Properties
	get sentBy(): string {
		return this.props.sentBy;
	}

	set sentBy(sentBy: ValueObjects.SentBy) {
		if (
			!this.visa.determineIf(
				(permissions) =>
					permissions.canManageTickets || permissions.isSystemAccount,
			)
		) {
			throw new PermissionError(
				'You do not have permission to modify this message',
			);
		}
		this.props.sentBy = sentBy.valueOf();
	}

	get initiatedBy(): MemberEntityReference {
		return this.props.initiatedBy;
	}

	private set initiatedBy(member: MemberEntityReference) {
		this.props.initiatedBy = member;
	}

	get message(): string {
		return this.props.message;
	}

	set message(message: ValueObjects.Message) {
		if (
			!this.visa.determineIf(
				(permissions) =>
					permissions.canManageTickets || permissions.isSystemAccount,
			)
		) {
			throw new PermissionError(
				'You do not have permission to modify this message',
			);
		}
		this.props.message = message.valueOf();
	}

	get embedding(): string | undefined {
		return this.props.embedding;
	}

	set embedding(embedding: ValueObjects.Embedding) {
		if (
			!this.visa.determineIf(
				(permissions) =>
					permissions.canManageTickets || permissions.isSystemAccount,
			)
		) {
			throw new PermissionError(
				'You do not have permission to modify this message',
			);
		}
		this.props.embedding = embedding.valueOf();
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	set createdAt(createdAt: Date) {
		if (!this.visa.determineIf((permissions) => permissions.isSystemAccount)) {
			throw new PermissionError(
				'You do not have permission to modify this message timestamp',
			);
		}
		this.props.createdAt = createdAt;
	}

	get isHiddenFromApplicant(): boolean {
		return this.props.isHiddenFromApplicant;
	}

	set isHiddenFromApplicant(isHiddenFromApplicant: boolean) {
		if (
			!this.visa.determineIf(
				(permissions) =>
					permissions.canManageTickets || permissions.isSystemAccount,
			)
		) {
			throw new PermissionError(
				'You do not have permission to modify this message visibility',
			);
		}
		this.props.isHiddenFromApplicant = isHiddenFromApplicant;
	}
	//#endregion Properties
}
