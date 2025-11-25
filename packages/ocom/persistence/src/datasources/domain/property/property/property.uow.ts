import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';

import type { Domain } from '@ocom/domain';
import { PropertyConverter } from './property.domain-adapter.ts';
import { PropertyRepository } from './property.repository.ts';
import type { PropertyModelType } from '@ocom/data-sources-mongoose-models/property';

export const getPropertyUnitOfWork = (
	propertyModel: PropertyModelType,
	passport: Domain.Passport
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