import { mockConsignmentSummariesApi } from '../mock-api/consignment-summaries-api.js'
import {
  ACTIVE_TAB,
  ALL_FILTER_VALUE,
  COMPLETED_TAB,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
  QUICK_FILTER_GROUPS,
  SORT_OPTIONS,
  SORT_ORDER_OPTIONS,
  STATUS_LABELS,
  hasEvidenceIssues
} from './inspection-dashboard-constants.js'
import {
  buildOptionsForValues,
  buildRiskOptions,
  buildStatusOptions,
  formatArrivalDateHeading,
  mapConsignmentForView,
  parseIsoDateInput,
  toUtcDate
} from './inspection-dashboard-display.js'
import {
  buildDashboardHref,
  getActiveFilterChips,
  getSummaryCards
} from './inspection-dashboard-links.js'

const NOTIFICATION_PAGE_SIZE = 10

const normalizeString = (value) => String(value || '').trim()

const normalizeSelectFilter = (value) =>
  normalizeString(value) || ALL_FILTER_VALUE

const getFilterValue = (query, fieldName) => normalizeString(query[fieldName])

const buildDashboardFilters = (query = {}) => {
  const requestedTab = normalizeString(query.tab)
  const tab = requestedTab === COMPLETED_TAB ? COMPLETED_TAB : ACTIVE_TAB
  const requestedQuickFilters = Array.isArray(query['quick-filter'])
    ? query['quick-filter']
    : [query['quick-filter']]
  const quickFilters = QUICK_FILTER_GROUPS.map((group) => group.key).filter(
    (key) =>
      requestedQuickFilters.some((value) => normalizeString(value) === key)
  )
  const sortBy = normalizeString(query['sort-by'])
  const sortOrder = normalizeString(query['sort-order'])

  return {
    tab,
    quickFilters,
    search:
      getFilterValue(query, 'search') ||
      getFilterValue(query, 'search-reference') ||
      getFilterValue(query, 'search-importer-name'),
    importer: normalizeSelectFilter(query['filter-importer']),
    status: normalizeSelectFilter(query['filter-status']),
    origin: normalizeSelectFilter(query['filter-origin']),
    arrivalFrom: getFilterValue(query, 'filter-arrival-from'),
    arrivalTo: getFilterValue(query, 'filter-arrival-to'),
    riskIndicator: normalizeSelectFilter(query['filter-risk-indicator']),
    sortBy: SORT_OPTIONS.some((option) => option.value === sortBy)
      ? sortBy
      : DEFAULT_SORT_BY,
    sortOrder: SORT_ORDER_OPTIONS.some((option) => option.value === sortOrder)
      ? sortOrder
      : DEFAULT_SORT_ORDER
  }
}

const matchesSearchFilter = (consignment, search) => {
  if (!search) {
    return true
  }

  return (
    consignment.reference.toLowerCase().includes(search) ||
    consignment.importer.toLowerCase().includes(search)
  )
}

const matchesQuickFilters = (consignment, quickFilters) =>
  quickFilters.every((key) => {
    const quickFilter = QUICK_FILTER_GROUPS.find((group) => group.key === key)
    return !quickFilter || quickFilter.matches(consignment)
  })

const matchesSelectedValue = (selectedValue, value) =>
  selectedValue === ALL_FILTER_VALUE || selectedValue === value

const matchesArrivalDateRange = (consignment, filters) => {
  const arrivalDate = toUtcDate(consignment.estimatedArrival)
  const arrivalFromDate = parseIsoDateInput(filters.arrivalFrom)
  const arrivalToDate = parseIsoDateInput(filters.arrivalTo)

  return (
    (!arrivalFromDate || arrivalDate >= arrivalFromDate) &&
    (!arrivalToDate || arrivalDate <= arrivalToDate)
  )
}

const consignmentMatchesFilters = (consignment, filters) =>
  [
    matchesSearchFilter(consignment, filters.search.toLowerCase()),
    matchesQuickFilters(consignment, filters.quickFilters),
    matchesSelectedValue(filters.importer, consignment.importer),
    matchesSelectedValue(filters.status, consignment.status),
    matchesSelectedValue(filters.origin, consignment.originCountry),
    filters.riskIndicator === ALL_FILTER_VALUE ||
      consignment.riskFlags.includes(filters.riskIndicator),
    matchesArrivalDateRange(consignment, filters)
  ].every(Boolean)

