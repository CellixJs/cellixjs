Feature: MongoTypeConverter

  Scenario: Converting a Mongoose model to a domain object
    Given a Mongoose model instance and a passport
    When toDomain is called
    Then it should return a domain object constructed with the adapter and passport

  Scenario: Converting a domain object to persistence
    Given a domain object with a props.doc property
    When toPersistence is called
    Then it should return the doc property from the domain object's props

  Scenario: Converting a Mongoose model to an adapter
    Given a Mongoose model instance
    When toAdapter is called
    Then it should return a new adapter constructed with the Mongoose model

  Scenario: Converting a domain object to an adapter
    Given a domain object with a props property
    When toAdapter is called
    Then it should return the props property from the domain object