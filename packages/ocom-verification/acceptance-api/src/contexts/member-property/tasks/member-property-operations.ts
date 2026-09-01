import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { type Actor, notes, Task } from '@serenity-js/core';
import { PROPERTY_FULL_CREATE_MUTATION, PROPERTY_FULL_UPDATE_MUTATION, type PropertyFullCreateInput, type PropertyFullMutationResult, type PropertyFullUpdateInput } from '../../../shared/graphql/property-field-operations.ts';
import { PROPERTIES_BY_COMMUNITY_ID_QUERY, PROPERTY_BY_ID_QUERY, PROPERTY_DELETE_MUTATION, type PropertyMutationResult, type PropertyResult } from '../../../shared/graphql/property-operations.ts';
import type { MemberPropertyNotes } from '../notes/member-property-notes.ts';
import { memberPropertyCommunityOf, rememberMemberPropertyId } from './member-property-context.ts';

export interface MemberPropertyUpdateInput {
	propertyName?: string;
	propertyType?: string | null;
	ownerId?: string | null;
	listedInDirectory?: boolean;
}

const mutationError = (result: PropertyFullMutationResult | PropertyMutationResult | undefined, action: string): string => String(result?.status?.errorMessage ?? `Member Property ${action} was rejected`);

async function recordMutation(actor: Actor, action: string, result: PropertyFullMutationResult | PropertyMutationResult | undefined, propertyName?: string): Promise<void> {
	if (result?.status?.success === true) {
		const propertyId = result.property?.id;
		if (propertyName && propertyId) {
			await rememberMemberPropertyId(actor, propertyName, propertyId);
		}
		await actor.attemptsTo(notes<MemberPropertyNotes>().set('lastOperationStatus', 'SUCCESS'), notes<MemberPropertyNotes>().set('lastOperationError', null));
		return;
	}
	await actor.attemptsTo(notes<MemberPropertyNotes>().set('lastOperationStatus', 'REJECTED'), notes<MemberPropertyNotes>().set('lastOperationError', mutationError(result, action)));
}

async function recordOperationError(actor: Actor, error: unknown): Promise<void> {
	const message = error instanceof Error ? error.message : String(error);
	await actor.attemptsTo(notes<MemberPropertyNotes>().set('lastOperationStatus', 'ERROR'), notes<MemberPropertyNotes>().set('lastOperationError', message));
}

/** Sends a minimal member Property create request without an ownerId. */
export class CreateMemberProperty extends Task {
	static named(propertyName: string): CreateMemberProperty {
		return new CreateMemberProperty(propertyName);
	}

	private constructor(private readonly propertyName: string) {
		super(`creates the member Property "${propertyName}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		try {
			const response = await GraphQLClient.as(actor).execute(PROPERTY_FULL_CREATE_MUTATION, {
				input: { propertyName: this.propertyName } satisfies PropertyFullCreateInput,
			});
			await recordMutation(actor, 'create', response.data.propertyCreate as PropertyFullMutationResult | undefined, this.propertyName);
		} catch (error) {
			await recordOperationError(actor, error);
		}
	}
}

/** Sends a deliberately raw create payload containing a forbidden ownerId. */
export class AttemptMemberPropertyCreateWithOwner extends Task {
	static named(propertyName: string, ownerId: string): AttemptMemberPropertyCreateWithOwner {
		return new AttemptMemberPropertyCreateWithOwner(propertyName, ownerId);
	}

	private constructor(
		private readonly propertyName: string,
		private readonly ownerId: string,
	) {
		super(`attempts to create the member Property "${propertyName}" with an owner id`);
	}

	async performAs(actor: Actor): Promise<void> {
		try {
			const response = await GraphQLClient.as(actor).execute(PROPERTY_FULL_CREATE_MUTATION, {
				input: { propertyName: this.propertyName, ownerId: this.ownerId } satisfies PropertyFullCreateInput,
			});
			await recordMutation(actor, 'create', response.data.propertyCreate as PropertyFullMutationResult | undefined, this.propertyName);
		} catch (error) {
			await recordOperationError(actor, error);
		}
	}
}

/** Sends a member Property update request and retains its observable result. */
export class UpdateMemberProperty extends Task {
	static with(propertyName: string, propertyId: string, input: MemberPropertyUpdateInput): UpdateMemberProperty {
		return new UpdateMemberProperty(propertyName, propertyId, input);
	}

	private constructor(
		private readonly propertyName: string,
		private readonly propertyId: string,
		private readonly input: MemberPropertyUpdateInput,
	) {
		super(`updates the member Property "${propertyName}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		try {
			const response = await GraphQLClient.as(actor).execute(PROPERTY_FULL_UPDATE_MUTATION, {
				input: { id: this.propertyId, ...this.input } satisfies PropertyFullUpdateInput,
			});
			await recordMutation(actor, 'update', response.data.propertyUpdate as PropertyFullMutationResult | undefined, this.propertyName);
		} catch (error) {
			await recordOperationError(actor, error);
		}
	}
}

