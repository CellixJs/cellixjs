import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Col, Form, Image, Input, InputNumber, Row, Select, Space, Switch, Typography } from 'antd';
import type React from 'react';
import type { PropertyUpdateInput } from '../generated.tsx';

const { Title } = Typography;

/** Values of one bedroom detail row; bed descriptions are comma-separated. */
interface PropertyFormBedroomDetailValues {
	roomName?: string | null | undefined;
	bedDescriptions?: string | null | undefined;
}

/** Values of one additional amenity row; amenities are comma-separated. */
interface PropertyFormAdditionalAmenityValues {
	category?: string | null | undefined;
	amenities?: string | null | undefined;
}

/**
 * Form-internal value shape of the shared property form. List-like fields
 * (tags, amenities, images, ...) are edited as comma-separated strings and
 * converted to arrays at the form boundary.
 */
export interface PropertyFormValues {
	propertyName?: string | undefined;
	propertyType?: string | null | undefined;
	ownerId?: string | null | undefined;
	listedForSale?: boolean | undefined;
	listedForRent?: boolean | undefined;
	listedForLease?: boolean | undefined;
	listedInDirectory?: boolean | undefined;
	tags?: string | null | undefined;
	location?: {
		address?: {
			streetNumber?: string | null | undefined;
			streetName?: string | null | undefined;
			municipality?: string | null | undefined;
			countrySubdivision?: string | null | undefined;
			postalCode?: string | null | undefined;
			country?: string | null | undefined;
		};
	};
	listingDetail?: {
		price?: number | null | undefined;
		rentHigh?: number | null | undefined;
		rentLow?: number | null | undefined;
		lease?: number | null | undefined;
		maxGuests?: number | null | undefined;
		bedrooms?: number | null | undefined;
		bathrooms?: number | null | undefined;
		squareFeet?: number | null | undefined;
		yearBuilt?: number | null | undefined;
		lotSize?: number | null | undefined;
		description?: string | null | undefined;
		amenities?: string | null | undefined;
		bedroomDetails?: PropertyFormBedroomDetailValues[] | undefined;
		additionalAmenities?: PropertyFormAdditionalAmenityValues[] | undefined;
		images?: string | null | undefined;
		video?: string | null | undefined;
		floorPlan?: string | null | undefined;
		floorPlanImages?: string | null | undefined;
		listingAgent?: string | null | undefined;
		listingAgentPhone?: string | null | undefined;
		listingAgentEmail?: string | null | undefined;
		listingAgentWebsite?: string | null | undefined;
		listingAgentCompany?: string | null | undefined;
		listingAgentCompanyPhone?: string | null | undefined;
		listingAgentCompanyEmail?: string | null | undefined;
		listingAgentCompanyWebsite?: string | null | undefined;
		listingAgentCompanyAddress?: string | null | undefined;
	};
}

/** Member option offered by the Owner select. */
export interface PropertyFormMemberOption {
	id: string;
	memberName?: string | null | undefined;
}

interface PropertyFormProps {
	initialValues?: PropertyFormValues | undefined;
	members?: PropertyFormMemberOption[] | undefined;
	membersLoading?: boolean | undefined;
	submitLabel: string;
	submitting?: boolean | undefined;
	onSubmit: (values: PropertyFormValues) => void;
}

/** Splits a comma-separated string into trimmed, non-empty entries. */
const splitCommaList = (value?: string | null): string[] =>
	(value ?? '')
		.split(',')
		.map((part) => part.trim())
		.filter((part) => part.length > 0);

/** Joins list entries into a comma-separated display string, dropping blanks. */
export const joinCommaList = (values?: readonly (string | null | undefined)[] | null): string => (values ?? []).filter((value): value is string => typeof value === 'string' && value.trim().length > 0).join(', ');

const trimmedOrNull = (value?: string | null): string | null => {
	const trimmed = (value ?? '').trim();
	return trimmed.length > 0 ? trimmed : null;
};

const listOrNull = (value?: string | null): string[] | null => {
	const list = splitCommaList(value);
	return list.length > 0 ? list : null;
};

/** Property input fields shared by the create and update mutations. */
type PropertyFormInputFields = Omit<PropertyUpdateInput, 'id' | 'propertyName'>;

/**
 * Converts submitted form values into the shared create/update input fields.
 * Emptied text fields are sent as explicit nulls so the backend clears them;
 * comma-separated fields become arrays.
 */
