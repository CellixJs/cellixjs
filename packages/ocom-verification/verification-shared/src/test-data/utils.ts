import { ObjectId } from 'mongodb';

/**
 * Generate a random MongoDB ObjectId string — useful for seeding test data.
 */
export function generateObjectId(): string {
	return new ObjectId().toHexString();
}
