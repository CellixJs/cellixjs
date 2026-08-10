import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { Property } from '@ocom/data-sources-mongoose-models/property';
import { Domain } from '@ocom/domain';
import type { PropertyDomainAdapter } from './property.domain-adapter.ts';

type PropertyModelType = Property;
type PropType = PropertyDomainAdapter;

export class PropertyRepository
	extends MongooseSeedwork.MongoRepositoryBase<PropertyModelType, PropType, Domain.Passport, Domain.Contexts.Property.Property.Property<PropType>>
	implements Domain.Contexts.Property.Property.PropertyRepository<PropType>
{
	// biome-ignore lint:noRequireAwait
	async getNewInstance(propertyName: string, community: Domain.Contexts.Community.Community.CommunityEntityReference): Promise<Domain.Contexts.Property.Property.Property<PropType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(Domain.Contexts.Property.Property.Property.getNewInstance(adapter, propertyName, community, this.passport));
	}

	async getById(id: string): Promise<Domain.Contexts.Property.Property.Property<PropType>> {
		const mongoProperty = await this.model.findById(id).populate(['community', 'owner']).exec();
		if (!mongoProperty) {
			throw new Error(`Property with id ${id} not found`);
		}
		return this.typeConverter.toDomain(mongoProperty, this.passport);
	}

	async getAll(): Promise<ReadonlyArray<Domain.Contexts.Property.Property.Property<PropType>>> {
		const mongoProperties = await this.model.find().exec();
		return Promise.all(mongoProperties.map((mongoProperty) => this.typeConverter.toDomain(mongoProperty, this.passport)));
	}

	/**
	 * Overrides the base save to persist deletions as soft deletes:
	 * when the aggregate requests deletion, the document is saved with
	 * `isDeleted: true` instead of being removed from the collection.
	 * The base flow (onSave, domain event dispatch, transaction tracking
	 * for integration events) is preserved.
	 */
	override async save(item: Domain.Contexts.Property.Property.Property<PropType>): Promise<Domain.Contexts.Property.Property.Property<PropType>> {
		item.onSave(this.typeConverter.toPersistence(item).isModified());

		for (const event of item.getDomainEvents()) {
			await this.bus.dispatch(event.constructor as new (aggregateId: string) => typeof event, event.payload);
		}
		item.clearDomainEvents();
		this.itemsInTransaction.push(item);

		const mongoObj = this.typeConverter.toPersistence(item);
		if (item.isDeleted) {
			mongoObj.set('isDeleted', true);
			await mongoObj.save({ session: this.session });
			return item;
		}
		return this.typeConverter.toDomain(await mongoObj.save({ session: this.session }), this.passport);
	}
}
