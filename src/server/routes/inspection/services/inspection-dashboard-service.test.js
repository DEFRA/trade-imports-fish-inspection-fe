import { buildInspectionDashboardViewModel } from './inspection-dashboard-service.js'

const today = new Date('2026-11-18T12:00:00.000Z')

const withTimeZone = (timeZone, callback) => {
  const originalTimeZone = process.env.TZ
  process.env.TZ = timeZone

  try {
    return callback()
  } finally {
    if (originalTimeZone === undefined) {
      delete process.env.TZ
    } else {
      process.env.TZ = originalTimeZone
    }
  }
}

describe('inspection dashboard view model', () => {
  test('builds a grouped commodity and document summary for a multi-species consignment', () => {
    const dashboard = buildInspectionDashboardViewModel('FELIXSTOWE', {
      today,
      query: {
        search: 'GB-IUU-2026-11021'
      }
    })
    const [row] = dashboard.active.rows

    expect(dashboard.active.filteredTotalCount).toBe(1)
    expect(row.arrivalTimingLabel).toBe('Arrival in 2 days')
    expect(row.commoditySpeciesSummary).toMatchObject({
      speciesCount: 12,
      commodityCount: 5,
      totalWeightDisplay: '8,170 kg'
    })
    expect(row.commoditySpeciesSummary.initialGroup).toMatchObject({
      commodityCode: '03024400',
      species: [
        expect.objectContaining({ species: 'Atlantic mackerel' }),
        expect.objectContaining({ species: 'Pacific chub mackerel' })
      ]
    })
    expect(row.commoditySpeciesSummary.remainingGroups).toHaveLength(4)
    expect(row.documentsProvidedLines).toEqual([
      'Catch certificates (5)',
      'Processing statements (3)',
      'Non-manipulation declarations (2)',
      'Additional documents (2)'
    ])
  })

  test('applies filters, sorts results, and creates reset links for active filters', () => {
    const dashboard = buildInspectionDashboardViewModel('FELIXSTOWE', {
      today,
      basePath: '/trade',
      query: {
        tab: 'active',
        search: 'GB-IUU-2026-11002',
        'filter-status': 'REQUIRES_DOCUMENT_CHECK',
        'filter-origin': 'France',
        'filter-risk-indicator': 'WEIGHT_MISMATCH',
        'filter-arrival-from': '2026-11-17',
        'filter-arrival-to': '2026-11-17',
        'sort-by': 'reference',
        'sort-order': 'desc'
      }
    })

    expect(dashboard.active.rows.map(({ reference }) => reference)).toEqual([
      'GB-IUU-2026-11002'
    ])
    expect(dashboard.hasActiveDashboardFilters).toBe(true)
    expect(
      dashboard.activeFilterChipsByTab.active.map(({ label }) => label)
    ).toEqual([
      'Search: GB-IUU-2026-11002',
      'Status: Requires document check',
      'Exporting country: France',
      'Risk indicator: Weight Mismatch',
      'Arrival from: 2026-11-17',
      'Arrival to: 2026-11-17'
    ])

    const searchChip = dashboard.activeFilterChipsByTab.active[0]
    expect(searchChip.href).toContain('/trade/inspections?')
    expect(searchChip.href).toContain('tab=active')
    expect(searchChip.href).toContain('#active')
    const searchChipUrl = new URL(searchChip.href, 'http://example.test')
    expect(searchChipUrl.searchParams.has('search')).toBe(false)
    expect(searchChipUrl.searchParams.get('filter-status')).toBe(
      'REQUIRES_DOCUMENT_CHECK'
    )
  })

  test.each([
    ['importer', 'importer'],
    ['status', 'statusLabel']
  ])('groups rows when sorting by %s', (sortBy, groupField) => {
    const dashboard = buildInspectionDashboardViewModel('FELIXSTOWE', {
      today,
      query: { 'sort-by': sortBy }
    })
    const rows = dashboard.active.rows
    let previousGroup

    for (const row of rows) {
      const currentGroup = row[groupField]
      expect(row.groupHeading).toBe(
        currentGroup === previousGroup ? undefined : currentGroup
      )
      previousGroup = currentGroup
    }
  })

  test('does not group rows when sorting by consignment reference', () => {
    const dashboard = buildInspectionDashboardViewModel('FELIXSTOWE', {
      today,
      query: { 'sort-by': 'reference' }
    })

    expect(dashboard.active.rows.every((row) => !row.groupHeading)).toBe(true)
  })

  test('provides navigable tab variants and a removable chip for mismatches', () => {
    const dashboard = buildInspectionDashboardViewModel('FELIXSTOWE', {
      today,
      basePath: '/trade',
      query: {
        'quick-filter': 'mismatches-flagged'
      }
    })
    const mismatchCard = dashboard.summaryCards.find(
      ({ key }) => key === 'mismatches-flagged'
    )
    const mismatchChip = dashboard.activeFilterChipsByTab.active.find(
      ({ label }) => label === 'View: Mismatches flagged'
    )

    expect(mismatchCard).toMatchObject({
      active: true,
      modifier: 'action'
    })
    expect(mismatchCard.tabVariants.map(({ tab }) => tab)).toEqual([
      'active',
      'completed'
    ])
    expect(mismatchCard.tabVariants[0].href).toMatch(/#active$/)
    expect(mismatchCard.tabVariants[1].href).toMatch(/#completed$/)
    expect(
      new URL(mismatchChip.href, 'http://example.test').searchParams.has(
        'quick-filter'
      )
    ).toBe(false)
  })

  test.each([
    ['in-progress', 'active', 'filter-status=IN_PROGRESS'],
    ['awaiting-inspection', 'active', 'quick-filter=awaiting-inspection'],
    ['completed-today', 'completed', 'quick-filter=completed-today'],
    ['mismatches-flagged', 'completed', 'quick-filter=mismatches-flagged']
  ])(
    'applying %s clears the previous filters and sort',
    (key, tab, selection) => {
      const dashboard = buildInspectionDashboardViewModel('FELIXSTOWE', {
        today,
        basePath: '/trade',
        query: {
          tab: 'completed',
          'quick-filter':
            key === 'mismatches-flagged'
              ? 'awaiting-inspection'
              : 'mismatches-flagged',
          search: 'old search',
          'filter-status': 'REQUIRES_DOCUMENT_CHECK',
          'filter-origin': 'France',
          'filter-risk-indicator': 'MISSING_EVIDENCE',
          'filter-arrival-to': '2026-11-17',
          'sort-by': 'reference',
          'sort-order': 'desc'
        }
      })
      const card = dashboard.summaryCards.find((item) => item.key === key)
      expect(card.href).toBe(
        `/trade/inspections?tab=${tab}&${selection}#${tab}-results`
      )
      for (const variant of card.tabVariants) {
        expect(variant.href).toBe(
          `/trade/inspections?tab=${variant.tab}&${selection}#${variant.tab}-results`
        )
      }
      const applied = buildInspectionDashboardViewModel('FELIXSTOWE', {
        today,
        query: Object.fromEntries(
          new URL(card.href, 'http://example.test').searchParams
        )
      })
      expect(applied[tab].filteredTotalCount).toBe(card.count)
      expect(applied.dashboardFilters.status).toBe(
        key === 'in-progress' ? 'IN_PROGRESS' : '__all__'
      )
    }
  )

  test.each([
    [{ 'quick-filter': 'in-progress' }, 'IN_PROGRESS'],
    [
      { 'quick-filter': 'in-progress', 'filter-status': 'IN_PROGRESS' },
      'IN_PROGRESS'
    ],
    [
      { 'quick-filter': 'in-progress', 'filter-status': 'REJECTED' },
      'REJECTED'
    ],
    [
      { 'quick-filter': 'awaiting-inspection', 'filter-status': 'REJECTED' },
      'REJECTED'
    ],
    [
      { 'quick-filter': 'completed-today', 'filter-status': 'REJECTED' },
      'REJECTED'
    ]
  ])('resolves %o to one status filter', (query, status) => {
    const dashboard = buildInspectionDashboardViewModel('FELIXSTOWE', {
      today,
      query
    })
    expect(dashboard.dashboardFilters).toMatchObject({
      status,
      quickFilters: []
    })
    expect(dashboard.activeFilterChipsByTab.active).toHaveLength(1)
  })

  test('ignores a calendar-invalid date filter instead of rolling it into another month', () => {
    const dashboard = buildInspectionDashboardViewModel('FELIXSTOWE', {
      today,
      query: {
        'filter-arrival-from': '2026-02-31'
      }
    })

    expect(dashboard.active.filteredTotalCount).toBe(
      dashboard.active.totalCount
    )
  })

  test('ignores a malformed date filter without hiding otherwise matching consignments', () => {
    const dashboard = buildInspectionDashboardViewModel('FELIXSTOWE', {
      today,
      query: {
        'filter-arrival-from': 'not-a-date'
      }
    })

    expect(dashboard.active.filteredTotalCount).toBe(
      dashboard.active.totalCount
    )
  })

  test('filters consignments by UTC arrival date in a negative-offset timezone', () => {
    withTimeZone('America/Los_Angeles', () => {
      const dashboard = buildInspectionDashboardViewModel('FELIXSTOWE', {
        today,
        query: {
          'filter-arrival-from': '2026-11-17',
          'filter-arrival-to': '2026-11-17'
        }
      })
      const rows = [...dashboard.active.rows, ...dashboard.completed.rows]

      expect(rows.length).toBeGreaterThan(0)
      expect(
        rows.every(
          ({ estimatedArrivalIsoDate }) =>
            estimatedArrivalIsoDate === '2026-11-17'
        )
      ).toBe(true)
    })
  })

  test('recognizes UTC-midnight completion overrides in a negative-offset timezone', () => {
    withTimeZone('America/Los_Angeles', () => {
      const baselineDashboard = buildInspectionDashboardViewModel(
        'FELIXSTOWE',
        { today }
      )
      const dashboard = buildInspectionDashboardViewModel('FELIXSTOWE', {
        today,
        statusOverrides: {
          'GB-IUU-2026-11002': {
            statusCode: 'COMPLETED',
            completedAt: '2026-11-18T00:00:00.000Z'
          }
        }
      })

      expect(dashboard.completedTodayCount).toBe(
        baselineDashboard.completedTodayCount + 1
      )
    })
  })

  test('applies status overrides to active and completed dashboard counts', () => {
    const dashboard = buildInspectionDashboardViewModel('FELIXSTOWE', {
      today,
      query: {
        tab: 'completed'
      },
      statusOverrides: {
        'GB-IUU-2026-11002': {
          statusCode: 'COMPLETED',
          completedAt: '2026-11-18T23:00:00.000Z',
          statusLabel: 'Manually completed',
          statusTagClass: 'govuk-tag--purple'
        },
        'GB-IUU-2026-11003': {
          statusCode: 'COMPLETED',
          statusLabel: 'Completed without a completion date',
          statusTagClass: 'govuk-tag--grey'
        },
        'GB-IUU-2026-11006': {
          statusCode: 'IN_PROGRESS',
          completedAt: '2026-11-18T00:00:00.000Z'
        }
      }
    })

    expect(
      dashboard.completed.rows.find(
        ({ reference }) => reference === 'GB-IUU-2026-11002'
      )
    ).toMatchObject({
      statusLabel: 'Manually completed',
      statusTagClass: 'govuk-tag--purple'
    })
    expect(
      dashboard.completed.rows.find(
        ({ reference }) => reference === 'GB-IUU-2026-11003'
      ).statusLabel
    ).toBe('Completed without a completion date')
    expect(
      dashboard.active.rows.find(
        ({ reference }) => reference === 'GB-IUU-2026-11006'
      ).statusLabel
    ).toBe('In progress')
    expect(dashboard.completedTodayCount).toBe(1)
  })

  test('returns empty pagination details when the selected filters match no consignments', () => {
    const dashboard = buildInspectionDashboardViewModel('FELIXSTOWE', {
      today,
      query: {
        search: 'no matching consignment'
      }
    })

    expect(dashboard.active).toMatchObject({
      rows: [],
      filteredTotalCount: 0,
      filteredStart: 0,
      filteredEnd: 0,
      pagination: {
        currentPage: 1,
        pageCount: 0
      }
    })
  })

  test('shows ten notifications initially and keeps the selected results when showing more', () => {
    const firstPage = buildInspectionDashboardViewModel('FELIXSTOWE', {
      today,
      basePath: '/trade',
      query: {
        search: 'GB-IUU-2026-110',
        'filter-arrival-from': '2026-01-01',
        'sort-by': 'reference',
        'sort-order': 'desc'
      }
    })
    const nextPage = buildInspectionDashboardViewModel('FELIXSTOWE', {
      today,
      basePath: '/trade',
      query: {
        search: 'GB-IUU-2026-110',
        'filter-arrival-from': '2026-01-01',
        'sort-by': 'reference',
        'sort-order': 'desc',
        page: '2'
      }
    })

    expect(firstPage.active.rows).toHaveLength(10)
    expect(nextPage.active.rows).toHaveLength(20)
    expect(
      nextPage.active.rows.slice(10).map(({ reference }) => reference)
    ).not.toEqual(firstPage.active.rows.map(({ reference }) => reference))
    expect(nextPage.active.pagination.nextHref).toContain(
      'search=GB-IUU-2026-110'
    )
    expect(nextPage.active.pagination.nextHref).toContain(
      'filter-arrival-from=2026-01-01'
    )
    expect(nextPage.active.pagination.showLessHref).toContain(
      'page=1#active-first-batch'
    )
    expect(nextPage.active.pagination.nextHref).toContain('sort-by=reference')
    expect(nextPage.active.pagination.nextHref).toContain('sort-order=desc')
    expect(nextPage.active.pagination.nextHref).toContain(
      'page=3#active-next-batch'
    )
  })
})
