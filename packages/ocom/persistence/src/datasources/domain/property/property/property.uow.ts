import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { PropertyModelType } from '@ocom/data-sources-mongoose-models';
import type { Domain } from '@ocom/domain';
import { PropertyConverter } from './property.domain-adapter.ts';
import { PropertyRepository } from './property.repository.ts';

export const getPropertyUnitOfWork = (
	propertyModel: PropertyModelType,
	passport: Domain.Passport,
): Domain.Contexts.Property.Property.PropertyUnitOfWork => {
	const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
		InProcEventBusInstance,
		NodeEventBusInstance,
		propertyModel,
		new PropertyConverter(),
		PropertyRepository,
	);
	return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
};
