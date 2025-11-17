
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { DomainSeedwork } from '@cellix/domain-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { EndUserDomainAdapter } from '../../user/end-user/end-user.domain-adapter.ts';
import { CommunityDomainAdapter } from '../community/community.domain-adapter.ts';
import { EndUserRoleDomainAdapter } from '../role/end-user-role/end-user-role.domain-adapter.ts';
import type * as Community from '@ocom/domain/contexts/community';
import type * as Member from '@ocom/domain/contexts/member';
import type * as EndUserRole from '@ocom/domain/contexts/end-user-role';
import type * as EndUser from '@ocom/domain/contexts/end-user';
import type { Passport } from '@ocom/domain/contexts/passport';

export class MemberConverter extends MongooseSeedwork.MongoTypeConverter<
	Models.Member.Member,
	MemberDomainAdapter,
	Passport,
	Member.Member<MemberDomainAdapter>
> {
	constructor() {
		super(
			MemberDomainAdapter,
			Member.Member<MemberDomainAdapter>
		);
	}
}

export class MemberDomainAdapter extends MongooseSeedwork.MongooseDomainAdapter<Models.Member.Member> implements Member.MemberProps {
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
    return (c as Models.Community.Community).id.toString();
  }

  get community(): Community.CommunityProps {
    if (!this.doc.community) {
      throw new Error('community is not populated');
    }
    if (this.doc.community instanceof MongooseSeedwork.ObjectId) {
        throw new Error('community is not populated or is not of the correct type');
    }
    return new CommunityDomainAdapter(this.doc.community as Models.Community.Community);
  }
  async loadCommunity(): Promise<Community.CommunityProps> {
    if (!this.doc.community) {
      throw new Error('community is not populated');
    }
    if (this.doc.community instanceof MongooseSeedwork.ObjectId) {
      await this.doc.populate('community');
    }
    return new CommunityDomainAdapter(this.doc.community as Models.Community.Community);
  }
  set community(community: Community.CommunityEntityReference | Community.Community<CommunityDomainAdapter>) {
    //check to see if community is derived from MongooseDomainAdapter
    if (community instanceof Community.Community) {
      this.doc.set('community', community.props.doc);
      return;
    }

    if (!community?.id) {
      throw new Error('community reference is missing id');
    }

    this.doc.set('community', community);
  }

  get accounts(): DomainSeedwork.PropArray<Member.MemberAccountEntityReference> {
    return new MongooseSeedwork.MongoosePropArray(this.doc.accounts, MemberAccountDomainAdapter);
  }

  get role(): EndUserRole.EndUserRoleProps {
    if (!this.doc.role) {
      throw new Error('role is not populated');
    }
    if (this.doc.role instanceof MongooseSeedwork.ObjectId) {
      throw new Error('role is not populated or is not of the correct type');
    }
    return new EndUserRoleDomainAdapter(this.doc.role as Models.Role.EndUserRole);
  }
  async loadRole(): Promise<EndUserRole.EndUserRoleProps> {
    if (!this.doc.role) {
      throw new Error('role is not populated');
    }
    if (this.doc.role instanceof MongooseSeedwork.ObjectId) {
      await this.doc.populate('role');
    }
    return new EndUserRoleDomainAdapter(this.doc.role as Models.Role.EndUserRole);
  }
  set role(role: EndUserRole.EndUserRoleEntityReference | EndUserRole.EndUserRole<EndUserRoleDomainAdapter>) {
    if (role instanceof EndUserRole.EndUserRole) {
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

  get customViews(): DomainSeedwork.PropArray<Member.MemberCustomViewEntityReference> {
    return new MongooseSeedwork.MongoosePropArray(this.doc.customViews, MemberCustomViewDomainAdapter);
  }
}

export class MemberAccountDomainAdapter implements Member.MemberAccountProps {
  public readonly doc: Models.Member.MemberAccount;
  constructor(doc: Models.Member.MemberAccount) {
    this.doc = doc;
  }
  public get id(): string {
    return this.doc.id?.valueOf() as string;
  }

  get firstName() {
    return this.doc.firstName;
  }
  set firstName(firstName) {
    this.doc.firstName = firstName;
  }

  get lastName() {
    return this.doc.lastName as string;
  }
  set lastName(lastName) {
    this.doc.lastName = lastName;
  }

  get user(): EndUser.EndUserProps {
    if (!this.doc.user) {
        throw new Error('User is not populated');
    }
    if (this.doc.user instanceof MongooseSeedwork.ObjectId) {
      throw new Error('User is not populated or is not of the correct type');
    }
    return new EndUserDomainAdapter(this.doc.user as Models.User.EndUser);
  }

  set user(user: EndUser.EndUserEntityReference | EndUser.EndUser<EndUserDomainAdapter>) {
    if (user instanceof EndUser.EndUser) {
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

  get createdBy(): EndUser.EndUserProps {
    if (!this.doc.createdBy) {
      throw new Error('createdBy is not populated');
    }
    if (this.doc.createdBy instanceof MongooseSeedwork.ObjectId) {
      throw new Error('createdBy is not populated or is not of the correct type');
    }
    return new EndUserDomainAdapter(this.doc.createdBy as Models.User.EndUser);
  }
  set createdBy(createdBy: EndUser.EndUserEntityReference | EndUser.EndUser<EndUserDomainAdapter>) {
    if (createdBy instanceof EndUser.EndUser) {
      this.doc.set('createdBy', createdBy.props.doc);
      return;
    }

    if (!createdBy?.id) {
      throw new Error('createdBy reference is missing id');
    }

    this.doc.set('createdBy', new MongooseSeedwork.ObjectId(createdBy.id));
  }
}

export class MemberCustomViewDomainAdapter implements Member.MemberCustomViewProps {
  public readonly doc: Models.Member.MemberCustomView;
  constructor(doc: Models.Member.MemberCustomView) {
    this.doc = doc;
  }
  public get id(): string {
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

export class MemberProfileDomainAdapter implements Member.MemberProfileProps {
  public readonly props: Models.Member.MemberProfile;
  constructor(props: Models.Member.MemberProfile) {
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
