# Deployment

This document describes the Docker images and how the production container starts.

## Dockerfile

[Dockerfile](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/Dockerfile) has three stages:

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

- The production container runs `node src`, which executes [src/index.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/index.js).
- Production defaults are set by `NODE_ENV=production`: ECS logs, Redis session cache, TLS to Redis, secure cookies, and secure context. See [configuration](configuration.md).
- Session and consent cookies are `Secure` in production. Local Compose overrides `SESSION_COOKIE_SECURE` to `false`.

## Dependency updates

An example Dependabot configuration is provided at `.github/example.dependabot.yml`. Rename it to `.github/dependabot.yml` to enable it.

## CI

Workflows are in `.github/workflows/` (`check-pull-request.yml`, `publish.yml`, `publish-hotfix.yml`, `build-docs.yml`).

- `build-docs.yml` runs on pull requests to `main` and pushes to `main` that change `docs/` or `mkdocs.yml`, and can be started manually. The `build` job installs Python 3.12 and `mkdocs-material==9.8.1`, runs `mkdocs build --strict` (which writes to `_site`, per `site_dir` in `mkdocs.yml`), and uploads `_site` as a Pages artifact. A warning or broken link fails the build. The `deploy` job to GitHub Pages is skipped for pull requests.
- `check-pull-request.yml` and `publish-hotfix.yml` set up Node.js from `.nvmrc`, then run `npm ci`, `npm run build:frontend`, `npm run format:check`, `npm run lint` and `npm test`. The pull request workflow also runs `npm run security-audit` first, tests the Docker image build, and runs SonarCloud and dependency review.
- `publish.yml` runs on pushes to `main` and manual dispatch from a non-`main` branch. It first runs `node scripts/configure-publish-settings.js`, then `npm ci`, `npm run build:frontend` and `npm test`, and passes the `prerelease`, `prerelease-suffix` and `push-dockerhub` outputs to `DEFRA/cdp-build-action/build`.
- [configure-publish-settings.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/scripts/configure-publish-settings.js) requires `GITHUB_REF_NAME` and `GITHUB_OUTPUT`, appends the settings to `GITHUB_OUTPUT`, and treats any branch other than `main` as a prerelease. Prerelease branches must match `feature|bugfix|ci|chore/FISB-<digits>-<lowercase-hyphenated-description>` (`FISB` is matched case-insensitively). `GITHUB_RUN_ID` and `GITHUB_RUN_ATTEMPT` must be positive integers. The suffix is `<branch>-run-<GITHUB_RUN_ID>-attempt-<GITHUB_RUN_ATTEMPT>` (lowercased, with the first `/` replaced by `-`), and `<version>-<suffix>.<build>` must fit in 128 characters (Docker tag limit). `push-dockerhub` is `true` only for `main`.
- For prereleases the script also fails if `HEAD` already has a stable tag (`v?X.Y.Z`), or if commits since the latest reachable stable tag contain `#none` without `#major`, `#minor` or `#patch`. Git is run from `GIT_EXECUTABLE` if set, otherwise `git.exe` on Windows or `/usr/bin/git`.
- The Confluence publishing workflow (`publish-docs-confluence.yml`) and its script under `scripts/confluence/` are absent from the current working tree (deleted in uncommitted changes), so there is no Confluence publishing step.

SonarCloud settings are in [sonar-project.properties](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/sonar-project.properties).
