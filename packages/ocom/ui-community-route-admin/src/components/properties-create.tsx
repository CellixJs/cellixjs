import type React from 'react';
import type { PropertyCreateInput } from '../generated.tsx';
import { PropertyForm, type PropertyFormMemberOption, toPropertyInputFields } from './property-form.tsx';

interface PropertiesCreateProps {
	members?: PropertyFormMemberOption[] | undefined;
	membersLoading?: boolean | undefined;
	onSave: (property: PropertyCreateInput) => void;
}

export const PropertiesCreate: React.FC<PropertiesCreateProps> = (props) => {
	return (
		<PropertyForm
			members={props.members ?? []}
			membersLoading={props.membersLoading ?? false}
			submitLabel="Create Property"
			onSubmit={(values) => {
				props.onSave({
					propertyName: values.propertyName ?? '',
					...toPropertyInputFields(values),
				});
			}}
		/>
	);
};
