import { vi } from 'vitest'

vi.mock('govuk-frontend', () => ({
  createAll: vi.fn(),
  Button: 'Button',
  Checkboxes: 'Checkboxes',
  ErrorSummary: 'ErrorSummary',
  Radios: 'Radios',
  SkipLink: 'SkipLink',
  Tabs: 'Tabs'
}))

vi.mock('./cookies.js', () => ({
  default: {
    init: vi.fn()
  }
}))

const createElement = (tagName) => {
  const attributes = new Map()
  const listeners = new Map()
  return {
    tagName,
    attributes,
    children: [],
    hidden: false,
    className: '',
    textContent: '',
    append: vi.fn(function (...children) {
      this.children.push(...children)
    }),
    addEventListener: vi.fn((event, listener) =>
      listeners.set(event, listener)
    ),
    getAttribute: vi.fn((name) => attributes.get(name)),
    setAttribute: vi.fn((name, value) => attributes.set(name, value)),
    focus: vi.fn(),
    querySelector: vi.fn(() => null),
    dispatchEvent: vi.fn(),
    listeners
  }
}

const initializeApplication = async (browserElements = {}) => {
  const {
    sortControls = [],
    goodsToggles = [],
    goodsRows = {},
    actionRadios = [],
    decisionConfirmations = [],
    summaryCards = [],
    tabs = [],
    selectedTab = null,
    hash = '#active',
    resultsCounts = {}
  } = browserElements
  const windowListeners = new Map()

  vi.stubGlobal('window', {
    addEventListener: vi.fn((event, listener) =>
      windowListeners.set(event, listener)
    ),
    location: { hash },
    history: { replaceState: vi.fn(), state: null }
  })
  vi.stubGlobal('document', {
    createElement: vi.fn(createElement),
    getElementById: vi.fn((id) => goodsRows[id] ?? resultsCounts[id]),
    querySelector: vi.fn(() => selectedTab),
    querySelectorAll: vi.fn((selector) => {
      const elements = {
        '[data-goods-toggle]': goodsToggles,
        '[data-inspection-sort-control]': sortControls,
        '.inspection-action-options': actionRadios,
        '[data-decision-confirmation]': decisionConfirmations,
        '.govuk-tabs__tab': tabs,
        '.inspection-dashboard__summary-card': summaryCards
      }
      return elements[selector] || []
    })
  })

  vi.resetModules()
  await import('./application.js')

  const govukFrontend = await import('govuk-frontend')
  const cookies = await import('./cookies.js')

  return {
    cookies,
    govukFrontend,
    windowListeners
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
  vi.clearAllMocks()
})

