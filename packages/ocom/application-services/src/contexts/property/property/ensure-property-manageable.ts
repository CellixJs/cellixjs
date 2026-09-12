const PROPERTY_NOT_FOUND_MESSAGE = 'Property not found';

const hasErrorName = (error: unknown, name: string): boolean => typeof error === 'object' && error !== null && (error as Error).name === name;

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
	try {
		property.assertCanManageProperties();
	} catch (error) {
		if (hasErrorName(error, 'PermissionError')) {
			throw new Error(PROPERTY_NOT_FOUND_MESSAGE);
		}
		throw error;
	}
	return property;
};
