import { VOString, VOArray } from '@lucaspaganini/value-objects';

const CustomViewTypes = {
	Property: 'PROPERTY',
	ServiceTicket: 'SERVICE_TICKET',
} as const;

type CustomViewTypeEnum = (typeof CustomViewTypes)[keyof typeof CustomViewTypes];

export class CustomViewName extends VOString({ trim: true, maxLength: 500 }) {}
class CustomViewTypeBase extends VOString({ trim: true, maxLength: 500 }) {}
export class CustomViewType extends CustomViewTypeBase {
	constructor(value: string) {
		super(value);
		if (!Object.values(CustomViewTypes).includes(value as CustomViewTypeEnum)) {
			throw new Error(`Invalid custom view type: ${value}`);
		}
	}
}
export class CustomViewSortOrder extends VOString({
	trim: true,
	maxLength: 500,
}) {}
class CustomViewFilter extends VOString({ trim: true, maxLength: 500 }) {}
export class CustomViewFilters extends VOArray(CustomViewFilter, {
	maxLength: 100,
}) {}
export class CustomViewColumnsToDisplay extends VOArray(CustomViewFilter, {
	maxLength: 30,
}) {}
