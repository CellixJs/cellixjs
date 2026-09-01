const PROPERTY_NOT_FOUND_MESSAGE = 'Property not found';

const hasErrorName = (error: unknown, name: string): boolean => error instanceof Error && error.name === name;

export const assertPropertyManageableOrThrow = <TProperty extends { assertCanManageProperties(): void }>(property: TProperty): void => {
	try {
		property.assertCanManageProperties();
	} catch (error) {
		if (hasErrorName(error, 'PermissionError')) {
			throw new Error(PROPERTY_NOT_FOUND_MESSAGE);
		}
		throw error;
	}
};

/**
 * Loads a property for a manage-style mutation while collapsing "unknown id"
 * and "caller may not manage this property" into one indistinguishable error,
 * so mutation responses cannot be used to probe property ids across
 * communities. This is the write-side counterpart of the deny-by-omission
 * read path in ensure-property-viewable.ts.
 */
export const getManageablePropertyOrThrow = async <TProperty extends { assertCanManageProperties(): void }>(repo: { getById(id: string): Promise<TProperty> }, id: string): Promise<TProperty> => {
	let property: TProperty;
	try {
		property = await repo.getById(id);
	} catch (error) {
		if (hasErrorName(error, 'NotFoundError')) {
			throw new Error(PROPERTY_NOT_FOUND_MESSAGE);
		}
		throw error;
	}
	assertPropertyManageableOrThrow(property);
	return property;
};

/**
 * Loads a property for an update that may be performed by either a manager or
 * the verified aggregate owner. Missing and unauthorized records retain the
 * same generic mutation error.
 */
export const getEditablePropertyOrThrow = async <TProperty extends { assertCanEditProperties(): void }>(repo: { getById(id: string): Promise<TProperty> }, id: string): Promise<TProperty> => {
	let property: TProperty;
	try {
		property = await repo.getById(id);
	} catch (error) {
		if (hasErrorName(error, 'NotFoundError')) {
			throw new Error(PROPERTY_NOT_FOUND_MESSAGE);
		}
		throw error;
	}
	try {
		property.assertCanEditProperties();
	} catch (error) {
		if (hasErrorName(error, 'PermissionError')) {
			throw new Error(PROPERTY_NOT_FOUND_MESSAGE);
		}
		throw error;
	}
	return property;
};
