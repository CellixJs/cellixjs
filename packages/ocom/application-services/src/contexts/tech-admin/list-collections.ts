import mongoose from 'mongoose';

export const ListCollections = () => {
	return async (): Promise<string[]> => {
		const { db } = mongoose.connection;
		if (!db) throw new Error('Database connection is not available');
		const cols = await db.listCollections().toArray();
		return cols
			.map((c) => c.name)
			.filter((n) => !n.startsWith('system.'))
			.sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
	};
};
