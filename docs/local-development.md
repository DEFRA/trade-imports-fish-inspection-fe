# Local development

This document covers the npm scripts, the local Docker Compose stack, and the test and lint tools.

## Requirements

- Node.js 24 or later (`engines` in [package.json](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/package.json)).
- Use `nvm use` with the version in the repository for consistency (see the [repository README](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/README.md)).

## Setup

```bash
npm install
```

`npm run setup:husky` installs Husky hooks when Husky is present.

## Running the service

| Script                   | Purpose                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`            | Runs `nodemon` with `AWS_EMF_ENVIRONMENT=Local`. Restarts on changes in `src/server` and `src/config`. Loads `.env` if present. |
| `npm run dev:debug`      | Same as `dev`, with the Node inspector paused on start (`--inspect-brk`).                                                       |
| `npm run build:frontend` | Builds client assets into `.public` (see [client assets](client-assets.md)).                                                    |
| `npm start`              | Runs the production mode entry (`NODE_ENV=production node .`). `prestart` builds assets first.                                  |

The server listens on `PORT` (default `3000`). Configuration is described in [configuration](configuration.md).

## Local stack with Docker Compose

[compose.yml](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/compose.yml) starts the dependencies and the frontend:

- `floci` (port 4566): AWS emulation for S3 and SQS. Loads [compose/aws.env](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/compose/aws.env) and runs scripts from [compose/floci/start.d](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/compose/floci/start.d). The default script is commented out.
- `redis` (port 6379): session cache.
- `mongodb` (port 27017): loads [compose/mongo/10-init.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/compose/mongo/10-init.js) on first start. A healthcheck is defined.
- `your-frontend` (port 3000): built from the repository `Dockerfile`. It runs with `NODE_ENV=production`, `REDIS_HOST=redis`, `LOG_FORMAT=pino-pretty`, `SESSION_COOKIE_SECURE=false`, `USE_SINGLE_INSTANCE_CACHE=true`, and `REDIS_TLS=false`.
- A commented-out `your-backend` example.

```bash
docker compose up --build -d
```

Because the frontend container runs in production mode, it serves prebuilt assets and uses the Redis session cache.

## Tests

- `npm test` runs Vitest with coverage and sets `TZ=UTC`.
- `npm run test:watch` runs Vitest in watch mode.
- Tests sit next to their source (for example [cookie-policy-manager.test.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/common/helpers/cookie-policy-manager.test.js)). Shared helpers are in [test-helpers/component-helpers.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/test-helpers/component-helpers.js).

## Lint and format

- `npm run lint` runs `lint:js` (ESLint) and `lint:scss` (Stylelint).
- `npm run format` and `npm run format:check` run Prettier on `src` and common config files.
- `npm run security-audit` runs `npm audit --audit-level=critical`.
- `npm run git:pre-commit-hook` runs audit, format check, lint, and tests together.
