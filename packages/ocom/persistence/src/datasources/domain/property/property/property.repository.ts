import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { PropertyDomainAdapter } from './property.domain-adapter.ts';
import type * as Community from '@ocom/domain/contexts/community';
import type * as Property from '@ocom/domain/contexts/property';
import type { Passport } from '@ocom/domain/contexts/passport';
// Runtime import for class constructor
import { Property as PropertyClass } from '@ocom/domain/contexts/property';

type PropertyModelType = Models.Property.Property;
type PropType = PropertyDomainAdapter;

export class PropertyRepository
	extends MongooseSeedwork.MongoRepositoryBase<
		PropertyModelType,
		PropType,
		Passport,
		Property.Property<PropType>
	>
	implements Property.PropertyRepository<PropType>
{
	// biome-ignore lint:noRequireAwait
	async getNewInstance(
		propertyName: string,
		community: Community.CommunityEntityReference,
	): Promise<Property.Property<PropType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(
			PropertyClass.getNewInstance(
				adapter,
				propertyName,
				community,
				this.passport,
			),
		);
	}

	async getById(id: string): Promise<Property.Property<PropType>> {
		const mongoProperty = await this.model.findById(id).exec();
		if (!mongoProperty) {
			throw new Error(`Property with id ${id} not found`);
		}
		return this.typeConverter.toDomain(mongoProperty, this.passport);
	}

	async getAll(): Promise<ReadonlyArray<Property.Property<PropType>>> {
		const mongoProperties = await this.model.find().exec();
		return Promise.all(
			mongoProperties.map((mongoProperty) =>
				this.typeConverter.toDomain(mongoProperty, this.passport),
			),
		);
	}
}