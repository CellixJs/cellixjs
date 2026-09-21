import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import type { ValueObjectProps } from '@cellix/domain-seedwork/value-object';
import { ValueObject } from '@cellix/domain-seedwork/value-object';
import type { CommunityVisa } from '../community.visa.ts';
import * as ValueObjects from './community-config.value-objects.ts';

export interface CommunityConfigLimitsProps extends ValueObjectProps {
	maxMembers: number;
	maxAdmins: number;
}

export interface CommunityConfigLimitsEntityReference extends Readonly<CommunityConfigLimitsProps> {}

export class CommunityConfigLimits extends ValueObject<CommunityConfigLimitsProps> implements CommunityConfigLimitsEntityReference {
	private readonly visa: CommunityVisa;
	private readonly isNew: boolean;

	constructor(props: CommunityConfigLimitsProps, visa: CommunityVisa, isNew = false) {
		super(props);
		this.visa = visa;
		this.isNew = isNew;
	}

	private validateVisa(): void {
		if (!this.isNew && !this.visa.determineIf((domainPermissions) => domainPermissions.isSystemAccount)) {
			throw new PermissionError('You do not have permission to change community configuration');
		}
	}

	get maxMembers(): number {
		return this.props.maxMembers;
	}
	set maxMembers(maxMembers: number) {
		this.validateVisa();
		this.props.maxMembers = new ValueObjects.MaxMembers(maxMembers).valueOf();
	}

	get maxAdmins(): number {
		return this.props.maxAdmins;
	}
	set maxAdmins(maxAdmins: number) {
		this.validateVisa();
		this.props.maxAdmins = new ValueObjects.MaxAdmins(maxAdmins).valueOf();
	}
}
