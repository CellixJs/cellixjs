import { PROPERTY_EDIT_POLICIES, PropertyForm, type PropertyFormMemberOption, toManagerPropertyInputFields } from '@ocom/ui-community-shared';
import type React from 'react';
import type { PropertyCreateInput } from '../generated.tsx';

interface PropertiesCreateProps {
	members?: PropertyFormMemberOption[] | undefined;
	membersLoading?: boolean | undefined;
	/** True while the create mutation is in flight; blocks duplicate submissions. */
	submitting?: boolean | undefined;
	onSave: (property: PropertyCreateInput) => void;
}

export const PropertiesCreate: React.FC<PropertiesCreateProps> = (props) => {
	return (
		<PropertyForm
			editPolicy={PROPERTY_EDIT_POLICIES.managerCreate}
			members={props.members ?? []}
			membersLoading={props.membersLoading ?? false}
			submitLabel="Create Property"
			submitting={props.submitting ?? false}
			onSubmit={(values) => {
				props.onSave({
					propertyName: values.propertyName ?? '',
					...toManagerPropertyInputFields(values),
				});
			}}
		/>
	);
};
