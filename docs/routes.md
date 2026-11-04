# Routes

This document lists the HTTP routes the service exposes and how route modules are organised.

## Route table

| Method | Path                | Auth | Handler                                                                             | Response                                                 |
| ------ | ------------------- | ---- | ----------------------------------------------------------------------------------- | -------------------------------------------------------- |
| GET    | `/`                 | none | [home controller](../src/server/routes/home/controller.js)                          | `home/index` view (Dashboard)                            |
| GET    | `/about`            | none | [about controller](../src/server/routes/about/controller.js)                        | `about/index` view                                       |
| GET    | `/health`           | none | [health controller](../src/server/routes/health/controller.js)                      | JSON `{ "message": "success" }`, 200                     |
| GET    | `/cookies`          | none | [cookies controller](../src/server/routes/cookies/controller.js)                    | `cookies/policy` view                                    |
| POST   | `/cookies`          | none | [cookies controller](../src/server/routes/cookies/controller.js)                    | JSON or redirect, see [cookie consent](cookie-consent.md) |
| GET    | `/favicon.ico`      | none | [serve-static-files.js](../src/server/plugins/serve-static-files.js)                | 204 No Content (production and test only)                |
| GET    | `/public/{param*}`  | none | [serve-static-files.js](../src/server/plugins/serve-static-files.js) or Vite middleware | Built client assets, see [client assets](client-assets.md) |

Route handlers and the `/cookies` routes are wired in [router.js](../src/server/plugins/router.js).

## Route modules

Each feature lives in `src/server/routes/<name>/`:

- `index.js` exports a Hapi plugin that calls `server.route()`.
- `controller.js` exports the handler (and any validation options).
- `index.njk` is the view, when the route renders HTML. Views are referenced by path relative to `src/server/routes`, for example `home/index`.
- `controller.test.js` holds the Vitest tests.

The `home` and `about` routes are example pages from the CDP template. The `health` route must stay: it is used by the platform.

## Static assets

- Outside production and test, [router.js](../src/server/plugins/router.js) starts Vite in middleware mode and mounts it at `/public` through `@defra/hapi-connect`.
- In production or test, `serveStaticFiles` serves `${assetPath}/{param*}` from `.public` with a cache lifetime of `staticCacheTimeout` (default one week).
- The `/favicon.ico` route is registered only in the production or test branch.

## Request logging

The request logger ignores `/public/*`, `/health`, and `/favicon.ico` (see [request-logger.js](../src/server/plugins/request-logger.js)).