export const toPropertyInputFields = (values: PropertyFormValues): PropertyFormInputFields => ({
	propertyType: trimmedOrNull(values.propertyType),
	ownerId: values.ownerId ?? null,
	listedForSale: values.listedForSale ?? false,
	listedForRent: values.listedForRent ?? false,
	listedForLease: values.listedForLease ?? false,
	listedInDirectory: values.listedInDirectory ?? false,
	tags: listOrNull(values.tags),
	location: {
		address: {
			streetNumber: trimmedOrNull(values.location?.address?.streetNumber),
			streetName: trimmedOrNull(values.location?.address?.streetName),
			municipality: trimmedOrNull(values.location?.address?.municipality),
			countrySubdivision: trimmedOrNull(values.location?.address?.countrySubdivision),
			postalCode: trimmedOrNull(values.location?.address?.postalCode),
			country: trimmedOrNull(values.location?.address?.country),
		},
	},
	listingDetail: {
		price: values.listingDetail?.price ?? null,
		rentHigh: values.listingDetail?.rentHigh ?? null,
		rentLow: values.listingDetail?.rentLow ?? null,
		lease: values.listingDetail?.lease ?? null,
		maxGuests: values.listingDetail?.maxGuests ?? null,
		bedrooms: values.listingDetail?.bedrooms ?? null,
		bathrooms: values.listingDetail?.bathrooms ?? null,
		squareFeet: values.listingDetail?.squareFeet ?? null,
		yearBuilt: values.listingDetail?.yearBuilt ?? null,
		lotSize: values.listingDetail?.lotSize ?? null,
		description: trimmedOrNull(values.listingDetail?.description),
		amenities: listOrNull(values.listingDetail?.amenities),
		bedroomDetails: (values.listingDetail?.bedroomDetails ?? []).map((row) => ({
			roomName: trimmedOrNull(row.roomName),
			bedDescriptions: listOrNull(row.bedDescriptions),
		})),
		additionalAmenities: (values.listingDetail?.additionalAmenities ?? []).map((row) => ({
			category: trimmedOrNull(row.category),
			amenities: listOrNull(row.amenities),
		})),
		images: listOrNull(values.listingDetail?.images),
		video: trimmedOrNull(values.listingDetail?.video),
		floorPlan: trimmedOrNull(values.listingDetail?.floorPlan),
		floorPlanImages: listOrNull(values.listingDetail?.floorPlanImages),
		listingAgent: trimmedOrNull(values.listingDetail?.listingAgent),
		listingAgentPhone: trimmedOrNull(values.listingDetail?.listingAgentPhone),
		listingAgentEmail: trimmedOrNull(values.listingDetail?.listingAgentEmail),
		listingAgentWebsite: trimmedOrNull(values.listingDetail?.listingAgentWebsite),
		listingAgentCompany: trimmedOrNull(values.listingDetail?.listingAgentCompany),
		listingAgentCompanyPhone: trimmedOrNull(values.listingDetail?.listingAgentCompanyPhone),
		listingAgentCompanyEmail: trimmedOrNull(values.listingDetail?.listingAgentCompanyEmail),
		listingAgentCompanyWebsite: trimmedOrNull(values.listingDetail?.listingAgentCompanyWebsite),
		listingAgentCompanyAddress: trimmedOrNull(values.listingDetail?.listingAgentCompanyAddress),
	},
});

const numberFieldProps = { min: 0, style: { width: '100%' } } as const;

interface UrlGalleryProps {
	urlsText?: string | undefined;
}

/** Inline gallery preview for a comma-separated list of image URLs. */
const UrlGallery: React.FC<UrlGalleryProps> = (props) => {
	const urls = splitCommaList(props.urlsText);
	if (urls.length === 0) {
		return null;
	}
	return (
		<Image.PreviewGroup>
			<Space wrap>
				{urls.map((url) => (
					<Image
						key={url}
						src={url}
						alt={url}
						width={96}
						height={72}
					/>
				))}
			</Space>
		</Image.PreviewGroup>
	);
};

interface UrlLinkPreviewProps {
	urlText?: string | undefined;
}

/** Inline link preview for a single URL field. */
const UrlLinkPreview: React.FC<UrlLinkPreviewProps> = (props) => {
	const url = (props.urlText ?? '').trim();
	if (url.length === 0) {
		return null;
	}
	return (
		<a
			href={url}
			target="_blank"
			rel="noreferrer"
		>
			{url}
		</a>
	);
};

/**
 * Shared property form used by both the create and detail admin screens. It
 * renders the full property field set in Overview, Location, and Listing
 * sections; the containers convert between GraphQL data/input shapes and
 * {@link PropertyFormValues}.
 */
