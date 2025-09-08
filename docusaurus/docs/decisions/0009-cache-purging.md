---
sidebar_position: 9
sidebar_label: 0009 Cache Purging
description: "A mechanism to refresh the screen when the application is updated to reflect latest changes."
status: accepted
contact: nguyenduy, etang93
date: 2024-06-04
deciders: nguyenduy
consulted: gidich, etang93
informed: ikeem07, heruwala, mgupta83
---

# Automatically Refresh Screen on Application Update

## Context and Problem Statement

When users open the application, updates won't be visible until they refresh their browser. If users don't refresh, they won't see the latest changes, which can cause confusion and frustration as they expect the application to be current. To improve user experience and ensure they see the latest updates, we need to implement a mechanism that automatically refreshes the screen when the application is updated.

## Decision Drivers

- **User Experience**: Ensure that users have a seamless experience when using the application.
- **Near Real-time Updates**: Provide near real-time updates to users without requiring manual intervention (e.g., refreshing the browser).
- **Consistency**: Ensure that users see the latest changes without having to manually refresh the browser.
- **Ease of Use**: Make it easy for users to stay up-to-date with the latest changes without requiring additional steps.
- **User Expectations**: Meet user expectations by automatically refreshing the screen when an update is available.

## Considered Options

- **Option 1: Polling Mechanism**: Implement a polling mechanism that periodically checks for updates and refreshes the screen if an update is available.

## Decision Outcome

Chosen option: **Option 1: Polling Mechanism**

We will implement a polling mechanism that periodically checks for updates and refreshes the screen if an update is available. This approach ensures that users see the latest changes without having to manually refresh the browser, providing a seamless and up-to-date experience.

### Consequences

- **Near Real-time Updates**: Users will receive near real-time updates without having to manually refresh the browser.
- **User Experience**: The application will provide a seamless experience by automatically refreshing the screen when an update is available.
- **Consistency**: Users will see the latest changes without having to take additional steps.
- **Ease of Use**: Users will not have to manually refresh the browser to see the latest changes, making it easier to stay up-to-date.

## Pros and Cons of the Options

### Pros of Polling Mechanism

- **Near Real-time Updates**: Users will receive near real-time updates without manual intervention.
- **User Experience**: The application will provide a seamless experience by automatically refreshing the screen.
- **Consistency**: Users will see the latest changes without manual intervention.
- **Ease of Use**: Users will not have to manually refresh the browser to see the latest changes.
- **Simple Implementation**: Implementing a polling mechanism is relatively straightforward and does not require complex setup.

### Cons of Polling Mechanism

- **Resource Consumption**: Polling can consume additional resources, especially if the polling interval is too frequent.
- **Latency**: There may be a slight delay between the update availability and the screen refresh, depending on the polling interval.
- **User Privacy**: Polling may involve sending requests to the server, which could raise privacy concerns if done too frequently.
