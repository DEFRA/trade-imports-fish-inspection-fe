---
name: create-update-eleventy-docs
description: Create or update technical documentation in docs/ when asked to document a feature, service, workflow, configuration, or code area. Compare existing Markdown with the current implementation and revise stale descriptions to match the code. The format of the markdowns follows Eleventy conventions.
---

# Technical Documentation

Create or reconcile focused technical Markdown documents under `./docs`, with one file per part of the service (for example routes, server plugins, Nunjucks configuration, client assets, or local infrastructure) and an index that links them.

`./docs` is the input folder for the GOV.UK Eleventy plugin configured in `eleventy.config.js`, so each document must be accurate Markdown that is compatible with Eleventy.

The implementation is the source of truth for current behavior.

When an existing document disagrees with working code, update the document to describe the code as it exists now; do not change code as part of this documentation task.

## Workflow

1. **Identify the subject and destination.** Translate the request into a specific feature, workflow, or part of the service. Search `./docs` (including subdirectories) for the closest existing document. Reuse and update that file when it covers the subject; otherwise choose a concise, descriptive Markdown filename under `./docs` for that part, following any local naming convention. If a request spans several parts, write a separate file for each part and link them rather than producing one large document. Do not add a subject to an existing file when it belongs to a different part of the service.
2. **Trace the behavior.** Locate the code that directly implements or controls the subject. Follow relevant route handlers, services, templates, configuration, environment variables, package scripts, and external calls as needed. Read nearby tests as corroborating evidence for expected inputs, outputs, and edge cases. Keep exploration scoped to claims the document needs to make.
3. **Compare documentation with evidence.** For an existing document, check each functional claim, code path, configuration name/default, command, and link against the current repository. Treat implementation and active configuration as authoritative for current behavior; use tests to confirm behavior, not to override contradictory implementation. Mark genuine uncertainties rather than filling gaps with assumptions.
4. **Create or revise the documents.** `./docs/index.md` should always exist independently of other documents, as it serves as the entry point for the documentation. If no suitable document exists, create one under `./docs` for that part of the service. If one exists, update it in place. Whenever a file is created, renamed, or removed, update the index `./docs/index.md` so it lists every part-specific document with a one-line description and no broken links. Create it only when the split documentation needs one, following the Eleventy conventions below. Explain the current behavior, relevant decisions, inputs/outputs, configuration, and operational steps only when they apply to the requested subject. Replace stale statements and examples, remove claims no longer supported by the code, and preserve accurate material. Keep the scope focused and avoid duplicating easy-to-find facts without a documentation benefit. Only document behaviour that is directly supported by code, configuration or nearby tests. Do not speculate or add unverified details.
5. **Verify the result.** Confirm the Markdown file is under `./docs`, its relative code links resolve, and any documented commands or configuration identifiers exist in the repository. Run `npx eleventy` and confirm it builds without errors, including no `DuplicatePermalinkOutputError`. Run a relevant documentation lint or check if the project provides one; otherwise perform a focused review of the edited file against the traced code. Report any behavior that could not be verified. Confirm that no code changes were made as part of this documentation update.

## Eleventy site conventions

- Every document under `./docs` needs front matter with `layout: page`, `title`, and `description`. `layout: page` is required in all documents so Eleventy renders the pages with GOV UK styling.
- Use `order` (integer) to control navigation order. Pages otherwise sort by `title`. Use `showPagination: true` only when pages form a sequence.
- Do not repeat the title as a top-level `#` heading in the body, because the layout renders it from `title`. Start body sections at `##`.
- Markdown is processed by Nunjucks (`markdownTemplateEngine: 'njk'`), including fenced code. Wrap any literal `{{`, `{%`, or `{#` in `{% raw %}` and `{% endraw %}`.
- Link between `./docs` pages using the URL Eleventy generates, for example `/routes/` for `routes.md`. Do not use .md links or ../ links that do not resolve on the built site
- Files outside `./docs` (for example `src/`, `compose/`, `package.json`) are not Eleventy input. Link to them with full repository URLs on the default branch, or show the path as plain code text.
- Govspeak extensions such as `information-callout` and `warning-callout` are enabled by default, and can be used where a note or warning helps the reader.

## Evidence and writing rules

- Base behavioral statements on the narrowest code path that controls the behavior. Check callers and configuration when they change what that path does.
- Separate observed behavior from assumptions, intended behavior, and external-system behavior. Do not present an unverified external dependency response as guaranteed.
- Link to source, tests, and configuration with full repository URLs, since these files are outside the Eleventy input folder. Link to other `docs/` pages as described in the Eleventy conventions.
- Link to other `docs/` files for behavior owned by another part of the service instead of duplicating that description. Each fact should have one owning document.
- Use examples that match the current code and defaults. Check environment variable names, defaults, route paths, command names, and file locations literally.
- Follow any applicable repository-specific documentation instructions and nearby formatting conventions. When no convention exists, use descriptive headings and concise prose.
- Keep edits limited to the requested documentation and directly necessary documentation links. Leave implementation changes out of scope.

## Done when

- A suitable Markdown document exists under `./docs` for each affected part of the service and covers the requested subject.
- Every document has the required Eleventy front matter, and `npx eleventy` builds without errors.
- The `./docs/index.md` index lists every part-specific document
- No document duplicates content owned by another.
- Each concrete claim about current functionality is supported by the implementation or clearly qualified where evidence is incomplete.
- Existing inaccurate claims and examples have been corrected to match current code.
- Relevant links and documented commands/configuration have been checked, and unresolved uncertainties are disclosed.
- The documentation accurately reflects the current behavior of the service, and any assumptions or external dependencies are clearly stated and qualified.
- No code changes have been made and the documentation solely reflects the current state of the service.
