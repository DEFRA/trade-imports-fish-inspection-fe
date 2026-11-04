---
layout: page
title: Sessions and caching
description: Server-side session storage, Catbox cache engines and the Redis client.
order: 4
---

This document covers server-side session storage, the Catbox cache engines, and the Redis client.

## Session plugin

[src/server/plugins/session-cache.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/plugins/session-cache.js) registers `@hapi/yar`:

- The session is stored in the Hapi cache named by `session.cache.name` (default `session`), with an expiry of `session.cache.ttl` (default four hours).
- The session cookie is named `session.cache.name`. Its password, lifetime, and `Secure` flag come from `session.cookie.*`.
- `storeBlank` is `false`, so empty sessions are not written.
- `errorOnCacheNotReady` is `true`, so requests fail if the cache is unavailable.
- `clearInvalid` is `true`, so invalid session cookies are removed.

Yar's `maxCookieSize` is left at its default, so session data is not limited to the cookie.

## Cache engine selection

[src/server/common/helpers/session-cache/cache-engine.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/common/helpers/session-cache/cache-engine.js) picks the engine from `session.cache.engine`:

- `redis` returns a `CatboxRedis` engine using the client from `buildRedisClient()`.
- Any other value returns `CatboxMemory`. When `NODE_ENV=production`, an error is logged because memory storage is for local development only.

The memory engine is not shared between instances and is lost on restart.

## Redis client

[src/server/common/helpers/redis-client.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/common/helpers/redis-client.js) builds the client from the `redis` config:

- Single-instance mode (`redis.useSingleInstanceCache` is `true`) uses `ioredis` `Redis`. Otherwise a `Cluster` client is used with the configured host.
- Port is fixed at `6379` and database at `0`. These are not configurable.
- `username` and `password` are only passed when `username` is non-empty.
- TLS is enabled when `redis.useTLS` is `true`.
- Every key is prefixed with `redis.keyPrefix` (default `trade-imports-fish-inspection-fe:`).
- Connection and error events are written to the logger.

## Local development

The `compose.yml` file runs Redis on port 6379 and the frontend uses it with `USE_SINGLE_INSTANCE_CACHE=true` and `REDIS_TLS=false`. Running `npm run dev` without Redis uses the memory engine by default.
