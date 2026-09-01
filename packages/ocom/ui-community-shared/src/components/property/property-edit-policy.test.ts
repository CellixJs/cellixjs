import { describe, expect, it } from 'vitest';
import { PROPERTY_EDIT_POLICIES } from './property-edit-policy.ts';

describe('Property edit policies', () => {
	it('keeps manager-only controls out of member policies', () => {
		expect(PROPERTY_EDIT_POLICIES.memberCreate).toMatchObject({
			canEditPropertyName: true,
			canEditPropertyType: false,
			canEditOwner: false,
			canEditListingContent: true,
		});
		expect(PROPERTY_EDIT_POLICIES.memberEdit).toMatchObject({
			canEditPropertyName: false,
			canEditPropertyType: false,
			canEditOwner: false,
			canEditListingContent: true,
		});
	});

	it('has a genuinely non-editable read-only policy', () => {
		expect(PROPERTY_EDIT_POLICIES.readOnly).toEqual({
			canEditPropertyName: false,
			canEditPropertyType: false,
			canEditOwner: false,
			canEditListingContent: false,
			canSubmit: false,
		});
	});
});
