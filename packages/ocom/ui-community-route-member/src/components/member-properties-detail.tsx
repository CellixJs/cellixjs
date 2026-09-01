import { PROPERTY_EDIT_POLICIES, PropertyDetails, type PropertyFormValues, type PropertyRecord, toMemberPropertyUpdateInput } from '@ocom/ui-community-shared';
import type React from 'react';

interface MemberPropertiesDetailProps {
	data: PropertyRecord;
	memberId: string;
	saving?: boolean | undefined;
	onSave: (input: ReturnType<typeof toMemberPropertyUpdateInput>) => Promise<boolean>;
	onSaveAndClose?: ((input: ReturnType<typeof toMemberPropertyUpdateInput>) => Promise<boolean>) | undefined;
}

/**
 * An owner receives the listing-only editor. A foreign or unowned property
 * receives a separate read-only presentation without owner identity.
 */
export const MemberPropertiesDetail: React.FC<MemberPropertiesDetailProps> = (props) => {
	const isOwnedByCurrentMember = props.data.owner?.id === props.memberId;
	const editPolicy = isOwnedByCurrentMember ? PROPERTY_EDIT_POLICIES.memberEdit : PROPERTY_EDIT_POLICIES.readOnly;

	const submit = (values: PropertyFormValues): Promise<boolean> => props.onSave(toMemberPropertyUpdateInput(props.data.id, values));
	const submitAndClose = props.onSaveAndClose ? (values: PropertyFormValues): Promise<boolean> => props.onSaveAndClose?.(toMemberPropertyUpdateInput(props.data.id, values)) ?? Promise.resolve(false) : undefined;

	return (
		<PropertyDetails
			data={props.data}
			editPolicy={editPolicy}
			submitLabel="Save"
			submitting={props.saving}
			onSubmit={
				isOwnedByCurrentMember
					? (values) => {
							void submit(values);
						}
					: undefined
			}
			onSubmitAndClose={
				isOwnedByCurrentMember && submitAndClose
					? (values) => {
							void submitAndClose(values);
						}
					: undefined
			}
		/>
	);
};