export const PropertyForm: React.FC<PropertyFormProps> = (props) => {
	const [form] = Form.useForm<PropertyFormValues>();
	const imagesText = Form.useWatch<string | undefined>(['listingDetail', 'images'], form);
	const videoText = Form.useWatch<string | undefined>(['listingDetail', 'video'], form);
	const floorPlanText = Form.useWatch<string | undefined>(['listingDetail', 'floorPlan'], form);
	const floorPlanImagesText = Form.useWatch<string | undefined>(['listingDetail', 'floorPlanImages'], form);

	const ownerOptions = (props.members ?? []).map((member) => {
		const memberName = member.memberName ?? member.id;
		return { value: member.id, label: memberName, title: memberName };
	});

	return (
		<Form
			layout="vertical"
			form={form}
			initialValues={props.initialValues ?? { propertyName: '' }}
			onFinish={(values) => {
				props.onSubmit(values);
			}}
		>
			<Title level={4}>Overview</Title>
			<Row gutter={16}>
				<Col
					xs={24}
					md={12}
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
				</Col>
				<Col
					xs={24}
					md={12}
				>
					<Form.Item
						name={['propertyType']}
						label="Property Type"
					>
						<Input
							placeholder="Property Type"
							maxLength={100}
						/>
					</Form.Item>
				</Col>
			</Row>
			<Row gutter={16}>
				<Col
					xs={24}
					md={12}
				>
					<Form.Item
						name={['ownerId']}
						label="Owner"
					>
						<Select
							allowClear
							placeholder="Select an owner"
							loading={props.membersLoading ?? false}
							options={ownerOptions}
							getPopupContainer={(trigger: HTMLElement) => trigger.parentElement ?? document.body}
						/>
					</Form.Item>
				</Col>
			</Row>
			<Row gutter={16}>
				<Col>
					<Form.Item
						name={['listedForSale']}
						label="Listed For Sale"
						valuePropName="checked"
					>
						<Switch />
					</Form.Item>
				</Col>
				<Col>
					<Form.Item
						name={['listedForRent']}
						label="Listed For Rent"
						valuePropName="checked"
					>
						<Switch />
					</Form.Item>
				</Col>
				<Col>
					<Form.Item
						name={['listedForLease']}
						label="Listed For Lease"
						valuePropName="checked"
					>
						<Switch />
					</Form.Item>
				</Col>
				<Col>
					<Form.Item
						name={['listedInDirectory']}
						label="Listed In Directory"
						valuePropName="checked"
					>
						<Switch />
					</Form.Item>
				</Col>
			</Row>
			<Form.Item
				name={['tags']}
				label="Tags"
			>
				<Input placeholder="Comma-separated tags" />
			</Form.Item>

			<Title level={4}>Location</Title>
			<Row gutter={16}>
				<Col
					xs={24}
					md={8}
				>
					<Form.Item
						name={['location', 'address', 'streetNumber']}
						label="Street Number"
					>
						<Input placeholder="Street Number" />
					</Form.Item>
				</Col>
				<Col
					xs={24}
					md={16}
				>
					<Form.Item
						name={['location', 'address', 'streetName']}
						label="Street Name"
					>
						<Input placeholder="Street Name" />
					</Form.Item>
				</Col>
			</Row>
			<Row gutter={16}>
				<Col
					xs={24}
					md={8}
				>
					<Form.Item
						name={['location', 'address', 'municipality']}
						label="City"
					>
						<Input placeholder="City" />
					</Form.Item>
				</Col>
				<Col
					xs={24}
					md={4}
				>
					<Form.Item
						name={['location', 'address', 'countrySubdivision']}
						label="State"
					>
						<Input placeholder="State" />
					</Form.Item>
				</Col>
				<Col
					xs={24}
					md={6}
				>
					<Form.Item
						name={['location', 'address', 'postalCode']}
						label="Postal Code"
					>
						<Input placeholder="Postal Code" />
					</Form.Item>
				</Col>
				<Col
					xs={24}
					md={6}
				>
					<Form.Item
						name={['location', 'address', 'country']}
						label="Country"
					>
						<Input placeholder="Country" />
					</Form.Item>
				</Col>
			</Row>

			<Title level={4}>Listing</Title>
			<Title level={5}>Details</Title>
			<Row gutter={16}>
				<Col
					xs={24}
					md={8}
				>
					<Form.Item
						name={['listingDetail', 'price']}
						label="Price"
					>
						<InputNumber
							placeholder="Price"
							{...numberFieldProps}
						/>
					</Form.Item>
				</Col>
				<Col
					xs={24}
					md={8}
				>
					<Form.Item
						name={['listingDetail', 'rentHigh']}
						label="Rent High"
					>
						<InputNumber
							placeholder="Rent High"
							{...numberFieldProps}
						/>
					</Form.Item>
				</Col>
				<Col
					xs={24}
					md={8}
				>
					<Form.Item
						name={['listingDetail', 'rentLow']}
						label="Rent Low"
					>
						<InputNumber
							placeholder="Rent Low"
							{...numberFieldProps}
						/>
					</Form.Item>
				</Col>
			</Row>
			<Row gutter={16}>
				<Col
					xs={24}
					md={8}
				>
					<Form.Item
						name={['listingDetail', 'lease']}
						label="Lease"
					>
						<InputNumber
							placeholder="Lease"
							{...numberFieldProps}
						/>
					</Form.Item>
				</Col>
				<Col
					xs={24}
					md={8}
				>
					<Form.Item
						name={['listingDetail', 'maxGuests']}
						label="Max Guests"
					>
						<InputNumber
							placeholder="Max Guests"
							{...numberFieldProps}
						/>
					</Form.Item>
				</Col>
				<Col
					xs={24}
					md={8}
				>
					<Form.Item
						name={['listingDetail', 'bedrooms']}
						label="Bedrooms"
					>
						<InputNumber
							placeholder="Bedrooms"
							{...numberFieldProps}
						/>
					</Form.Item>
				</Col>
			</Row>
			<Row gutter={16}>
				<Col
					xs={24}
					md={8}
				>
					<Form.Item
						name={['listingDetail', 'bathrooms']}
						label="Bathrooms"
						rules={[
							{
								validator: (_rule, value: number | null | undefined) =>
									value === undefined || value === null || Number.isInteger(value * 2) ? Promise.resolve() : Promise.reject(new Error('Bathrooms must be in increments of 0.5')),
							},
						]}
					>
						<InputNumber
							placeholder="Bathrooms"
							step={0.5}
							{...numberFieldProps}
						/>
					</Form.Item>
				</Col>
				<Col
					xs={24}
					md={8}
				>
					<Form.Item
						name={['listingDetail', 'squareFeet']}
						label="Square Feet"
					>
						<InputNumber
							placeholder="Square Feet"
							{...numberFieldProps}
						/>
					</Form.Item>
				</Col>
				<Col
					xs={24}
					md={8}
				>
					<Form.Item
						name={['listingDetail', 'yearBuilt']}
						label="Year Built"
					>
						<InputNumber
							placeholder="Year Built"
							{...numberFieldProps}
						/>
					</Form.Item>
				</Col>
			</Row>
			<Row gutter={16}>
				<Col
					xs={24}
					md={8}
				>
					<Form.Item
						name={['listingDetail', 'lotSize']}
						label="Lot Size"
					>
						<InputNumber
							placeholder="Lot Size"
							{...numberFieldProps}
						/>
					</Form.Item>
				</Col>
			</Row>
			<Form.Item
				name={['listingDetail', 'description']}
				label="Description"
			>
				<Input.TextArea
					placeholder="Description"
					rows={3}
				/>
			</Form.Item>
			<Title level={5}>Bedroom Details</Title>
			<Form.List name={['listingDetail', 'bedroomDetails']}>
				{(fields, { add, remove }) => (
					<>
						{fields.map(({ key, name }) => (
							<Row
								key={key}
								gutter={16}
								align="middle"
							>
								<Col
									xs={24}
									md={10}
								>
									<Form.Item
										name={[name, 'roomName']}
										label="Room Name"
									>
										<Input placeholder="Room Name" />
									</Form.Item>
								</Col>
								<Col
									xs={22}
									md={12}
								>
									<Form.Item
										name={[name, 'bedDescriptions']}
										label="Bed Descriptions"
									>
										<Input placeholder="Comma-separated bed descriptions" />
									</Form.Item>
								</Col>
								<Col span={2}>
									<Button
										type="text"
										aria-label="Remove bedroom detail row"
										icon={<MinusCircleOutlined />}
										onClick={() => remove(name)}
									/>
								</Col>
							</Row>
						))}
						<Form.Item>
							<Button
								type="dashed"
								onClick={() => add()}
								icon={<PlusOutlined />}
							>
								Add Bedroom Detail
							</Button>
						</Form.Item>
					</>
				)}
			</Form.List>

			<Title level={5}>Amenities</Title>
			<Form.Item
				name={['listingDetail', 'amenities']}
				label="Amenities"
			>
				<Input placeholder="Comma-separated amenities" />
			</Form.Item>
			<Title level={5}>Additional Amenities</Title>
			<Form.List name={['listingDetail', 'additionalAmenities']}>
				{(fields, { add, remove }) => (
					<>
						{fields.map(({ key, name }) => (
							<Row
								key={key}
								gutter={16}
								align="middle"
							>
								<Col
									xs={24}
									md={10}
								>
									<Form.Item
										name={[name, 'category']}
										label="Category"
									>
										<Input placeholder="Category" />
									</Form.Item>
								</Col>
								<Col
									xs={22}
									md={12}
								>
									<Form.Item
										name={[name, 'amenities']}
										label="Amenities"
									>
										<Input placeholder="Comma-separated amenities" />
									</Form.Item>
								</Col>
								<Col span={2}>
									<Button
										type="text"
										aria-label="Remove additional amenity row"
										icon={<MinusCircleOutlined />}
										onClick={() => remove(name)}
									/>
								</Col>
							</Row>
						))}
						<Form.Item>
							<Button
								type="dashed"
								onClick={() => add()}
								icon={<PlusOutlined />}
							>
								Add Additional Amenity
							</Button>
						</Form.Item>
					</>
				)}
			</Form.List>

			<Title level={5}>Media</Title>
			<Form.Item
				name={['listingDetail', 'images']}
				label="Images"
			>
				<Input placeholder="Comma-separated image URLs" />
			</Form.Item>
			<UrlGallery urlsText={imagesText} />
			<Form.Item
				name={['listingDetail', 'video']}
				label="Video"
			>
				<Input placeholder="Video URL" />
			</Form.Item>
			<UrlLinkPreview urlText={videoText} />
			<Form.Item
				name={['listingDetail', 'floorPlan']}
				label="Floor Plan"
			>
				<Input placeholder="Floor plan URL" />
			</Form.Item>
			<UrlLinkPreview urlText={floorPlanText} />
			<Form.Item
				name={['listingDetail', 'floorPlanImages']}
				label="Floor Plan Images"
			>
				<Input placeholder="Comma-separated floor plan image URLs" />
			</Form.Item>
			<UrlGallery urlsText={floorPlanImagesText} />

			<Title level={5}>Agent</Title>
			<Row gutter={16}>
				<Col
					xs={24}
					md={12}
				>
					<Form.Item
						name={['listingDetail', 'listingAgent']}
						label="Listing Agent"
					>
						<Input placeholder="Listing Agent" />
					</Form.Item>
				</Col>
				<Col
					xs={24}
					md={12}
				>
					<Form.Item
						name={['listingDetail', 'listingAgentPhone']}
						label="Listing Agent Phone"
					>
						<Input placeholder="Listing Agent Phone" />
					</Form.Item>
				</Col>
			</Row>
			<Row gutter={16}>
				<Col
					xs={24}
					md={12}
				>
					<Form.Item
						name={['listingDetail', 'listingAgentEmail']}
						label="Listing Agent Email"
					>
						<Input placeholder="Listing Agent Email" />
					</Form.Item>
				</Col>
				<Col
					xs={24}
					md={12}
				>
					<Form.Item
						name={['listingDetail', 'listingAgentWebsite']}
						label="Listing Agent Website"
					>
						<Input placeholder="Listing Agent Website" />
					</Form.Item>
				</Col>
			</Row>
			<Row gutter={16}>
				<Col
					xs={24}
					md={12}
				>
					<Form.Item
						name={['listingDetail', 'listingAgentCompany']}
						label="Listing Agent Company"
					>
						<Input placeholder="Listing Agent Company" />
					</Form.Item>
				</Col>
				<Col
					xs={24}
					md={12}
				>
					<Form.Item
						name={['listingDetail', 'listingAgentCompanyPhone']}
						label="Listing Agent Company Phone"
					>
						<Input placeholder="Listing Agent Company Phone" />
					</Form.Item>
				</Col>
			</Row>
			<Row gutter={16}>
				<Col
					xs={24}
					md={12}
				>
					<Form.Item
						name={['listingDetail', 'listingAgentCompanyEmail']}
						label="Listing Agent Company Email"
					>
						<Input placeholder="Listing Agent Company Email" />
					</Form.Item>
				</Col>
				<Col
					xs={24}
					md={12}
				>
					<Form.Item
						name={['listingDetail', 'listingAgentCompanyWebsite']}
						label="Listing Agent Company Website"
					>
						<Input placeholder="Listing Agent Company Website" />
					</Form.Item>
				</Col>
			</Row>
			<Form.Item
				name={['listingDetail', 'listingAgentCompanyAddress']}
				label="Listing Agent Company Address"
			>
				<Input placeholder="Listing Agent Company Address" />
			</Form.Item>

			<Button
				type="primary"
				htmlType="submit"
				value={'save'}
				loading={props.submitting ?? false}
			>
				{props.submitLabel}
			</Button>
		</Form>
	);
};
