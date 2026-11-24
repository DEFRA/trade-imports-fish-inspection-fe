# Routes

This document lists the HTTP routes the service exposes and how route modules are organised.

## Route table

| Method | Path               | Auth                 | Handler                                                                                                                                                  | Response                                                                                           |
| ------ | ------------------ | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| GET    | `/`                | none                 | [home plugin](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/routes/home/index.js)                                       | Redirect to `/inspections`                                                                         |
| GET    | `/inspections`     | mock user in session | [home controller](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/routes/home/controller.js)                              | `inspection/dashboard/index` view, redirect to `/mock-auth`, or 403                                |
| GET    | `/account`         | mock user in session | [home controller](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/routes/home/controller.js)                              | `inspection/account` view, redirect to `/mock-auth`, or 403                                        |
| POST   | `/sign-out`        | none                 | [home controller](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/routes/home/controller.js)                              | Clears the mock user and redirects to `/mock-auth` (`/inspections` when `AUTH_MODE` is not `mock`) |
| GET    | `/mock-auth`       | none                 | [home controller](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/routes/home/controller.js)                              | `inspection/mock-auth` view (only registered when `AUTH_MODE=mock`)                                |
| POST   | `/mock-auth`       | none                 | [home controller](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/routes/home/controller.js)                              | Signs in a mock user (only registered when `AUTH_MODE=mock`), see [Mock sign-in](#mock-sign-in)    |
| GET    | `/about`           | none                 | [about controller](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/routes/about/controller.js)                            | `about/index` view                                                                                 |
| GET    | `/health`          | none                 | [health controller](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/routes/health/controller.js)                          | JSON `{ "message": "success" }`, 200                                                               |
| GET    | `/cookies`         | none                 | [cookies controller](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/routes/cookies/controller.js)                        | `cookies/policy` view                                                                              |
| POST   | `/cookies`         | none                 | [cookies controller](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/routes/cookies/controller.js)                        | JSON or redirect, see [cookie consent](cookie-consent.md)                                          |
| GET    | `/favicon.ico`     | none                 | [serve-static-files.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/plugins/serve-static-files.js)                    | 204 No Content (production and test only)                                                          |
| GET    | `/public/{param*}` | none                 | [serve-static-files.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/plugins/serve-static-files.js) or Vite middleware | Built client assets, see [client assets](client-assets.md)                                         |

Route handlers and the `/cookies` routes are wired in [router.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/plugins/router.js).

## Route modules

Each feature lives in `src/server/routes/<name>/`:

- `index.js` exports a Hapi plugin that calls `server.route()`. Modules without an `index.js` (such as `cookies`, which exports its plugin from `controller.js`) are registered from their controller instead.
- `controller.js` exports the handler (and any validation options).
- `index.njk` is the view, when the route renders HTML. Views are referenced by path relative to `src/server/routes`, for example `home/index`. The `cookies` module renders `policy.njk`.
- `controller.test.js` holds the Vitest tests.

The `error` module only holds the `index.njk` view used by the error handler and the mock sign-in 403 response. Its `index.js` is empty and registers no routes.

The `about` route is an example page from the CDP template. The `health` route must stay: it is used by the platform.

## Mock sign-in

The `home` plugin registers the dashboard, account, sign-out and mock sign-in routes. The user is stored in the Yar session under `mock-user` (see [sessions and caching](sessions-and-caching.md)).

- The picker is opt-in through `authMode` (`AUTH_MODE`, default `disabled`; see [configuration](configuration.md#authentication-mode)). The `/mock-auth` routes are registered only when it is `mock`, independent of `NODE_ENV`. If the handlers were reached while disabled, they return 404.
- When `authMode` is not `mock`, `/inspections` and `/account` return the `error/index` view with status 403 and the message "Dashboard sign-in is not available on this service." This applies even to a session that already holds a PHA user. `POST /sign-out` still clears the session user and redirects to `/inspections`.
- `GET /mock-auth` lists the users from [mock-users.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/routes/inspection/mock-users.js): `felixstowe-test` (PHA, port `FELIXSTOWE`), `dover-test` (PHA, port `DOVER`) and `non-pha-test` (role `IMPORTER`, no port).
- `POST /mock-auth` reads `mockUser` from the payload. An unknown id returns 400. A user without the `PHA` role gets the `error/index` view with status 403. Otherwise the user is saved in the session and the response redirects to `/inspections`.
- With the picker enabled, `/inspections` redirects to `/mock-auth` when there is no session user, and returns 403 ("You do not have permission to access this page") when the user lacks the `PHA` role or a `portId`. Otherwise it renders the dashboard for the user's port: `portId` is passed to `buildInspectionDashboardViewModel` (see [inspection dashboard](inspection-dashboard.md)), and the mock consignment API returns only consignments for that port whose `notificationStatus` is `SUBMITTED` (seeds without a `portId` default to `FELIXSTOWE`, and seeds without a `notificationStatus` default to `SUBMITTED`).
- `/account` renders the signed-in user's details, redirects to `/mock-auth` when there is no session user, and returns 403 for users without the `PHA` role or a `portId`.

## Static assets

- Outside production and test, [router.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/plugins/router.js) starts Vite in middleware mode and mounts it at `/public` through `@defra/hapi-connect`.
- In production or test, `serveStaticFiles` serves `${assetPath}/{param*}` from `.public` with a cache lifetime of `staticCacheTimeout` (default one week).
- The `/favicon.ico` route is registered only in the production or test branch.

## Request logging

The request logger ignores `/public/*`, `/health`, and `/favicon.ico` (see [request-logger.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/plugins/request-logger.js)).