const filterConsignments = (consignments, filters) =>
  consignments.filter((consignment) =>
    consignmentMatchesFilters(consignment, filters)
  )

const compareBySortField = (first, second, sortBy) => {
  if (sortBy === DEFAULT_SORT_BY) {
    return first.estimatedArrival.getTime() - second.estimatedArrival.getTime()
  }

  if (sortBy === 'importer') {
    return first.importer.localeCompare(second.importer, 'en-GB')
  }

  if (sortBy === 'status') {
    return (
      first.statusLabelOverride || STATUS_LABELS[first.status]
    ).localeCompare(
      second.statusLabelOverride || STATUS_LABELS[second.status],
      'en-GB'
    )
  }

  if (sortBy === 'reference') {
    return first.reference.localeCompare(second.reference, 'en-GB')
  }

  return 0
}

const sortConsignments = (consignments, filters) => {
  const sortedConsignments = [...consignments].sort((first, second) => {
    const primaryResult = compareBySortField(first, second, filters.sortBy)
    if (primaryResult !== 0) {
      return primaryResult
    }

    return first.reference.localeCompare(second.reference, 'en-GB')
  })

  if (filters.sortOrder === 'desc') {
    sortedConsignments.reverse()
  }

  return sortedConsignments
}

const getGroupDetails = (row, sortBy) => {
  if (sortBy === DEFAULT_SORT_BY) {
    return {
      key: row.estimatedArrivalIsoDate,
      heading: formatArrivalDateHeading(row.estimatedArrivalIsoDate)
    }
  }

  if (sortBy === 'importer') {
    return { key: row.importer, heading: row.importer }
  }

  if (sortBy === 'status') {
    return { key: row.statusLabel, heading: row.statusLabel }
  }

  return null
}

const addGroupHeadings = (rows, sortBy) => {
  let previousGroupKey

  for (const row of rows) {
    const group = getGroupDetails(row, sortBy)
    if (group && group.key !== previousGroupKey) {
      row.groupHeading = group.heading
    }
    previousGroupKey = group?.key
  }
}

const buildTabViewModel = (
  consignments,
  filters,
  requestedPage,
  basePath,
  tabId
) => {
  const filteredConsignments = filterConsignments(consignments, filters)
  const sortedConsignments = sortConsignments(filteredConsignments, filters)
  const hasRows = sortedConsignments.length > 0
  const pageCount = Math.ceil(
    sortedConsignments.length / NOTIFICATION_PAGE_SIZE
  )
  const currentPage = Math.min(requestedPage, Math.max(pageCount, 1))
  const visibleCount = Math.min(
    currentPage * NOTIFICATION_PAGE_SIZE,
    sortedConsignments.length
  )
  const rows = sortedConsignments
    .slice(0, visibleCount)
    .map(mapConsignmentForView)

  addGroupHeadings(rows, filters.sortBy)

  return {
    rows,
    totalCount: consignments.length,
    filteredTotalCount: sortedConsignments.length,
    filteredStart: hasRows ? 1 : 0,
    filteredEnd: visibleCount,
    pagination: {
      currentPage,
      pageCount,
      firstNewRowIndex: (currentPage - 1) * NOTIFICATION_PAGE_SIZE + 1,
      firstRowAnchorId:
        currentPage === 1 ? `${tabId}-first-batch` : `${tabId}-next-batch`,
      nextHref:
        currentPage < pageCount
          ? buildDashboardHref(
              filters,
              basePath,
              tabId,
              { page: String(currentPage + 1) },
              `${tabId}-next-batch`
            )
          : '',
      showLessHref:
        currentPage > 1
          ? buildDashboardHref(
              filters,
              basePath,
              tabId,
              { page: '1' },
              `${tabId}-first-batch`
            )
          : ''
    }
  }
}

