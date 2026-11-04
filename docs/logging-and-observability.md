---
layout: page
title: Logging and observability
description: Logger, request logging and tracing, health check, Pulse and metrics.
order: 9
---

This document covers logging, request tracing, the health endpoint, and the Pulse and metrics plugins.

## Logger

[logger.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/common/helpers/logging/logger.js) creates one shared `pino` logger from [logger-options.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/plugins/logger-options.js).

- `LOG_FORMAT=ecs` uses `@elastic/ecs-pino-format` with the service name and version.
- `LOG_FORMAT=pino-pretty` uses the `pino-pretty` transport.
- Log level comes from `LOG_LEVEL`. Logging is disabled when `LOG_ENABLED` is `false`.
- `/health` is excluded from log output.
- Trace IDs from `@defra/hapi-tracing` are added to each entry as `trace.id`.
- Redaction paths come from `LOG_REDACT`. In production, the defaults are `req.headers.authorization`, `req.headers.cookie`, and `res.headers`.

## Request logging

[request-logger.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/plugins/request-logger.js) uses `hapi-pino`. It skips `/public/*`, `/health`, and `/favicon.ico`.

## Request tracing

[request-tracing.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/plugins/request-tracing.js) uses `@defra/hapi-tracing`. It reads the header named by `TRACING_HEADER` (default `x-cdp-request-id`) to correlate requests across services.

## Health check

`GET /health` returns `{ "message": "success" }` with status 200. The platform uses it for health checks, so keep the route (see [routes](/routes/)).

The production image installs `curl` for the platform health check (see [deployment](/deployment/)).

## Pulse

[pulse.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/plugins/pulse.js) registers `hapi-pulse` with the shared logger and a 10 second timeout.

## Metrics

The `@defra/cdp-metrics` plugin is registered in [server.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/server.js). This document does not describe the metrics it emits. Check the package documentation for details.

## Error logging

The error handler in [errors.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/common/helpers/errors.js) logs server errors (status 500 and above) at `error` level.
