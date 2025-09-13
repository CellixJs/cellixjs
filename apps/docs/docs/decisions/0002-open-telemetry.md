---
sidebar_position: 2
sidebar_label: 0002 Open Telemetry
description: "Open Telemetry Decisions."
# These are optional elements. Feel free to remove any of them.
status: accepted
contact: heruwala
date: 2024-04-17
deciders: gidich, heruwala, TheIceCreamTroll
consulted: etang93, mgupta83
informed: ikeem07, nguyenduy
---

# Use Open Telemetry to add observability to the project

## Context and Problem Statement

For the Owner Community project, we need end-to-end observability to monitor and troubleshoot the application. We need to track the performance of the application, identify bottlenecks, and troubleshoot issues. We need a solution that provides distributed tracing, metrics, and logging capabilities. We need to decide on a tool that can provide these capabilities and integrate well with our existing infrastructure.

<!-- This is an optional element. Feel free to remove. -->

## Decision Drivers

- Apollo graphql, is a key technology used for the application and is open telemetry compliant and requires minimal changes to integrate with open telemetry.
- Being hosted on Microsoft Azure, Azure Monitor is already compliant with open telemetry and can be easily integrated.
- Trace logs are easily viewable in Azure Monitor and can be used to troubleshoot issues.

## Considered Options

- **Option #1: Application Insights**: Microsoft's application performance management service. This was initially in the project before the open telemetry was considered. The project had only minimal logging and was not providing the required details for troubleshooting.
- **Option #2: Open Telemetry (@azure/monitor-opentelemetry) + Azure Monitor**: This option leverages open telemetry but uses Microsoft Distribution of open telemetry to integrate with Azure Monitor and provides automatic additional logging for azure functions.
- **Option #3: Open Telemetry (@azure//monitor-opentelemetry-exporter) + Azure Monitor**: This option requires additional work for azure functions that is provided by the @azure/monitor-opentelemetry package.
- **Option #4: Open Telemetry + DataDog**: A monitoring and analytics platform. DataDog was not chosen because it was not ingesting all the details required for troubleshooting. It also required a server to be stood up and an agent to be installed on the server as well as using a proprietary sdk.

## Decision Outcome

Chosen option: Option #2: Use Open Telemetry (@azure/monitor-opentelemetry) + Azure Monitor to add observability to the project.
The npm package @azure/monitor-opentelemetry provides MongoDb and Azure functions instrumentation out of the box.
Apollo Graphql is already open telemetry compliant and requires minimal changes to integrate with open telemetry.


## More Information

- [npm package @azure/monitor-opentelemetry](https://www.npmjs.com/package/@azure/monitor-opentelemetry)