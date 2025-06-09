import { DomainSeedwork } from '@cellix/domain-seedwork';
import { EndUser, type EndUserEntityReference } from '../../user/end-user/end-user.ts';
import * as ValueObjects from './member-account.value-objects.ts';
import type { CommunityVisa } from '../community.visa.ts';
import type { Passport } from '../../passport.ts';

export interface MemberAccountProps extends DomainSeedwork.DomainEntityProps {
  firstName: string;
  lastName: string;
  user: Readonly<EndUserEntityReference>;
  statusCode: string;
  createdBy: Readonly<EndUserEntityReference>;
}

export interface MemberAccountEntityReference extends Readonly<Omit<MemberAccountProps, 'user' |'createdBy' >> {
  get user(): Readonly<EndUserEntityReference>;
  get createdBy(): Readonly<EndUserEntityReference>;
}

export class MemberAccount extends DomainSeedwork.DomainEntity<MemberAccountProps> implements MemberAccountEntityReference {
  //#region Fields
  private readonly visa: CommunityVisa;
  private readonly passport: Passport;
  //#endregion Fields

  //#region Constructors
  constructor(props: MemberAccountProps, passport: Passport, visa: CommunityVisa) {
    super(props);
    this.passport = passport;
    this.visa = visa;
  }
  //#endregion Constructors

  //#region Methods
  private validateVisa() {
    if (
      !this.visa.determineIf(
        (domainPermissions) => 
          domainPermissions.isSystemAccount || 
          domainPermissions.canManageMembers || 
          (
            domainPermissions.canEditOwnMemberAccounts && 
            domainPermissions.isEditingOwnMemberAccount
          )
      )
    ) {
      throw new DomainSeedwork.PermissionError('You do not have permission to update this account');
    }
  }
  //#endregion Methods

  //#region Properties
  get firstName(): string {
    return this.props.firstName;
  }
  set firstName(firstName: string) {
    this.validateVisa();
    this.props.firstName = new ValueObjects.FirstName(firstName).valueOf();
  }

  get lastName(): string {
    return this.props.lastName;
  }
  set lastName(lastName: string) {
    this.validateVisa();
    this.props.lastName = new ValueObjects.LastName(lastName).valueOf();
  }

  get user(): Readonly<EndUserEntityReference> {
    return new EndUser(this.props.user, this.passport);
  }
  set user(user: Readonly<EndUserEntityReference>) {
    this.validateVisa();
    this.props.user = user;
  }

  get statusCode(): string {
    return this.props.statusCode;
  }
  set statusCode(statusCode: string) {
    if (!this.visa.determineIf((domainPermissions) => domainPermissions.isSystemAccount || domainPermissions.canManageMembers)) {
      throw new DomainSeedwork.PermissionError('You do not have permission to update this account');
    }
    this.props.statusCode = new ValueObjects.AccountStatusCode(statusCode).valueOf();
  }

  get createdBy(): Readonly<EndUserEntityReference> {
    return new EndUser(this.props.createdBy, this.passport);
  }
  set createdBy(createdBy: Readonly<EndUserEntityReference>) {
    this.validateVisa();
    this.props.createdBy = createdBy;
  }
  // #endregion Properties

}