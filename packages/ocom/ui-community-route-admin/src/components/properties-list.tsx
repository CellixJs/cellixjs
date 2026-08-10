import type { TableColumnsType } from 'antd';
import { Button, Space, Table, Typography } from 'antd';
import type React from 'react';
import type { AdminPropertiesListContainerPropertyFieldsFragment } from '../generated.tsx';

const { Title } = Typography;

export interface PropertiesListProps {
	data: AdminPropertiesListContainerPropertyFieldsFragment[];
	onPropertyView?: (propertyId: string) => void;
	loading?: boolean;
}

const formatListingNumber = (value: number | null | undefined): string => {
	if (value === null || value === undefined) {
		return 'N/A';
	}
	return String(value);
};

export const PropertiesList: React.FC<PropertiesListProps> = (props) => {
	const { data, onPropertyView, loading } = props;

	const columns: TableColumnsType<AdminPropertiesListContainerPropertyFieldsFragment> = [
		{
			title: 'Property Name',
			dataIndex: 'propertyName',
			key: 'propertyName',
		},
		{
			title: 'Property Type',
			dataIndex: 'propertyType',
			key: 'propertyType',
			render: (propertyType: string | null) => propertyType || 'N/A',
		},
		{
			title: 'Bedrooms',
			dataIndex: ['listingDetail', 'bedrooms'],
			key: 'bedrooms',
			render: (bedrooms: number | null) => formatListingNumber(bedrooms),
		},
		{
			title: 'Bathrooms',
			dataIndex: ['listingDetail', 'bathrooms'],
			key: 'bathrooms',
			render: (bathrooms: number | null) => formatListingNumber(bathrooms),
		},
		{
			title: 'Square Feet',
			dataIndex: ['listingDetail', 'squareFeet'],
			key: 'squareFeet',
			render: (squareFeet: number | null) => formatListingNumber(squareFeet),
		},
		{
			title: 'Updated',
			dataIndex: 'updatedAt',
			key: 'updatedAt',
			render: (date: string) => {
				if (!date) return 'N/A';
				return new Date(date).toLocaleDateString();
			},
		},
		{
			title: 'Action',
			key: 'action',
			render: (_text: unknown, record: AdminPropertiesListContainerPropertyFieldsFragment) => (
				<Button
					type="link"
					onClick={() => onPropertyView?.(String(record.id))}
				>
					View
				</Button>
			),
		},
	];

	return (
		<Space
			direction="vertical"
			size="large"
			style={{ width: '100%' }}
		>
			<Title level={3}>Community Properties ({data.length})</Title>
			<Table
				dataSource={data}
				columns={columns}
				rowKey="id"
				loading={loading ?? false}
				pagination={{
					pageSize: 10,
					showSizeChanger: true,
					showQuickJumper: true,
					showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} properties`,
				}}
			/>
		</Space>
	);
};
