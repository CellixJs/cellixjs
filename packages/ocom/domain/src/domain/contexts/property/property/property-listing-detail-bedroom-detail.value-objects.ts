import { VOArray, VOString } from '@lucaspaganini/value-objects';

export class RoomName extends VOString({ trim: true, maxLength: 100, minLength: 1 }) {}

class BedDescription extends VOString({ trim: true, maxLength: 100 }) {}
export class BedDescriptions extends VOArray(BedDescription, { maxLength: 20 }) {}