import { VOString } from '@lucaspaganini/value-objects';

export class MemberName extends VOString({ trim: true, maxLength: 200, minLength: 1 }) {}
export class CyberSourceCustomerId extends VOString({ maxLength: 50, minLength: 1 }) {}
