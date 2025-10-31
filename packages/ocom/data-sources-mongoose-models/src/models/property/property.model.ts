import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { type Model, type ObjectId, type PopulatedDoc, Schema, type Types } from 'mongoose';
import * as Community from '../community/community.model.ts';
import * as Member from '../member/member.model.ts';

/**
 * Point model - used to store lat/long coordinates
 */
export interface Point extends MongooseSeedwork.NestedPath {
	type: string;
	/**
	 * Latitude must be the first coordinate
	 */
	coordinates: number[] | null;
}

export interface BedroomDetail extends MongooseSeedwork.SubdocumentBase {
	roomName: string;
	bedDescriptions: string[];
}

const BedroomDetailSchema = new Schema<BedroomDetail, Model<BedroomDetail>, BedroomDetail>(
	{
		roomName: { type: String, required: false, maxlength: 100 },
		bedDescriptions: { type: [{ type: String, maxlength: 40 }], required: false },
	},
	{
		timestamps: true,
		versionKey: 'version',
	},
);

export interface AdditionalAmenity extends MongooseSeedwork.SubdocumentBase {
	category: string;
	amenities: string[];
}

const AdditionalAmenitySchema = new Schema<AdditionalAmenity, Model<AdditionalAmenity>, AdditionalAmenity>(
	{
		category: { type: String, required: false, maxlength: 100 },
		amenities: { type: [{ type: String, maxlength: 40 }], required: false },
	},
	{
		timestamps: true,
		versionKey: 'version',
	},
);

export interface ListingDetail extends MongooseSeedwork.NestedPath {
	price: number | null;
	rentHigh: number | null;
	rentLow: number | null;
	lease: number | null;
	maxGuests: number | null;
	bedrooms: number | null;
	bedroomDetails: Types.DocumentArray<BedroomDetail>;
	bathrooms: number | null;
	squareFeet: number | null;
	yearBuilt: number | null;
	lotSize: number | null;
	description: string | null;
	amenities: string[];
	additionalAmenities: Types.DocumentArray<AdditionalAmenity>;
	images: string[];
	video: string | null;
	floorPlan: string | null;
	floorPlanImages: string[];
	listingAgent: string | null;
	listingAgentPhone: string | null;
	listingAgentEmail: string | null;
	listingAgentWebsite: string | null;
	listingAgentCompany: string | null;
	listingAgentCompanyPhone: string | null;
	listingAgentCompanyEmail: string | null;
	listingAgentCompanyWebsite: string | null;
	listingAgentCompanyAddress: string | null;
}

export interface Location extends MongooseSeedwork.NestedPath {
	position: Point;
	address: {
		streetNumber: string;
		streetName: string;
		municipality: string;
		municipalitySubdivision: string;
		localName: string;
		countrySecondarySubdivision: string;
		countryTertiarySubdivision: string;
		countrySubdivision: string;
		countrySubdivisionName: string;
		postalCode: string;
		extendedPostalCode: string;
		countryCode: string;
		country: string;
		countryCodeISO3: string;
		freeformAddress: string;
		streetNameAndNumber: string;
		routeNumbers: string;
		crossStreet: string;
	};
}

export interface Property extends MongooseSeedwork.Base {
	community: PopulatedDoc<Community.Community> | ObjectId;
	location: Location;
	owner?: PopulatedDoc<Member.Member> | ObjectId;
	propertyName: string;
	propertyType: string;
	listedForSale: boolean;
	listedForRent: boolean;
	listedForLease: boolean;
	listedInDirectory: boolean;
	listingDetail: ListingDetail;
	tags: string[];
	hash: string | null;
	lastIndexed: Date | null;
	updateIndexFailedDate: Date | null;
}

