# Client assets

The browser code and styles are built with Vite into `.public/`. The build is configured in [vite.config.js](../vite.config.js).

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

[application.js](../src/client/javascripts/application.js) initialises the cookie banner and the GOV.UK Frontend components `Button`, `Checkboxes`, `ErrorSummary`, `Radios`, and `SkipLink`.

[cookies.js](../src/client/javascripts/cookies.js) implements consent handling. See [cookie consent](cookie-consent.md).

## Styles

- [application.scss](../src/client/stylesheets/application.scss) is the entry point.
- Partials cover variables (`variables/_colours.scss`), core layout (`core/`), helpers (`helpers/`), and components (`components/`).
- `_govuk-frontend.scss` imports GOV.UK Frontend.
- Linting: `npm run lint:scss` runs Stylelint over `src/**/*.scss`.
