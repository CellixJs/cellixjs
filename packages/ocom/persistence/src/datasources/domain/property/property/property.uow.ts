import * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import { NodeEventBusInstance } from '@cellix/event-bus-seedwork-node/node-event-bus';
import { InProcEventBusInstance } from '@cellix/event-bus-seedwork-node/in-proc-event-bus';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Passport } from '@ocom/domain';
import { PropertyConverter } from './property.domain-adapter.ts';
import { PropertyRepository } from './property.repository.ts';

import { Property } from '@ocom/domain/contexts/property/property';
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