describe('application browser initialization', () => {
  test('does not automatically submit a changed sort control', async () => {
    const control = {
      addEventListener: vi.fn()
    }

    const { cookies, govukFrontend } = await initializeApplication({
      sortControls: [control]
    })

    expect(cookies.default.init).toHaveBeenCalledOnce()
    expect(control.addEventListener).not.toHaveBeenCalled()
    expect(
      govukFrontend.createAll.mock.calls.map(([component]) => component)
    ).toEqual([
      'Button',
      'Checkboxes',
      'ErrorSummary',
      'Radios',
      'SkipLink',
      'Tabs'
    ])
  })

  test.each(['active', 'completed'])(
    'focuses the %s results count after Apply',
    async (tab) => {
      const count = {
        dataset: { resultsTab: tab },
        focus: vi.fn(),
        scrollIntoView: vi.fn()
      }
      const id = `${tab}-results`
      const { windowListeners } = await initializeApplication({
        hash: `#${id}`,
        resultsCounts: { [id]: count }
      })

      expect(window.history.replaceState).toHaveBeenCalledWith(
        null,
        '',
        `#${tab}`
      )
      windowListeners.get('pageshow')()
      expect(count.focus).toHaveBeenCalledOnce()
      expect(count.scrollIntoView).toHaveBeenCalledWith({ block: 'start' })
    }
  )

  test.each(['active', 'completed'])(
    'normalizes %s pagination fragments to their tab and focuses the batch',
    async (tab) => {
      const row = {
        dataset: { resultsTab: tab },
        focus: vi.fn(),
        scrollIntoView: vi.fn()
      }
      const { windowListeners } = await initializeApplication({
        hash: `#${tab}-next-batch`,
        resultsCounts: { [`${tab}-next-batch`]: row }
      })

      expect(window.history.replaceState).toHaveBeenCalledWith(
        null,
        '',
        `#${tab}`
      )
      windowListeners.get('pageshow')()
      expect(row.focus).toHaveBeenCalledWith({ preventScroll: true })
      expect(row.scrollIntoView).toHaveBeenCalledWith({ block: 'start' })
    }
  )

  test('uses the server-selected tab when the URL has no fragment', async () => {
    const selectedTab = {
      getAttribute: vi.fn(() => '#completed')
    }
    await initializeApplication({ hash: '', selectedTab })

    expect(window.history.replaceState).toHaveBeenCalledWith(
      null,
      '',
      '#completed'
    )
  })

  test('does not move focus on an ordinary tab visit', async () => {
    const { windowListeners } = await initializeApplication()
    expect(windowListeners.has('pageshow')).toBe(false)
    expect(window.history.replaceState).not.toHaveBeenCalled()
  })

  test('shows decision confirmation only when issue decision is selected', async () => {
    const decisionRadio = {
      value: 'issue-decision',
      checked: false,
      addEventListener: vi.fn((event, listener) => {
        decisionRadio.changeListener = listener
      })
    }
    const otherRadio = {
      value: 'add-note',
      checked: false,
      addEventListener: vi.fn((event, listener) => {
        otherRadio.changeListener = listener
      })
    }
    const confirmation = {
      hidden: true,
      closest: vi.fn(() => ({
        querySelectorAll: vi.fn(() => [decisionRadio, otherRadio])
      }))
    }

    await initializeApplication({ decisionConfirmations: [confirmation] })

    expect(confirmation.hidden).toBe(true)
    decisionRadio.checked = true
    decisionRadio.changeListener()
    expect(confirmation.hidden).toBe(false)

    decisionRadio.checked = false
    otherRadio.checked = true
    otherRadio.changeListener()
    expect(confirmation.hidden).toBe(true)
  })

  test('progressively enhances goods disclosure and keeps its state accessible', async () => {
    const attributes = new Map([
      ['aria-controls', 'goods-extra-1'],
      ['aria-expanded', 'false']
    ])
    const button = {
      addEventListener: vi.fn((event, listener) => {
        button.clickListener = listener
      }),
      getAttribute: vi.fn((name) => attributes.get(name) || null),
      hidden: true,
      setAttribute: vi.fn((name, value) => attributes.set(name, value)),
      textContent: 'Show more'
    }
    const goodsRows = { hidden: false }

    await initializeApplication({
      goodsToggles: [button],
      goodsRows: { 'goods-extra-1': goodsRows }
    })

    expect(goodsRows.hidden).toBe(true)
    expect(button.hidden).toBe(false)

    button.clickListener()
    expect(goodsRows.hidden).toBe(false)
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(button.textContent).toBe('Show less')

    button.clickListener()
    expect(goodsRows.hidden).toBe(true)
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(button.textContent).toBe('Show more')
  })

  test('shows three action radios with a divider and expands the rest', async () => {
    const options = Array.from({ length: 9 }, () => {
      const input = { focus: vi.fn() }
      return {
        classList: {
          contains: (className) => className === 'govuk-radios__item'
        },
        querySelector: vi.fn((selector) =>
          selector === 'input' ? input : null
        )
      }
    })
    const actionGroup = {
      id: 'inspection-action-options'
    }
    const radios = {
      children: options,
      closest: vi.fn(() => actionGroup),
      append: vi.fn((...elements) => radios.children.push(...elements))
    }

    await initializeApplication({ actionRadios: [radios] })

    const more = radios.children.at(-2)
    const extra = radios.children.at(-1)
    const less = extra.children.at(-1)

    expect(extra.hidden).toBe(true)
    expect(extra.children[0].tagName).toBe('hr')
    expect(extra.children[0].className).toContain(
      'govuk-section-break--visible'
    )
    expect(extra.children).toContain(options[3])
    expect(more.textContent).toBe('Show more options')
    expect(more.className).toContain('inspection-action-options__toggle')

    more.listeners.get('click')()
    expect(extra.hidden).toBe(false)
    expect(more.hidden).toBe(true)

    less.listeners.get('click')()
    expect(extra.hidden).toBe(true)
    expect(more.hidden).toBe(false)
  })

  test('updates mismatch summary count and destination when the selected tab changes', async () => {
    const makeVariant = (tab, count, href) => ({
      dataset: {
        count: String(count),
        href
      },
      tab
    })
    const variants = {
      active: makeVariant('active', 3, '/inspections?tab=active#active'),
      completed: makeVariant(
        'completed',
        7,
        '/inspections?tab=completed#completed'
      )
    }
    const count = { textContent: '3' }
    const link = { setAttribute: vi.fn() }
    const card = {
      querySelector: vi.fn((selector) => {
        if (selector === '[data-summary-count]') {
          return count
        }
        if (selector === '[data-summary-link]') {
          return link
        }
        const [, tab] = selector.match(/data-summary-tab="([^"]+)"/) || []
        return variants[tab]
      })
    }
    const activeTab = {
      addEventListener: vi.fn(),
      getAttribute: vi.fn(() => '#active')
    }
    const completedTab = {
      addEventListener: vi.fn((event, listener) => {
        completedTab.clickListener = listener
      }),
      getAttribute: vi.fn(() => '#completed')
    }
    const { windowListeners } = await initializeApplication({
      summaryCards: [card],
      tabs: [activeTab, completedTab],
      selectedTab: activeTab
    })

    expect(count.textContent).toBe('3')
    completedTab.clickListener()
    expect(count.textContent).toBe('7')
    expect(link.setAttribute).toHaveBeenLastCalledWith(
      'href',
      '/inspections?tab=completed#completed'
    )

    window.location.hash = '#active'
    windowListeners.get('hashchange')()
    expect(count.textContent).toBe('3')
    expect(link.setAttribute).toHaveBeenLastCalledWith(
      'href',
      '/inspections?tab=active#active'
    )
  })
})
