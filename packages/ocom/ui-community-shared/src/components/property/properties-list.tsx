import type { TableColumnsType } from 'antd';
import { Button, Space, Table, Typography } from 'antd';
import type React from 'react';
import { formatDisplayAddress } from './format-display-address.ts';
import type { PropertyRecord } from './property-types.ts';

const { Title } = Typography;

export interface PropertyListProps {
	data: readonly PropertyRecord[];
	onPropertyView?: ((propertyId: string) => void) | undefined;
	loading?: boolean | undefined;
	/** Manager lists show owner names; member lists must keep them hidden. */
	showOwner?: boolean | undefined;
}

const formatListingNumber = (value: number | null | undefined): string => {
	if (value === null || value === undefined) {
		return 'N/A';
	}
	return String(value);
};

const formatPrice = (value: number | null | undefined): string => {
	if (value === null || value === undefined) {
		return 'N/A';
	}
	return `$${value.toLocaleString('en-US')}`;
};

export const PropertyList: React.FC<PropertyListProps> = (props) => {
	const { data, onPropertyView, loading, showOwner = true } = props;

	const columns: TableColumnsType<PropertyRecord> = [
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
			title: 'Price',
			dataIndex: ['listingDetail', 'price'],
			key: 'price',
			render: (price: number | null) => formatPrice(price),
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
			title: 'Address',
			key: 'address',
			render: (_text: unknown, record: PropertyRecord) => formatDisplayAddress(record.location?.address),
		},
		...(showOwner
			? [
					{
						title: 'Owner',
						key: 'owner',
						render: (_text: unknown, record: PropertyRecord) => record.owner?.memberName || 'N/A',
					},
				]
			: []),
		{
			title: 'Updated',
			dataIndex: 'updatedAt',
			key: 'updatedAt',
			render: (date: string | Date | null | undefined) => {
				if (!date) return 'N/A';
				return new Date(date).toLocaleDateString();
			},
		},
		{
			title: 'Action',
			key: 'action',
			render: (_text: unknown, record: PropertyRecord) => (
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
				dataSource={[...data]}
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
