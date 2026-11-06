---
layout: page
title: FIS inspection frontend
description: Technical documentation
---

For setup basics see the [repository README](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/README.md).

| Document                                                 | Covers                                                           |
| -------------------------------------------------------- | ---------------------------------------------------------------- |
| [Server startup and plugins](/server-startup/)           | Entry point, `createServer()`, plugin order, error handler       |
| [Routes](/routes/)                                       | Route table, route module layout, static assets                  |
| [Configuration](/configuration/)                         | All config keys, environment variables, and defaults             |
| [Sessions and caching](/sessions-and-caching/)           | Yar session, Catbox engines, Redis client                        |
| [Cookie consent](/cookie-consent/)                       | Consent cookie, banner, `/cookies` routes, client-side behaviour |
| [Security](/security/)                                   | Security headers, CSP, CSRF, cookie and redirect safety          |
| [Views and templates](/views-and-templates/)             | Nunjucks setup, shared context, layout, globals and filters      |
| [Client assets](/client-assets/)                         | Vite build, runtime asset serving, JavaScript and SCSS           |
| [Logging and observability](/logging-and-observability/) | Logger, request logging and tracing, health check, Pulse         |
| [Local development](/local-development/)                 | npm scripts, Docker Compose stack, tests, linting                |
| [Deployment](/deployment/)                               | Dockerfile stages, production runtime, CI workflows              |
