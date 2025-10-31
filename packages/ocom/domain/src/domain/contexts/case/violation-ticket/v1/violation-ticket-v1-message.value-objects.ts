import {
  VOSet,
  VOString
} from '@lucaspaganini/value-objects';

export const SentByCodes = {
  External: 'external',
  Internal: 'internal'
}
export class SentBy extends VOSet(Object.values(SentByCodes)) { }
export class Message extends VOString({ trim: true, maxLength: 2000 }) { }
export class Embedding extends VOString({ trim: true, maxLength: 2000 }) { }