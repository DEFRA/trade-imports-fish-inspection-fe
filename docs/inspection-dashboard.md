# Inspection dashboard

This document describes how the `/inspections` dashboard view model is built. The route, session and access rules are owned by [Routes](routes.md#mock-sign-in).

## Modules

The logic lives in `src/server/routes/inspection/services/`:

| Module                                                                                                                                                                           | Responsibility                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [inspection-dashboard-service.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/routes/inspection/services/inspection-dashboard-service.js)     | Parses the query, filters, sorts, splits into tabs and assembles the view model             |
| [inspection-dashboard-constants.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/routes/inspection/services/inspection-dashboard-constants.js) | Tab names, defaults, status and risk labels, tag classes, quick filter groups, sort options |
| [inspection-dashboard-display.js](https://github.com/DEFRA/trade-imports-fish-inspection-fe/blob/main/src/server/routes/inspection/services/inspection-dashboard-display.js)     | Maps consignments to table rows and builds select options                                   |
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

## Data and tabs

- Consignments come from `mockConsignmentSummariesApi.listConsignmentSummaries(today, portId)`.
- Optional `statusOverrides` (keyed by reference) replace a consignment's status, label and tag class, and set `completedAt` when the override status is `COMPLETED`. The controller does not pass overrides.
- Consignments with status `COMPLETED` go to the completed tab; all others go to the active tab.
- The same filters and sort are applied to both tabs. Ties are broken by reference. `desc` reverses the sorted list.
- Each tab has `rows`, `totalCount`, `filteredTotalCount`, `filteredStart`, `filteredEnd` and a single-page `pagination` placeholder (`currentPage` 1, `pageCount` 1 when rows exist, otherwise 0).
- When sorting by estimated arrival, the first row for each arrival date gets an `arrivalDateHeading`.

## Quick filters and summary cards

| Key                   | Label               | Tab       | Matches                                             |
| --------------------- | ------------------- | --------- | --------------------------------------------------- |
| `awaiting-inspection` | Awaiting inspection | active    | Status `REQUIRES_DOCUMENT_CHECK`                    |
| `in-progress`         | In progress         | active    | Status `IN_PROGRESS`                                |
| `completed-today`     | Completed today     | completed | Status `COMPLETED` and completed today              |
| `mismatches-flagged`  | Mismatches flagged  | none      | Risk flag `COMMODITY_MISMATCH` or `WEIGHT_MISMATCH` |

- Selected quick filters are combined with AND.
- Each summary card links to the dashboard with its key toggled. The `awaiting-inspection` and `mismatches-flagged` cards have the `action` modifier.
- The `mismatches-flagged` card also has `tabVariants` with a count and link for each tab.
- Active filter chips are built per tab and each chip's link removes that one filter.

## Row display

`mapConsignmentForView` produces each row, including a `detailPath` of `/inspection/<reference>`, short-date and weight (`kg`) formatting, a status label and tag class, risk flag labels, a documents-provided summary and a commodity and species summary grouped by commodity code.

Arrival timing text is `Arrival today`, `Arrival in N day(s)` or `Overdue by N day(s)`. The tag is red below 3 days, yellow up to 8 days and green beyond that.
