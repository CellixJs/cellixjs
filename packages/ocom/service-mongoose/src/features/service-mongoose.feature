Feature: ServiceMongoose

  Scenario: Initializing the Mongoose Service with a valid URI
    Given a valid MongoDB URI and options
    When the mongoose service is constructed with a valid URI and options
    Then it should initialize the uri and options properties

  Scenario: Initializing the Mongoose Service with a valid URI and no options
    Given a valid MongoDB URI and no options
    When the mongoose service is constructed with a valid URI and no options
    Then it should initialize the uri property and use Mongoose default options

  Scenario: Initializing the Mongoose Service with an empty URI
    Given an empty MongoDB URI
    When the mongoose service is constructed with an empty URI
    Then it should throw an error indicating the MongoDB uri is required

  Scenario: Starting up the service
    Given a mongoose service instance with a valid URI
    When the service is started
    Then it should connect to MongoDB and set serviceInternal

  Scenario: Shutting down the service when started
    Given a started mongoose service instance
    When the service is shutdown
    Then it should disconnect from MongoDB and log that the service stopped

  Scenario: Shutting down the service when not started
    Given a mongoose service instance that has not been started
    When the service is shutdown
    Then it should throw an error indicating shutdown cannot proceed

  Scenario: Accessing the service property when started
    Given a started mongoose service instance
    When the service property is accessed
    Then it should return the internal Mongoose instance

  Scenario: Accessing the service property when not started
    Given a mongoose service instance that has not been started
    When the service property is accessed
    Then it should throw an error indicating the service is not started
