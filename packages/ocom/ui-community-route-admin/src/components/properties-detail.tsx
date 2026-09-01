import { PROPERTY_EDIT_POLICIES, PropertyDetails, type PropertyFormMemberOption, type PropertyFormValues, toManagerPropertyInputFields } from '@ocom/ui-community-shared';
import { Button, Modal, Typography } from 'antd';
import type React from 'react';
import { useState } from 'react';
import type { AdminPropertiesDetailContainerPropertyFieldsFragment, PropertyUpdateInput } from '../generated.tsx';

const { Text } = Typography;

/** Update input fields emitted on save; the container adds the property id. */
export type PropertiesDetailSaveInput = Omit<PropertyUpdateInput, 'id'>;

export interface PropertiesDetailProps {
	data: AdminPropertiesDetailContainerPropertyFieldsFragment;
	members?: PropertyFormMemberOption[] | undefined;
	membersLoading?: boolean | undefined;
	onSave: (input: PropertiesDetailSaveInput) => Promise<void>;
	onSaveAndClose?: ((input: PropertiesDetailSaveInput) => Promise<void>) | undefined;
	onRemove: () => Promise<void>;
	saving?: boolean | undefined;
	removing?: boolean | undefined;
}

const toManagerSaveInput = (data: AdminPropertiesDetailContainerPropertyFieldsFragment, values: PropertyFormValues): PropertiesDetailSaveInput => ({
	propertyName: values.propertyName ?? data.propertyName,
	...toManagerPropertyInputFields(values),
});

/**
 * Keeps manager-only deletion confirmation in the admin route while sharing
 * route-neutral detail presentation and form behavior with the member route.
 */
export const PropertiesDetail: React.FC<PropertiesDetailProps> = (props) => {
	const [removeModalOpen, setRemoveModalOpen] = useState(false);

	const handleConfirmRemove = async () => {
		await props.onRemove();
		setRemoveModalOpen(false);
	};

	return (
		<>
			<PropertyDetails
				data={props.data}
				editPolicy={PROPERTY_EDIT_POLICIES.managerEdit}
				members={props.members}
				membersLoading={props.membersLoading}
				submitLabel="Save"
				submitting={props.saving}
				onSubmit={(values) => {
					void props.onSave(toManagerSaveInput(props.data, values));
				}}
				onSubmitAndClose={
					props.onSaveAndClose
						? (values) => {
								void props.onSaveAndClose?.(toManagerSaveInput(props.data, values));
							}
						: undefined
				}
				actions={
					<Button
						danger
						onClick={() => setRemoveModalOpen(true)}
						loading={props.removing ?? false}
					>
						Remove Property
					</Button>
				}
			/>
			<Modal
				open={removeModalOpen}
				title="Remove this property?"
				okText="Remove Property"
				okButtonProps={{ danger: true }}
				confirmLoading={props.removing ?? false}
				onCancel={() => setRemoveModalOpen(false)}
				onOk={() => void handleConfirmRemove()}
			>
				<Text>{`This will remove the property "${props.data.propertyName}" from the community.`}</Text>
			</Modal>
		</>
	);
};
