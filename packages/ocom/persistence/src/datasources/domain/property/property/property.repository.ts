import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { Property } from '@ocom/data-sources-mongoose-models';
import { Domain } from '@ocom/domain';
import type { PropertyDomainAdapter } from './property.domain-adapter.ts';

type PropertyModelType = Property;
type PropType = PropertyDomainAdapter;

export class PropertyRepository
	extends MongooseSeedwork.MongoRepositoryBase<
		PropertyModelType,
		PropType,
		Domain.Passport,
		Domain.Contexts.Property.Property.Property<PropType>
	>
	implements Domain.Contexts.Property.Property.PropertyRepository<PropType>
{
	// biome-ignore lint:noRequireAwait
	async getNewInstance(
		propertyName: string,
		community: Domain.Contexts.Community.Community.CommunityEntityReference,
	): Promise<Domain.Contexts.Property.Property.Property<PropType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(
			Domain.Contexts.Property.Property.Property.getNewInstance(
				adapter,
				propertyName,
				community,
				this.passport,
			),
		);
	}

	async getById(
		id: string,
	): Promise<Domain.Contexts.Property.Property.Property<PropType>> {
		const mongoProperty = await this.model.findById(id).exec();
		if (!mongoProperty) {
			throw new Error(`Property with id ${id} not found`);
		}
		return this.typeConverter.toDomain(mongoProperty, this.passport);
	}

	async getAll(): Promise<
		ReadonlyArray<Domain.Contexts.Property.Property.Property<PropType>>
	> {
		const mongoProperties = await this.model.find().exec();
		return Promise.all(
			mongoProperties.map((mongoProperty) =>
				this.typeConverter.toDomain(mongoProperty, this.passport),
			),
		);
	}
}
