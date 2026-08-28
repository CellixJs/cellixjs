Feature: Tech Admin Resolvers Authorization

  As a staff portal user
  I want tech-admin resolvers to enforce authorization at execution time
  So that unauthorized users cannot read database collections, documents, or blob storage even if they modify GraphQL queries

  Scenario: Unauthenticated user requests database collections
    Given a user without a verifiedJwt in their context
    When the techAdminDatabaseCollections query is executed
    Then it should throw an "Unauthorized" error

  Scenario: Authenticated but unauthorized user requests database collections
    Given a user with a verifiedJwt in their context
    And that user does not have canViewDatabaseDocuments or canManageTechAdmin permission
    When the techAdminDatabaseCollections query is executed
    Then it should throw an "Unauthorized" error
    And it should not return collection names

  Scenario: Authenticated but unauthorized user requests database documents
    Given a user with a verifiedJwt in their context
    And that user does not have canViewDatabaseDocuments or canManageTechAdmin permission
    When the techAdminDatabaseDocuments query is executed for collection "users"
    Then it should throw an "Unauthorized" error
    And it should not return database documents

  Scenario: Unauthorized user modifies query arguments to attempt access
    Given a user with a verifiedJwt in their context
    And that user does not have canViewDatabaseDocuments or canManageTechAdmin permission
    When the techAdminDatabaseDocuments query is executed for collection "users" with modified filter and pageSize arguments
    Then it should throw an "Unauthorized" error
    And it should not return database documents

  Scenario: Authorized user requests database collections
    Given a user with a verifiedJwt in their context
    And that user has canViewDatabaseDocuments permission
    When the techAdminDatabaseCollections query is executed
    Then it should return non-system collection names

  Scenario: Authorized user attempts an unsafe filter operator
    Given a user with a verifiedJwt in their context
    And that user has canViewDatabaseDocuments permission
    When the techAdminDatabaseDocuments query is executed with filter containing "$where"
    Then it should throw a "BAD_USER_INPUT" error

  Scenario: Unauthenticated user requests blob containers
    Given a user without a verifiedJwt in their context
    When the techAdminBlobContainers query is executed
    Then it should throw an "Unauthorized" error

  Scenario: Authenticated but unauthorized user requests blob containers
    Given a user with a verifiedJwt in their context
    And that user does not have canViewBlobExplorer or canManageTechAdmin permission
    When the techAdminBlobContainers query is executed
    Then it should throw an "Unauthorized" error

  Scenario: Authorized user requests blob containers
    Given a user with a verifiedJwt in their context
    And that user has canViewBlobExplorer permission
    When the techAdminBlobContainers query is executed
    Then it should return blob container names

  Scenario: Authorized user lists blobs with filters
    Given a user with a verifiedJwt in their context
    And that user has canViewBlobExplorer permission
    When the techAdminBlobList query is executed with name and tag filters
    Then it should return folders and blobs for the selected path

  Scenario: Authorized user previews blob content
    Given a user with a verifiedJwt in their context
    And that user has canManageTechAdmin permission
    When the techAdminBlobContent query is executed
    Then it should return blob preview content and a download URL
