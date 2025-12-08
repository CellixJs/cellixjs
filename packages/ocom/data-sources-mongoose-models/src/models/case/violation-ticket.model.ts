import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
// @ts-ignore [TS7]
import { type Model, type PopulatedDoc, Schema, type SchemaDefinition, type Types } from 'mongoose';
import * as Community from '../community/community.model.ts';
import * as Member from '../member/member.model.ts';
import * as Property from '../property/property.model.ts';
import * as Service from '../service/service.model.ts';
import { type Ticket, type TicketModelType, ticketOptions } from './ticket.model.ts';

// Finance Details Subdocuments
interface ViolationTicketFinanceDetailsAdhocTransactionsApproval extends MongooseSeedwork.NestedPath {
  isApplicantApprovalRequired: boolean;
  isApplicantApproved: boolean;
  applicantRespondedAt?: Date;
}

const ViolationTicketFinanceDetailsAdhocTransactionsApprovalType: SchemaDefinition<ViolationTicketFinanceDetailsAdhocTransactionsApproval> = {
  isApplicantApprovalRequired: { type: Boolean, required: true },
  isApplicantApproved: { type: Boolean, required: true },
  applicantRespondedAt: { type: Date, required: false },
};

interface ViolationTicketFinanceDetailsAdhocTransactionsFinanceReference extends MongooseSeedwork.NestedPath {
  referenceType: string;
  referenceId: string;
}

const ViolationTicketFinanceDetailsAdhocTransactionsFinanceReferenceType: SchemaDefinition<ViolationTicketFinanceDetailsAdhocTransactionsFinanceReference> = {
  referenceType: { type: String, required: true },
  referenceId: { type: String, required: true },
};

interface ViolationTicketFinanceDetailsAdhocTransactionsTransactionReference extends MongooseSeedwork.NestedPath {
  referenceType: string;
  referenceId: string;
}

const ViolationTicketFinanceDetailsAdhocTransactionsTransactionReferenceType: SchemaDefinition<ViolationTicketFinanceDetailsAdhocTransactionsTransactionReference> = {
  referenceType: { type: String, required: true },
  referenceId: { type: String, required: true },
};

interface ViolationTicketFinanceDetailsAdhocTransactions extends MongooseSeedwork.SubdocumentBase {
  amount: number;
  description: string;
  transactionType: string;
  approval: ViolationTicketFinanceDetailsAdhocTransactionsApproval;
  financeReference: ViolationTicketFinanceDetailsAdhocTransactionsFinanceReference;
  transactionReference: ViolationTicketFinanceDetailsAdhocTransactionsTransactionReference;
}

const ViolationTicketFinanceDetailsAdhocTransactionsSchema = new Schema<ViolationTicketFinanceDetailsAdhocTransactions, Model<ViolationTicketFinanceDetailsAdhocTransactions>, ViolationTicketFinanceDetailsAdhocTransactions>(
  {
    amount: { type: Number, required: true },
    description: { type: String, required: true, maxlength: 500 },
    transactionType: { type: String, required: true },
    approval: { type: ViolationTicketFinanceDetailsAdhocTransactionsApprovalType, required: true, ...MongooseSeedwork.NestedPathOptions },
    financeReference: { type: ViolationTicketFinanceDetailsAdhocTransactionsFinanceReferenceType, required: true, ...MongooseSeedwork.NestedPathOptions },
    transactionReference: { type: ViolationTicketFinanceDetailsAdhocTransactionsTransactionReferenceType, required: true, ...MongooseSeedwork.NestedPathOptions },
  },
  {
    timestamps: true,
    versionKey: 'version',
  }
);

interface ViolationTicketFinanceDetailsTransactionsSubmissionTransactionReference extends MongooseSeedwork.NestedPath {
  referenceType: string;
  referenceId: string;
}

const ViolationTicketFinanceDetailsTransactionsSubmissionTransactionReferenceType: SchemaDefinition<ViolationTicketFinanceDetailsTransactionsSubmissionTransactionReference> = {
  referenceType: { type: String, required: true },
  referenceId: { type: String, required: true },
};

interface ViolationTicketFinanceDetailsTransactionsSubmission extends MongooseSeedwork.NestedPath {
  amount: number;
  description: string;
  transactionReference: ViolationTicketFinanceDetailsTransactionsSubmissionTransactionReference;
}

const ViolationTicketFinanceDetailsTransactionsSubmissionType: SchemaDefinition<ViolationTicketFinanceDetailsTransactionsSubmission> = {
  amount: { type: Number, required: true },
  description: { type: String, required: true, maxlength: 500 },
  transactionReference: { type: ViolationTicketFinanceDetailsTransactionsSubmissionTransactionReferenceType, required: true, ...MongooseSeedwork.NestedPathOptions },
};

interface ViolationTicketFinanceDetailsTransactions extends MongooseSeedwork.NestedPath {
  submission: ViolationTicketFinanceDetailsTransactionsSubmission;
  adhocTransactions: Types.DocumentArray<ViolationTicketFinanceDetailsAdhocTransactions>;
}

const ViolationTicketFinanceDetailsTransactionsType: SchemaDefinition<ViolationTicketFinanceDetailsTransactions> = {
  submission: { type: ViolationTicketFinanceDetailsTransactionsSubmissionType, required: true, ...MongooseSeedwork.NestedPathOptions },
  adhocTransactions: [ViolationTicketFinanceDetailsAdhocTransactionsSchema],
};

