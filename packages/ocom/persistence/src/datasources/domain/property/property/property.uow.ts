import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { PropertyConverter } from './property.domain-adapter.ts';
import { PropertyRepository } from './property.repository.ts';
import type { PropertyUnitOfWork } from '@ocom/domain/contexts/property';
import type { Passport } from '@ocom/domain/contexts/passport';

export const getPropertyUnitOfWork = (
	propertyModel: Models.Property.PropertyModelType,
	passport: Passport
): PropertyUnitOfWork => {
	const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
		InProcEventBusInstance,
		NodeEventBusInstance,
		propertyModel,
		new PropertyConverter(),
		PropertyRepository,
	);
	return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
};