import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { Passport } from '@ocom/domain';

import { EndUserDomainAdapter } from '../../user/end-user/end-user.domain-adapter.ts';
import type { Community } from '@ocom/data-sources-mongoose-models/community';
import type { EndUser } from '@ocom/data-sources-mongoose-models/user/end-user';

export class CommunityConverter extends MongooseSeedwork.MongoTypeConverter<
	Community,
	CommunityDomainAdapter,
	Passport,
	Community<CommunityDomainAdapter>
> {
	constructor() {
		super(
			CommunityDomainAdapter,
			Community
		);
	}
}

export class CommunityDomainAdapter
	extends MongooseSeedwork.MongooseDomainAdapter<Community>
	implements CommunityProps
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

	get createdBy(): EndUserProps {
		if (!this.doc.createdBy) {
			throw new Error('createdBy is not populated');
		}
		if (this.doc.createdBy instanceof MongooseSeedwork.ObjectId) {
			throw new Error(
				'createdBy is not populated or is not of the correct type',
			);
		}
		return new EndUserDomainAdapter(this.doc.createdBy as EndUser);
	}

    async loadCreatedBy(): Promise<EndUserProps> {
		if (!this.doc.createdBy) {
			throw new Error('createdBy is not populated');
		}
		if (this.doc.createdBy instanceof MongooseSeedwork.ObjectId) {
            await this.doc.populate('createdBy');
		}
		return new EndUserDomainAdapter(this.doc.createdBy as EndUser);
	}

	set createdBy(user: EndUserEntityReference | EndUser<EndUserDomainAdapter>) {
		//check to see if user is derived from MongooseDomainAdapter
		if (user instanceof EndUser) {
            this.doc.set('createdBy', user.props.doc);
            return;
		}

        if (!user?.id) {
            throw new Error('user reference is missing id');
        }

		this.doc.set('createdBy', user);
	}
}
