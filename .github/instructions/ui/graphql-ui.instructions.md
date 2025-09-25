---
applyTo: "**/ui-*/src/components/**/*.graphql"
---

## Copilot Instructions: GraphQL

### Purpose

- `.graphql` files in the frontend define GraphQL queries, mutations, and fragments for use with Apollo Client and React components.
- They enable type-safe, modular, and maintainable data fetching and manipulation.

### Organization & Structure

- Place `.graphql` files next to the component or container that uses them, typically in the same feature or layout folder.
- For a given container component, there should be a corresponding `.graphql` file with the same base name. (e.g `contact-details.container.graphql`)
- All queries, mutations, and fragments used in the container component should be defined in the corresponding `.graphql` file.

### Coding Conventions

- Queries and mutations should use the following naming convention `<Layout><Container><Operation>`
    - Given a container component named `ContactDetailsContainer` in the `applicant` layout which uses the `ApplicantUser` query, the query name should be: `ApplicantContactDetailsContainerApplicantUser`
- Fragments should use the following naming convention `<Layout><Container><Type>Fields`
    - Given a container component named `ContactDetailsContainer` in the `applicant` layout, a fragment for the `ApplicantUser` type should be named: `ApplicantContactDetailsContainerUserFields`
- Always prefer reusable fragments over direct field access in queries/mutations.
- Use variables for dynamic values; avoid hardcoding IDs or parameters.
- Keep queries minimal—request only the fields needed by the component.
- Include the `id` fields on fragment types where the `id` field is present to ensure consistency in Apollo Cache.
- Ensure queries and mutations use the same fragment definitions to ensure consistency in Apollo Cache.

### Integration


- Import `.graphql` files into TypeScript/JS files using codegen-generated types for type safety.
- Use Apollo Client hooks (`useQuery`, `useMutation`, etc.) with imported queries/mutations.
- Co-locate fragments with the components that use them for maintainability.

### Apollo Client Link Chain Customization

- Configure Apollo Client with a dynamic link chain to flexibly route operations to different data sources:
    - **Batching**: Use a batching link (e.g., `BatchHttpLink`) to combine multiple GraphQL operations into a single HTTP request. This is why container components are allowed to define their own queries and mutations; the batching link can optimize their execution on the server.
    - **Authentication & Custom Headers**: Add custom Apollo links to inject authentication tokens or other headers into requests.
    - **REST Integration**: Use Apollo's REST link to fetch data from non-GraphQL APIs. Route specific operations to REST endpoints using a link map and split logic. Typical usage is for fetching JSON data from Azure Blob Storage.
- Example generalized setup:
    ```ts
    import { ApolloClient, InMemoryCache, ApolloLink, from } from '@apollo/client';
    import { BatchHttpLink } from '@apollo/client/link/batch-http';
    import { RestLink } from 'apollo-link-rest';

    // Define links for different data sources
    const batchGraphqlLink = new BatchHttpLink({ uri: '/graphql', batchMax: 10, batchInterval: 20 });
    const restApiLink = new RestLink({ uri: '/rest-api' });

    // Custom links for authentication, headers, etc.
    const authLink = new ApolloLink((operation, forward) => {
      operation.setContext(({ headers = {} }) => ({
        headers: {
          ...headers,
          Authorization: 'Bearer <token>'
        }
      }));
      return forward(operation);
    });

    // Link map for routing operations
    const linkMap = {
      CountryDetails: restApiLink, // Example: route 'CountryDetails' query to REST
      default: from([authLink, batchGraphqlLink])
    };

    // Dynamic split logic based on operation name
    const dynamicLink = ApolloLink.split(
      operation => operation.operationName in linkMap,
      new ApolloLink((operation, forward) => {
        const link = linkMap[operation.operationName as keyof typeof linkMap] || linkMap.default;
        return link.request(operation, forward);
      }),
      linkMap.default
    );

    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: dynamicLink
    });
    ```
- You can extend this pattern to route based on context, operation type, or other criteria. Update the link chain dynamically (e.g., on authentication changes) as needed.

### Testing

- Mock queries and mutations in Storybook stories and unit tests using Apollo Client's mocking utilities.

### Example Structure

```
components/
  feature-x/
    my-component.container.graphql
    my-component.container.tsx
    my-component.stories.tsx
    my-component.tsx
```

### References

- [Apollo Client Docs](https://www.apollographql.com/docs/react/)
- [GraphQL Specification](https://spec.graphql.org/)