---
sidebar_position: 17
sidebar_label: 0017 Chrome Content Overrides
description: "Decision record for using Chrome Content Overrides with Requestly for FeatureFlags.json."
status: proposed
contact: kapoor1109 etang93
date: 2025-08-01
deciders: gidich etang93 mgupta83 nnoce14 iwilson dheruwala
informed:
---

# Chrome Content Overrides for FeatureFlags.json

## Context and Problem Statement

During maintenance windows, we need to override the `FeatureFlags.json` file to enable or disable specific features temporarily. The solution must be lightweight, easy to implement, and not require changes to the production environment. After evaluating various options, we propose using Requestly for URL redirection combined with Chrome's built-in content overrides to achieve this.

## Decision Drivers

- Ability to override `FeatureFlags.json` without modifying the production environment
- Lightweight and easy-to-implement solution
- Minimal disruption to existing workflows
- Flexibility to enable or disable features dynamically during maintenance windows

## Considered Options

- **Use Requestly with Chrome Content Overrides**: Redirect the URL of `FeatureFlags.json` using Requestly and override the content using Chrome's developer tools.
- **Modify the production environment**: Implement a mechanism to dynamically serve an alternate `FeatureFlags.json` during maintenance windows.

## Decision Outcome

Chosen option: **Use Requestly with Chrome Content Overrides**

The team has decided to use Requestly for URL redirection and Chrome's content overrides to override the `FeatureFlags.json` file during maintenance windows. This approach is lightweight, requires no changes to the production environment, and is easy to implement.

### Consequences

- Good: The solution is lightweight and does not require changes to the production environment.
- Good: It provides flexibility to dynamically override `FeatureFlags.json` during maintenance windows.
- Bad: The solution is browser-specific and requires manual setup in Chrome.

## Validation

- Test the solution by redirecting the URL of `FeatureFlags.json` using Requestly and overriding the content using Chrome's developer tools.
- Verify that the overridden file is served correctly during maintenance windows.
- Ensure that the solution does not impact other parts of the application.

## Pros and Cons of the Options

### Use Requestly with Chrome Content Overrides

- Good, because it is lightweight and does not require changes to the production environment.
- Good, because it is easy to implement and provides flexibility during maintenance windows.
- Neutral, because it is browser-specific and requires manual setup in Chrome.
- Neutral, Requestly has a limit of 5 rules with 3 being active at a time for free users
- Bad, because it may not work in non-Chrome browsers or automated environments.

### Modify the production environment

- Good, because it provides a robust and environment-agnostic solution.
- Neutral, because it requires changes to the production environment, which may introduce risks.
- Bad, because it is more complex and time-consuming to implement.

## More Information

The team will use Requestly to redirect the URL of `FeatureFlags.json` to a local file and Chrome's content overrides to modify the file's content. This approach will be used only during maintenance windows and will not impact the production environment.

> For more details on Requestly, see [Requestly Documentation](https://app.requestly.io/).

> Setup [Video](https://ecfmg1.sharepoint.com/:v:/r/sites/ConnectedApps/Shared%20Documents/CXA-UX%20and%20Dev/architecture/reference-material/HTTP-Proxy-Override-Requestly.mp4?csf=1&web=1&e=e9MJmn)