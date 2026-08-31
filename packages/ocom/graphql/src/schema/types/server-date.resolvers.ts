import type { Resolvers } from '../builder/generated.ts';

const serverDate: Resolvers = {
	Query: {
		serverDate: () => new Date(),
	},
};

export default serverDate;
