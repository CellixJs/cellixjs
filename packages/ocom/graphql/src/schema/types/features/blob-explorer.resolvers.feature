Feature: Blob Explorer Resolvers

  As an API consumer
  I want to query blob storage containers and blobs
  So that I can browse Azure Blob Storage from the Staff Portal

  # ─── blobExplorerListContainers ─────────────────────────────────────────────

  Scenario: Listing containers when authenticated with canViewBlobExplorer permission
    Given a staff user with a verifiedJwt and canViewBlobExplorer permission
    When the blobExplorerListContainers query is executed
    Then it should return the list of containers

  Scenario: Listing containers when unauthenticated
    Given a user without a verifiedJwt in their context
    When the blobExplorerListContainers query is executed
    Then it should throw an "Unauthorized" error

  Scenario: Listing containers when missing canViewBlobExplorer permission
    Given a staff user with a verifiedJwt but without canViewBlobExplorer permission
    When the blobExplorerListContainers query is executed
    Then it should throw an "Unauthorized" error

  # ─── blobExplorerListBlobs ───────────────────────────────────────────────────

  Scenario: Listing blobs when authenticated with canViewBlobExplorer permission
    Given a staff user with a verifiedJwt and canViewBlobExplorer permission
    When the blobExplorerListBlobs query is executed with containerName "my-container"
    Then it should return the hierarchy page with items and prefixes

  Scenario: Listing blobs when unauthenticated
    Given a user without a verifiedJwt in their context
    When the blobExplorerListBlobs query is executed with containerName "my-container"
    Then it should throw an "Unauthorized" error

  Scenario: Listing blobs when missing canViewBlobExplorer permission
    Given a staff user with a verifiedJwt but without canViewBlobExplorer permission
    When the blobExplorerListBlobs query is executed with containerName "my-container"
    Then it should throw an "Unauthorized" error

  # ─── blobExplorerGetDownloadAuthorization ────────────────────────────────────

  Scenario: Getting download authorization when authenticated with canViewBlobExplorer permission
    Given a staff user with a verifiedJwt and canViewBlobExplorer permission
    When the blobExplorerGetDownloadAuthorization query is executed with containerName "my-container" and blobName "file.txt"
    Then it should return the download authorization result

  Scenario: Getting download authorization when unauthenticated
    Given a user without a verifiedJwt in their context
    When the blobExplorerGetDownloadAuthorization query is executed with containerName "my-container" and blobName "file.txt"
    Then it should throw an "Unauthorized" error

  Scenario: Getting download authorization when missing canViewBlobExplorer permission
    Given a staff user with a verifiedJwt but without canViewBlobExplorer permission
    When the blobExplorerGetDownloadAuthorization query is executed with containerName "my-container" and blobName "file.txt"
    Then it should throw an "Unauthorized" error
