import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { type Model, Schema } from 'mongoose';

export interface Ticket extends MongooseSeedwork.Base {
  discriminatorKey: string;
}

// TODO: Discriminator key and Version can't exist together, if we don't use version key it will fall back to __v
export const ticketOptions = {
  discriminatorKey: 'ticketType',
  timestamps: true,
  // versionKey: 'version',
  shardKey: { community: 1 },
};

const TicketSchema = new Schema<Ticket, Model<Ticket>, Ticket>({}, ticketOptions);
export const TicketModelName = 'Ticket';

export const TicketModelFactory = MongooseSeedwork.modelFactory<Ticket>(
    TicketModelName,
    TicketSchema,
);
export type TicketModelType = ReturnType<typeof TicketModelFactory>;