# Architecture decisions

## ADR-001: Modular monolith with asynchronous workers

The product starts as independently deployable web, API, and worker applications in one monorepo. Business domains remain NestJS modules; Redis-backed workers execute costly, retryable work. This creates clear boundaries without premature microservice operational cost.

## ADR-002: PostgreSQL is the system of record

Relational data and user ownership require transactions and constraints. Flexible model responses belong in JSONB only when not queried relationally.

## ADR-003: Resume files are private objects

The API issues time-limited upload/download URLs; it does not expose storage keys or public buckets. This minimizes sensitive-data exposure.
