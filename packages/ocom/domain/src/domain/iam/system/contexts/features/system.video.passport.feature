Feature: <Passport> SystemVideoPassport

  Scenario: The system passport grants the permissions it was created with
    When I create a SystemVideoPassport with isSystemAccount true and get a visa for a video
    Then determineIf should report isSystemAccount as true
    And determineIf should report canManageVideos as not granted

  Scenario: A system passport without permissions grants nothing
    When I create a SystemVideoPassport with no permissions and get a visa for a video
    Then determineIf should report isSystemAccount as not granted
