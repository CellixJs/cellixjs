import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { type Model, type PopulatedDoc, Schema, type SchemaDefinition, type Types } from 'mongoose';
import * as Community from '../community/index.ts';
import * as Member from '../member/index.ts';
import * as Property from '../property/index.ts';
import * as Service from '../service/index.ts';
import { type Ticket, type TicketModelType, ticketOptions } from './ticket.model.ts';

// Finance Details Subdocuments
interface ViolationTicketV1FinanceDetailsAdhocTransactionsApproval extends MongooseSeedwork.NestedPath {
  isApplicantApprovalRequired: boolean;
  isApplicantApproved: boolean;
  applicantRespondedAt?: Date;
}

const ViolationTicketV1FinanceDetailsAdhocTransactionsApprovalType: SchemaDefinition<ViolationTicketV1FinanceDetailsAdhocTransactionsApproval> = {
  isApplicantApprovalRequired: { type: Boolean, required: true },
  isApplicantApproved: { type: Boolean, required: true },
  applicantRespondedAt: { type: Date, required: false },
};

interface ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReference extends MongooseSeedwork.NestedPath {
  referenceType: string;
  referenceId: string;
}

const ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReferenceType: SchemaDefinition<ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReference> = {
  referenceType: { type: String, required: true },
  referenceId: { type: String, required: true },
};

interface ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReference extends MongooseSeedwork.NestedPath {
  referenceType: string;
  referenceId: string;
}

const ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReferenceType: SchemaDefinition<ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReference> = {
  referenceType: { type: String, required: true },
  referenceId: { type: String, required: true },
};

interface ViolationTicketV1FinanceDetailsAdhocTransactions extends MongooseSeedwork.SubdocumentBase {
  amount: number;
  description: string;
  transactionType: string;
  approval: ViolationTicketV1FinanceDetailsAdhocTransactionsApproval;
  financeReference: ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReference;
  transactionReference: ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReference;
}

const ViolationTicketV1FinanceDetailsAdhocTransactionsSchema = new Schema<ViolationTicketV1FinanceDetailsAdhocTransactions, Model<ViolationTicketV1FinanceDetailsAdhocTransactions>, ViolationTicketV1FinanceDetailsAdhocTransactions>(
  {
    amount: { type: Number, required: true },
    description: { type: String, required: true, maxlength: 500 },
    transactionType: { type: String, required: true },
    approval: { type: ViolationTicketV1FinanceDetailsAdhocTransactionsApprovalType, required: true, ...MongooseSeedwork.NestedPathOptions },
    financeReference: { type: ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReferenceType, required: true, ...MongooseSeedwork.NestedPathOptions },
    transactionReference: { type: ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReferenceType, required: true, ...MongooseSeedwork.NestedPathOptions },
  },
  {
    timestamps: true,
    versionKey: 'version',
  }
);

interface ViolationTicketV1FinanceDetailsTransactionsSubmissionTransactionReference extends MongooseSeedwork.NestedPath {
  referenceType: string;
  referenceId: string;
}

const ViolationTicketV1FinanceDetailsTransactionsSubmissionTransactionReferenceType: SchemaDefinition<ViolationTicketV1FinanceDetailsTransactionsSubmissionTransactionReference> = {
  referenceType: { type: String, required: true },
  referenceId: { type: String, required: true },
};

interface ViolationTicketV1FinanceDetailsTransactionsSubmission extends MongooseSeedwork.NestedPath {
  amount: number;
  description: string;
  transactionReference: ViolationTicketV1FinanceDetailsTransactionsSubmissionTransactionReference;
}

const ViolationTicketV1FinanceDetailsTransactionsSubmissionType: SchemaDefinition<ViolationTicketV1FinanceDetailsTransactionsSubmission> = {
  amount: { type: Number, required: true },
  description: { type: String, required: true, maxlength: 500 },
  transactionReference: { type: ViolationTicketV1FinanceDetailsTransactionsSubmissionTransactionReferenceType, required: true, ...MongooseSeedwork.NestedPathOptions },
};

interface ViolationTicketV1FinanceDetailsTransactions extends MongooseSeedwork.NestedPath {
  submission: ViolationTicketV1FinanceDetailsTransactionsSubmission;
  adhocTransactions: Types.DocumentArray<ViolationTicketV1FinanceDetailsAdhocTransactions>;
}

