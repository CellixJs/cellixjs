import { Types } from 'mongoose';

/**
 * Generate a random MongoDB ObjectId string — useful for seeding test data.
 */
export function generateObjectId(): string {
	return new Types.ObjectId().toHexString();
}
