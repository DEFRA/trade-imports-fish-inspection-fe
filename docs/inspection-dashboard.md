# Inspection dashboard

This document describes how the `/inspections` dashboard view model is built. The route, session and access rules are owned by [Routes](routes.md#mock-sign-in).

The consignment detail page at `/inspection/{reference}` is described in [Consignment detail](#consignment-detail).

## Consignment detail

`GET /inspection/{reference}` is handled by `consignmentController` in the home controller. It uses the same `requirePhaUser` guard as `/inspections` and `/account` (see [Routes](routes.md#mock-sign-in)): 403 when `authMode` is not `mock` (even for an existing PHA session), redirect to `/mock-auth` without a session user, and 403 without the `PHA` role or a `portId`. It throws a 404 when `buildInspectionConsignmentViewModel(portId, reference)` returns `null` (no consignment with that reference for the port), and otherwise renders `inspection/consignment` with `pageTitle` `Consignment <reference>`, `basePath`, `user` and `consignment`.

The view model is the dashboard row from `mapConsignmentForView` plus:

- Summary fields: `port` (the seed `port`, otherwise `Dover` for port `DOVER` and `Felixstowe` for any other), `importerEori`, `declaredWeight`, `productDescription` (distinct species joined with commas), `vesselName`, `imoNumber`, `containerNumber` and `exportingCountry`.
- `showDocumentInsightsWarning` is true when the consignment has risk flags. `documentInsightsWarningText` is the seed `warningText`, then `riskNotes`, then the risk flag labels joined with commas. `consignment.njk` shows them in a warning panel above "Recent changes".
- `evidenceRows`: one row each for catch certificates, processing statements, Non-Manipulation Documents (NMD) and additional documents. Each row has `type`, `count`, `status` (`Provided` or `Not provided`), `statusClass`, `details` and generated `references` of the form `<CC|PS|NMD|DOC>-<country code>-<consignment number>-<nn>`. The country code comes from a fixed lookup, with `XX` for unknown countries.
- `commodityWeightComparison`: `null` without a commodity summary, otherwise commodity and species counts, total weight and per-commodity groups. Weights on the notification come from the seed; the catch certificate, processing statement and NMD weights are always `Not available`.
- `recentChange`: the first entry of `recentChanges` (label, description, actor, timestamp, `completionCertificate`), otherwise the status label with `completedAt` when set.

The [consignment.njk](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/routes/inspection/consignment.njk) view uses the `consignment-overview` and `inspection-action-form` components described in [Views and templates](views-and-templates.md#components). Two parts are still in progress:

- The "View previous changes" link (`/inspection/<reference>/history`) is shown, but no history route exists yet, so it returns 404.
- The action form includes the CSRF `crumb`, but its Submit button is disabled with the hint "Recording inspection actions is not available yet." because no `POST /inspection/<reference>/action` route exists.

## Modules

The logic lives in `src/server/routes/inspection/services/`:

| Module                                                                                                                                                                           | Responsibility                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [inspection-dashboard-service.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/routes/inspection/services/inspection-dashboard-service.js)     | Parses the query, filters, sorts, splits into tabs and assembles the view model             |
| [inspection-dashboard-constants.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/routes/inspection/services/inspection-dashboard-constants.js) | Tab names, defaults, status and risk labels, tag classes, quick filter groups, sort options |
| [inspection-dashboard-display.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/routes/inspection/services/inspection-dashboard-display.js)     | Maps consignments to table rows and builds select options                                   |
| [inspection-consignment-service.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/routes/inspection/services/inspection-consignment-service.js) | Builds the consignment detail view model (see [Consignment detail](#consignment-detail))    |
| [inspection-dashboard-links.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/routes/inspection/services/inspection-dashboard-links.js)         | Builds summary cards and active filter chips, including their `/inspections?...` links      |

The [home controller](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/routes/home/controller.js) calls `buildInspectionDashboardViewModel(user.portId, { query: request.query })` and renders `inspection/dashboard/index` with `pageTitle`, `basePath` (empty), `user` and the returned view model.

## Query parameters

| Parameter                                           | Behaviour                                                                                                                  |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `tab`                                               | `completed` selects the completed tab; any other value selects `active`                                                    |
| `quick-filter`                                      | One or more of `awaiting-inspection`, `in-progress`, `completed-today`, `mismatches-flagged`; unknown values are ignored   |
| `search`                                            | Case-insensitive match on consignment reference or importer. Falls back to `search-reference`, then `search-importer-name` |
| `filter-importer`, `filter-status`, `filter-origin` | Exact match; empty or missing means all (`__all__`)                                                                        |
| `filter-risk-indicator`                             | Matches consignments whose risk flags include the value                                                                    |
| `filter-arrival-from`, `filter-arrival-to`          | Inclusive `YYYY-MM-DD` bounds on estimated arrival; invalid dates are ignored                                              |
| `sort-by`                                           | `estimated-arrival` (default), `importer`, `status` or `reference`; other values use the default                           |
| `sort-order`                                        | `asc` (default) or `desc`; other values use the default                                                                    |
| `page`                                              | Positive integer number of 10-row batches to show on each tab; see [Data and tabs](#data-and-tabs)                         |

## Data and tabs

- Consignments come from `mockConsignmentSummariesApi.listConsignmentSummaries(portId, today)`, which builds them from the seed data described in [Seed data](#seed-data). Only seeds whose `portId` matches (default `FELIXSTOWE`) and whose `notificationStatus` is `SUBMITTED` (the default) are returned.
- Optional `statusOverrides` (keyed by reference) replace a consignment's status, label and tag class, and set `completedAt` when the override status is `COMPLETED`. The controller does not pass overrides.
- Consignments with status `COMPLETED` go to the completed tab; all others go to the active tab.
- The same filters and sort are applied to both tabs. Ties are broken by reference. `desc` reverses the sorted list.
- Each tab has `rows`, `totalCount`, `filteredTotalCount`, `filteredStart`, `filteredEnd` and `pagination`.
- Rows are shown in batches of 10 (`NOTIFICATION_PAGE_SIZE`). The `page` query parameter (default 1, invalid values become 1) makes the tab show the first `page * 10` rows, so later pages extend the list rather than replace it. The page is capped at the tab's page count (minimum 1). `filteredEnd` is the number of visible rows.
- `pagination` has `currentPage`, `pageCount`, `firstNewRowIndex` (1-based index of the first row in the latest batch), `firstRowAnchorId` (`<tab>-first-batch` on page 1, otherwise `<tab>-next-batch`), `nextHref` (empty on the last page) and `showLessHref` (empty on page 1). Both links keep the current filters and tab. `nextHref` sets `page` to the next page and ends with `#<tab>-next-batch`. `showLessHref` sets `page=1` and ends with `#<tab>-first-batch`. The template renders them as "Show more" and "Show less" under the table, and puts the anchor id on the first row of the latest batch.
- Rows get a `groupHeading` when the group changes between adjacent rows. It is only set when sorting by `estimated-arrival` (long arrival date), `importer` (importer name) or `status` (status label); sorting by `reference` has no headings.

## Seed data

The seeds live in `src/server/routes/inspection/` and are validated and converted to consignment summaries by the mock API ([consignment-summaries-api.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/routes/inspection/mock-api/consignment-summaries-api.js)).

- [inspection-dashboard-consignment-seeds.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/routes/inspection/inspection-dashboard-consignment-seeds.js): default export combining all seed groups, plus the generators for the additional Felixstowe and Dover seeds.
- [inspection-dashboard-consignment-seeds-felixstowe.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/routes/inspection/inspection-dashboard-consignment-seeds-felixstowe.js): Felixstowe seeds. It starts with the detailed seeds from [inspection-dashboard-consignment-seeds-felixstowe-detailed.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/routes/inspection/inspection-dashboard-consignment-seeds-felixstowe-detailed.js) (`GB-IUU-2026-11001` to `11005`, with commodity breakdowns, recent changes and warning text), followed by the shorter Felixstowe seeds.
- [inspection-dashboard-consignment-seed-values.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/routes/inspection/inspection-dashboard-consignment-seed-values.js): importer name, species and weight constants shared by the seed files and generators.
- [inspection-dashboard-consignment-seed-generator-controls.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/routes/inspection/inspection-dashboard-consignment-seed-generator-controls.js): reference start numbers, base weights, weight increments, the document count cycle, the number of multi-commodity Dover seeds, and the generated IMO, container number and status-change time settings.
- [inspection-dashboard-paired-arrival-seeds.json](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/routes/inspection/inspection-dashboard-paired-arrival-seeds.json): `[arrivalOffsetDays, status]` pairs used by the generators.

The combined export is ordered as follows:

- Felixstowe seeds, additional Felixstowe seeds, two hand-written Dover seeds, then additional Dover seeds.
- Additional Felixstowe seeds: one per pair in the JSON file, with references `GB-IUU-2026-<n>` starting at 11022, weight starting at 3200 kg and increasing by 425 kg each.
- Additional Dover seeds: 40, taking pairs from the JSON file (wrapping if needed), with references starting at 21004, weight starting at 3000 kg and increasing by 350 kg each. They have `portId` `DOVER` and `notificationStatus` `SUBMITTED`.
- Importer, origin, arrival time and commodity code are cycled by index. Species is cycled for Dover and taken by index from the species list for Felixstowe. Document counts use `index % 3` (catch certificates `1 + index % 2`), and every fourth seed has the `MISSING_EVIDENCE` risk flag.
- After combining, every seed gets a generated `vesselName` (when missing or `Multiple vessels`), `imoNumber` (from 1156094 plus the index) and `containerNumber` (`TIFU` plus a seven-digit index) unless already set, and an `importerEori` looked up by importer name (an unknown importer throws). A first `recentChanges` entry `Inspector status changed to <status label>` by `Port Health Authority` is added unless one already exists.
- The [seed test](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/routes/inspection/inspection-dashboard-consignment-seeds.test.js) checks the group order, a total of 84 seeds and sample generated values.

## Quick filters and summary cards

| Key                   | Label               | Tab       | Matches                                             |
| --------------------- | ------------------- | --------- | --------------------------------------------------- |
| `awaiting-inspection` | Awaiting inspection | active    | Status `REQUIRES_DOCUMENT_CHECK`                    |
| `in-progress`         | In progress         | active    | Status `IN_PROGRESS`                                |
| `completed-today`     | Completed today     | completed | Status `COMPLETED` and completed today              |
| `mismatches-flagged`  | Mismatches flagged  | none      | Risk flag `COMMODITY_MISMATCH` or `WEIGHT_MISMATCH` |

- Selected quick filters are combined with AND. A quick filter that has a status (`awaiting-inspection`, `completed-today`) is dropped when the `filter-status` value is set to a different status.
- The `in-progress` group uses the status filter form field instead of a quick filter (`useFormStatus`): its card is active when `filter-status` is `IN_PROGRESS`, and its link sets or removes `filter-status`. A legacy `quick-filter=in-progress` is converted to that status when `filter-status` is absent and is not kept as a quick filter.
- Each other summary card links to the dashboard with its key toggled. The `awaiting-inspection` and `mismatches-flagged` cards have the `action` modifier.
- The `mismatches-flagged` card also has `tabVariants` with a count and link for each tab; client JavaScript swaps the card's count and link when the tab changes.
- An active card links to the same view with its filter removed and shows "Remove filter" instead of "Apply filter".
- Active filter chips are built per tab and each chip's link removes that one filter. Quick filter chips are labelled "View: <label>".
- The status filter options exclude `COMPLETED`.

## Links and anchors

Dashboard links (cards and chips) always include `tab` and end with a fragment. Inactive cards use `#<tab>-results`, so the page focuses the results heading; active cards and chips use `#<tab>`. The search form submits to `/inspections#active-results`, and each tab's sort form submits to `/inspections#<tab>` using its "Apply sort" button. "Show more" and "Show less" links use the `#<tab>-next-batch` and `#<tab>-first-batch` fragments described in [Data and tabs](#data-and-tabs).

## Row display

`mapConsignmentForView` produces each row, including short-date and weight (`kg`) formatting, a status label and tag class, risk flag labels, a documents-provided summary and a commodity and species summary grouped by commodity code. In the dashboard template, each row's reference is a link to `/inspection/<reference>` ([Consignment detail](#consignment-detail)).

Each consignment summary has `commoditySpecies` (`commodityCode`, `species`, `weight` items). It uses the seed's `commoditySpecies` when present, otherwise a single item built from the seed's first commodity code, species and declared weight. `commodityCodes` is the de-duplicated list of codes.

The row's `commoditySpeciesSummary` has `speciesCount`, `commodityCount`, `totalWeightDisplay`, `initialGroup` (the first commodity code group) and `remainingGroups`. The dashboard template renders a Goods table (code, species, weight) with the initial group, and a summary ("N commodity codes", "N species", "Total weight: ...") under the "Goods" label when there is more than one code or species. The commodity code cell spans the rows for its species. Remaining groups sit in a separate table body that is hidden by client JavaScript behind a "Show more" / "Show less" toggle button (see [Client assets](client-assets.md#javascript)). Without a summary the template shows separate Species, Commodity code and Weight rows.

Arrival timing text is `Arrival today`, `Arrival in N day(s)` or `Overdue by N day(s)`. The tag is red below 3 days, yellow up to 8 days and green beyond that.
