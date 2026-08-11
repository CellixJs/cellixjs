---
sidebar_position: 34
sidebar_label: 0034 Redis-Backed Application-Service Rate Limiting
description: "Architecture decision for Redis-backed, feature-aware rate limiting at the application-service boundary"
status: accepted
contact: jasonmorais
date: 2026-08-11
deciders: jasonmorais
consulted:
informed:
---

# Redis-Backed Application-Service Rate Limiting

## Context and Problem Statement

Cellix needs rate limiting for application operations such as `community.create`. The limit must be selected by the feature being executed and may vary by stable caller characteristics such as actor type, role, account, or community scope. It must also work when multiple application instances process requests concurrently. It also requires role/user type based distinctions as well. 

The implementation needs a storage service that can perform a high volume of small counter operations efficiently, expire counters automatically, work during local development, and remain replaceable. The architectural question is which storage sercvice to use and where the rate-limit decision should be made.

## Decision Drivers

1. **Fast operations**: Rate-limit checks need to be efficient - theres a lot of possible volume with AI driven requests.
2. **Feature and role awareness**: Policies must be selected from application context, not only from an HTTP route or client address.
3. **Distributed consistency**: All instances of the application must observe the same counters. This means a local to machine hosted version is not enough.
4. **Automatic expiration**: Fixed-window counters must disappear without application cleanup jobs.
5. **Local development compatability**: Developers and automated tests need a repository-supported local Redis implementation.
6. **Replaceability**: The application policy model should not be coupled to Redis commands or to one rate-limiting algorithm.

## Considered Options

- Redis-backed counters
- MongoDB documents with TTL indexes
- A time-series database

What was considered but isn't possible:
- MongoDB timeseries collection (CosmoDB doesn't support it)   

## Decision Outcome

Chosen option: **Redis-backed rate limiting through a generic application service**, because Redis best meets the requirements for speed, counter operations, automatic expiration, local compatability, and future implementation flexibility.

Redis is the recommended primary service for rate limiting in Cellix. MongoDB remains a compatabile alternative if Redis for whatever reason does not work for the organization, but the speed difference will be very noticable.

The application selects the concrete service when it composes infrastructure services. Service selection is therefore very flexible, and solutions could be swapped out with relative ease.

### Service Boundary

Rate limiting is integrated at the **application-service level** rather than at a the register function level for endpoints, or deeper at the domain level.

The application service is the first boundary that has all of the information needed to make the business operation decision without letting the request drive too deep into the application, which also follows our typical infrastructure service usage model:

The following information is used:

- the feature being attempted, such as `community.create`
- the user type or role used by policy criteria
- the point at which the scenario is about to perform its application work

For example, the application service can pass `feature: 'community.create'` with information about the actual user. The application policy can then give the userusing that feature a limit of five operations per fifteen minutes and staff actors a limit of twenty operations per fifteen minutes.

This placement also means rate limiting applies to an application use case, not just over a single endpoint. The same application service can be called from GraphQL, REST, or some other layer without any difference.

### Generic Rate-Limiting Contract

The shared rate-limiting package owns the policy and decision model, not a database-specific data model. It provides:

- `RateLimitPolicy`, which identifies a feature, optional generic criteria, a limit, a fixed time limit
- `RateLimitSubject`, houses information about the user in question

Applications define policy facts such as `userType: 'account'` or `userType: 'staff'`.

### Redis Infrastructure

Redis is treated as generic implementation of the rate limit service rather than as a redis specific implementation:

- `ServiceRedisRateLimiting` owns a dedicated Redis client and reads the shared `REDIS_URL` configuration.
- The reusable Redis package knows only about fixed-window counter commands and the generic rate-limit contract.
- Application packages provide policies and subjects; they do not construct Redis keys or issue Redis commands.
- The repository provides an embedded Redis server through `@cagematch/server-redis-memory-mock-seedwork` and `@cagematch/server-redis-memory-mock` for local development and E2E infrastructure.
- Shared local-development helpers provide the Redis URL and worktree-aware port conversion, so worktrees can use isolated Redis instances.

This infrastructure can support other Redis-backed services in the future without making the rate-limiting package the owner of Redis provisioning, environment policy, or application-specific data. Production Redis provisioning and lifecycle remain environment concerns, while local Redis provisioning remains a developer and test convenience.

### Trial Runs

| Metric                     |     MongoDB |         Redis | Better  |
| -------------------------- | ----------: | ------------: | ------- |
| Mean trial duration        |  344.933 ms |     13.192 ms | Redis   |
| Median trial duration      |  346.874 ms |     12.669 ms | Redis   |
| P95 trial duration         |  351.338 ms |     16.984 ms | Redis   |
| Mean throughput            | 2,900 ops/s |  77,653 ops/s | Redis   |
| Mean request P50           |    8.415 ms |      0.315 ms | Redis   |
| Mean request P95           |   10.180 ms |      0.393 ms | Redis   |
| Mean request P99           |   12.237 ms |      0.578 ms | Redis   |
| Trial-duration variation   |      1.955% |       15.850% | MongoDB |
| Trials won on throughput   |        0/20 |         20/20 | Redis   |

### Consequences

#### Positive

1. Redis provides a very efficient solution.
2. Availability of local Redis memory server package for e2e enablement and local development
3. Typical industry adoption - this is the standard solution for these types of operations and has a lot of developer support for various solutions for "Redis" as a whole beyond this current implementation.

#### Negative

1. Requires an additional service/database to be made for production if we want to have cross instance syncing of data.
2. Redis counters are optimized for enforcement, not history. If detailed analytics are desired over performance, the Mongo solution would be a better fit.

## Pros and Cons of other Options

### MongoDB documents with TTL indexes

- Good, because MongoDB is already part of the application infrastructure and TTL indexes are straightforward to provision.
- Good, because documents can be inspected and history is retained.
- Good, because MongoDB already has a synced data stream between various instances.
- Bad, because high-frequency rate-limit checks add document read/update, indexing, is much slower and expensive via this solution.
- Bad, because MongoDB is slower and less purpose-built for this counter workload, so for this type of solution it values ease rather than practicality.

### Time-series database

- Good, because it could retain detailed usage history and supports historical analysis.
- Bad, because it introduces substantial external infrastructure, dependency, deployment, and requires a lot of local development setup work.
- Bad, because it provides no particular enforcement benefit over the Mongo solution.
- Bad, because the speed of this solution provides no benefit over the existing Mongo infrastructure.

The time-series option is has been written off a possible solution due to the one benefit it provides not outweighing the negative impact on local development and performance, along with overhead.

## More Information

The implementation is divided across these packages:

- `@cagematch/rate-limiting`: facade pattern service - allows solutions to be swapped out easily
- `@cagematch/rate-limiting-redis`: Redis implementation of facade service
- `@cagematch/rate-limiting-mongo`: MongoDB implementation of facade service
- `@cagematch/server-redis-memory-mock-seedwork`: Redis server seedwork
- `@cagematch/server-redis-memory-mock`: Mock implementation of Redis server - application specific
- `@ocom/application-services`: application-service integration and subject usage
- `apps/api`: initialization of facade service and passing in of specific implementation

Related resources:

- [0003 Domain Driven Design](/docs/decisions/0003-domain-driven-design.md), which establishes application-service orchestration and infrastructure separation
- [0014 Azure Infrastructure Deployments](/docs/decisions/0014-azure-infrastructure-deployments.md), which establishes the production infrastructure ownership model
- [0019 Monorepo Structure and Turborepo](/docs/decisions/0019-monorepo-turborepo.md), which governs the package and application boundaries used by the implementation
