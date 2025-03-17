import { Domain } from 'api-domain';
import { Models } from 'api-data-sources-mongoose-models';
import { MongooseSeedwork } from 'api-data-sources-mongoose-seedwork';

export class EndUserConverter 
  extends MongooseSeedwork.MongoTypeConverter<
    Models.User.EndUser, 
    EndUserDomainAdapter,
    Domain.Contexts.User.EndUser.EndUser<EndUserDomainAdapter>,
    Domain.DomainExecutionContext
  > 
{
  constructor() {
    super(EndUserDomainAdapter, Domain.Contexts.User.EndUser.EndUser<EndUserDomainAdapter>);
  }
}

export class EndUserDomainAdapter extends MongooseSeedwork.MongooseDomainAdapter<Models.User.EndUser> implements Domain.Contexts.User.EndUser.EndUserProps {


  get externalId() {
    return this.doc.externalId;
  }
  set externalId(externalId) {
    this.doc.externalId = externalId;
  }

  get personalInformation() {
    if (!this.doc.personalInformation) {
      this.doc.set('personalInformation', {});
    }
    return new EndUserPersonalInformationDomainAdapter(this.doc.personalInformation);
  }

  get email() {
    return this.doc.email;
  }
  set email(email) {
    this.doc.email = email;
  }

  get displayName() {
    return this.doc.displayName;
  }
  set displayName(displayName) {
    this.doc.displayName = displayName;
  }

  get accessBlocked() {
    return this.doc.accessBlocked;
  }
  set accessBlocked(accessBlocked) {
    this.doc.accessBlocked = accessBlocked;
  }

  get tags() {
    return this.doc.tags;
  }
  set tags(tags) {
    this.doc.tags = tags;
  }
}

export class EndUserPersonalInformationDomainAdapter implements Domain.Contexts.User.EndUser.EndUserPersonalInformationProps {
    constructor(public readonly props: Models.User.EndUserPersonalInformation) {}

    get identityDetails() {
      if (!this.props.identityDetails) {
        this.props.set('identityDetails', {});
      }
      return new EndUserIdentityDetailsDomainAdapter(this.props.identityDetails);
    }

    get contactInformation() {
      if (!this.props.contactInformation) {
        this.props.set('contactInformation', {});
      }
      return new EndUserContactInformationDomainAdapter(this.props.contactInformation);
    }
}

export class EndUserIdentityDetailsDomainAdapter implements Domain.Contexts.User.EndUser.EndUserIdentityDetailsProps {
    constructor(public readonly props: Models.User.EndUserIdentityDetails) {}

    get lastName() {
      return this.props.lastName;
    }
    set lastName(lastName: string) {
      this.props.lastName = lastName;
    }

    get legalNameConsistsOfOneName() {
        return this.props.legalNameConsistsOfOneName;
    }
    set legalNameConsistsOfOneName(legalNameConsistsOfOneName: boolean) {
        this.props.legalNameConsistsOfOneName = legalNameConsistsOfOneName;
    }

    get restOfName() {
        return this.props.restOfName;
    }
    set restOfName(restOfName: string) {
        this.props.restOfName = restOfName;
    }
}

export class EndUserContactInformationDomainAdapter implements Domain.Contexts.User.EndUser.EndUserContactInformationProps {
    constructor(public readonly props: Models.User.EndUserContactInformation) {}

    get email() {
        return this.props.email;
    }
    set email(email: string) {
        this.props.email = email;
    }
}