interface ViolationTicketFinanceDetailsRevenueRecognition extends MongooseSeedwork.NestedPath {
  amount: number;
  description: string;
  recognizedAt: Date;
}

const ViolationTicketFinanceDetailsRevenueRecognitionType: SchemaDefinition<ViolationTicketFinanceDetailsRevenueRecognition> = {
  amount: { type: Number, required: true },
  description: { type: String, required: true, maxlength: 500 },
  recognizedAt: { type: Date, required: true },
};

interface ViolationTicketFinanceDetails extends MongooseSeedwork.NestedPath {
  serviceFee: number;
  transactions: ViolationTicketFinanceDetailsTransactions;
  revenueRecognition: ViolationTicketFinanceDetailsRevenueRecognition;
}

const ViolationTicketFinanceDetailsType: SchemaDefinition<ViolationTicketFinanceDetails> = {
  serviceFee: { type: Number, required: true },
  transactions: { type: ViolationTicketFinanceDetailsTransactionsType, required: true, ...MongooseSeedwork.NestedPathOptions },
  revenueRecognition: { type: ViolationTicketFinanceDetailsRevenueRecognitionType, required: true, ...MongooseSeedwork.NestedPathOptions },
};

// Revision Request
interface ViolationTicketRevisionRequest extends MongooseSeedwork.NestedPath {
  requestedAt: Date;
  requestedBy: PopulatedDoc<Member.Member>;
  revisionSummary: string;
  revisionSubmittedAt?: Date;
}

const ViolationTicketRevisionRequestType: SchemaDefinition<ViolationTicketRevisionRequest> = {
  requestedAt: { type: Date, required: true },
  requestedBy: { type: Schema.Types.ObjectId, ref: Member.MemberModelName, required: true },
  revisionSummary: { type: String, required: true },
  revisionSubmittedAt: { type: Date, required: false },
};

// Activity Detail
export interface ViolationTicketActivityDetail extends MongooseSeedwork.SubdocumentBase {
  activityType: string;
  activityDescription: string;
  activityBy: PopulatedDoc<Member.Member>;
}

const ViolationTicketActivityDetailSchema = new Schema<ViolationTicketActivityDetail, Model<ViolationTicketActivityDetail>, ViolationTicketActivityDetail>(
  {
    activityType: {
      type: String,
      required: true,
      enum: ['CREATED', 'SUBMITTED', 'ASSIGNED', 'PAID', 'CLOSED', 'UPDATED'],
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

// Message
export interface ViolationTicketMessage extends MongooseSeedwork.SubdocumentBase {
  sentBy: string;
  initiatedBy?: PopulatedDoc<Member.Member>;
  message: string;
  embedding?: string;
  createdAt: Date;
  isHiddenFromApplicant: boolean;
}

const ViolationTicketMessageSchema = new Schema<ViolationTicketMessage, Model<ViolationTicketMessage>, ViolationTicketMessage>(
  {
    sentBy: { type: String, required: true, enum: ['external', 'internal'] },
    initiatedBy: { type: Schema.Types.ObjectId, ref: Member.MemberModelName, required: false, index: true },
    message: { type: String, required: true, maxlength: 2000 },
    embedding: { type: String, required: false, maxlength: 2000 },
    createdAt: { type: Date, default: Date.now },
    isHiddenFromApplicant: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: false,
    versionKey: 'version',
  }
);

// Photo
interface ViolationTicketPhoto extends MongooseSeedwork.SubdocumentBase {
  documentId: string;
  description: string;
}

const ViolationTicketPhotoSchema = new Schema<ViolationTicketPhoto, Model<ViolationTicketPhoto>, ViolationTicketPhoto>(
  {
    documentId: { type: String, required: true },
    description: { type: String, required: false, maxlength: 300 },
  },
  {
    timestamps: true,
    versionKey: 'version',
  }
);

// Main Violation Ticket
export interface ViolationTicket extends Ticket {
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
  activityLog: Types.DocumentArray<ViolationTicketActivityDetail>;
  messages: Types.DocumentArray<ViolationTicketMessage>;
  photos: Types.DocumentArray<ViolationTicketPhoto>;
  financeDetails: ViolationTicketFinanceDetails;
  revisionRequest?: ViolationTicketRevisionRequest;
  hash: string;
  lastIndexed?: Date;
  updateIndexFailedDate?: Date;
}

const ViolationTicketSchema = new Schema<ViolationTicket, Model<ViolationTicket>, ViolationTicket>(
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
      enum: ['DRAFT', 'SUBMITTED', 'ASSIGNED', 'PAID', 'CLOSED'],
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
    activityLog: [ViolationTicketActivityDetailSchema],
    messages: [ViolationTicketMessageSchema],
    photos: [ViolationTicketPhotoSchema],
    financeDetails: { type: ViolationTicketFinanceDetailsType, required: true, ...MongooseSeedwork.NestedPathOptions },
    revisionRequest: { type: ViolationTicketRevisionRequestType, required: false, ...MongooseSeedwork.NestedPathOptions },
    hash: { type: String, required: false, maxlength: 100 },
    lastIndexed: { type: Date, required: false },
    updateIndexFailedDate: { type: Date, required: false },
  },
  ticketOptions
);

export const ViolationTicketModelName: string = 'violation-ticket';

export const ViolationTicketModelFactory = (TicketModel: TicketModelType) => {
  return TicketModel.discriminator(ViolationTicketModelName, ViolationTicketSchema);
};

export type ViolationTicketModelType = ReturnType<typeof ViolationTicketModelFactory>;