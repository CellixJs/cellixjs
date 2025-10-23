import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { type Model, type PopulatedDoc, Schema, type SchemaDefinition, type Types } from 'mongoose';
import * as Community from '../community/index.ts';
import * as Member from '../member/index.ts';
import * as Property from '../property/index.ts';
import * as Service from '../service/index.ts';
import { type Ticket, type TicketModelType, ticketOptions } from './ticket.model.ts';

export interface ServiceTicketRevisionRequestChanges extends MongooseSeedwork.NestedPath {
  requestUpdatedAssignment: boolean;
  requestUpdatedStatus: boolean;
  requestUpdatedProperty: boolean;
}

export const ServiceTicketRevisionRequestChangesType = {
  requestUpdatedAssignment: { type: Boolean, required: true },
  requestUpdatedStatus: { type: Boolean, required: true },
  requestUpdatedProperty: { type: Boolean, required: true },
}

export interface ServiceTicketRevisionRequest extends MongooseSeedwork.NestedPath {
  requestedAt: Date;
  requestedBy: PopulatedDoc<Member.Member>;
  revisionSummary: string;
  requestedChanges: ServiceTicketRevisionRequestChanges;
  revisionSubmittedAt?: Date;
}

export const ServiceTicketRevisionRequestType: SchemaDefinition<ServiceTicketRevisionRequest> = {
  requestedAt: { type: Date, required: true },
  requestedBy: { type: Schema.Types.ObjectId, ref: Member.MemberModelName, required: true },
  revisionSummary: { type: String, required: true },
  requestedChanges: { type: ServiceTicketRevisionRequestChangesType, required: true, ...MongooseSeedwork.NestedPathOptions },
  revisionSubmittedAt: {type: Date, required: false}
}

export interface ServiceTicketActivityDetail extends MongooseSeedwork.SubdocumentBase {
  activityType: string;
  activityDescription: string;
  activityBy: PopulatedDoc<Member.Member>;
}
const ServiceTicketActivityDetailSchema = new Schema<ServiceTicketActivityDetail, Model<ServiceTicketActivityDetail>, ServiceTicketActivityDetail>(
  {
    activityType: {
      type: String,
      required: true,
      enum: ['CREATED', 'SUBMITTED', 'ASSIGNED', 'INPROGRESS', 'UPDATED', 'COMPLETED', 'CLOSED'],
    },
    activityDescription: {
      type: String,
      maxlength: 2000,
      required: true,
    },
    activityBy: { type: Schema.Types.ObjectId, ref: Member.MemberModelName, required: true, index: true },
  },
  {
    timestamps: true,
    versionKey: 'version',
  }
);

export interface ServiceTicketMessage extends MongooseSeedwork.SubdocumentBase {
  sentBy: string;
  initiatedBy?: PopulatedDoc<Member.Member>;
  message: string;
  embedding?: string;
  createdAt: Date;
  isHiddenFromApplicant: boolean;
}

const ServiceTicketMessageSchema = new Schema<ServiceTicketMessage, Model<ServiceTicketMessage>, ServiceTicketMessage>({
  sentBy: { type: String, required: true, enum: ['external', 'internal'] },
  initiatedBy: { type: Schema.Types.ObjectId, ref: Member.MemberModelName, required: false, index: true },
  message: { type: String, required: true, maxlength: 2000 },
  embedding: { type: String, required: false, maxlength: 2000 },
  createdAt: { type: Date, default: Date.now },
  isHiddenFromApplicant: { type: Boolean, required: true, default: false },
});

export interface Photo extends MongooseSeedwork.SubdocumentBase {
  documentId: string;
  description: string;
}
export const PhotoSchema = new Schema<Photo, Model<Photo>, Photo>({
  description: {
    type: String,
    required: false,
    maxlength: 300,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  documentId: { type: String, required: true },
});

export interface ServiceTicket extends Ticket {
  community: PopulatedDoc<Community.Community>;
  property?: PopulatedDoc<Property.Property>;
  requestor: PopulatedDoc<Member.Member>;
  assignedTo?: PopulatedDoc<Member.Member>;
  service?: PopulatedDoc<Service.Service>;
  title: string;
  description: string;
  status: string;
  priority: number;
  ticketType?: string;
  discriminatorKey: string;
  activityLog: Types.DocumentArray<ServiceTicketActivityDetail>;
  revisionRequest?: ServiceTicketRevisionRequest;
  messages: Types.DocumentArray<ServiceTicketMessage>;
  photos: Types.DocumentArray<Photo>;
  hash: string;
  lastIndexed: Date | undefined;
  updateIndexFailedDate: Date | undefined;
}

const ServiceTicketSchema = new Schema<ServiceTicket, Model<ServiceTicket>, ServiceTicket>(
  {
    schemaVersion: {
      type: String,
      default: '1.0.0',
      required: false,
    },
    community: { type: Schema.Types.ObjectId, ref: Community.CommunityModelName, required: true, index: true },
    property: { type: Schema.Types.ObjectId, ref: Property.PropertyModelName, required: false, index: true },
    requestor: { type: Schema.Types.ObjectId, ref: Member.MemberModelName, required: true, index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: Member.MemberModelName, required: false, index: true },
    service: { type: Schema.Types.ObjectId, ref: Service.ServiceModelName, required: false, index: true },

    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'ASSIGNED', 'INPROGRESS', 'COMPLETED', 'CLOSED'],
      default: 'DRAFT',
      required: true,
    },
    priority: {
      type: Number,
      required: true,
      default: 5,
      min: 1,
      max: 5,
    },
    activityLog: [ServiceTicketActivityDetailSchema],
    revisionRequest: { type: ServiceTicketRevisionRequestType, required: false, ...MongooseSeedwork.NestedPathOptions },
    messages: [ServiceTicketMessageSchema],
    photos: [PhotoSchema],
    hash: { type: String, required: false, maxlength: 100 },
    lastIndexed: { type: Date, required: false },
    updateIndexFailedDate: { type: Date, required: false },
  },
  ticketOptions
);

export const ServiceTicketModelName: string = 'service-ticket';

export const ServiceTicketModelFactory = (TicketModel: TicketModelType) => {
    return TicketModel.discriminator(ServiceTicketModelName, ServiceTicketSchema);
};

export type ServiceTicketModelType = ReturnType<typeof ServiceTicketModelFactory>;