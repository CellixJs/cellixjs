export interface Repository<T> {
	get(id: string): Promise<T>;
	save(item: T): Promise<T>;
}

export class NotFoundError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'NotFoundError';
	}
}