/** Sends a member Property delete request and retains its observable result. */
export class DeleteMemberProperty extends Task {
	static identifiedAs(propertyName: string, propertyId: string): DeleteMemberProperty {
		return new DeleteMemberProperty(propertyName, propertyId);
	}

	private constructor(
		propertyName: string,
		private readonly propertyId: string,
	) {
		super(`deletes the member Property "${propertyName}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		try {
			const response = await GraphQLClient.as(actor).execute(PROPERTY_DELETE_MUTATION, { input: { id: this.propertyId } });
			await recordMutation(actor, 'delete', response.data.propertyDelete as PropertyMutationResult | undefined);
		} catch (error) {
			await recordOperationError(actor, error);
		}
	}
}

/** Reads a member Property directory and records both success and failure state. */
export class OpenMemberPropertyDirectory extends Task {
	static currentCommunity(): OpenMemberPropertyDirectory {
		return new OpenMemberPropertyDirectory(undefined);
	}

	static community(communityId: string): OpenMemberPropertyDirectory {
		return new OpenMemberPropertyDirectory(communityId);
	}

	private constructor(private readonly requestedCommunityId: string | undefined) {
		super('opens the member Property directory');
	}

	async performAs(actor: Actor): Promise<void> {
		const community = await memberPropertyCommunityOf(actor);
		const communityId = this.requestedCommunityId ?? community.communityId;
		try {
			const response = await GraphQLClient.as(actor).execute(PROPERTIES_BY_COMMUNITY_ID_QUERY, { communityId });
			const properties = response.data.propertiesByCommunityId as PropertyResult[];
			await actor.attemptsTo(
				notes<MemberPropertyNotes>().set(
					'listedPropertyNames',
					properties.map((property) => property.propertyName),
				),
				notes<MemberPropertyNotes>().set('directoryStatus', 'SUCCESS'),
				notes<MemberPropertyNotes>().set('directoryError', null),
				notes<MemberPropertyNotes>().set('lastOperationStatus', 'SUCCESS'),
				notes<MemberPropertyNotes>().set('lastOperationError', null),
			);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			await actor.attemptsTo(
				notes<MemberPropertyNotes>().set('listedPropertyNames', []),
				notes<MemberPropertyNotes>().set('directoryStatus', 'ERROR'),
				notes<MemberPropertyNotes>().set('directoryError', message),
				notes<MemberPropertyNotes>().set('lastOperationStatus', 'ERROR'),
				notes<MemberPropertyNotes>().set('lastOperationError', message),
			);
		}
	}
}

/** Reads a detail by id and records a found, missing, or transport/error outcome. */
export class ReadMemberProperty extends Task {
	static identifiedAs(propertyName: string, propertyId: string): ReadMemberProperty {
		return new ReadMemberProperty(propertyName, propertyId);
	}

	private constructor(
		propertyName: string,
		private readonly propertyId: string,
	) {
		super(`reads the member Property "${propertyName}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		try {
			const response = await GraphQLClient.as(actor).execute(PROPERTY_BY_ID_QUERY, { id: this.propertyId });
			const property = response.data.property as PropertyResult | null;
			await actor.attemptsTo(
				notes<MemberPropertyNotes>().set('lastReadStatus', property ? 'FOUND' : 'MISSING'),
				notes<MemberPropertyNotes>().set('lastReadError', null),
				notes<MemberPropertyNotes>().set('lastReadPropertyId', property?.id ?? null),
			);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			await actor.attemptsTo(notes<MemberPropertyNotes>().set('lastReadStatus', 'ERROR'), notes<MemberPropertyNotes>().set('lastReadError', message), notes<MemberPropertyNotes>().set('lastReadPropertyId', null));
		}
	}
}
