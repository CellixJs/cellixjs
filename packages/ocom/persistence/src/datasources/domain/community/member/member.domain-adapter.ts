
import type { PropArray } from '@cellix/domain-seedwork/prop-array';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';

import { Domain } from '@ocom/domain';
import { EndUserDomainAdapter } from '../../user/end-user/end-user.domain-adapter.ts';
import { CommunityDomainAdapter } from '../community/community.domain-adapter.ts';
import { EndUserRoleDomainAdapter } from '../role/end-user-role/end-user-role.domain-adapter.ts';
import type { Community } from '@ocom/data-sources-mongoose-models/community';
import type { Member, MemberAccount, MemberCustomView, MemberProfile } from '@ocom/data-sources-mongoose-models/member';
import type { EndUserRole } from '@ocom/data-sources-mongoose-models/role/end-user-role';
import type { EndUser } from '@ocom/data-sources-mongoose-models/user/end-user';

export class MemberConverter extends MongooseSeedwork.MongoTypeConverter<
	Member,
	MemberDomainAdapter,
	Domain.Passport,
	Domain.Contexts.Community.Member.Member<MemberDomainAdapter>
> {
	constructor() {
		super(
			MemberDomainAdapter,
			Domain.Contexts.Community.Member.Member<MemberDomainAdapter>
		);
	}
}

export class MemberDomainAdapter extends MongooseSeedwork.MongooseDomainAdapter<Member> implements Domain.Contexts.Community.Member.MemberProps {
  get memberName() {
    return this.doc.memberName;
  }
  set memberName(memberName) {
    this.doc.memberName = memberName;
  }

  get cybersourceCustomerId() {
    return this.doc.cybersourceCustomerId;
  }

  set cybersourceCustomerId(cybersourceCustomerId) {
    this.doc.cybersourceCustomerId = cybersourceCustomerId;
  }

    /**
   * Exposes the community foreign key as a string regardless of populated state.
   * Use this in GraphQL field resolvers (Option 1) to fetch the Community via DataLoader/repo.
   */
  get communityId(): string {
    const c = this.doc.community;
    if (!c) {
      throw new Error('community is not set');
    }
    if (c instanceof MongooseSeedwork.ObjectId) {
      return c.toString();
    }
    // populated doc case
    // biome-ignore lint/plugin/no-type-assertion: test file
    return (c as Community).id.toString();
  }

  get community(): Domain.Contexts.Community.Community.CommunityProps {
    if (!this.doc.community) {
      throw new Error('community is not populated');
    }
    if (this.doc.community instanceof MongooseSeedwork.ObjectId) {
        throw new Error('community is not populated or is not of the correct type');
    }
    // biome-ignore lint/plugin/no-type-assertion: test file
    return new CommunityDomainAdapter(this.doc.community as Community);
  }
  async loadCommunity(): Promise<Domain.Contexts.Community.Community.CommunityProps> {
    if (!this.doc.community) {
      throw new Error('community is not populated');
    }
    if (this.doc.community instanceof MongooseSeedwork.ObjectId) {
      await this.doc.populate('community');
    }
    // biome-ignore lint/plugin/no-type-assertion: test file
    return new CommunityDomainAdapter(this.doc.community as Community);
  }
  set community(community: Domain.Contexts.Community.Community.CommunityEntityReference | Domain.Contexts.Community.Community.Community<CommunityDomainAdapter>) {
    //check to see if community is derived from MongooseDomainAdapter
    if (community instanceof Domain.Contexts.Community.Community.Community) {
      this.doc.set('community', community.props.doc);
      return;
    }

    if (!community?.id) {
      throw new Error('community reference is missing id');
    }

    this.doc.set('community', community);
  }

  get accounts(): PropArray<Domain.Contexts.Community.Member.MemberAccountEntityReference> {
    return new MongooseSeedwork.MongoosePropArray(this.doc.accounts, MemberAccountDomainAdapter);
  }

  get role(): Domain.Contexts.Community.Role.EndUserRole.EndUserRoleProps {
    if (!this.doc.role) {
      throw new Error('role is not populated');
    }
    if (this.doc.role instanceof MongooseSeedwork.ObjectId) {
      throw new Error('role is not populated or is not of the correct type');
    }
    // biome-ignore lint/plugin/no-type-assertion: test file
    return new EndUserRoleDomainAdapter(this.doc.role as EndUserRole);
  }
  async loadRole(): Promise<Domain.Contexts.Community.Role.EndUserRole.EndUserRoleProps> {
    if (!this.doc.role) {
      throw new Error('role is not populated');
    }
    if (this.doc.role instanceof MongooseSeedwork.ObjectId) {
      await this.doc.populate('role');
    }
    // biome-ignore lint/plugin/no-type-assertion: test file
    return new EndUserRoleDomainAdapter(this.doc.role as EndUserRole);
  }
  set role(role: Domain.Contexts.Community.Role.EndUserRole.EndUserRoleEntityReference | Domain.Contexts.Community.Role.EndUserRole.EndUserRole<EndUserRoleDomainAdapter>) {
    if (role instanceof Domain.Contexts.Community.Role.EndUserRole.EndUserRole) {
        this.doc.set('role', role.props.doc);
        return;
    }
    if (!role?.id) {
        throw new Error('role reference is missing id');
    }
    this.doc.set('role', role);
  }

  get profile() {
    if (!this.doc.profile) {
      this.doc.set('profile', {});
    } //embedded - ensure it exists
    return new MemberProfileDomainAdapter(this.doc.profile);
  }

