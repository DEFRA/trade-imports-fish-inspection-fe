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

const scrollPositionKey = 'inspection-sort-scroll-position'

const initializeApplication = async (
  savedPosition,
  controls = [],
  storageMethods = {},
  browserElements = {}
) => {
  const storedValues = new Map()
  if (savedPosition !== null) {
    storedValues.set(scrollPositionKey, savedPosition)
  }

  const {
    goodsToggles = [],
    goodsRows = {},
    summaryCards = [],
    tabs = [],
    selectedTab = null
  } = browserElements
  const sessionStorage = {
    getItem: vi.fn((key) => storedValues.get(key) ?? null),
    removeItem: vi.fn((key) => storedValues.delete(key)),
    setItem: vi.fn((key, value) => storedValues.set(key, value)),
    ...storageMethods
  }
  const requestAnimationFrame = vi.fn()
  const scrollTo = vi.fn()
  const windowListeners = new Map()

  vi.stubGlobal('sessionStorage', sessionStorage)
  vi.stubGlobal('requestAnimationFrame', requestAnimationFrame)
  vi.stubGlobal('window', {
    addEventListener: vi.fn((event, listener) =>
      windowListeners.set(event, listener)
    ),
    location: { hash: '#active' },
    scrollTo,
    scrollY: 480
  })
  vi.stubGlobal('document', {
    getElementById: vi.fn((id) => goodsRows[id]),
    querySelector: vi.fn(() => selectedTab),
    querySelectorAll: vi.fn((selector) => {
      const elements = {
        '[data-goods-toggle]': goodsToggles,
        '[data-inspection-sort-control]': controls,
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
    requestAnimationFrame,
    scrollTo,
    sessionStorage,
    windowListeners
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
  vi.clearAllMocks()
})

describe('application browser initialization', () => {
  test('restores sort scroll position and submits a changed sort control', async () => {
    const control = {
      addEventListener: vi.fn((event, listener) => {
        control.changeListener = listener
      }),
      form: {
        requestSubmit: vi.fn()
      }
    }

    const {
      cookies,
      govukFrontend,
      requestAnimationFrame,
      scrollTo,
      sessionStorage
    } = await initializeApplication('320', [control])

    expect(cookies.default.init).toHaveBeenCalledOnce()
    expect(sessionStorage.removeItem).toHaveBeenCalledWith(scrollPositionKey)
    expect(requestAnimationFrame).toHaveBeenCalledOnce()
    requestAnimationFrame.mock.calls[0][0]()
    expect(scrollTo).toHaveBeenCalledWith(0, 320)

    control.changeListener()
    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      scrollPositionKey,
      '480'
    )
    expect(control.form.requestSubmit).toHaveBeenCalledOnce()
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

  test('does not restore scrolling when there is no saved sort position', async () => {
    const { requestAnimationFrame, sessionStorage } =
      await initializeApplication(null)

    expect(sessionStorage.removeItem).not.toHaveBeenCalled()
    expect(requestAnimationFrame).not.toHaveBeenCalled()
  })

  test('restores sorting when browser storage cannot clear the saved position', async () => {
    const { requestAnimationFrame, scrollTo } = await initializeApplication(
      '320',
      [],
      {
        removeItem: vi.fn(() => {
          throw new DOMException('Storage is unavailable', 'SecurityError')
        })
      }
    )

    expect(requestAnimationFrame).toHaveBeenCalledOnce()
    requestAnimationFrame.mock.calls[0][0]()
    expect(scrollTo).toHaveBeenCalledWith(0, 320)
  })

  test('initializes components and submits sorting when browser storage is unavailable', async () => {
    const control = {
      addEventListener: vi.fn((event, listener) => {
        control.changeListener = listener
      }),
      form: {
        requestSubmit: vi.fn()
      }
    }

    const { govukFrontend } = await initializeApplication(null, [control], {
      getItem: vi.fn(() => {
        throw new DOMException('Storage is unavailable', 'SecurityError')
      }),
      setItem: vi.fn(() => {
        throw new DOMException('Storage is unavailable', 'SecurityError')
      })
    })

    control.changeListener()

    expect(control.form.requestSubmit).toHaveBeenCalledOnce()
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

    await initializeApplication(
      null,
      [],
      {},
      {
        goodsToggles: [button],
        goodsRows: { 'goods-extra-1': goodsRows }
      }
    )

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
    const { windowListeners } = await initializeApplication(
      null,
      [],
      {},
      {
        summaryCards: [card],
        tabs: [activeTab, completedTab],
        selectedTab: activeTab
      }
    )

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
