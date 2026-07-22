Feature: <Export> Services Index

  Scenario: Exporting Community services
    Given the services index module
    When I import the Community export
    Then it should export the Community services object

  Scenario: Exporting User services
    Given the services index module
    When I import the User export
    Then it should export the User services object