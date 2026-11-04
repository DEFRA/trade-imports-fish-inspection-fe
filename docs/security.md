# Security

This document covers the HTTP security controls applied to every response and request.

## Security headers

Set in `routes.security` in [server.js](../src/server/server.js):

- `Strict-Transport-Security`: max age one year, `includeSubDomains`, no `preload`.
- `X-XSS-Protection` enabled, `X-Content-Type-Options: nosniff`, and `X-Frame-Options` enabled.

## Content Security Policy

[content-security-policy.js](../src/server/plugins/content-security-policy.js) configures `blankie`:

- `defaultSrc`, `imgSrc`, `mediaSrc`, `fontSrc`, `styleSrc`, `manifestSrc`, and `formAction` are `'self'`, with `data:` where listed.
- `scriptSrc` allows `'self'`, one inline script hash, and Google Tag Manager and Google Analytics hosts.
- `connectSrc` allows `'self'`, `wss`, `data:`, and Google analytics hosts.
- `frameSrc` allows `https://www.googletagmanager.com`.
- `objectSrc` is `'none'` and `frameAncestors` is `'none'`.
- `generateNonces` is `true`, so nonces are generated per request.

Changes to inline scripts or Google hosts require updating this policy.

## CSRF protection

[csrf.js](../src/server/plugins/csrf.js) registers `@hapi/crumb`:

- Crumb sets a cookie holding the token, and the token is available to templates as `crumb`.
- Forms include the token as a hidden `crumb` field. The client-side consent script sends it in the JSON body.
- POST requests without a matching token are rejected with 403.
- The cookie `Secure` flag is set only in production.

## Cookie and session security

- The consent cookie uses `SameSite=Lax` and is `Secure` in production.
- The session cookie is `Secure` when `session.cookie.secure` is true (production by default).
- `SESSION_COOKIE_PASSWORD` must be overridden in every deployed environment. The default is a placeholder.

## Redirects

Only same-site relative paths are accepted for the cookie form's `returnUrl`. See [cookie consent](cookie-consent.md).

## Logging

In production, the logger redacts `req.headers.authorization`, `req.headers.cookie`, and `res.headers` by default. See [configuration](configuration.md).
