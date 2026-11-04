---
layout: page
title: Configuration
description: Configuration keys, environment variables and defaults.
order: 3
---

All configuration is defined with [convict](https://github.com/mozilla/node-convict) in [src/config/config.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/config/config.js). Values are read from environment variables where an `env` name is listed. The config is validated with `strict` mode at startup, so unknown keys fail fast.

Defaults marked "production" depend on `NODE_ENV === 'production'`.

## Service

| Key                      | Environment variable    | Default                  | Notes                                                                                                                           |
| ------------------------ | ----------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `serviceVersion`         | `SERVICE_VERSION`       | `null`                   | Injected by CDP environments                                                                                                    |
| `host`                   | `HOST`                  | `0.0.0.0`                | Bind address                                                                                                                    |
| `port`                   | `PORT`                  | `3000`                   | Bind port                                                                                                                       |
| `serviceName`            | none                    | `Fish import inspection` | Used in page titles and the header                                                                                              |
| `assetPath`              | `ASSET_PATH`            | `/public`                | Base path for built assets                                                                                                      |
| `staticCacheTimeout`     | `STATIC_CACHE_TIMEOUT`  | one week (ms)            | Cache lifetime for static files                                                                                                 |
| `isSecureContextEnabled` | `ENABLE_SECURE_CONTEXT` | `true` in production     | Enables the secure context plugin                                                                                               |
| `httpProxy`              | `HTTP_PROXY`            | `null`                   | See the proxy section in the [repository README](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/README.md) |

`isProduction`, `isDevelopment`, and `isTest` are derived from `NODE_ENV`.

## Logging

| Key           | Environment variable | Default                                                | Notes                           |
| ------------- | -------------------- | ------------------------------------------------------ | ------------------------------- |
| `log.enabled` | `LOG_ENABLED`        | `true` unless `NODE_ENV=test`                          |                                 |
| `log.level`   | `LOG_LEVEL`          | `info`                                                 | `fatal` to `trace`, or `silent` |
| `log.format`  | `LOG_FORMAT`         | `ecs` in production, otherwise `pino-pretty`           | `ecs` or `pino-pretty`          |
| `log.redact`  | `LOG_REDACT`         | authorization, cookie, and `res.headers` in production | Paths removed from log output   |

See [logging and observability](/logging-and-observability/).

## Sessions and cache

| Key                       | Environment variable      | Default                                   | Notes                                         |
| ------------------------- | ------------------------- | ----------------------------------------- | --------------------------------------------- |
| `session.cache.engine`    | `SESSION_CACHE_ENGINE`    | `redis` in production, otherwise `memory` | Allowed values: `redis`, `memory`             |
| `session.cache.name`      | `SESSION_CACHE_NAME`      | `session`                                 | Name of the Hapi cache                        |
| `session.cache.ttl`       | `SESSION_CACHE_TTL`       | four hours (ms)                           | Server-side session lifetime                  |
| `session.cookie.ttl`      | `SESSION_COOKIE_TTL`      | four hours (ms)                           | Session cookie lifetime                       |
| `session.cookie.password` | `SESSION_COOKIE_PASSWORD` | a placeholder string                      | Sensitive. Must be overridden per environment |
| `session.cookie.secure`   | `SESSION_COOKIE_SECURE`   | `true` in production                      | Secure flag on the session cookie             |

See [sessions and caching](/sessions-and-caching/).

## Redis

| Key                            | Environment variable        | Default                             | Notes                                    |
| ------------------------------ | --------------------------- | ----------------------------------- | ---------------------------------------- |
| `redis.host`                   | `REDIS_HOST`                | `127.0.0.1`                         |                                          |
| `redis.username`               | `REDIS_USERNAME`            | `''`                                | Credentials are only sent when non-empty |
| `redis.password`               | `REDIS_PASSWORD`            | `''`                                | Sensitive                                |
| `redis.keyPrefix`              | `REDIS_KEY_PREFIX`          | `trade-imports-fish-inspection-fe:` |                                          |
| `redis.useSingleInstanceCache` | `USE_SINGLE_INSTANCE_CACHE` | `true` unless production            | `false` uses a Redis Cluster client      |
| `redis.useTLS`                 | `REDIS_TLS`                 | `true` in production                |                                          |

## Cookies and tracing

| Key                                   | Environment variable     | Default                                   | Notes                           |
| ------------------------------------- | ------------------------ | ----------------------------------------- | ------------------------------- |
| `cookieConsent.name`                  | none                     | `trade-imports-fish-inspection-fe_policy` | Consent cookie name             |
| `cookieConsent.config.ttl`            | none                     | one year (ms)                             |                                 |
| `googleAnalytics.googleTagManagerKey` | `GOOGLE_TAG_MANAGER_KEY` | `''`                                      | Expected format `GTM-XXXXXXXX`  |
| `tracing.header`                      | `TRACING_HEADER`         | `x-cdp-request-id`                        | Header used for request tracing |

## Nunjucks

| Key                | Default (development) | Notes                               |
| ------------------ | --------------------- | ----------------------------------- |
| `nunjucks.watch`   | `true`                | Reload templates on change          |
| `nunjucks.noCache` | `true`                | Recompile templates on every render |

Both default to `false` outside development. See [views and templates](/views-and-templates/).

## Local `.env`

`npm run dev` and `npm run server:watch` read `.env` when present (`--env-file-if-exists=.env`). Do not commit secrets.
