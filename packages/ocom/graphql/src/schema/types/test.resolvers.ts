import type { Resolvers } from "../builder/generated.ts";

const test: Resolvers = {
    Query: {
        hello: () => "Hello, world!"
    }
}

export default test;