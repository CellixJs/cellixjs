import { Domain } from '@ocom/api-domain';
import type { Models } from '@ocom/api-data-sources-mongoose-models';
import { MongooseSeedwork } from '@cellix/data-sources-mongoose';
import { EndUserDomainAdapter } from '../../user/end-user/end-user.domain-adapter.ts';

export class CommunityConverter extends MongooseSeedwork.MongoTypeConverter<
	Models.Community.Community,
	CommunityDomainAdapter,
	Domain.Passport,
	Domain.Contexts.Community.Community.Community<CommunityDomainAdapter>
> {
	constructor() {
		super(
			CommunityDomainAdapter,
			Domain.Contexts.Community.Community.Community,
		);
	}
}

export class CommunityDomainAdapter
	extends MongooseSeedwork.MongooseDomainAdapter<Models.Community.Community>
	implements Domain.Contexts.Community.Community.CommunityProps
{
	get name() {
		return this.doc.name;
	}
	set name(name) {
		this.doc.name = name;
	}

	get domain() {
		return this.doc.domain;
	}
	set domain(domain) {
		this.doc.domain = domain;
	}

	get whiteLabelDomain() {
		return this.doc.whiteLabelDomain;
	}
	set whiteLabelDomain(whiteLabelDomain: string) {
		this.doc.whiteLabelDomain = whiteLabelDomain;
	}

	get handle() {
		return this.doc.handle;
	}
	set handle(handle) {
		this.doc.handle = handle;
	}

	get createdBy(): Domain.Contexts.User.EndUser.EndUserProps {
		if (!this.doc.createdBy) {
			throw new Error('createdBy is not populated');
		}
		if (this.doc.createdBy instanceof MongooseSeedwork.ObjectId) {
			throw new Error(
				'createdBy is not populated or is not of the correct type',
			);
		}
		return new EndUserDomainAdapter(this.doc.createdBy as Models.User.EndUser);
	}

	set createdBy(user: Domain.Contexts.User.EndUser.EndUserEntityReference | EndUserDomainAdapter) {
		//check to see if user is derived from MongooseDomainAdapter
		if (user instanceof EndUserDomainAdapter) {
            this.doc.set('createdBy', user.doc);
            return;
		}

        if (!user?.id) {
            throw new Error('user reference is missing id');
        }

		this.doc.set('createdBy', new MongooseSeedwork.ObjectId(user.id));
	}
}
