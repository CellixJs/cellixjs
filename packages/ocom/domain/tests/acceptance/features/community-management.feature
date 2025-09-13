@community-management @business-critical @smoke-test
Feature: Community Management - Core Functionality
  As a platform administrator
  I want to establish and maintain communities with proper governance
  So that I can ensure quality user experiences and maintain platform standards

  # Business Rules:
  # - Community names must be between 3 and 200 characters
  # - Only authorized users can create communities
  # - Community creation must validate business rules before persistence
  # - Users receive clear feedback when validation fails

  Background: Administrative Access
    Given I am an authorized system administrator
    And I have access to community management functions

  @validation @positive-test  
  Scenario: Successfully create community with valid name
    Given I am preparing to create a new community
    When I create a community named "Tech Innovation Hub"
    Then the community should be created successfully
    And I should see confirmation of the new community
    And the community should be available in the system

  @validation @negative-test
  Scenario: Prevent community creation with excessively long names
    As a business rule, community names should be concise and memorable
    
    Given I am preparing to create a new community
    When I attempt to create a community with a name exceeding 200 characters
    Then the system should reject the community creation
    And I should be informed that the name is "Too long"
    And no community should be persisted in the system

  @validation @edge-case
  Scenario: Create community with name at maximum length
    Given I am preparing to create a new community
    When I create a community with a name of exactly 200 characters
    Then the community should be created successfully
    And the full name should be preserved