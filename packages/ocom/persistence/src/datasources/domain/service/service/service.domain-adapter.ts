import * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import { Domain } from '@ocom/domain';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { CommunityDomainAdapter } from '../../community/community/community.domain-adapter.ts';

export class ServiceConverter extends MongooseSeedwork.MongoTypeConverter<
	Models.Service.Service,
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
	extends MongooseSeedwork.MongooseDomainAdapter<Models.Service.Service>
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
		return new CommunityDomainAdapter(this.doc.community as Models.Community.Community);
	}

    async loadCommunity(): Promise<Domain.Contexts.Community.Community.CommunityProps> {
		if (!this.doc.community) {
			throw new Error('community is not populated');
		}
		if (this.doc.community instanceof MongooseSeedwork.ObjectId) {
            await this.doc.populate('community');
		}
		return new CommunityDomainAdapter(this.doc.community as Models.Community.Community);
	}

	setCommunityRef(community: Domain.Contexts.Community.Community.CommunityEntityReference) {
		if (!community?.id) {
			throw new Error('community reference is missing id');
		}
		this.doc.set('community', new MongooseSeedwork.ObjectId(community.id));
	}
}