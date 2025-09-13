export interface Visa<T> {
	determineIf(func: (permissions: Readonly<T>) => boolean): boolean;
}
