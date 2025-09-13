export interface ServiceBase<T = unknown> {
	startUp(): Promise<Exclude<T, ServiceBase>>;
	shutDown(): Promise<void>;
}

export interface SyncServiceBase<T = unknown> {
	startUp(): Exclude<T, ServiceBase>;
	shutDown(): void;
}
