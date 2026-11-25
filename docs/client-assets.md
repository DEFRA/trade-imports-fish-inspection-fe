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

It also enhances the inspection action form rendered by `inspection-action-form`:

- `[data-goods-toggle]` buttons toggle the content named by `aria-controls` and switch their text between `Show more` and `Show less`.
- In `.inspection-action-options` radios, everything after the first three items is moved into a collapsible group with `Show more options` and `Show less` buttons. The group starts expanded if one of those items is checked. `Show less` clears any selection in the group.
- `[data-decision-confirmation]` is shown only while the `issue-decision` action is selected.

[cookies.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/client/javascripts/cookies.js) implements consent handling. See [cookie consent](cookie-consent.md).

## Styles

- [application.scss](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/client/stylesheets/application.scss) is the entry point.
- It uses `@use` for `govuk-frontend`, `variables`, `helpers`, `core`, `components`, `partials` and `inspection-dashboard` (the dashboard styles in `_inspection-dashboard.scss`). It also defines the `inspection-overview__*` and `inspection-case__*` styles for the consignment detail page, including the MoJ timeline styling.
- Partials cover variables (`variables/_colours.scss`), core layout (`core/_header.scss` and `core/_main.scss`), helpers (`helpers/_links.scss`), and components (`components/`, which uses the `heading` component styles).
- `_govuk-frontend.scss` imports GOV.UK Frontend.
- Linting: `npm run lint:scss` runs Stylelint over `src/**/*.scss`.
