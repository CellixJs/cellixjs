import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { CommunityDomainAdapter } from '../../community/community/community.domain-adapter.ts';
import type * as Community from '@ocom/domain/contexts/community';
import type * as Service from '@ocom/domain/contexts/service';
import type { Passport } from '@ocom/domain/contexts/passport';

export class ServiceConverter extends MongooseSeedwork.MongoTypeConverter<
	Models.Service.Service,
	ServiceDomainAdapter,
	Passport,
	Service.Service<ServiceDomainAdapter>
> {
	constructor() {
		super(
			ServiceDomainAdapter,
			Service.Service
		);
	}
}

export class ServiceDomainAdapter
	extends MongooseSeedwork.MongooseDomainAdapter<Models.Service.Service>
	implements Service.ServiceProps
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

	get community(): Community.CommunityProps {
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

    async loadCommunity(): Promise<Community.CommunityProps> {
		if (!this.doc.community) {
			throw new Error('community is not populated');
		}
		if (this.doc.community instanceof MongooseSeedwork.ObjectId) {
            await this.doc.populate('community');
		}
		return new CommunityDomainAdapter(this.doc.community as Models.Community.Community);
	}

	setCommunityRef(community: Community.CommunityEntityReference) {
		if (!community?.id) {
			throw new Error('community reference is missing id');
		}
		this.doc.set('community', new MongooseSeedwork.ObjectId(community.id));
	}
}