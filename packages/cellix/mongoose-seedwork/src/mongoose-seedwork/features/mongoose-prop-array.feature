Feature: MongoosePropArray

  Scenario: Adding an item to the array
    Given a mongoose prop array with a document array and an adapter
    When addItem is called with a domain adapter instance
    Then it should push the document to the array and return a new adapter for the added document

  Scenario: Removing an item from the array
    Given a mongoose prop array with a document array containing an item
    When removeItem is called with the domain adapter instance
    Then it should remove the document from the array

  Scenario: Removing all items from the array
    Given a mongoose prop array with a document array containing multiple items
    When removeAll is called
    Then it should remove all documents from the array

  Scenario: Creating and adding a new item
    Given a mongoose prop array with a document array and an adapter
    When getNewItem is called
    Then it should create a new document, add it to the array, and return a new adapter for the new document

  Scenario: Accessing items returns all items as adapters
    Given a mongoose prop array with a document array containing multiple documents
    When the items property is accessed
    Then it should return an array of adapters for each document
>>>>>>> REPLACE
