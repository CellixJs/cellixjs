import { Descriptions, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import type React from 'react';
import { formatDisplayAddress } from './format-display-address.ts';
import { joinCommaList } from './property-input-mappers.ts';
import type { PropertyRecord } from './property-types.ts';

const { Text } = Typography;

const display = (value: string | number | boolean | null | undefined): string => {
	if (value === null || value === undefined || value === '') {
		return 'N/A';
	}
	return String(value);
};

const money = (value: number | null | undefined): string => (value === null || value === undefined ? 'N/A' : `$${value.toLocaleString('en-US')}`);

/** Shared timestamp display preserving the manager detail's existing format. */
export const formatPropertyDate = (value: string | Date | null | undefined): string => (value ? dayjs(value).format('MM/DD/YYYY') : 'N/A');

/**
 * Read-only Property projection. It intentionally never renders `owner`,
 * even when the route queried `owner.id` only to select an edit policy.
 */
export const PropertyReadOnlyDetail: React.FC<{ data: PropertyRecord }> = ({ data }) => {
	const listing = data.listingDetail;

	return (
		<Space
			className="property-read-only-detail"
			direction="vertical"
			size="large"
			style={{ width: '100%' }}
		>
			<Descriptions
				title="Overview"
				size="small"
				column={1}
			>
				<Descriptions.Item label="Property Type">{display(data.propertyType)}</Descriptions.Item>
				<Descriptions.Item label="Listed For Sale">{data.listedForSale ? 'Yes' : 'No'}</Descriptions.Item>
				<Descriptions.Item label="Listed For Rent">{data.listedForRent ? 'Yes' : 'No'}</Descriptions.Item>
				<Descriptions.Item label="Listed For Lease">{data.listedForLease ? 'Yes' : 'No'}</Descriptions.Item>
				<Descriptions.Item label="Listed In Directory">{data.listedInDirectory ? 'Yes' : 'No'}</Descriptions.Item>
				<Descriptions.Item label="Tags">{joinCommaList(data.tags) || 'N/A'}</Descriptions.Item>
			</Descriptions>

			<Descriptions
				title="Location"
				size="small"
				column={1}
			>
				<Descriptions.Item label="Address">{formatDisplayAddress(data.location?.address)}</Descriptions.Item>
				<Descriptions.Item label="Country">{display(data.location?.address?.country)}</Descriptions.Item>
			</Descriptions>

			<Descriptions
				title="Listing"
				size="small"
				column={1}
			>
				<Descriptions.Item label="Price">{money(listing?.price)}</Descriptions.Item>
				<Descriptions.Item label="Rent Range">
					{listing?.rentLow === null || listing?.rentLow === undefined || listing?.rentHigh === null || listing?.rentHigh === undefined ? 'N/A' : `${money(listing.rentLow)} - ${money(listing.rentHigh)}`}
				</Descriptions.Item>
				<Descriptions.Item label="Lease">{display(listing?.lease)}</Descriptions.Item>
				<Descriptions.Item label="Max Guests">{display(listing?.maxGuests)}</Descriptions.Item>
				<Descriptions.Item label="Bedrooms">{display(listing?.bedrooms)}</Descriptions.Item>
				<Descriptions.Item label="Bathrooms">{display(listing?.bathrooms)}</Descriptions.Item>
				<Descriptions.Item label="Square Feet">{display(listing?.squareFeet)}</Descriptions.Item>
				<Descriptions.Item label="Year Built">{display(listing?.yearBuilt)}</Descriptions.Item>
				<Descriptions.Item label="Lot Size">{display(listing?.lotSize)}</Descriptions.Item>
				<Descriptions.Item label="Description">{display(listing?.description)}</Descriptions.Item>
				<Descriptions.Item label="Amenities">{joinCommaList(listing?.amenities) || 'N/A'}</Descriptions.Item>
				<Descriptions.Item label="Bedroom Details">
					{listing?.bedroomDetails?.length ? listing.bedroomDetails.map((detail) => `${detail.roomName ?? 'Unnamed'}: ${joinCommaList(detail.bedDescriptions) || 'N/A'}`).join('; ') : 'N/A'}
				</Descriptions.Item>
				<Descriptions.Item label="Additional Amenities">
					{listing?.additionalAmenities?.length ? listing.additionalAmenities.map((amenity) => `${amenity.category ?? 'Uncategorized'}: ${joinCommaList(amenity.amenities) || 'N/A'}`).join('; ') : 'N/A'}
				</Descriptions.Item>
				<Descriptions.Item label="Images">{joinCommaList(listing?.images) || 'N/A'}</Descriptions.Item>
				<Descriptions.Item label="Video">{display(listing?.video)}</Descriptions.Item>
				<Descriptions.Item label="Floor Plan">{display(listing?.floorPlan)}</Descriptions.Item>
				<Descriptions.Item label="Floor Plan Images">{joinCommaList(listing?.floorPlanImages) || 'N/A'}</Descriptions.Item>
			</Descriptions>

			<Descriptions
				title="Agent"
				size="small"
				column={1}
			>
				<Descriptions.Item label="Listing Agent">{display(listing?.listingAgent)}</Descriptions.Item>
				<Descriptions.Item label="Listing Agent Phone">{display(listing?.listingAgentPhone)}</Descriptions.Item>
				<Descriptions.Item label="Listing Agent Email">{display(listing?.listingAgentEmail)}</Descriptions.Item>
				<Descriptions.Item label="Listing Agent Website">{display(listing?.listingAgentWebsite)}</Descriptions.Item>
				<Descriptions.Item label="Listing Agent Company">{display(listing?.listingAgentCompany)}</Descriptions.Item>
				<Descriptions.Item label="Listing Agent Company Phone">{display(listing?.listingAgentCompanyPhone)}</Descriptions.Item>
				<Descriptions.Item label="Listing Agent Company Email">{display(listing?.listingAgentCompanyEmail)}</Descriptions.Item>
				<Descriptions.Item label="Listing Agent Company Website">{display(listing?.listingAgentCompanyWebsite)}</Descriptions.Item>
				<Descriptions.Item label="Listing Agent Company Address">{display(listing?.listingAgentCompanyAddress)}</Descriptions.Item>
			</Descriptions>
		</Space>
	);
};

/** Metadata shown for both editable and read-only detail views. */
export const PropertyMetadata: React.FC<{ data: PropertyRecord }> = ({ data }) => (
	<Descriptions
		title="Property Info"
		size="small"
		layout="vertical"
	>
		<Descriptions.Item label="Id">{data.id}</Descriptions.Item>
		<Descriptions.Item label="Created At">{formatPropertyDate(data.createdAt)}</Descriptions.Item>
		<Descriptions.Item label="Updated At">{formatPropertyDate(data.updatedAt)}</Descriptions.Item>
	</Descriptions>
);

/** A visible textual marker useful when a property has no editable form. */
export const ReadOnlyPropertyNotice: React.FC = () => <Text type="secondary">This property is view only.</Text>;
