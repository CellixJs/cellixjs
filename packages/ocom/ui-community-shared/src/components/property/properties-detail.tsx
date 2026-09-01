import { Space, Typography } from 'antd';
import type React from 'react';
import { PROPERTY_EDIT_POLICIES, type PropertyEditPolicy } from './property-edit-policy.ts';
import { PropertyForm } from './property-form.tsx';
import { propertyRecordToFormValues } from './property-input-mappers.ts';
import { PropertyMetadata, PropertyReadOnlyDetail, ReadOnlyPropertyNotice } from './property-read-only-detail.tsx';
import type { PropertyFormMemberOption, PropertyFormValues, PropertyRecord } from './property-types.ts';

const { Title } = Typography;

export interface PropertyDetailsProps {
	data: PropertyRecord;
	editPolicy?: PropertyEditPolicy | undefined;
	members?: PropertyFormMemberOption[] | undefined;
	membersLoading?: boolean | undefined;
	submitLabel?: string | undefined;
	submitting?: boolean | undefined;
	onSubmit?: ((values: PropertyFormValues) => void) | undefined;
	onSubmitAndClose?: ((values: PropertyFormValues) => void) | undefined;
	actions?: React.ReactNode;
}

/**
 * Route-neutral detail presentation. Route containers own mutations and
 * manager-only deletion confirmation; this component only selects the
 * editable or read-only presentation from an explicit policy.
 */
export const PropertyDetails: React.FC<PropertyDetailsProps> = (props) => {
	const editPolicy = props.editPolicy ?? PROPERTY_EDIT_POLICIES.managerEdit;
	const members: PropertyFormMemberOption[] = [...(props.members ?? [])];
	if (editPolicy.canEditOwner && props.data.owner && !members.some((member) => member.id === String(props.data.owner?.id))) {
		members.push({ id: String(props.data.owner.id), memberName: props.data.owner.memberName });
	}

	return (
		<Space
			direction="vertical"
			size="large"
			style={{ width: '100%' }}
		>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<Title level={3}>{props.data.propertyName}</Title>
				{props.actions}
			</div>
			<PropertyMetadata data={props.data} />
			{editPolicy.canEditListingContent ? (
				<PropertyForm
					key={String(props.data.id)}
					initialValues={propertyRecordToFormValues(props.data)}
					editPolicy={editPolicy}
					members={members}
					membersLoading={props.membersLoading ?? false}
					submitLabel={props.submitLabel ?? 'Save'}
					submitting={props.submitting ?? false}
					onSubmit={props.onSubmit ?? (() => undefined)}
					onSubmitAndClose={props.onSubmitAndClose}
				/>
			) : (
				<>
					<ReadOnlyPropertyNotice />
					<PropertyReadOnlyDetail data={props.data} />
				</>
			)}
		</Space>
	);
};
