---
name: tech-docs
description: Create or update technical documentation in docs/ when asked to document a feature, service, workflow, configuration, or code area. Compare existing Markdown with the current implementation and revise stale descriptions to match the code.
---

# Technical Documentation

Create or reconcile focused technical Markdown documents under `docs/`, with one file per part of the service (for example routes, server plugins, Nunjucks configuration, client assets, or local infrastructure) and an index that links them. The implementation is the source of truth for current behavior. When an existing document disagrees with working code, update the document to describe the code as it exists now; do not change code as part of this documentation task.

## Workflow

1. **Identify the subject and destination.** Translate the request into a specific feature, workflow, or part of the service. Search `docs/` (including subdirectories) for the closest existing document. Reuse and update that file when it covers the subject; otherwise choose a concise, descriptive Markdown filename under `docs/` for that part, following any local naming convention. If a request spans several parts, write a separate file for each part and link them rather than producing one large document. Do not add a subject to an existing file when it belongs to a different part of the service.
2. **Trace the behavior.** Locate the code that directly implements or controls the subject. Follow relevant route handlers, services, templates, configuration, environment variables, package scripts, and external calls as needed. Read nearby tests as corroborating evidence for expected inputs, outputs, and edge cases. Keep exploration scoped to claims the document needs to make.
3. **Compare documentation with evidence.** For an existing document, check each functional claim, code path, configuration name/default, command, and link against the current repository. Treat implementation and active configuration as authoritative for current behavior; use tests to confirm behavior, not to override contradictory implementation. Mark genuine uncertainties rather than filling gaps with assumptions.
4. **Create or revise the documents.** If no suitable document exists, create one under `docs/` for that part of the service. If one exists, update it in place. Whenever a file is created, renamed, or removed, update the index in `docs/` (for example `docs/README.md`) so it lists every part-specific document with a one-line description and no broken links. If the index does not exist, create it only when the split documentation needs one. Explain the current behavior, relevant decisions, inputs/outputs, configuration, and operational steps only when they apply to the requested subject. Replace stale statements and examples, remove claims no longer supported by the code, and preserve accurate material. Keep the scope focused and avoid duplicating easy-to-find facts without a documentation benefit.
5. **Verify the result.** Confirm the Markdown file is under `docs/`, its relative code links resolve, and any documented commands or configuration identifiers exist in the repository. Run a relevant documentation lint or check if the project provides one; otherwise perform a focused review of the edited file against the traced code. Report any behavior that could not be verified.

## Evidence and writing rules

- Base behavioral statements on the narrowest code path that controls the behavior. Check callers and configuration when they change what that path does.
- Separate observed behavior from assumptions, intended behavior, and external-system behavior. Do not present an unverified external dependency response as guaranteed.
- Prefer repository-relative Markdown links to the relevant source, tests, configuration, or other documentation when they help readers verify details.
- Link to other `docs/` files for behavior owned by another part of the service instead of duplicating that description. Each fact should have one owning document.
- Use examples that match the current code and defaults. Check environment variable names, defaults, route paths, command names, and file locations literally.
- Follow any applicable repository-specific documentation instructions and nearby formatting conventions. When no convention exists, use descriptive headings and concise prose.
- Keep edits limited to the requested documentation and directly necessary documentation links. Leave implementation changes out of scope.

## Done when

- A suitable Markdown document exists under `docs/` for each affected part of the service and covers the requested subject.
- The `docs/` index lists every part-specific document, and no document duplicates content owned by another.
- Each concrete claim about current functionality is supported by the implementation or clearly qualified where evidence is incomplete.
- Existing inaccurate claims and examples have been corrected to match current code.
- Relevant links and documented commands/configuration have been checked, and unresolved uncertainties are disclosed.
