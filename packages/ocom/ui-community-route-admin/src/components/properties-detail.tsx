import { Button, Descriptions, Modal, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import type React from 'react';
import { useState } from 'react';
import type { AdminPropertiesDetailContainerPropertyFieldsFragment, PropertyUpdateInput } from '../generated.tsx';
import { joinCommaList, PropertyForm, type PropertyFormMemberOption, type PropertyFormValues, toPropertyInputFields } from './property-form.tsx';

const { Title, Text } = Typography;

/** Update input fields emitted on save; the container adds the property id. */
export type PropertiesDetailSaveInput = Omit<PropertyUpdateInput, 'id'>;

export interface PropertiesDetailProps {
	data: AdminPropertiesDetailContainerPropertyFieldsFragment;
	members?: PropertyFormMemberOption[] | undefined;
	membersLoading?: boolean | undefined;
	onSave: (input: PropertiesDetailSaveInput) => Promise<void>;
	/**
	 * When provided, the form offers a "Save & Close" button that submits the
	 * same validated input here; the caller navigates back to the properties
	 * list after a successful save.
	 */
	onSaveAndClose?: ((input: PropertiesDetailSaveInput) => Promise<void>) | undefined;
	onRemove: () => Promise<void>;
	saving?: boolean | undefined;
	removing?: boolean | undefined;
}

/** Seeds the shared property form from the detail fragment. */
const toFormValues = (data: AdminPropertiesDetailContainerPropertyFieldsFragment): PropertyFormValues => ({
	propertyName: data.propertyName,
	propertyType: data.propertyType ?? undefined,
	ownerId: data.owner ? String(data.owner.id) : undefined,
	listedForSale: data.listedForSale,
	listedForRent: data.listedForRent,
	listedForLease: data.listedForLease,
	listedInDirectory: data.listedInDirectory,
	tags: joinCommaList(data.tags),
	location: {
		address: {
			streetNumber: data.location?.address?.streetNumber ?? undefined,
			streetName: data.location?.address?.streetName ?? undefined,
			municipality: data.location?.address?.municipality ?? undefined,
			countrySubdivision: data.location?.address?.countrySubdivision ?? undefined,
			postalCode: data.location?.address?.postalCode ?? undefined,
			country: data.location?.address?.country ?? undefined,
		},
	},
	listingDetail: {
		price: data.listingDetail?.price ?? undefined,
		rentHigh: data.listingDetail?.rentHigh ?? undefined,
		rentLow: data.listingDetail?.rentLow ?? undefined,
		lease: data.listingDetail?.lease ?? undefined,
		maxGuests: data.listingDetail?.maxGuests ?? undefined,
		bedrooms: data.listingDetail?.bedrooms ?? undefined,
		bathrooms: data.listingDetail?.bathrooms ?? undefined,
		squareFeet: data.listingDetail?.squareFeet ?? undefined,
		yearBuilt: data.listingDetail?.yearBuilt ?? undefined,
		lotSize: data.listingDetail?.lotSize ?? undefined,
		description: data.listingDetail?.description ?? undefined,
		amenities: joinCommaList(data.listingDetail?.amenities),
		bedroomDetails: (data.listingDetail?.bedroomDetails ?? []).map((detail) => ({
			roomName: detail.roomName ?? undefined,
			bedDescriptions: joinCommaList(detail.bedDescriptions),
		})),
		additionalAmenities: (data.listingDetail?.additionalAmenities ?? []).map((amenity) => ({
			category: amenity.category ?? undefined,
			amenities: joinCommaList(amenity.amenities),
		})),
		images: joinCommaList(data.listingDetail?.images),
		video: data.listingDetail?.video ?? undefined,
		floorPlan: data.listingDetail?.floorPlan ?? undefined,
		floorPlanImages: joinCommaList(data.listingDetail?.floorPlanImages),
		listingAgent: data.listingDetail?.listingAgent ?? undefined,
		listingAgentPhone: data.listingDetail?.listingAgentPhone ?? undefined,
		listingAgentEmail: data.listingDetail?.listingAgentEmail ?? undefined,
		listingAgentWebsite: data.listingDetail?.listingAgentWebsite ?? undefined,
		listingAgentCompany: data.listingDetail?.listingAgentCompany ?? undefined,
		listingAgentCompanyPhone: data.listingDetail?.listingAgentCompanyPhone ?? undefined,
		listingAgentCompanyEmail: data.listingDetail?.listingAgentCompanyEmail ?? undefined,
		listingAgentCompanyWebsite: data.listingDetail?.listingAgentCompanyWebsite ?? undefined,
		listingAgentCompanyAddress: data.listingDetail?.listingAgentCompanyAddress ?? undefined,
	},
});

export const PropertiesDetail: React.FC<PropertiesDetailProps> = (props) => {
	const [removeModalOpen, setRemoveModalOpen] = useState(false);
	const data = props.data;
	const onSaveAndClose = props.onSaveAndClose;

	// The stored owner stays selectable even while the member list is loading.
	const members: PropertyFormMemberOption[] = [...(props.members ?? [])];
	if (data.owner && !members.some((member) => member.id === String(data.owner?.id))) {
		members.push({ id: String(data.owner.id), memberName: data.owner.memberName });
	}

	const handleConfirmRemove = async () => {
		await props.onRemove();
		setRemoveModalOpen(false);
	};

	return (
		<Space
			direction="vertical"
			size="large"
			style={{ width: '100%' }}
		>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<Title level={3}>{data.propertyName}</Title>
				<Button
					danger
					onClick={() => setRemoveModalOpen(true)}
					loading={props.removing ?? false}
				>
					Remove Property
				</Button>
			</div>
			<Descriptions
				title="Property Info"
				size={'small'}
				layout={'vertical'}
			>
				<Descriptions.Item label="Id">{data.id}</Descriptions.Item>
				<Descriptions.Item label="Created At">{dayjs(data.createdAt).format('MM/DD/YYYY')}</Descriptions.Item>
				<Descriptions.Item label="Updated At">{dayjs(data.updatedAt).format('MM/DD/YYYY')}</Descriptions.Item>
			</Descriptions>

			<PropertyForm
				initialValues={toFormValues(data)}
				members={members}
				membersLoading={props.membersLoading ?? false}
				submitLabel="Save"
				submitting={props.saving ?? false}
				onSubmit={(values) => {
					void props.onSave({
						propertyName: values.propertyName ?? data.propertyName,
						...toPropertyInputFields(values),
					});
				}}
				onSubmitAndClose={
					onSaveAndClose
						? (values) => {
								void onSaveAndClose({
									propertyName: values.propertyName ?? data.propertyName,
									...toPropertyInputFields(values),
								});
							}
						: undefined
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
				<Text>{`This will remove the property "${data.propertyName}" from the community.`}</Text>
			</Modal>
		</Space>
	);
};
