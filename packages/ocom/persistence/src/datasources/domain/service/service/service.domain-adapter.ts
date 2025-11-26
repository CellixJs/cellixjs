import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { Domain } from '@ocom/domain';

import { CommunityDomainAdapter } from '../../community/community/community.domain-adapter.ts';
import type { Community } from '@ocom/data-sources-mongoose-models/community';
import type { Service } from '@ocom/data-sources-mongoose-models/service';

export class ServiceConverter extends MongooseSeedwork.MongoTypeConverter<
	Service,
	ServiceDomainAdapter,
	Domain.Passport,
	Domain.Contexts.Service.Service.Service<ServiceDomainAdapter>
> {
	constructor() {
		super(
			ServiceDomainAdapter,
			Domain.Contexts.Service.Service.Service
		);
	}
}

export class ServiceDomainAdapter
	extends MongooseSeedwork.MongooseDomainAdapter<Service>
	implements Domain.Contexts.Service.Service.ServiceProps
{
	get serviceName() {
		return this.doc.serviceName;
	}
	set serviceName(serviceName: string) {
		this.doc.serviceName = serviceName;
	}

	get description() {
		return this.doc.description;
	}
	set description(description: string) {
		this.doc.description = description;
	}

	get isActive() {
		return this.doc.isActive;
	}
	set isActive(isActive: boolean) {
		this.doc.isActive = isActive;
	}

	get community(): Domain.Contexts.Community.Community.CommunityProps {
		if (!this.doc.community) {
			throw new Error('community is not populated');
		}
		if (this.doc.community instanceof MongooseSeedwork.ObjectId) {
			throw new Error(
				'community is not populated or is not of the correct type',
			);
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

	setCommunityRef(community: Domain.Contexts.Community.Community.CommunityEntityReference) {
		if (!community?.id) {
			throw new Error('community reference is missing id');
		}
		this.doc.set('community', new MongooseSeedwork.ObjectId(community.id));
	}
}