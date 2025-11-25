import { MongooseSeedwork } from '@cellix/mongoose-seedwork';

import type { Passport } from '@ocom/domain';
import type { PropertyDomainAdapter } from './property.domain-adapter.ts';
import type { Property } from '@ocom/data-sources-mongoose-models/property';

type PropertyModelType = Property;
type PropType = PropertyDomainAdapter;

export class PropertyRepository
	extends MongooseSeedwork.MongoRepositoryBase<
		PropertyModelType,
		PropType,
		Passport,
		Property<PropType>
	>
	implements PropertyRepository<PropType>
{
	// biome-ignore lint:noRequireAwait
	async getNewInstance(
		propertyName: string,
		community: CommunityEntityReference,
	): Promise<Property<PropType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(
			Property.getNewInstance(
				adapter,
				propertyName,
				community,
				this.passport,
			),
		);
	}

	async getById(id: string): Promise<Property<PropType>> {
		const mongoProperty = await this.model.findById(id).exec();
		if (!mongoProperty) {
			throw new Error(`Property with id ${id} not found`);
		}
		return this.typeConverter.toDomain(mongoProperty, this.passport);
	}

	async getAll(): Promise<ReadonlyArray<Property<PropType>>> {
		const mongoProperties = await this.model.find().exec();
		return Promise.all(
			mongoProperties.map((mongoProperty) =>
				this.typeConverter.toDomain(mongoProperty, this.passport),
			),
		);
	}
}