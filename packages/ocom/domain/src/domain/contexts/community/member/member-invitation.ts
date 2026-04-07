import { DomainEntity } from '@cellix/domain-seedwork/domain-entity';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import type { CommunityVisa } from '../community.visa.ts';
import type { EndUserEntityReference } from '../../user/end-user/end-user.ts';
import * as ValueObjects from './member-invitation.value-objects.ts';

export interface MemberInvitationProps extends DomainEntityProps {
	email: string;
	message: string;
	status: string;
	expiresAt: Date;
	invitedBy: Readonly<EndUserEntityReference>;
	acceptedBy?: Readonly<EndUserEntityReference>;
	communityId: string;

	readonly createdAt: Date;
	readonly updatedAt: Date;
}

export interface MemberInvitationEntityReference extends Readonly<Omit<MemberInvitationProps, 'invitedBy' | 'acceptedBy'>> {
	readonly invitedBy: EndUserEntityReference;
	readonly acceptedBy: EndUserEntityReference | undefined;
}

export class MemberInvitation<props extends MemberInvitationProps> extends DomainEntity<props> implements MemberInvitationEntityReference {
	private readonly _visa: CommunityVisa;

	constructor(props: props, visa: CommunityVisa) {
		super(props);
		this._visa = visa;
	}

	//#region Actions
	/**
	 * Mark invitation as sent
	 */
	public requestMarkAsSent(): void {
		if (!this.isPending) {
			throw new Error('Can only mark pending invitations as sent');
		}
		if (!this._visa.determineIf((domainPermissions) => domainPermissions.canManageMembers || domainPermissions.isSystemAccount)) {
			throw new Error('Cannot mark invitation as sent');
		}
		this.status = 'SENT';
	}

	/**
	 * Accept the invitation
	 */
	public requestAccept(acceptedBy: EndUserEntityReference): void {
		if (!this.isActive) {
			throw new Error('Cannot accept inactive invitation');
		}
		if (this.isExpired) {
			throw new Error('Cannot accept expired invitation');
		}
		this.status = 'ACCEPTED';
		this.props.acceptedBy = acceptedBy;
	}

	/**
	 * Reject the invitation
	 */
	public requestReject(): void {
		if (!this.isActive) {
			throw new Error('Cannot reject inactive invitation');
		}
		this.status = 'REJECTED';
	}

	/**
	 * Mark invitation as expired
	 */
	public requestMarkAsExpired(): void {
		if (!this._visa.determineIf((domainPermissions) => domainPermissions.canManageMembers || domainPermissions.isSystemAccount)) {
			throw new Error('Cannot mark invitation as expired');
		}
		this.status = 'EXPIRED';
	}

	/**
	 * Extend invitation expiration
	 */
	public requestExtendExpiration(newExpiresAt: Date): void {
		if (!this._visa.determineIf((domainPermissions) => domainPermissions.canManageMembers || domainPermissions.isSystemAccount)) {
			throw new Error('Cannot extend invitation expiration');
		}
		if (!this.isActive) {
			throw new Error('Cannot extend inactive invitation');
		}
		this.expiresAt = newExpiresAt;
	}
	//#endregion Actions

	//#region Properties
	get email(): string {
		return this.props.email;
	}

	set email(email: string) {
		if (!this._visa.determineIf((domainPermissions) => domainPermissions.canManageMembers || domainPermissions.isSystemAccount)) {
			throw new Error('Cannot modify invitation email');
		}
		this.props.email = new ValueObjects.InvitationEmail(email).valueOf();
	}

	get message(): string {
		return this.props.message;
	}

	set message(message: string) {
		if (!this._visa.determineIf((domainPermissions) => domainPermissions.canManageMembers || domainPermissions.isSystemAccount)) {
			throw new Error('Cannot modify invitation message');
		}
		this.props.message = new ValueObjects.InvitationMessage(message).valueOf();
	}

	get status(): string {
		return this.props.status;
	}

	private set status(status: string) {
		this.props.status = new ValueObjects.InvitationStatus(status).valueOf();
	}

	get expiresAt(): Date {
		return this.props.expiresAt;
	}

	set expiresAt(expiresAt: Date) {
		if (!this._visa.determineIf((domainPermissions) => domainPermissions.canManageMembers || domainPermissions.isSystemAccount)) {
			throw new Error('Cannot modify invitation expiration');
		}
		this.props.expiresAt = new ValueObjects.InvitationExpiresAt(expiresAt).valueOf();
	}

	get invitedBy(): EndUserEntityReference {
		return this.props.invitedBy;
	}

	get acceptedBy(): EndUserEntityReference | undefined {
		return this.props.acceptedBy;
	}

	get communityId(): string {
		return this.props.communityId;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}
	//#endregion Properties

	//#region Status Helpers
	get isPending(): boolean {
		return new ValueObjects.InvitationStatus(this.status).isPending;
	}

	get isSent(): boolean {
		return new ValueObjects.InvitationStatus(this.status).isSent;
	}

	get isAccepted(): boolean {
		return new ValueObjects.InvitationStatus(this.status).isAccepted;
	}

	get isRejected(): boolean {
		return new ValueObjects.InvitationStatus(this.status).isRejected;
	}

	get isExpired(): boolean {
		return new ValueObjects.InvitationExpiresAt(this.expiresAt).isExpired || new ValueObjects.InvitationStatus(this.status).isExpired;
	}

	get isActive(): boolean {
		return !this.isExpired && (this.isPending || this.isSent);
	}

	get daysUntilExpiration(): number {
		return new ValueObjects.InvitationExpiresAt(this.expiresAt).daysUntilExpiration;
	}
	//#endregion Status Helpers
}
