import type { FormRule } from 'antd';

/**
 * Inline validation rules for the shared property form, mirroring the domain
 * value objects so save-time backend rejections surface as antd inline
 * messages instead.
 *
 * Domain sources mirrored:
 * - `@ocom/domain` `contexts/property/property/property.value-objects.ts`
 *   (propertyName/propertyType maxLength 100)
 * - `@ocom/domain` `contexts/property/property/property-listing-detail.value-objects.ts`
 *   (integer ranges, description 5000, agent fields, amenities/images arrays)
 * - `@ocom/domain` `contexts/property/property/property-listing-detail-bedroom-detail.value-objects.ts`
 *   (roomName 100, bedDescriptions items 100 / max 20)
 * - `@ocom/domain` `contexts/property/property/property-listing-detail-additional-amenity.value-objects.ts`
 *   (category 100, amenities items 100 / max 20)
 * - `@ocom/domain` `contexts/value-objects.ts` (email pattern and maxLength 254)
 * - Tags have no domain value object; items mirror the mongoose
 *   `property.model.ts` per-item maxlength of 100, and the aggregate keeps
 *   only the first 50 tags (silently truncating), so entries are capped at 50.
 */

/**
 * Email pattern of the domain `Email` value object
 * (`@ocom/domain` `contexts/value-objects.ts`, sourced from the WHATWG HTML
 * valid e-mail address definition). Intentionally NOT antd's `type: 'email'`.
 */
const EMAIL_PATTERN = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/** Rules for optional email fields: domain email pattern plus the domain's 254-character cap. Empty values are allowed. */
export const emailRules = (label: string): FormRule[] => [
	{ pattern: EMAIL_PATTERN, message: `${label} must be a valid email address` },
	{ max: 254, message: `${label} must be at most 254 characters` },
];

/** Rule for an optional text field capped at `maxLength` characters by the domain. */
export const maxLengthRule = (label: string, maxLength: number): FormRule => ({
	max: maxLength,
	message: `${label} must be at most ${maxLength} characters`,
});

/**
 * Rule for optional whole-number fields (domain `VOInteger`): the value must
 * be an integer within the domain range. The GraphQL schema transports these
 * as Float, so fractions must be caught here before they reach the domain.
 */
export const integerRangeRule = (label: string, min: number, max: number): FormRule => ({
	validator: (_rule, value: number | null | undefined) => {
		if (value === undefined || value === null) {
			return Promise.resolve();
		}
		if (!Number.isInteger(value)) {
			return Promise.reject(new Error(`${label} must be a whole number`));
		}
		if (value < min || value > max) {
			return Promise.reject(new Error(`${label} must be between ${min} and ${max}`));
		}
		return Promise.resolve();
	},
});

/**
 * Rule for half-step numeric fields (domain `Bathrooms` value object,
 * `VOFloat` range with 0.5 increments): the value must land on a 0.5
 * increment and stay within the domain range.
 */
export const halfStepRangeRule = (label: string, min: number, max: number): FormRule => ({
	validator: (_rule, value: number | null | undefined) => {
		if (value === undefined || value === null) {
			return Promise.resolve();
		}
		if (!Number.isInteger(value * 2)) {
			return Promise.reject(new Error(`${label} must be in increments of 0.5`));
		}
		if (value < min || value > max) {
			return Promise.reject(new Error(`${label} must be between ${min} and ${max}`));
		}
		return Promise.resolve();
	},
});

/** Splits a comma-separated form value into trimmed, non-empty segments. */
const commaSegments = (value?: string | null): string[] =>
	(value ?? '')
		.split(',')
		.map((segment) => segment.trim())
		.filter((segment) => segment.length > 0);

/**
 * Rule for comma-separated list fields, validating each segment against the
 * domain's per-item maxLength and, when the domain caps the array, the
 * total number of entries.
 */
export const commaListRule = (label: string, maxItemLength: number, maxItems?: number): FormRule => ({
	validator: (_rule, value: string | null | undefined) => {
		const segments = commaSegments(value);
		const oversized = segments.find((segment) => segment.length > maxItemLength);
		if (oversized !== undefined) {
			return Promise.reject(new Error(`Each ${label} entry must be at most ${maxItemLength} characters`));
		}
		if (maxItems !== undefined && segments.length > maxItems) {
			return Promise.reject(new Error(`At most ${maxItems} ${label} entries are allowed`));
		}
		return Promise.resolve();
	},
});
