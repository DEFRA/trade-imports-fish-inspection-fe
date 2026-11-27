# Client assets

The browser code and styles are built with Vite into `.public/`. The build is configured in [vite.config.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/vite.config.js).

## Build

- `npm run build:frontend` runs `vite build`.
- `prestart` runs the build before `npm start`.
- The Dockerfile runs the build in the development and production build stages.

Vite settings:

- `base` is `/public`. `outDir` is `.public`, and `manifest: true` writes `.public/.vite/manifest.json`.
- Entry points:
  - `src/client/javascripts/application.js`
  - `src/client/stylesheets/application.scss`
  - `src/client/assets.html`
- Sourcemaps are generated.
- SCSS uses `sass-embedded` with load paths including `node_modules`, `src/client/stylesheets`, `src/server`, and the component and partial directories.

## Runtime serving

- Development: Vite runs in middleware mode and serves `/public` (see [routes](routes.md)). `getAssetPath()` returns unhashed paths.
- Production: `.public` is served by `serveStaticFiles`, and `getAssetPath()` resolves hashed names through the manifest.

## JavaScript

[application.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/client/javascripts/application.js) initialises the cookie banner and the GOV.UK Frontend components `Button`, `Checkboxes`, `ErrorSummary`, `Radios`, `SkipLink`, and `Tabs`.

For each `[data-goods-toggle]` button it hides the rows controlled by `aria-controls`, reveals the button, and toggles the rows and the button's `aria-expanded` and text (`Show more` / `Show less`) on click.

For each `.inspection-action-options` radio group (the action form on the consignment page), only the first three radio items stay visible. If there are more, the rest are moved into a hidden container with a "Show more options" button before it and a "Show less" button inside it. The container starts expanded when one of the extra radios is checked. "Show more options" reveals the extras and focuses the first extra radio. "Show less" clears any checked extra radio (dispatching a bubbling `change` event), collapses the container and focuses "Show more options".

For each `[data-decision-confirmation]` block, the block is hidden unless the `inspection-action` radio in the same form with value `issue-decision` is checked, and is updated on each radio `change`.

When the URL hash matches an element with `data-results-tab` (the dashboard's `<tab>-results` heading or the first row of the latest batch of results), the hash is replaced with the tab id before `Tabs` is initialised so that the matching tab is selected. When there is no hash, the hash is set to the tab selected by the server. On the first `pageshow` the target element is then focused and scrolled into view. See [Inspection dashboard](inspection-dashboard.md#links-and-anchors).

It also updates the dashboard summary cards for the selected tab: for each `.inspection-dashboard__summary-card` it copies `data-count` and `data-href` from the matching `[data-summary-tab]` element into the card's `[data-summary-count]` and `[data-summary-link]`. This runs on load, on tab clicks and on `hashchange`. See [Inspection dashboard](inspection-dashboard.md#quick-filters-and-summary-cards).

[cookies.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/client/javascripts/cookies.js) implements consent handling. See [cookie consent](cookie-consent.md).

## Styles

- [application.scss](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/client/stylesheets/application.scss) is the entry point.
- It uses `@use` for `govuk-frontend`, `variables`, `helpers`, `core`, `components`, `partials` and `inspection-dashboard` (the dashboard styles in `_inspection-dashboard.scss`). It also defines the `inspection-overview__*` and `inspection-case__*` styles for the consignment detail page, including the MoJ timeline styling.
- Partials cover variables (`variables/_colours.scss`), core layout (`core/_header.scss` and `core/_main.scss`), helpers (`helpers/_links.scss`), and components (`components/`, which uses the `heading` component styles).
- `_govuk-frontend.scss` imports GOV.UK Frontend.
- Linting: `npm run lint:scss` runs Stylelint over `src/**/*.scss`.
