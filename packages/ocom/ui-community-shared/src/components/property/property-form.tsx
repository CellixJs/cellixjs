import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Col, Form, Image, Input, InputNumber, Row, Select, Space, Switch, Typography } from 'antd';
import type React from 'react';
import { useRef } from 'react';
import { COUNTRY_SELECT_OPTIONS, stateSelectOptionsForCountry } from './address-options.ts';
import { PROPERTY_EDIT_POLICIES, type PropertyEditPolicy } from './property-edit-policy.ts';
import { commaListRule, emailRules, halfStepRangeRule, integerRangeRule, isSafeHttpUrl, maxLengthRule, safeHttpUrlListRule, safeHttpUrlRule } from './property-form.validation.ts';
import type { PropertyFormMemberOption, PropertyFormValues } from './property-types.ts';

const { Title } = Typography;

export interface PropertyFormProps {
	initialValues?: PropertyFormValues | undefined;
	members?: PropertyFormMemberOption[] | undefined;
	membersLoading?: boolean | undefined;
	submitLabel: string;
	submitting?: boolean | undefined;
	editPolicy?: PropertyEditPolicy | undefined;
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

const numberFieldProps = { min: 0, style: { width: '100%' } } as const;

interface UrlGalleryProps {
	urlsText?: string | undefined;
}

/** Inline gallery preview for a comma-separated list of image URLs. */
const UrlGallery: React.FC<UrlGalleryProps> = (props) => {
	const urls = splitCommaList(props.urlsText).filter(isSafeHttpUrl);
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
	// Only linkify http(s) URLs; other schemes (javascript:, data:, ...) render
	// as inert text so a stored value can never execute in a viewer's browser.
	if (!isSafeHttpUrl(url)) {
		return <span>{url}</span>;
	}
	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
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
	const editPolicy = props.editPolicy ?? PROPERTY_EDIT_POLICIES.managerCreate;
	// Which submit button triggered the pending submission; both buttons share
	// the same validation and scroll-to-error behavior via htmlType="submit".
	const submitIntentRef = useRef<'save' | 'saveAndClose'>('save');
	const imagesText = Form.useWatch<string | undefined>(['listingDetail', 'images'], form);
	const videoText = Form.useWatch<string | undefined>(['listingDetail', 'video'], form);
	const floorPlanText = Form.useWatch<string | undefined>(['listingDetail', 'floorPlan'], form);
	const floorPlanImagesText = Form.useWatch<string | undefined>(['listingDetail', 'floorPlanImages'], form);
	// Country drives the state/province cascade: countries with a subdivision
	// list (US/Canada) get a Select, everything else a free-text Input.
	const selectedCountry = Form.useWatch<string | undefined>(['location', 'address', 'country'], form);
	const stateOptions = stateSelectOptionsForCountry(selectedCountry);

	const ownerOptions = (props.members ?? []).map((member) => {
		const memberName = member.memberName ?? member.id;
		return { value: member.id, label: memberName, title: memberName };
	});

	if (!editPolicy.canEditListingContent) {
		return null;
	}

	return (
		<Form
			layout="vertical"
			form={form}
			initialValues={props.initialValues ?? { propertyName: '' }}
			scrollToFirstError={{ behavior: 'auto', block: 'center' }}
			onFinish={(values) => {
				const intent = submitIntentRef.current;
				// Consume the intent so a later Enter-key submit (which clicks no
				// button) defaults to a plain save rather than replaying Save & Close.
				submitIntentRef.current = 'save';
				if (intent === 'saveAndClose' && props.onSubmitAndClose) {
					props.onSubmitAndClose(values);
					return;
				}
				props.onSubmit(values);
			}}
			onFinishFailed={() => {
				// Failed validation must not leave a stale Save & Close intent
				// behind; after corrections, Enter-key submits stay on the page.
				submitIntentRef.current = 'save';
			}}
		>
			<Title level={4}>Overview</Title>
			{editPolicy.canEditPropertyName || editPolicy.canEditPropertyType ? (
				<Row gutter={16}>
					{editPolicy.canEditPropertyName ? (
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
					) : null}
					{editPolicy.canEditPropertyType ? (
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
					) : null}
				</Row>
			) : null}
			{editPolicy.canEditOwner ? (
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
			) : null}
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
				rules={[commaListRule('tag', 100, 50)]}
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
						{stateOptions ? (
							<Select
								allowClear
								showSearch
								optionFilterProp="label"
								placeholder="State"
								options={[...stateOptions]}
								getPopupContainer={(trigger: HTMLElement) => trigger.parentElement ?? document.body}
							/>
						) : (
							<Input placeholder="State / Province / Region" />
						)}
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
							onChange={() => {
								// Changing (or clearing) the country invalidates any
								// previously chosen state/province.
								form.setFieldValue(['location', 'address', 'countrySubdivision'], undefined);
							}}
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
						rules={[halfStepRangeRule('Bathrooms', 0, 1000)]}
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
								disabled={fields.length >= 50}
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
								disabled={fields.length >= 50}
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
				rules={[commaListRule('image URL', 2048, 50), safeHttpUrlListRule('Image')]}
			>
				<Input placeholder="Comma-separated image URLs" />
			</Form.Item>
			<UrlGallery urlsText={imagesText} />
			<Form.Item
				name={['listingDetail', 'video']}
				label="Video"
				rules={[maxLengthRule('Video', 2048), safeHttpUrlRule('Video')]}
			>
				<Input placeholder="Video URL" />
			</Form.Item>
			<UrlLinkPreview urlText={videoText} />
			<Form.Item
				name={['listingDetail', 'floorPlan']}
				label="Floor Plan"
				rules={[maxLengthRule('Floor plan', 2048), safeHttpUrlRule('Floor plan')]}
			>
				<Input placeholder="Floor plan URL" />
			</Form.Item>
			<UrlLinkPreview urlText={floorPlanText} />
			<Form.Item
				name={['listingDetail', 'floorPlanImages']}
				label="Floor Plan Images"
				rules={[commaListRule('floor plan image URL', 2048, 50), safeHttpUrlListRule('Floor plan image')]}
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

			{editPolicy.canSubmit ? (
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
			) : null}
		</Form>
	);
};
