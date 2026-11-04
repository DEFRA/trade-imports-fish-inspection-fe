---
layout: page
title: Cookie consent
description: How analytics cookie consent is stored, enforced and presented.
order: 5
---

The service asks users whether they accept analytics cookies. Consent is stored in a server-readable cookie. Google Tag Manager (GTM) loads only after the user accepts analytics. The implementation works without JavaScript, with JavaScript providing an enhanced experience.

## Consent state

[src/server/common/helpers/cookie-policy-manager.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/common/helpers/cookie-policy-manager.js) manages the cookie:

- Cookie name: `cookieConsent.name`, default `trade-imports-fish-inspection-fe_policy`.
- Default policy when no cookie exists: `{ confirmed: false, essential: true, analytics: false }`. Analytics are off until the user opts in.
- `updatePolicy()` sets `analytics` and `confirmed: true`, then removes analytics cookies if analytics were rejected.
- `removeAnalytics()` expires cookies matching `_ga`, `_ga_*`, `_gid`, `_gat_*`, and `_dc_gtm_*` using `h.unstate()`.
- Cookie options come from `cookieConsent.policy` (`base64json` encoding, `SameSite=Lax`, `Secure` in production, `clearInvalid`) and `cookieConsent.config` (one-year TTL).

## Template context

[src/server/plugins/cookie-consent.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/plugins/cookie-consent.js) runs on `onPreResponse` for view responses (except 403). For each view it:

- Sets `Cache-Control: no-store` so pages are not kept in the back/forward cache.
- Adds `cookiesPolicy` and `currentPath` to the template context.
- If the user has confirmed a choice and rejected analytics, calls `removeAnalytics()`. This covers users without JavaScript who previously accepted.

The layout in [page.njk](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/common/templates/layouts/page.njk) shows the banner while `cookiesPolicy.confirmed` is false, and includes the GTM snippets only when `cookiesPolicy.analytics` is true.

## Routes

Defined in [src/server/routes/cookies/controller.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/routes/cookies/controller.js):

- `GET /cookies` renders the preferences page. `?updated=true` shows a confirmation.
- `POST /cookies` requires `analytics` (boolean). Optional `async` (boolean, default `false`) and `returnUrl` (string, max 2000 characters).
  - `async: true` returns JSON `{ "message": "success" }`.
  - A `returnUrl` passing `isSafeRedirect()` redirects there.
  - Otherwise the response redirects to `/cookies?updated=true`.

`isSafeRedirect()` in [is-safe-redirect.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/common/helpers/is-safe-redirect.js) only accepts paths starting with `/` and not `//`.

## Banner

[banner.njk](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/common/templates/partials/cookies/banner.njk) is a form posting to `/cookies`:

- Without JavaScript, the Accept and Reject buttons submit `analytics=true` or `analytics=false`. `returnUrl` sends the user back to the current page.
- The form includes the CSRF `crumb` as a hidden field (see [security](/security/)).
- `data-crumb` and `data-gtm-key` on the banner pass values to the client script.

## Client behaviour

[src/client/javascripts/cookies.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/client/javascripts/cookies.js) progressively enhances the banner:

- On Accept, it loads GTM immediately when the key matches `^GTM-[A-Z0-9]+$`.
- On Reject, it deletes GA cookies across the hostname's domain variants.
- It sends the choice with an XHR `POST /cookies` (JSON body including `crumb`). A non-2xx response or network error falls back to a native form submit.
- On load, if the banner is absent and no GTM script is present, it deletes orphaned GA cookies.
- On a `pageshow` event with `persisted`, it deletes GA cookies and reloads.

Note: the client sends `crumb` in the JSON body, and [csrf.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/plugins/csrf.js) relies on `@hapi/crumb` accepting it there.
