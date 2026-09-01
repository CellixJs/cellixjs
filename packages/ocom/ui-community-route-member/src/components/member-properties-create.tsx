import { type MemberPropertyCreateInput, PROPERTY_EDIT_POLICIES, PropertyForm, type PropertyFormValues, toMemberPropertyCreateInput } from '@ocom/ui-community-shared';
import type React from 'react';

interface MemberPropertiesCreateProps {
	submitting?: boolean | undefined;
	onSave: (input: MemberPropertyCreateInput) => void;
}

/** Member create form contains only the server-safe self-owned input fields. */
export const MemberPropertiesCreate: React.FC<MemberPropertiesCreateProps> = (props) => (
	<PropertyForm
		editPolicy={PROPERTY_EDIT_POLICIES.memberCreate}
		submitLabel="Create Property"
		submitting={props.submitting ?? false}
		onSubmit={(values: PropertyFormValues) => props.onSave(toMemberPropertyCreateInput(values))}
	/>
);
