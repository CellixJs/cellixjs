import { VOOptional, VOString } from '@lucaspaganini/value-objects';

export class Name extends VOString({ trim: true, maxLength: 200, minLength: 1 }) {}
export class Domain extends VOString({ trim: true, maxLength: 500, minLength: 1 }) {}
class WhiteLabelDomainBase extends VOString({
	trim: true,
	maxLength: 500,
	minLength: 1,
}) {}
export class WhiteLabelDomain extends VOOptional(WhiteLabelDomainBase, [null]) {}
class HandleBase extends VOString({ trim: true, maxLength: 50, minLength: 1 }) {}
export class Handle extends VOOptional(HandleBase, [null]) {}
