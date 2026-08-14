import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import type {
	PropertyAdditionalAmenityCommand,
	PropertyAddressFieldsCommand,
	PropertyBedroomDetailCommand,
	PropertyFieldsCommand,
	PropertyListingDetailFieldsCommand,
	PropertyLocationFieldsCommand,
} from './apply-property-fields.ts';
import { create, type PropertyCreateCommand } from './create.ts';
import { type PropertyQueryByCommunityIdCommand, queryByCommunityId } from './query-by-community-id.ts';
import { type PropertyQueryByIdCommand, queryById } from './query-by-id.ts';
import { type PropertyRequestDeleteCommand, requestDelete } from './request-delete.ts';
import { type PropertyUpdateCommand, type PropertyUpdateListingDetailCommand, update } from './update.ts';

export type {
	PropertyAdditionalAmenityCommand,
	PropertyAddressFieldsCommand,
	PropertyBedroomDetailCommand,
	PropertyCreateCommand,
	PropertyFieldsCommand,
	PropertyListingDetailFieldsCommand,
	PropertyLocationFieldsCommand,
	PropertyUpdateCommand,
	PropertyUpdateListingDetailCommand,
};

export interface PropertyApplicationService {
	create: (command: PropertyCreateCommand) => Promise<Domain.Contexts.Property.Property.PropertyEntityReference>;
	update: (command: PropertyUpdateCommand) => Promise<Domain.Contexts.Property.Property.PropertyEntityReference>;
	requestDelete: (command: PropertyRequestDeleteCommand) => Promise<Domain.Contexts.Property.Property.PropertyEntityReference>;
	queryById: (command: PropertyQueryByIdCommand) => Promise<Domain.Contexts.Property.Property.PropertyEntityReference | null>;
	queryByCommunityId: (command: PropertyQueryByCommunityIdCommand) => Promise<Domain.Contexts.Property.Property.PropertyEntityReference[]>;
}

export const Property = (dataSources: DataSources): PropertyApplicationService => {
	return {
		create: create(dataSources),
		update: update(dataSources),
		requestDelete: requestDelete(dataSources),
		queryById: queryById(dataSources),
		queryByCommunityId: queryByCommunityId(dataSources),
	};
};
