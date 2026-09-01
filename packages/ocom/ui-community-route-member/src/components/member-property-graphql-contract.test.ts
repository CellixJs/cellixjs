import { print } from 'graphql';
import { describe, expect, it } from 'vitest';
import { MemberPropertiesListDocument, MemberPropertiesRouteGuardMembersForCurrentEndUserDocument, MemberPropertyCreateDocument, MemberPropertyDetailDocument, MemberPropertyUpdateDocument } from '../generated.tsx';

describe('member Property GraphQL documents', () => {
	it('never requests manager-only owner options or deletion operations', () => {
		const memberDocuments = [MemberPropertiesRouteGuardMembersForCurrentEndUserDocument, MemberPropertiesListDocument, MemberPropertyDetailDocument, MemberPropertyCreateDocument, MemberPropertyUpdateDocument].map((document) =>
			print(document),
		);

		for (const document of memberDocuments) {
			expect(document).not.toContain('propertyOwnerOptions');
			expect(document).not.toContain('propertyDelete');
		}
	});

	it('uses owner ids only in the detail projection needed for ownership policy', () => {
		expect(print(MemberPropertiesListDocument)).not.toContain('owner');
		expect(print(MemberPropertyDetailDocument)).toContain('owner');
		expect(print(MemberPropertyDetailDocument)).not.toContain('memberName');
	});
});
