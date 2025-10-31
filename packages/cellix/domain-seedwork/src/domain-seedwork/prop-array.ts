import type { DomainEntityProps } from './domain-entity.ts';

export interface PropArray<propType extends DomainEntityProps> {
	get items(): ReadonlyArray<propType>;
	addItem(item: propType): void;
	/**
	 * Creates a new item, adds it to the array, and returns a reference to it.
	 *
	 * @returns {propType} The newly created item, which has already been added to the array.
	 *
	 * @remarks
	 * The implementation is responsible for constructing the new item.
	 * The array will be mutated by this operation.
	 */
	getNewItem(): propType;
	removeItem(item: propType): void;
	removeAll(): void;
}
