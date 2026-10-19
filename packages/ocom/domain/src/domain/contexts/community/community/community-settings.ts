import type { RootEventRegistry } from '@cellix/domain-seedwork/aggregate-root';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import type { ValueObjectProps } from '@cellix/domain-seedwork/value-object';
import { ValueObject } from '@cellix/domain-seedwork/value-object';
import { CommunityIpAddressUpdatedEvent, type CommunityIpAddressUpdatedProps } from '../../../events/types/community-ip-address-updated.ts';
import type { CommunityVisa } from '../community.visa.ts';
import * as ValueObjects from './community.value-objects.ts';

export interface CommunitySettingsProps extends ValueObjectProps {
	ipAddress: string | undefined;
	countryCode: string | undefined;
	countryName: string | undefined;
}

export interface CommunitySettingsEntityReference extends Readonly<CommunitySettingsProps> {}

/** Country resolved for {@link CommunitySettings.ipAddress} by a geolocation provider. */
export interface CommunitySettingsGeolocation {
	readonly countryCode?: string | undefined;
	readonly countryName?: string | undefined;
}

export interface CommunityAggregateRoot extends RootEventRegistry {
	readonly id: string;
}

export class CommunitySettings extends ValueObject<CommunitySettingsProps> implements CommunitySettingsEntityReference {
	private readonly visa: CommunityVisa;
	private readonly root: CommunityAggregateRoot;

	constructor(props: CommunitySettingsProps, visa: CommunityVisa, root: CommunityAggregateRoot) {
		super(props);
		this.visa = visa;
		this.root = root;
	}

	get ipAddress(): string | undefined {
		return this.props.ipAddress;
	}
	/**
	 * Sets the community's client IP. A changed IP clears the previous country and raises
	 * {@link CommunityIpAddressUpdatedEvent} so the country is resolved asynchronously.
	 */
	set ipAddress(ipAddress: string) {
		if (!this.visa.determineIf((permissions) => permissions.canManageCommunitySettings || permissions.isSystemAccount)) {
			throw new PermissionError('You do not have permission to update this ipAddress');
		}
		const value = new ValueObjects.IpAddress(ipAddress).valueOf();
		if (value === this.props.ipAddress) {
			return;
		}
		this.props.ipAddress = value;
		this.props.countryCode = undefined;
		this.props.countryName = undefined;
		this.root.addIntegrationEvent<CommunityIpAddressUpdatedProps, CommunityIpAddressUpdatedEvent>(CommunityIpAddressUpdatedEvent, {
			communityId: this.root.id,
			ipAddress: value,
		});
	}

	get countryCode(): string | undefined {
		return this.props.countryCode;
	}
	get countryName(): string | undefined {
		return this.props.countryName;
	}

	/**
	 * Stores the country resolved for the current IP address.
	 * @param geolocation - Provider result; fields the provider omits are stored as `undefined`.
	 * @throws PermissionError unless called with the system passport.
	 */
	public applyGeolocation(geolocation: CommunitySettingsGeolocation): void {
		if (!this.visa.determineIf((permissions) => permissions.isSystemAccount)) {
			throw new PermissionError('You do not have permission to update this geolocation');
		}
		this.props.countryCode = new ValueObjects.CountryCode(geolocation.countryCode).valueOf()?.toUpperCase();
		this.props.countryName = new ValueObjects.CountryName(geolocation.countryName).valueOf();
	}
}
