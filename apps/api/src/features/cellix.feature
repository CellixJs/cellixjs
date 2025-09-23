Feature: Cellix Application Bootstrap

  Scenario: Initializing infrastructure services
    Given a new Cellix application
    When infrastructure services are initialized with a registration callback
    Then it should create a Cellix instance in infrastructure phase
    And it should invoke the registration callback
    And it should return a context builder

  Scenario: Registering an infrastructure service
    Given a Cellix instance in infrastructure phase
    When an infrastructure service is registered
    Then it should store the service in the registry
    And it should return the registry for chaining

  Scenario: Registering a duplicate infrastructure service
    Given a Cellix instance with a registered service
    When the same service type is registered again
    Then it should throw an error indicating the service is already registered

  Scenario: Setting the infrastructure context
    Given a Cellix instance in infrastructure phase
    When the context creator is set
    Then it should store the context creator
    And it should transition to context phase
    And it should return an application services initializer

  Scenario: Setting context in wrong phase
    Given a Cellix instance in context phase
    When setContext is called
    Then it should throw an error for invalid phase

  Scenario: Initializing application services
    Given a Cellix instance in context phase with context creator set
    When application services factory is initialized
    Then it should store the factory
    And it should transition to app-services phase
    And it should return an Azure function handler registry

  Scenario: Initializing application services without context
    Given a Cellix instance in context phase without context creator
    When initializeApplicationServices is called
    Then it should throw an error indicating context creator is required

  Scenario: Registering an Azure Function HTTP handler
    Given a Cellix instance in app-services phase
    When an Azure Function HTTP handler is registered
    Then it should store the handler configuration
    And it should transition to handlers phase
    And it should return the registry for chaining

  Scenario: Registering handler in wrong phase
    Given a Cellix instance in infrastructure phase
    When registerAzureFunctionHttpHandler is called
    Then it should throw an error for invalid phase

  Scenario: Starting up the application
    Given a Cellix instance in handlers phase with all configurations
    When startUp is called
    Then it should register Azure Functions with app.http
    And it should set up appStart and appTerminate hooks
    And it should transition to started phase
    And it should return the started application

  Scenario: Starting up without context configuration
    Given a Cellix instance in handlers phase without context creator
    When startUp is called
    Then it should throw an error indicating context is not configured

  Scenario: Retrieving an infrastructure service
    Given a started Cellix application with registered services
    When getInfrastructureService is called with a service key
    Then it should return the registered service instance

  Scenario: Retrieving unregistered service
    Given a started Cellix application
    When getInfrastructureService is called with an unregistered key
    Then it should throw an error indicating service not found

  Scenario: Accessing context before initialization
    Given a Cellix instance before startup
    When context property is accessed
    Then it should throw an error indicating context not initialized

  Scenario: Service lifecycle startup
    Given a Cellix application during appStart hook
    When services are started
    Then it should call startUp on all registered services
    And it should create the infrastructure context
    And it should initialize application services host
    And it should log successful startup

  Scenario: Service lifecycle shutdown
    Given a started Cellix application during appTerminate hook
    When services are stopped
    Then it should call shutDown on all registered services
    And it should log successful shutdown

  Scenario: Service startup failure
    Given a Cellix application with a service that fails to start
    When appStart hook executes
    Then it should record the exception in the span
    And it should rethrow the error
    And it should set span status to ERROR

  Scenario: Service shutdown failure
    Given a started Cellix application with a service that fails to stop
    When appTerminate hook executes
    Then it should record the exception in the span
    And it should rethrow the error
    And it should set span status to ERROR