import { AggregateRoot, type RootEventRegistry } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import type { CommunityVisa } from '../community.visa.ts';
import type { Passport } from '../../passport.ts';
import type { EndUserEntityReference } from '../../user/end-user/end-user.ts';
import * as ValueObjects from './member-invitation.value-objects.ts';

export interface MemberInvitationProps extends DomainEntityProps {
	email: string;
	message: string;
	status: string;
	expiresAt: Date;
	invitedBy: Readonly<EndUserEntityReference>;
	acceptedBy: Readonly<EndUserEntityReference> | undefined;
	communityId: string;

	readonly createdAt: Date;
	readonly updatedAt: Date;
}

export interface MemberInvitationEntityReference extends Readonly<Omit<MemberInvitationProps, 'invitedBy' | 'acceptedBy'>> {
	readonly invitedBy: EndUserEntityReference;
	readonly acceptedBy: EndUserEntityReference | undefined;
}

export class MemberInvitation<props extends MemberInvitationProps> extends AggregateRoot<props, Passport> implements MemberInvitationEntityReference, RootEventRegistry {
	private _visa!: CommunityVisa;
	private _isNew: boolean = false;

	constructor(props: props, passport: Passport) {
		super(props, passport);
		this._visa = passport.community.forCommunity({ id: props.communityId } as Parameters<typeof passport.community.forCommunity>[0]);
	}

	public static getNewInstance<props extends MemberInvitationProps>(
		newProps: props,
		passport: Passport,
		communityId: string,
		email: string,
		message: string,
		expiresAt: Date,
		invitedBy: EndUserEntityReference,
	): MemberInvitation<props> {
		const visa = passport.community.forCommunity({ id: communityId } as Parameters<typeof passport.community.forCommunity>[0]);
		if (!visa.determineIf((p) => p.canManageMembers || p.isSystemAccount)) {
			throw new PermissionError('Cannot create member invitation');
		}
		const instance = new MemberInvitation(newProps, passport);
		instance._isNew = true;
		instance.email = email;
		instance.message = message;
		instance.expiresAt = expiresAt;
		instance.props.invitedBy = invitedBy;
		instance.props.communityId = communityId;
		instance.props.status = new ValueObjects.InvitationStatus('PENDING').valueOf();
		instance._isNew = false;
		return instance;
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
		if (!this._isNew && !this._visa.determineIf((domainPermissions) => domainPermissions.canManageMembers || domainPermissions.isSystemAccount)) {
			throw new Error('Cannot modify invitation email');
		}
		this.props.email = new ValueObjects.InvitationEmail(email).valueOf();
	}

	get message(): string {
		return this.props.message;
	}

	set message(message: string) {
		if (!this._isNew && !this._visa.determineIf((domainPermissions) => domainPermissions.canManageMembers || domainPermissions.isSystemAccount)) {
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
		if (!this._isNew && !this._visa.determineIf((domainPermissions) => domainPermissions.canManageMembers || domainPermissions.isSystemAccount)) {
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
		return this.props.expiresAt <= new Date() || new ValueObjects.InvitationStatus(this.status).isExpired;
	}

	get isActive(): boolean {
		return !this.isExpired && (this.isPending || this.isSent);
	}

	get daysUntilExpiration(): number {
		const now = new Date();
		const diffTime = this.props.expiresAt.getTime() - now.getTime();
		return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	}
	//#endregion Status Helpers
}
