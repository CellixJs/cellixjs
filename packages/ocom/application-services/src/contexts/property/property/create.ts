import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { applyPropertyFields, type PropertyFieldsCommand } from './apply-property-fields.ts';
import { ensureCommunityPropertiesCreatable, ensureCommunityPropertiesManageable, isCommunityPropertiesManageable } from './ensure-property-viewable.ts';

export interface PropertyCreateCommand extends PropertyFieldsCommand {
	propertyName: string;
	communityId: string;
}

/**
 * Request-scoped identity supplied only by the authenticated application
 * services factory. It is deliberately not part of a GraphQL command.
 */
export interface PropertyRequestContext {
	readonly currentMember: Domain.Contexts.Community.Member.MemberEntityReference | null;
}

const noCurrentMemberContext: PropertyRequestContext = {
	currentMember: null,
};

export const create = (dataSources: DataSources, requestContext: PropertyRequestContext = noCurrentMemberContext) => {
	return async (command: PropertyCreateCommand): Promise<Domain.Contexts.Property.Property.PropertyEntityReference> => {
		// Authorize against the target community before any lookups, so an
		// unauthorized caller cannot probe community existence or
		// property-name availability from the distinct error responses.
		ensureCommunityPropertiesCreatable(dataSources.passport, command.communityId);
		const canManageProperties = isCommunityPropertiesManageable(dataSources.passport, command.communityId);

		// Type is a manager-owned field. Reject it before checking the requested
		// name so an own-property editor cannot use this mutation as a name
		// availability oracle.
		if (command.propertyType !== undefined && !canManageProperties) {
			ensureCommunityPropertiesManageable(dataSources.passport, command.communityId);
		}

		let owner: Domain.Contexts.Community.Member.MemberEntityReference | null = null;
		if (canManageProperties) {
			if (command.ownerId !== undefined && command.ownerId !== null) {
				owner = await dataSources.readonlyDataSource.Community.Member.MemberReadRepo.getByIdInCommunityWithRole(command.ownerId, command.communityId);
				if (!owner) {
					throw new Error('Property owner not found');
				}
			}
		} else {
			// A member's owner is never command data, including if it happens to
			// equal their own id. Bind the verified canonical member instead.
			if (command.ownerId !== undefined) {
				throw new Error('Property owner cannot be specified');
			}
			const currentMember = requestContext.currentMember;
			if (!currentMember || currentMember.community.id !== command.communityId) {
				throw new Error('Unauthorized');
			}
			owner = currentMember;
		}

		let community: Domain.Contexts.Community.Community.CommunityEntityReference | undefined;
		await dataSources.domainDataSource.Community.Community.CommunityUnitOfWork.withScopedTransaction(async (repo) => {
			community = await repo.get(command.communityId);
		});
		if (!community) {
			throw new Error(`Community not found for id ${command.communityId}`);
		}
		const communityToUse = community;

		// Friendly pre-check for the partial unique index on { community, propertyName }.
		// The check-then-write race is acceptable here; the index backstops it.
		const nameTaken = await dataSources.readonlyDataSource.Property.Property.PropertyReadRepo.isPropertyNameTaken(command.communityId, command.propertyName);
		if (nameTaken) {
			throw new Error('A property with this name already exists');
		}

		let propertyToReturn: Domain.Contexts.Property.Property.PropertyEntityReference | undefined;
		await dataSources.domainDataSource.Property.Property.PropertyUnitOfWork.withScopedTransaction(async (repo) => {
			const newProperty = await repo.getNewInstance(command.propertyName, communityToUse, owner);
			// Owner was bound in the aggregate factory from either the trusted
			// request context or a community-scoped manager lookup. It must not be
			// reapplied from command data.
			const { ownerId: _ownerId, ...remainingFields } = command;
			await applyPropertyFields(dataSources, newProperty, remainingFields);
			propertyToReturn = await repo.save(newProperty);
		});
		if (!propertyToReturn) {
			throw new Error('property not found');
		}
		return propertyToReturn;
	};
};
