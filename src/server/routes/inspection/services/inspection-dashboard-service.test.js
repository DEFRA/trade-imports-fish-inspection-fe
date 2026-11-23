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
        'filter-origin': 'France',
        'filter-status': 'REQUIRES_DOCUMENT_CHECK',
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
    expect(mismatchCard.tabVariants[0].href).toContain('#active')
    expect(mismatchCard.tabVariants[1].href).toContain('#completed')
    expect(
      new URL(mismatchChip.href, 'http://example.test').searchParams.has(
        'quick-filter'
      )
    ).toBe(false)
  })

  test('replaces status quick filters while retaining independent mismatch filters', () => {
    const dashboard = buildInspectionDashboardViewModel('FELIXSTOWE', {
      today,
      basePath: '/trade',
      query: {
        'quick-filter': ['in-progress', 'mismatches-flagged']
      }
    })
    const awaitingInspectionCard = dashboard.summaryCards.find(
      ({ key }) => key === 'awaiting-inspection'
    )
    const completedTodayCard = dashboard.summaryCards.find(
      ({ key }) => key === 'completed-today'
    )
    const awaitingInspectionUrl = new URL(
      awaitingInspectionCard.href,
      'http://example.test'
    )
    const completedTodayUrl = new URL(
      completedTodayCard.href,
      'http://example.test'
    )

    expect(awaitingInspectionUrl.searchParams.getAll('quick-filter')).toEqual([
      'mismatches-flagged',
      'awaiting-inspection'
    ])
    expect(completedTodayUrl.searchParams.get('tab')).toBe('completed')
    expect(completedTodayUrl.searchParams.getAll('quick-filter')).toEqual([
      'mismatches-flagged',
      'completed-today'
    ])
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
})
