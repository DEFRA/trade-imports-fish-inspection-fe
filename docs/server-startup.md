---
layout: page
title: Server startup and plugins
description: How the service boots, builds the Hapi server and registers plugins.
order: 1
---

This document describes how the service boots, how the Hapi server is built, and the order in which plugins are registered.

## Entry point

- [src/index.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/index.js) imports `startServer()` and registers an `unhandledRejection` handler that logs the error and sets `process.exitCode = 1`.
- [src/server/common/helpers/start-server.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/common/helpers/start-server.js) calls `createServer()`, then `server.start()`, and logs the listening URL (`http://localhost:<port>`).
- [src/server/server.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/server.js) exports `createServer()`, which builds the Hapi server and registers all plugins.

## Server options

Set in `createServer()`:

- Host and port come from `host` and `port` in [configuration](/configuration/).
- Request validation runs with `abortEarly: false`, so all validation errors are reported.
- Static files resolve relative to `<root>/.public`.
- Security headers: HSTS (`maxAge` 31536000, `includeSubDomains`, no `preload`), `xss: 'enabled'`, `noSniff: true`, and `xframe: true`.
- Router strips trailing slashes.
- One server-side cache named by `session.cache.name` (default `session`), backed by the engine from `getCacheEngine()`. See [sessions and caching](/sessions-and-caching/).
- Cookie parsing is lenient: `state.strictHeader` is `false`.

## Plugin registration order

Plugins are registered in this order in `createServer()`:

1. `requestLogger` (`hapi-pino`): [request-logger.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/plugins/request-logger.js)
2. `requestTracing` (`@defra/hapi-tracing`): [request-tracing.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/plugins/request-tracing.js)
3. `metrics` (`@defra/cdp-metrics`)
4. `secureContext` (`@defra/hapi-secure-context`)
5. `pulse` (`hapi-pulse`, 10 second timeout): [pulse.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/plugins/pulse.js)
6. `contentSecurityPolicy` (`blankie`): [content-security-policy.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/plugins/content-security-policy.js)
7. `sessionCache` (`@hapi/yar`): [session-cache.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/plugins/session-cache.js)
8. `nunjucksConfig` (`@hapi/vision`): see [views and templates](/views-and-templates/)
9. `Scooter` (`@hapi/scooter`, user agent parsing)
10. `csrf` (`@hapi/crumb`): see [security](/security/)
11. `cookieConsent`: [cookie-consent.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/plugins/cookie-consent.js), see [cookie consent](/cookie-consent/)
12. `router`: [router.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/plugins/router.js), see [routes](/routes/)

After registration, `server.ext('onPreResponse', catchAll)` installs the error handler from [errors.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/common/helpers/errors.js). Error responses render the `error/index` view with a message derived from the status code. Server errors (5xx) are logged with the request logger.

## Notes

- The order matters for `onPreResponse` extensions. `cookieConsent` adds template context before `catchAll` runs for view responses.
- `secureContext` is always registered. `ENABLE_SECURE_CONTEXT` is defined in config, but how the plugin reads it is not verified here.
