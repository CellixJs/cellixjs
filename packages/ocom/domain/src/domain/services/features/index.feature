Feature: <Export> Services Index

  Scenario: Exporting Community services
    Given the services index module
    When I import the Community export
    Then it should export the Community services object