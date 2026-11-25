import {
  ACTIVE_TAB,
  ALL_FILTER_VALUE,
  COMPLETED_TAB,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
  MISMATCHES_FLAGGED_FILTER,
  QUICK_FILTER_GROUPS,
  RISK_FLAG_LABELS,
  STATUS_LABELS
} from './inspection-dashboard-constants.js'

const appendQueryValue = (query, key, value) => {
  if (Array.isArray(value)) {
    value.filter(Boolean).forEach((item) => query.append(key, item))
    return
  }

  if (value) {
    query.set(key, value)
  }
}

const buildDashboardHref = (
  filters,
  basePath,
  tab,
  overrides = {},
  fragment = tab
) => {
  const query = new URLSearchParams({ tab })
  const values = {
    'quick-filter': filters.quickFilters,
    search: filters.search,
    'filter-importer':
      filters.importer === ALL_FILTER_VALUE ? '' : filters.importer,
    'filter-status': filters.status === ALL_FILTER_VALUE ? '' : filters.status,
    'filter-origin': filters.origin === ALL_FILTER_VALUE ? '' : filters.origin,
    'filter-risk-indicator':
      filters.riskIndicator === ALL_FILTER_VALUE ? '' : filters.riskIndicator,
    'filter-arrival-from': filters.arrivalFrom,
    'filter-arrival-to': filters.arrivalTo,
    'sort-by': filters.sortBy === DEFAULT_SORT_BY ? '' : filters.sortBy,
    'sort-order':
      filters.sortOrder === DEFAULT_SORT_ORDER ? '' : filters.sortOrder,
    ...overrides
  }

  Object.entries(values).forEach(([key, value]) => {
    appendQueryValue(query, key, value)
  })

  return `${basePath}/inspections?${query.toString()}#${fragment}`
}

const getSummaryCount = (consignments, group, tab) =>
  consignments
    .filter(
      (consignment) =>
        (consignment.status === 'COMPLETED') === (tab === COMPLETED_TAB)
    )
    .filter(group.matches).length

const buildTabVariants = (
  consignments,
  filters,
  basePath,
  group,
  quickFilters
) =>
  [ACTIVE_TAB, COMPLETED_TAB].map((tab) => ({
    tab,
    count: getSummaryCount(consignments, group, tab),
    href: buildDashboardHref(filters, basePath, tab, {
      'quick-filter': quickFilters
    })
  }))

const buildSummaryCard = (consignments, filters, basePath, group) => {
  const active = filters.quickFilters.includes(group.key)
  const tab = active ? filters.tab : group.tab || filters.tab
  const selectedQuickFilters = active
    ? filters.quickFilters.filter((key) => key !== group.key)
    : [...filters.quickFilters, group.key]

  return {
    key: group.key,
    label: group.label,
    count: getSummaryCount(consignments, group, group.tab || filters.tab),
    modifier: ['awaiting-inspection', MISMATCHES_FLAGGED_FILTER].includes(
      group.key
    )
      ? 'action'
      : '',
    active,
    tabVariants:
      group.key === MISMATCHES_FLAGGED_FILTER
        ? buildTabVariants(
            consignments,
            filters,
            basePath,
            group,
            selectedQuickFilters
          )
        : [],
    href: buildDashboardHref(filters, basePath, tab, {
      'quick-filter': selectedQuickFilters
    })
  }
}

const getSummaryCards = (consignments, filters, basePath) =>
  QUICK_FILTER_GROUPS.map((group) =>
    buildSummaryCard(consignments, filters, basePath, group)
  )

const getActiveFilterChips = (filters, basePath, tab) => {
  const chips = []
  const addChip = (key, label, resetValue = '') => {
    chips.push({
      label,
      href: buildDashboardHref(filters, basePath, tab, { [key]: resetValue })
    })
  }

  filters.quickFilters.forEach((key) => {
    const group = QUICK_FILTER_GROUPS.find((item) => item.key === key)
    if (group) {
      addChip(
        'quick-filter',
        `View: ${group.label}`,
        filters.quickFilters.filter((item) => item !== key)
      )
    }
  })

  const filterChips = [
    {
      active: Boolean(filters.search),
      key: 'search',
      label: `Search: ${filters.search}`
    },
    {
      active: filters.importer !== ALL_FILTER_VALUE,
      key: 'filter-importer',
      label: `Importer: ${filters.importer}`
    },
    {
      active: filters.status !== ALL_FILTER_VALUE,
      key: 'filter-status',
      label: `Status: ${STATUS_LABELS[filters.status] || filters.status}`
    },
    {
      active: filters.origin !== ALL_FILTER_VALUE,
      key: 'filter-origin',
      label: `Exporting country: ${filters.origin}`
    },
    {
      active: filters.riskIndicator !== ALL_FILTER_VALUE,
      key: 'filter-risk-indicator',
      label: `Risk indicator: ${RISK_FLAG_LABELS[filters.riskIndicator] || filters.riskIndicator}`
    },
    {
      active: Boolean(filters.arrivalFrom),
      key: 'filter-arrival-from',
      label: `Arrival from: ${filters.arrivalFrom}`
    },
    {
      active: Boolean(filters.arrivalTo),
      key: 'filter-arrival-to',
      label: `Arrival to: ${filters.arrivalTo}`
    }
  ]

  filterChips
    .filter((chip) => chip.active)
    .forEach((chip) => addChip(chip.key, chip.label))

  return chips
}

export { buildDashboardHref, getActiveFilterChips, getSummaryCards }
