// Fixture: Application services dependency boundary violation
// This file intentionally violates conventions for testing purposes
const mongoose = 'mongoose';

export const badAction = () => {
	return mongoose;
};
