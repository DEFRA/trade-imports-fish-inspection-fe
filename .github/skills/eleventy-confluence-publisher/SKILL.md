---
name: eleventy-confluence-publisher
description: "Use when configuring or updating this repository's workflow for publishing docs/ Markdown to existing Confluence Cloud pages through the Atlassian REST API."
---

# Publish documentation to Confluence

This repository publishes Markdown source files from `docs/` to existing Confluence Cloud pages. The publisher does not run Eleventy, render Nunjucks, create Confluence pages, or write page IDs back to the repository.

## Project files

- [Publisher](../../../scripts/confluence/publish_confluence.py)
- [Python requirements](../../../scripts/confluence/requirements.txt)
- [GitHub Actions workflow](../../workflows/publish-docs-confluence.yml)
- Documentation source root: `../../../docs/`

These are repository files, not assets bundled inside this skill directory.

## Publishing setup

1. Inspect `docs/` and preserve any existing `confluence.page_id` values.
2. Add a mapping to each document that should be published:

   ```yaml
   confluence:
     page_id: "123456789"
     publish: true
     delete_mode: trash
   ```

   `page_id` must be the numeric ID of an existing Confluence page, quoted as a YAML string. The publisher does not create pages, so create the page separately and add its ID. `publish` defaults to `true`; set it to `false` to skip a mapped document. `delete_mode` defaults to `trash` and can be set to `retain`. The front matter must also have a non-empty `title`.

3. Configure the repository's Actions variables and secrets:
   - Variable `CONFLUENCE_BASE_URL`, for example `https://your-site.atlassian.net`
   - Secret `CONFLUENCE_EMAIL`, the Atlassian account email
   - Secret `CONFLUENCE_API_TOKEN`, an Atlassian API token

   The workflow passes these as environment variables to the publisher. Do not put credentials in the workflow or source files.

4. Install dependencies and dry-run all documents:

   ```bash
   python -m pip install -r scripts/confluence/requirements.txt
   python scripts/confluence/publish_confluence.py --all --docs-root docs --dry-run
   ```

   This is an operational dry run, not a comprehensive validator: it parses and converts mapped documents and reports intended actions without calling Confluence. Documents without a publishable mapping are skipped. It does not validate local links, check page existence, or provide a rendered-HTML preview.

5. Test change detection between two commits before enabling publishing:

   ```bash
   python scripts/confluence/publish_confluence.py \
     --docs-root docs --before HEAD^ --after HEAD --dry-run
   ```

   Use commit references that exist locally and include the change you want to test.

## Workflow behavior

- Pushes to `main` run the workflow when changes touch `./docs/**`, `./scripts/confluence/**`, or `.github/workflows/publish-docs-confluence.yml`.
- Manual dispatch supports `publish_all` and `dry_run`. By default, manual dispatch checks only the latest commit; enable `publish_all` to process every mapped document.
- The workflow uses full Git history (`fetch-depth: 0`) and grants `contents: read`. It does not commit page IDs or modify repository contents.
- The publisher finds changed files with Git rename detection. For a rename with the same page ID, it updates that page without trashing it. For deletions, it reads the mapping from the base revision and applies `delete_mode`; `trash` is the default.
- For each update, the publisher fetches the current page and sends the next version number. If a mapped page cannot be fetched, the publish fails rather than creating a replacement page.
- Front matter is removed before the Markdown body is converted to HTML. Tables and fenced code blocks are enabled. Eleventy/Nunjucks rendering and local-link validation or rewriting are not performed; check links and HTML for Confluence compatibility.

## Current publishing readiness

The existing files in `docs/` do not yet have `confluence` mappings. Until page IDs are added, the workflow can run but will skip those documents.