const ViolationTicketV1FinanceDetailsTransactionsType: SchemaDefinition<ViolationTicketV1FinanceDetailsTransactions> = {
  submission: { type: ViolationTicketV1FinanceDetailsTransactionsSubmissionType, required: true, ...MongooseSeedwork.NestedPathOptions },
  adhocTransactions: [ViolationTicketV1FinanceDetailsAdhocTransactionsSchema],
};

interface ViolationTicketV1FinanceDetailsRevenueRecognition extends MongooseSeedwork.NestedPath {
  amount: number;
  description: string;
  recognizedAt: Date;
}

const ViolationTicketV1FinanceDetailsRevenueRecognitionType: SchemaDefinition<ViolationTicketV1FinanceDetailsRevenueRecognition> = {
  amount: { type: Number, required: true },
  description: { type: String, required: true, maxlength: 500 },
  recognizedAt: { type: Date, required: true },
};

interface ViolationTicketV1FinanceDetails extends MongooseSeedwork.NestedPath {
  serviceFee: number;
  transactions: ViolationTicketV1FinanceDetailsTransactions;
  revenueRecognition: ViolationTicketV1FinanceDetailsRevenueRecognition;
}

const ViolationTicketV1FinanceDetailsType: SchemaDefinition<ViolationTicketV1FinanceDetails> = {
  serviceFee: { type: Number, required: true },
  transactions: { type: ViolationTicketV1FinanceDetailsTransactionsType, required: true, ...MongooseSeedwork.NestedPathOptions },
  revenueRecognition: { type: ViolationTicketV1FinanceDetailsRevenueRecognitionType, required: true, ...MongooseSeedwork.NestedPathOptions },
};

// Revision Request
interface ViolationTicketV1RevisionRequest extends MongooseSeedwork.NestedPath {
  requestedAt: Date;
  requestedBy: PopulatedDoc<Member.Member>;
  revisionSummary: string;
  revisionSubmittedAt?: Date;
}

const ViolationTicketV1RevisionRequestType: SchemaDefinition<ViolationTicketV1RevisionRequest> = {
  requestedAt: { type: Date, required: true },
  requestedBy: { type: Schema.Types.ObjectId, ref: Member.MemberModelName, required: true },
  revisionSummary: { type: String, required: true },
  revisionSubmittedAt: { type: Date, required: false },
};

// Activity Detail
export interface ViolationTicketV1ActivityDetail extends MongooseSeedwork.SubdocumentBase {
  activityType: string;
  activityDescription: string;
  activityBy: PopulatedDoc<Member.Member>;
}

const ViolationTicketV1ActivityDetailSchema = new Schema<ViolationTicketV1ActivityDetail, Model<ViolationTicketV1ActivityDetail>, ViolationTicketV1ActivityDetail>(
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
export interface ViolationTicketV1Message extends MongooseSeedwork.SubdocumentBase {
  sentBy: string;
  initiatedBy?: PopulatedDoc<Member.Member>;
  message: string;
  embedding?: string;
  createdAt: Date;
  isHiddenFromApplicant: boolean;
}

const ViolationTicketV1MessageSchema = new Schema<ViolationTicketV1Message, Model<ViolationTicketV1Message>, ViolationTicketV1Message>(
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
interface ViolationTicketV1Photo extends MongooseSeedwork.SubdocumentBase {
  documentId: string;
  description: string;
}

const ViolationTicketV1PhotoSchema = new Schema<ViolationTicketV1Photo, Model<ViolationTicketV1Photo>, ViolationTicketV1Photo>(
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
  activityLog: Types.DocumentArray<ViolationTicketV1ActivityDetail>;
  messages: Types.DocumentArray<ViolationTicketV1Message>;
  photos: Types.DocumentArray<ViolationTicketV1Photo>;
  financeDetails: ViolationTicketV1FinanceDetails;
  revisionRequest?: ViolationTicketV1RevisionRequest;
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
    activityLog: [ViolationTicketV1ActivityDetailSchema],
    messages: [ViolationTicketV1MessageSchema],
    photos: [ViolationTicketV1PhotoSchema],
    financeDetails: { type: ViolationTicketV1FinanceDetailsType, required: true, ...MongooseSeedwork.NestedPathOptions },
    revisionRequest: { type: ViolationTicketV1RevisionRequestType, required: false, ...MongooseSeedwork.NestedPathOptions },
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