const PropertySchema = new Schema<Property, Model<Property>, Property>(
	{
		schemaVersion: { type: String, default: '1.0.0' },
		community: {
			type: Schema.Types.ObjectId,
			ref: Community.CommunityModelName,
			required: true,
			index: true,
		},
		location: {
			position: {
				type: {
					type: String,
					enum: ['Point'],
					default: 'Point',
					required: true,
				},
				coordinates: { type: [Number], required: false },
			},
			address: {
				streetNumber: { type: String, required: false },
				streetName: { type: String, required: false },
				municipality: { type: String, required: false },
				municipalitySubdivision: { type: String, required: false },
				localName: { type: String, required: false },
				countrySecondarySubdivision: { type: String, required: false },
				countryTertiarySubdivision: { type: String, required: false },
				countrySubdivision: { type: String, required: false },
				countrySubdivisionName: { type: String, required: false },
				postalCode: { type: String, required: false },
				extendedPostalCode: { type: String, required: false },
				countryCode: { type: String, required: false },
				country: { type: String, required: false },
				countryCodeISO3: { type: String, required: false },
				freeformAddress: { type: String, required: false },
				streetNameAndNumber: { type: String, required: false },
				routeNumbers: { type: String, required: false },
				crossStreet: { type: String, required: false },
			},
		},
		owner: {
			type: Schema.Types.ObjectId,
			ref: Member.MemberModelName,
			required: false,
			index: true,
		},
		propertyName: { type: String, required: true, maxlength: 100, index: true },
		propertyType: { type: String, required: false, maxlength: 100 },
		listedForSale: { type: Boolean, required: false, default: false },
		listedForRent: { type: Boolean, required: false, default: false },
		listedForLease: { type: Boolean, required: false, default: false },
		listedInDirectory: { type: Boolean, required: false, default: false },
		listingDetail: {
			price: { type: Number, required: false },
			rentHigh: { type: Number, required: false },
			rentLow: { type: Number, required: false },
			lease: { type: Number, required: false },
			maxGuests: { type: Number, required: false },
			bedrooms: { type: Number, required: false },
			bedroomDetails: [BedroomDetailSchema],
			bathrooms: { type: Number, required: false },
			squareFeet: { type: Number, required: false },
			yearBuilt: { type: Number, required: false },
			lotSize: { type: Number, required: false },
			description: { type: String, required: false, maxlength: 5000 },
			amenities: { type: [{ type: String, maxlength: 100 }], required: false },
			additionalAmenities: [AdditionalAmenitySchema],
			images: { type: [String], required: false },
			video: { type: String, required: false },
			floorPlan: { type: String, required: false, maxlength: 2000 },
			floorPlanImages: { type: [String], required: false },
			listingAgent: { type: String, required: false, maxlength: 500 },
			listingAgentPhone: { type: String, required: false, maxlength: 100 },
			listingAgentEmail: { type: String, required: false, maxlength: 254 },
			listingAgentWebsite: { type: String, required: false, maxlength: 1000 },
			listingAgentCompany: { type: String, required: false, maxlength: 500 },
			listingAgentCompanyPhone: { type: String, required: false, maxlength: 100 },
			listingAgentCompanyEmail: { type: String, required: false, maxlength: 254 },
			listingAgentCompanyWebsite: { type: String, required: false, maxlength: 1000 },
			listingAgentCompanyAddress: { type: String, required: false, maxlength: 1000 },
		},
		tags: { type: [{ type: String, maxlength: 100 }], required: false },
		hash: { type: String, required: false, maxlength: 100 },
		lastIndexed: { type: Date, required: false },
		updateIndexFailedDate: { type: Date, required: false },
	},
	{
		timestamps: true,
		versionKey: 'version',
	},
)
	.index({ community: 1, propertyName: 1 }, { unique: true })
	.index({ 'location.position': '2dsphere' });

export const PropertyModelName = 'Property';
export const PropertyModelFactory = MongooseSeedwork.modelFactory<Property>(
	PropertyModelName,
	PropertySchema,
);
export type PropertyModelType = ReturnType<typeof PropertyModelFactory>;