const applyStatusOverrides = (consignments, statusOverrides, today) =>
  consignments.map((consignment) => {
    const override = statusOverrides[consignment.reference]
    if (!override) {
      return consignment
    }

    const isCompleted = override.statusCode === 'COMPLETED'
    const completedAt =
      isCompleted && override.completedAt
        ? new Date(override.completedAt)
        : null

    return {
      ...consignment,
      status: override.statusCode,
      completedAt,
      isCompletedToday:
        completedAt !== null &&
        toUtcDate(completedAt).getTime() === toUtcDate(today).getTime(),
      statusLabelOverride: override.statusLabel,
      statusTagClassOverride: override.statusTagClass
    }
  })

const splitConsignmentsByStatus = (consignments) => ({
  activeConsignments: consignments.filter(
    (consignment) => consignment.status !== 'COMPLETED'
  ),
  completedConsignments: consignments.filter(
    (consignment) => consignment.status === 'COMPLETED'
  )
})

const getSortedUniqueValues = (values) =>
  [...new Set(values)].sort((first, second) =>
    first.localeCompare(second, 'en-GB')
  )

const buildDashboardFilterOptions = (consignments) => {
  const uniqueImporters = getSortedUniqueValues(
    consignments.map((consignment) => consignment.importer)
  )
  const uniqueOrigins = getSortedUniqueValues(
    consignments.map((consignment) => consignment.originCountry)
  )

  return {
    referenceOptions: consignments
      .map((consignment) => consignment.reference)
      .sort((first, second) => first.localeCompare(second, 'en-GB')),
    importerNameOptions: uniqueImporters,
    statusOptions: buildStatusOptions(),
    originOptions: buildOptionsForValues(uniqueOrigins, 'All origins'),
    riskOptions: buildRiskOptions(),
    sortOptions: SORT_OPTIONS,
    sortOrderOptions: SORT_ORDER_OPTIONS
  }
}

const hasActiveDashboardFilters = (filters) =>
  [
    filters.quickFilters.length > 0,
    Boolean(filters.search),
    filters.importer !== ALL_FILTER_VALUE,
    filters.status !== ALL_FILTER_VALUE,
    filters.origin !== ALL_FILTER_VALUE,
    Boolean(filters.arrivalFrom),
    Boolean(filters.arrivalTo),
    filters.riskIndicator !== ALL_FILTER_VALUE,
    filters.sortBy !== DEFAULT_SORT_BY,
    filters.sortOrder !== DEFAULT_SORT_ORDER
  ].some(Boolean)

const buildInspectionDashboardViewModel = (
  portId,
  { query = {}, today = new Date(), statusOverrides = {}, basePath = '' } = {}
) => {
  const filters = buildDashboardFilters(query)
  const requestedPage = Math.max(
    1,
    Number.parseInt(normalizeString(query.page), 10) || 1
  )
  const consignments = applyStatusOverrides(
    mockConsignmentSummariesApi.listConsignmentSummaries(portId, today),
    statusOverrides,
    today
  )
  const { activeConsignments, completedConsignments } =
    splitConsignmentsByStatus(consignments)
  const active = buildTabViewModel(
    activeConsignments,
    filters,
    requestedPage,
    basePath,
    ACTIVE_TAB
  )
  const completed = buildTabViewModel(
    completedConsignments,
    filters,
    requestedPage,
    basePath,
    COMPLETED_TAB
  )
  const completedTodayCount = consignments.filter(
    (consignment) =>
      consignment.status === 'COMPLETED' && consignment.isCompletedToday
  ).length

  return {
    activeTab: filters.tab,
    dashboardFilters: filters,
    filterOptions: buildDashboardFilterOptions(consignments),
    active,
    completed,
    summaryCards: getSummaryCards(consignments, filters, basePath),
    activeFilterChipsByTab: {
      [ACTIVE_TAB]: getActiveFilterChips(filters, basePath, ACTIVE_TAB),
      [COMPLETED_TAB]: getActiveFilterChips(filters, basePath, COMPLETED_TAB)
    },
    activeCount: activeConsignments.length,
    completedCount: completedConsignments.length,
    completedTodayCount,
    evidenceIssuesCount: consignments.filter(hasEvidenceIssues).length,
    hasActiveDashboardFilters: hasActiveDashboardFilters(filters)
  }
}

export {
  ALL_FILTER_VALUE,
  buildDashboardFilters,
  filterConsignments,
  sortConsignments,
  getSummaryCards,
  getActiveFilterChips,
  buildInspectionDashboardViewModel
}
