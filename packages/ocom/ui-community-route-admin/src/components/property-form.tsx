import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Col, Form, Image, Input, InputNumber, Row, Select, Space, Switch, Typography } from 'antd';
import type React from 'react';
import { useRef } from 'react';
import type { PropertyUpdateInput } from '../generated.tsx';
import { COUNTRY_SELECT_OPTIONS, STATE_SELECT_OPTIONS } from './address-options.ts';
import { commaListRule, emailRules, integerRangeRule, maxLengthRule } from './property-form.validation.ts';

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
	/**
	 * When provided, a second "Save & Close" submit button is rendered that
	 * runs the same form validation and routes successfully validated values
	 * here instead of {@link PropertyFormProps.onSubmit}.
	 */
	onSubmitAndClose?: ((values: PropertyFormValues) => void) | undefined;
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

/**
 * Comma-list fields always submit an array — an emptied field submits `[]` so
 * the backend clears the stored list instead of treating it as omitted.
 */
const listOrEmpty = (value?: string | null): string[] => splitCommaList(value);

/** Property input fields shared by the create and update mutations. */
type PropertyFormInputFields = Omit<PropertyUpdateInput, 'id' | 'propertyName'>;

/**
 * Converts submitted form values into the shared create/update input fields.
 * Emptied text fields are sent as explicit nulls so the backend clears them;
 * comma-separated fields become arrays, sent as `[]` when emptied so the
 * backend clears the stored list.
 */
