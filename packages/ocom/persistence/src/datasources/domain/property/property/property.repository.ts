import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { Domain } from '@ocom/domain';
import type { PropertyDomainAdapter } from './property.domain-adapter.ts';

type PropertyModelType = Models.Property.Property;
type PropType = PropertyDomainAdapter;

export class PropertyRepository
	extends MongooseSeedwork.MongoRepositoryBase<
		PropertyModelType,
		PropType,
		Domain.Passport,
		Domain.Property.Property<PropType>
	>
	implements Domain.Property.PropertyRepository<PropType>
{
	// biome-ignore lint:noRequireAwait
	async getNewInstance(
		propertyName: string,
		community: Domain.Community.CommunityEntityReference,
	): Promise<Domain.Property.Property<PropType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(
			Domain.Property.Property.getNewInstance(
				adapter,
				propertyName,
				community,
				this.passport,
			),
		);
	}

	async getById(id: string): Promise<Domain.Property.Property<PropType>> {
		const mongoProperty = await this.model.findById(id).exec();
		if (!mongoProperty) {
			throw new Error(`Property with id ${id} not found`);
		}
		return this.typeConverter.toDomain(mongoProperty, this.passport);
	}

	async getAll(): Promise<ReadonlyArray<Domain.Property.Property<PropType>>> {
		const mongoProperties = await this.model.find().exec();
		return Promise.all(
			mongoProperties.map((mongoProperty) =>
				this.typeConverter.toDomain(mongoProperty, this.passport),
			),
		);
	}
}