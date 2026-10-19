import { VOOptional, VOString } from '@lucaspaganini/value-objects';

export class Name extends VOString({
	trim: true,
	maxLength: 200,
	minLength: 1,
}) {}
export class Domain extends VOString({
	trim: true,
	maxLength: 500,
	minLength: 1,
}) {}
class WhiteLabelDomainBase extends VOString({
	trim: true,
	maxLength: 500,
	minLength: 1,
}) {}
export class WhiteLabelDomain extends VOOptional(WhiteLabelDomainBase, [null]) {}
class HandleBase extends VOString({
	trim: true,
	maxLength: 50,
	minLength: 1,
}) {}
export class Handle extends VOOptional(HandleBase, [null]) {}

// Settings: client IP and the country resolved from it
export class IpAddress extends VOString({
	trim: true,
	maxLength: 45,
	minLength: 2,
}) {}
class CountryCodeBase extends VOString({
	trim: true,
	maxLength: 2,
	minLength: 2,
}) {}
export class CountryCode extends VOOptional(CountryCodeBase, [undefined]) {}
class CountryNameBase extends VOString({
	trim: true,
	maxLength: 100,
	minLength: 1,
}) {}
export class CountryName extends VOOptional(CountryNameBase, [undefined]) {}
