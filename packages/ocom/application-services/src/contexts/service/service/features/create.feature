Feature: Service Create Application Service

  Scenario: Creating a service successfully
    Given a valid community exists with id "507f1f77bcf86cd799439011"
    When I create a service with name "Test Service", description "Test Description", and communityId "507f1f77bcf86cd799439011"
    Then it should return a service entity reference with name "Test Service" and description "Test Description"

  Scenario: Creating a service with non-existent community
    Given no community exists with id "507f1f77bcf86cd799439011"
    When I create a service with name "Test Service", description "Test Description", and communityId "507f1f77bcf86cd799439011"
    Then it should throw an error "Community not found"

  Scenario: Creating a service when save fails
    Given a valid community exists with id "507f1f77bcf86cd799439011"
    When I create a service but save fails
    Then it should throw an error "service not found"