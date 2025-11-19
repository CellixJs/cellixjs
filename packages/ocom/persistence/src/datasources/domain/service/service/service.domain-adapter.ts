import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { CommunityDomainAdapter } from '../../community/community/community.domain-adapter.ts';
import type { Community, CommunityEntityReference, CommunityProps } from '@ocom/domain/contexts/community';
import type { Service, ServiceProps } from '@ocom/domain/contexts/service';
import type { Passport } from '@ocom/domain/contexts/passport';
// Runtime import for class constructor
import { Service as ServiceClass } from '@ocom/domain/contexts/service';

export class ServiceConverter extends MongooseSeedwork.MongoTypeConverter<
	Models.Service,
	ServiceDomainAdapter,
	Passport,
	Service<ServiceDomainAdapter>
> {
	constructor() {
		super(
			ServiceDomainAdapter,
			ServiceClass
		);
	}
}

export class ServiceDomainAdapter
	extends MongooseSeedwork.MongooseDomainAdapter<Models.Service>
	implements ServiceProps
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

	get community(): CommunityProps {
		if (!this.doc.community) {
			throw new Error('community is not populated');
		}
		if (this.doc.community instanceof MongooseSeedwork.ObjectId) {
			throw new Error(
				'community is not populated or is not of the correct type',
			);
		}
		return new CommunityDomainAdapter(this.doc.community as Models.Community);
	}

    async loadCommunity(): Promise<CommunityProps> {
		if (!this.doc.community) {
			throw new Error('community is not populated');
		}
		if (this.doc.community instanceof MongooseSeedwork.ObjectId) {
            await this.doc.populate('community');
		}
		return new CommunityDomainAdapter(this.doc.community as Models.Community);
	}

	setCommunityRef(community: CommunityEntityReference) {
		if (!community?.id) {
			throw new Error('community reference is missing id');
		}
		this.doc.set('community', new MongooseSeedwork.ObjectId(community.id));
	}
}