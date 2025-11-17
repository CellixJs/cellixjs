import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Domain } from '@ocom/domain';
import { PropertyConverter } from './property.domain-adapter.ts';
import { PropertyRepository } from './property.repository.ts';
import type * as Property from '@ocom/domain/contexts/property';

export const getPropertyUnitOfWork = (
	propertyModel: Models.Property.PropertyModelType,
	passport: Domain.Passport
): Property.PropertyUnitOfWork => {
	const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
		InProcEventBusInstance,
		NodeEventBusInstance,
		propertyModel,
		new PropertyConverter(),
		PropertyRepository,
	);
	return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
};