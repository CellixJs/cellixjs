// Fixture: Application services factory pattern violation
// This file intentionally violates the curried factory pattern for testing purposes
export const badAction = (command: unknown) => {
	return command;
};