export const toPropertyInputFields = (values: PropertyFormValues): PropertyFormInputFields => ({
	propertyType: trimmedOrNull(values.propertyType),
	ownerId: values.ownerId ?? null,
	listedForSale: values.listedForSale ?? false,
	listedForRent: values.listedForRent ?? false,
	listedForLease: values.listedForLease ?? false,
	listedInDirectory: values.listedInDirectory ?? false,
	tags: listOrEmpty(values.tags),
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
		amenities: listOrEmpty(values.listingDetail?.amenities),
		bedroomDetails: (values.listingDetail?.bedroomDetails ?? []).map((row) => ({
			roomName: trimmedOrNull(row.roomName),
			bedDescriptions: listOrEmpty(row.bedDescriptions),
		})),
		additionalAmenities: (values.listingDetail?.additionalAmenities ?? []).map((row) => ({
			category: trimmedOrNull(row.category),
			amenities: listOrEmpty(row.amenities),
		})),
		images: listOrEmpty(values.listingDetail?.images),
		video: trimmedOrNull(values.listingDetail?.video),
		floorPlan: trimmedOrNull(values.listingDetail?.floorPlan),
		floorPlanImages: listOrEmpty(values.listingDetail?.floorPlanImages),
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
	// Which submit button triggered the pending submission; both buttons share
	// the same validation and scroll-to-error behavior via htmlType="submit".
	const submitIntentRef = useRef<'save' | 'saveAndClose'>('save');
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
			scrollToFirstError={{ behavior: 'auto', block: 'center' }}
			onFinish={(values) => {
				if (submitIntentRef.current === 'saveAndClose' && props.onSubmitAndClose) {
					props.onSubmitAndClose(values);
					return;
				}
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
						rules={[{ required: true, whitespace: true, message: 'Property name is required.' }, maxLengthRule('Property name', 100)]}
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
						rules={[maxLengthRule('Property type', 100)]}
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
				rules={[commaListRule('tag', 100)]}
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
						<Select
							allowClear
							showSearch
							optionFilterProp="label"
							placeholder="State"
							options={[...STATE_SELECT_OPTIONS]}
							getPopupContainer={(trigger: HTMLElement) => trigger.parentElement ?? document.body}
						/>
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
						<Select
							allowClear
							showSearch
							optionFilterProp="label"
							placeholder="Country"
							options={[...COUNTRY_SELECT_OPTIONS]}
							getPopupContainer={(trigger: HTMLElement) => trigger.parentElement ?? document.body}
						/>
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
							prefix="$"
							precision={2}
							controls={false}
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
							prefix="$"
							precision={2}
							controls={false}
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
							prefix="$"
							precision={2}
							controls={false}
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
							suffix="months"
							controls={false}
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
						rules={[integerRangeRule('Max guests', 0, 1000)]}
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
						rules={[integerRangeRule('Bedrooms', 0, 1000)]}
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
						rules={[integerRangeRule('Square feet', 0, 1000000)]}
					>
						<InputNumber
							placeholder="Square Feet"
							controls={false}
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
						rules={[integerRangeRule('Year built', 0, 9999)]}
					>
						<InputNumber
							placeholder="Year Built"
							controls={false}
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
						rules={[integerRangeRule('Lot size', 0, 1000000)]}
					>
						<InputNumber
							placeholder="Lot Size"
							suffix="sq ft"
							controls={false}
							{...numberFieldProps}
						/>
					</Form.Item>
				</Col>
			</Row>
			<Form.Item
				name={['listingDetail', 'description']}
				label="Description"
				rules={[maxLengthRule('Description', 5000)]}
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
										rules={[maxLengthRule('Room name', 100)]}
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
										rules={[commaListRule('bed description', 100, 20)]}
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
				rules={[commaListRule('amenity', 100, 50)]}
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
										rules={[maxLengthRule('Category', 100)]}
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
										rules={[commaListRule('amenity', 100, 20)]}
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
				rules={[commaListRule('image URL', 2048, 50)]}
			>
				<Input placeholder="Comma-separated image URLs" />
			</Form.Item>
			<UrlGallery urlsText={imagesText} />
			<Form.Item
				name={['listingDetail', 'video']}
				label="Video"
				rules={[maxLengthRule('Video', 2048)]}
			>
				<Input placeholder="Video URL" />
			</Form.Item>
			<UrlLinkPreview urlText={videoText} />
			<Form.Item
				name={['listingDetail', 'floorPlan']}
				label="Floor Plan"
				rules={[maxLengthRule('Floor plan', 2048)]}
			>
				<Input placeholder="Floor plan URL" />
			</Form.Item>
			<UrlLinkPreview urlText={floorPlanText} />
			<Form.Item
				name={['listingDetail', 'floorPlanImages']}
				label="Floor Plan Images"
				rules={[commaListRule('floor plan image URL', 2048, 50)]}
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
						rules={[maxLengthRule('Listing agent', 500)]}
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
						rules={[maxLengthRule('Listing agent phone', 100)]}
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
						rules={emailRules('Listing agent email')}
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
						rules={[maxLengthRule('Listing agent website', 1000)]}
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
						rules={[maxLengthRule('Listing agent company', 500)]}
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
						rules={[maxLengthRule('Listing agent company phone', 100)]}
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
						rules={emailRules('Listing agent company email')}
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
						rules={[maxLengthRule('Listing agent company website', 1000)]}
					>
						<Input placeholder="Listing Agent Company Website" />
					</Form.Item>
				</Col>
			</Row>
			<Form.Item
				name={['listingDetail', 'listingAgentCompanyAddress']}
				label="Listing Agent Company Address"
				rules={[maxLengthRule('Listing agent company address', 1000)]}
			>
				<Input placeholder="Listing Agent Company Address" />
			</Form.Item>

			<Space>
				<Button
					type="primary"
					htmlType="submit"
					loading={props.submitting ?? false}
					onClick={() => {
						submitIntentRef.current = 'save';
					}}
				>
					{props.submitLabel}
				</Button>
				{props.onSubmitAndClose ? (
					<Button
						htmlType="submit"
						loading={props.submitting ?? false}
						onClick={() => {
							submitIntentRef.current = 'saveAndClose';
						}}
					>
						Save & Close
					</Button>
				) : null}
			</Space>
		</Form>
	);
};
