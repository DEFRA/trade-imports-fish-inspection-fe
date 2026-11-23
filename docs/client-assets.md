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

It also preserves the scroll position when an element with `data-inspection-sort-control` changes: the position is stored in `sessionStorage` (`inspection-sort-scroll-position`), the form is submitted with `requestSubmit()`, and on the next load the stored value is removed and the page scrolls to it in a `requestAnimationFrame` callback. Failures reading or writing `sessionStorage` are caught and ignored.

For each `[data-goods-toggle]` button it hides the rows controlled by `aria-controls`, reveals the button, and toggles the rows and the button's `aria-expanded` and text (`Show more` / `Show less`) on click.

It also updates the dashboard summary cards for the selected tab: for each `.inspection-dashboard__summary-card` it copies `data-count` and `data-href` from the matching `[data-summary-tab]` element into the card's `[data-summary-count]` and `[data-summary-link]`. This runs on load, on tab clicks and on `hashchange`. See [Inspection dashboard](inspection-dashboard.md#quick-filters-and-summary-cards).

[cookies.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/client/javascripts/cookies.js) implements consent handling. See [cookie consent](cookie-consent.md).

## Styles

- [application.scss](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/client/stylesheets/application.scss) is the entry point.
- It uses `@use` for `govuk-frontend`, `variables`, `helpers`, `core`, `components`, `partials` and `inspection-dashboard` (the dashboard styles in `_inspection-dashboard.scss`).
- Partials cover variables (`variables/_colours.scss`), core layout (`core/_header.scss` and `core/_main.scss`), helpers (`helpers/_links.scss`), and components (`components/`, which uses the `heading` component styles).
- `_govuk-frontend.scss` imports GOV.UK Frontend.
- Linting: `npm run lint:scss` runs Stylelint over `src/**/*.scss`.
