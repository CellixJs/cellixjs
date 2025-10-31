import { VOString } from '@lucaspaganini/value-objects';

const ServiceTicketV1MessageSentByEnum = {
  Internal: 'internal',
  External: 'external'
} as const;

export class Message extends VOString({ trim: true, maxLength: 2000, minLength: 1 }) {}

export class Embedding extends VOString({ trim: true, maxLength: 2000 }) {}

export class SentBy extends VOString({ trim: false }) {
  constructor(value: string) {
    super(value);
    const validValues = Object.values(ServiceTicketV1MessageSentByEnum) as string[];
    if (!validValues.includes(value)) {
      throw new Error(`SentBy must be one of: ${validValues.join(', ')}`);
    }
  }
}