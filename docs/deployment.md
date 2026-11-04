# Deployment

This document describes the Docker images and how the production container starts.

## Dockerfile

[Dockerfile](../Dockerfile) has three stages:

1. `development` (based on `defradigital/node-development`): installs dependencies, copies the repository, builds the client assets, and runs `npm run docker:dev` (which runs `npm run dev`). Exposes `PORT` (3000) and `9229` for debugging.
2. `production_build`: sets `NODE_ENV=production` and builds the client assets.
3. `production` (based on `defradigital/node`): installs production dependencies with `npm ci --omit=dev`, copies `package*.json`, `src`, and `.public`, and runs `node src`.

The production image installs `curl` for the platform health check. `TZ` is set to `Europe/London` in both stages.

## Commands

```bash
docker build --target development --no-cache --tag trade-imports-fish-inspection-fe:development .
docker build --no-cache --tag trade-imports-fish-inspection-fe .
docker run -p 3000:3000 trade-imports-fish-inspection-fe
```

## Runtime

- The production container runs `node src`, which executes [src/index.js](../src/index.js).
- Production defaults are set by `NODE_ENV=production`: ECS logs, Redis session cache, TLS to Redis, secure cookies, and secure context. See [configuration](configuration.md).
- Session and consent cookies are `Secure` in production. Local Compose overrides `SESSION_COOKIE_SECURE` to `false`.

## Dependency updates

An example Dependabot configuration is provided at `.github/example.dependabot.yml`. Rename it to `.github/dependabot.yml` to enable it.

## CI

Workflows are in `.github/workflows/` (`check-pull-request.yml`, `publish.yml`, `publish-hotfix.yml`). SonarCloud settings are in [sonar-project.properties](../sonar-project.properties).