  get customViews(): PropArray<Domain.Contexts.Community.Member.MemberCustomViewEntityReference> {
    return new MongooseSeedwork.MongoosePropArray(this.doc.customViews, MemberCustomViewDomainAdapter);
  }
}

export class MemberAccountDomainAdapter implements Domain.Contexts.Community.Member.MemberAccountProps {
  public readonly doc: MemberAccount;
  constructor(doc: MemberAccount) {
    this.doc = doc;
  }
  public get id(): string {
    // biome-ignore lint/plugin/no-type-assertion: test file
    return this.doc.id?.valueOf() as string;
  }

  get firstName() {
    return this.doc.firstName;
  }
  set firstName(firstName) {
    this.doc.firstName = firstName;
  }

  get lastName() {
    // biome-ignore lint/plugin/no-type-assertion: test file
    return this.doc.lastName as string;
  }
  set lastName(lastName) {
    this.doc.lastName = lastName;
  }

  get user(): Domain.Contexts.User.EndUser.EndUserProps {
    if (!this.doc.user) {
        throw new Error('User is not populated');
    }
    if (this.doc.user instanceof MongooseSeedwork.ObjectId) {
      throw new Error('User is not populated or is not of the correct type');
    }
    // biome-ignore lint/plugin/no-type-assertion: test file
    return new EndUserDomainAdapter(this.doc.user as EndUser);
  }

  set user(user: Domain.Contexts.User.EndUser.EndUserEntityReference | Domain.Contexts.User.EndUser.EndUser<EndUserDomainAdapter>) {
    if (user instanceof Domain.Contexts.User.EndUser.EndUser) {
      this.doc.set('user', user.props.doc);
      return;
    }

    if (!user?.id) {
      throw new Error('user reference is missing id');
    }

    this.doc.set('user', new MongooseSeedwork.ObjectId(user.id));
  }

  get statusCode() {
    return this.doc.statusCode;
  }
  set statusCode(statusCode) {
    this.doc.statusCode = statusCode;
  }

  get createdBy(): Domain.Contexts.User.EndUser.EndUserProps {
    if (!this.doc.createdBy) {
      throw new Error('createdBy is not populated');
    }
    if (this.doc.createdBy instanceof MongooseSeedwork.ObjectId) {
      throw new Error('createdBy is not populated or is not of the correct type');
    }
    // biome-ignore lint/plugin/no-type-assertion: test file
    return new EndUserDomainAdapter(this.doc.createdBy as EndUser);
  }
  set createdBy(createdBy: Domain.Contexts.User.EndUser.EndUserEntityReference | Domain.Contexts.User.EndUser.EndUser<EndUserDomainAdapter>) {
    if (createdBy instanceof Domain.Contexts.User.EndUser.EndUser) {
      this.doc.set('createdBy', createdBy.props.doc);
      return;
    }

    if (!createdBy?.id) {
      throw new Error('createdBy reference is missing id');
    }

    this.doc.set('createdBy', new MongooseSeedwork.ObjectId(createdBy.id));
  }
}

export class MemberCustomViewDomainAdapter implements Domain.Contexts.Community.Member.MemberCustomViewProps {
  public readonly doc: MemberCustomView;
  constructor(doc: MemberCustomView) {
    this.doc = doc;
  }
  public get id(): string {
    // biome-ignore lint/plugin/no-type-assertion: test file
    return this.doc.id?.valueOf() as string;
  }

  get name() {
    return this.doc.name;
  }
  set name(name) {
    this.doc.name = name;
  }

  get type() {
    return this.doc.type;
  }
  set type(type) {
    this.doc.type = type;
  }

  get filters() {
    return this.doc.filters;
  }
  set filters(filters) {
    this.doc.filters = filters;
  }

  get sortOrder() {
    return this.doc.sortOrder;
  }
  set sortOrder(sortOrder) {
    this.doc.sortOrder = sortOrder;
  }

  get columnsToDisplay() {
    return this.doc.columnsToDisplay;
  }
  set columnsToDisplay(columnsToDisplay) {
    this.doc.columnsToDisplay = columnsToDisplay;
  }
}

export class MemberProfileDomainAdapter implements Domain.Contexts.Community.Member.MemberProfileProps {
  public readonly props: MemberProfile;
  constructor(props: MemberProfile) {
    this.props = props;
  }

  get name() {
    return this.props.name;
  }
  set name(name) {
    this.props.name = name;
  }

  get email() {
    return this.props.email;
  }
  set email(email) {
    this.props.email = email;
  }

  get bio() {
    return this.props.bio;
  }
  set bio(bio) {
    this.props.bio = bio;
  }

  get avatarDocumentId() {
    return this.props.avatarDocumentId;
  }
  set avatarDocumentId(avatarDocumentId) {
    this.props.avatarDocumentId = avatarDocumentId;
  }

  get interests() {
    return this.props.interests;
  }
  set interests(interests) {
    this.props.interests = interests;
  }

  get showInterests() {
    return this.props.showInterests;
  }
  set showInterests(showInterests) {
    this.props.showInterests = showInterests;
  }

  get showEmail() {
    return this.props.showEmail;
  }
  set showEmail(showEmail) {
    this.props.showEmail = showEmail;
  }

  get showProfile() {
    return this.props.showProfile;
  }
  set showProfile(showProfile) {
    this.props.showProfile = showProfile;
  }

  get showLocation() {
    return this.props.showLocation;
  }
  set showLocation(showLocation) {
    this.props.showLocation = showLocation;
  }

  get showProperties() {
    return this.props.showProperties;
  }
  set showProperties(showProperties) {
    this.props.showProperties = showProperties;
  }
}
