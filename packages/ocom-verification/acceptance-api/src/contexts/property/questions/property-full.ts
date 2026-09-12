import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { type Actor, type AnswersQuestions, notes, Question, type UsesAbilities } from '@serenity-js/core';
import { PROPERTIES_FULL_BY_COMMUNITY_ID_QUERY, type PropertyFullResult } from '../../../shared/graphql/property-field-operations.ts';
import { type CurrentCommunityMemberResult, MEMBER_FOR_CURRENT_COMMUNITY_QUERY } from '../../../shared/graphql/property-operations.ts';
import type { PropertyNotes } from '../notes/property-notes.ts';

async function readActiveCommunityId(actor: AnswersQuestions & UsesAbilities): Promise<string> {
	const communityId = await actor.answer(notes<PropertyNotes>().get('activeCommunityId'));
	if (!communityId) {
		throw new Error('No community id available. Did the actor become a property manager of a community first?');
	}
	return communityId;
}

/**
 * Question that finds a property by name in the actor's active community,
 * reading the FULL user-managed field set (location, owner, extended listing
 * detail). Answers `undefined` when no property with that name exists.
 */
export class PropertyFullNamed extends Question<Promise<PropertyFullResult | undefined>> {
	static called(propertyName: string): PropertyFullNamed {
		return new PropertyFullNamed(propertyName);
	}

	private constructor(private readonly propertyName: string) {
		super(`the full field set of the property named "${propertyName}"`);
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<PropertyFullResult | undefined> {
		const communityId = await readActiveCommunityId(actor);
		const response = await GraphQLClient.as(actor as unknown as Actor).execute(PROPERTIES_FULL_BY_COMMUNITY_ID_QUERY, { communityId });
		const properties = response.data['propertiesByCommunityId'] as PropertyFullResult[];
		return properties.find((property) => property.propertyName === this.propertyName);
	}

	override toString = () => `the full field set of the property named "${this.propertyName}"`;
}

/** Format a price value the way the properties list renders it. */
function formatPriceCell(price: number | null | undefined): string {
	return price === null || price === undefined ? 'N/A' : `$${price.toLocaleString('en-US')}`;
}

/** Format an address the way the properties list renders it, e.g. `113 Beacon St, Mountain View, CA 94040`. */
function formatAddressCell(property: PropertyFullResult): string {
	const address = property.location?.address;
	const streetLine = [address?.streetNumber, address?.streetName].filter((part) => part && part.length > 0).join(' ');
	const regionLine = [address?.countrySubdivision, address?.postalCode].filter((part) => part && part.length > 0).join(' ');
	const parts = [streetLine, address?.municipality ?? '', regionLine].filter((part) => part.length > 0);
	return parts.length === 0 ? 'N/A' : parts.join(', ');
}

/**
 * Question that answers the text a properties-list cell is expected to show
 * for a property, derived from the API state using the same formatting rules
 * as the admin UI (price, address, owner).
 */
export class PropertyListCell extends Question<Promise<string>> {
	static of(propertyName: string, columnTitle: string): PropertyListCell {
		return new PropertyListCell(propertyName, columnTitle);
	}

	private constructor(
		private readonly propertyName: string,
		private readonly columnTitle: string,
	) {
		super(`the "${columnTitle}" list cell of the property "${propertyName}"`);
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<string> {
		const property = await actor.answer(PropertyFullNamed.called(this.propertyName));
		if (!property) {
			throw new Error(`The property "${this.propertyName}" is not in the properties list`);
		}
		switch (this.columnTitle) {
			case 'Price':
				return formatPriceCell(property.listingDetail?.price);
			case 'Address':
				return formatAddressCell(property);
			case 'Owner':
				return property.owner?.memberName ?? 'N/A';
			default:
				throw new Error(`Unsupported properties list column "${this.columnTitle}"`);
		}
	}

	override toString = () => `the "${this.columnTitle}" list cell of the property "${this.propertyName}"`;
}

/**
 * Question that answers the member name of the acting end user in the active
 * community (the name the owner column is expected to display).
 */
export class ActingMemberName extends Question<Promise<string>> {
	static ofActiveCommunity(): ActingMemberName {
		return new ActingMemberName();
	}

	private constructor() {
		super("the acting member's name in the active community");
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<string> {
		const communityId = await readActiveCommunityId(actor);
		const response = await GraphQLClient.as(actor as unknown as Actor).execute(MEMBER_FOR_CURRENT_COMMUNITY_QUERY, { communityId });
		const member = response.data['memberForCurrentCommunity'] as CurrentCommunityMemberResult | null;
		if (!member?.memberName) {
			throw new Error('The acting member has no member name in the active community');
		}
		return member.memberName;
	}

	override toString = () => "the acting member's name in the active community";
}
