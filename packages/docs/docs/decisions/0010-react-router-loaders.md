---
sidebar_position: 10
sidebar_label: 0010 React Router Loadeer
description: "This MADR discusses the pros and cos of the react router loader functionality."
# These are optional elements. Feel free to remove any of them.
status: rejected
date: 2024-06-05
deciders:
---

# React Router Loader

## Context and Problem Statement

Considering the integration of React Router DOM v6 with Apollo Client for data loading, we encounter challenges with using hooks like `useQuery` within the `loader` function, necessitating direct `client.query` usage. This method complicates the distinct roles of caching between the router and Apollo provider.

<!-- This is an optional element. Feel free to remove. -->

## Decision Drivers

- Complexity in rewriting existing data fetching setups to accommodate router-based loading.
- Unclear benefits of integrating data loading within the router context.
- Confusion and potential conflicts between router and Apollo provider caching mechanisms.

## Considered Options

- **Integrate React Router Loader**: Implement loader functions in routes to handle data fetching.
- **Retain Current Apollo Client Setup**: Continue using Apollo Client's `useQuery` outside the routing context.
- **Hybrid Approach**: Use a combination of both methods selectively based on specific needs.

## Decision Outcome

Chosen option: **Retain Current Apollo Client Setup**, because integrating the React Router Loader would require extensive rewriting with unclear benefits, and it blurs the lines between routing and data management responsibilities, which could lead to maintenance challenges and cache consistency issues.

## Links/Resources

- [Discussion on React Router and Apollo Client Integration](https://community.apollographql.com/t/how-to-load-data-with-react-router-dom-v6-and-handling-errorpage/5347/11)
- [React Router Official Documentation on Loader](https://reactrouter.com/en/main/route/route#loader)
- [Apollo GraphQL Documentation on Initiating Queries Outside React](https://www.apollographql.com/docs/react/data/suspense/#initiating-queries-outside-react)
