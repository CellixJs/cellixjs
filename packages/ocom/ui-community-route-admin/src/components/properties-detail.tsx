import { Button, Descriptions, Form, Input, InputNumber, Modal, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import type React from 'react';
import { useState } from 'react';
import type { AdminPropertiesDetailContainerPropertyFieldsFragment } from '../generated.tsx';

const { Title, Text } = Typography;

export interface PropertiesDetailFormValues {
	propertyName: string;
	propertyType?: string | null;
	listingDetail?: {
		bedrooms?: number | null;
		bathrooms?: number | null;
		squareFeet?: number | null;
	} | null;
}

export interface PropertiesDetailProps {
	data: AdminPropertiesDetailContainerPropertyFieldsFragment;
	onSave: (values: PropertiesDetailFormValues) => Promise<void>;
	onRemove: () => Promise<void>;
	saving?: boolean;
	removing?: boolean;
}

export const PropertiesDetail: React.FC<PropertiesDetailProps> = (props) => {
	const [form] = Form.useForm<PropertiesDetailFormValues>();
	const [removeModalOpen, setRemoveModalOpen] = useState(false);
	const data = props.data;

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

			<Form
				layout="vertical"
				form={form}
				initialValues={{
					propertyName: data.propertyName,
					propertyType: data.propertyType ?? undefined,
					listingDetail: {
						bedrooms: data.listingDetail?.bedrooms ?? undefined,
						bathrooms: data.listingDetail?.bathrooms ?? undefined,
						squareFeet: data.listingDetail?.squareFeet ?? undefined,
					},
				}}
				onFinish={(values) => {
					void props.onSave(values);
				}}
			>
				<Form.Item
					name={['propertyName']}
					label="Property Name"
					rules={[{ required: true, whitespace: true, message: 'Property name is required.' }]}
				>
					<Input
						placeholder="Property Name"
						maxLength={100}
					/>
				</Form.Item>
				<Form.Item
					name={['propertyType']}
					label="Property Type"
				>
					<Input
						placeholder="Property Type"
						maxLength={100}
					/>
				</Form.Item>
				<Form.Item
					name={['listingDetail', 'bedrooms']}
					label="Bedrooms"
				>
					<InputNumber
						placeholder="Bedrooms"
						min={0}
						style={{ width: '100%' }}
					/>
				</Form.Item>
				<Form.Item
					name={['listingDetail', 'bathrooms']}
					label="Bathrooms"
				>
					<InputNumber
						placeholder="Bathrooms"
						min={0}
						step={0.5}
						style={{ width: '100%' }}
					/>
				</Form.Item>
				<Form.Item
					name={['listingDetail', 'squareFeet']}
					label="Square Feet"
				>
					<InputNumber
						placeholder="Square Feet"
						min={0}
						style={{ width: '100%' }}
					/>
				</Form.Item>
				<Button
					type="primary"
					htmlType="submit"
					value={'save'}
					loading={props.saving ?? false}
				>
					Save
				</Button>
			</Form>
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
