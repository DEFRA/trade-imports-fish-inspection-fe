# Views and templates

Pages are rendered with Nunjucks through `@hapi/vision`. The configuration is in [src/config/nunjucks/nunjucks.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/config/nunjucks/nunjucks.js).

## Engine setup

- Nunjucks is configured with `autoescape: true`, `trimBlocks`, and `lstripBlocks`.
- Template search paths:
  - `node_modules/govuk-frontend/dist/` (GOV.UK Frontend macros, for example `govuk/components/...`)
  - `src/server/common/templates`
  - `src/server/common/components`
- Vision looks up views in `src/server/routes`. A view name `home/index` resolves to `src/server/routes/home/index.njk`.
- `isCached` is `true` in production. `watch` and `noCache` follow the `nunjucks.*` config.

## Shared context

[context.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/config/nunjucks/context/context.js) adds these variables to every view:

- `assetPath`: `${assetPath}/assets`
- `serviceName`, `serviceUrl` (`/`), `cookieName`, `googleTagManagerKey`
- `breadcrumbs` (empty by default)
- `navigation`, built by [build-navigation.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/config/nunjucks/context/build-navigation.js). It contains "Dashboard" (`/`) and "About" (`/about`), with `current` set from the request path.
- `getAssetPath(asset)`: in development returns `${assetPath}/${asset}`. In production it looks up the hashed file in the Vite manifest at `.public/.vite/manifest.json`.

The cookie consent plugin adds `cookiesPolicy` and `currentPath` for each view. See [cookie consent](cookie-consent.md).

## Globals and filters

- Globals: [globals.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/config/nunjucks/globals/globals.js) exports `govukRebrand` (`true`).
- Filters: [filters.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/config/nunjucks/filters/filters.js) exports `assign`, `formatDate` ([format-date.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/config/nunjucks/filters/format-date.js)), and `formatCurrency` ([format-currency.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/config/nunjucks/filters/format-currency.js)).

## Layout

[page.njk](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/common/templates/layouts/page.njk) extends `govuk/template.njk` and provides:

- A GOV.UK header and service navigation.
- A Beta phase banner.
- Breadcrumbs when `breadcrumbs.length > 1`.
- A footer with Privacy, Cookies, and Accessibility links.
- The cookie banner, GTM snippets (only when analytics are accepted), and the application script.

Page views set `pageTitle`, which feeds the `<title>` as `pageTitle | serviceName`.

## Components

- [heading/macro.njk](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/common/components/heading/macro.njk) provides `appHeading`, which is imported into the layout. Styles are in `_heading.scss`.
- Route views (for example [home/index.njk](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/routes/home/index.njk)) extend the layout and render content in the `content` block.

## Error page

[error/index.njk](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/routes/error/index.njk) renders the message passed by the error handler in [errors.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/common/helpers/errors.js). See [server startup](server-startup.md).
