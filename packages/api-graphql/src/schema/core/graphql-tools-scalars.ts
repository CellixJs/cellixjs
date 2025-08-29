import { buildSchema } from 'graphql';
import { typeDefs } from 'graphql-scalars';

const scalars = typeDefs.join('\n')
export default buildSchema(scalars);