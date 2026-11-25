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

const initializeApplication = async (
  controls = [],
  goodsToggles = [],
  actionRadios = [],
  decisionConfirmations = []
) => {
  vi.stubGlobal('document', {
    querySelectorAll: vi.fn((selector) =>
      selector === '[data-goods-toggle]'
        ? goodsToggles
        : selector === '[data-decision-confirmation]'
          ? decisionConfirmations
          : selector === '.inspection-action-options'
            ? actionRadios
            : controls
    ),
    createElement: vi.fn((tagName) => {
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
    }),
    getElementById: vi.fn(
      (id) =>
        goodsToggles.find(
          (toggle) => toggle.getAttribute('aria-controls') === id
        )?.controlledContent
    )
  })

  vi.resetModules()
  await import('./application.js')

  const govukFrontend = await import('govuk-frontend')
  const cookies = await import('./cookies.js')

  return {
    cookies,
    govukFrontend
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

    const { cookies, govukFrontend } = await initializeApplication([control])

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

    await initializeApplication([], [], [], [confirmation])

    expect(confirmation.hidden).toBe(true)
    decisionRadio.checked = true
    decisionRadio.changeListener()
    expect(confirmation.hidden).toBe(false)

    decisionRadio.checked = false
    otherRadio.checked = true
    otherRadio.changeListener()
    expect(confirmation.hidden).toBe(true)
  })

  test('toggles goods details and updates the accessible button state', async () => {
    const controlledContent = { hidden: true }
    const attributes = new Map([
      ['aria-controls', 'commodity-codes-extra-1'],
      ['aria-expanded', 'false']
    ])
    const toggle = {
      controlledContent,
      addEventListener: vi.fn((event, listener) => {
        toggle.clickListener = listener
      }),
      getAttribute: vi.fn((name) => attributes.get(name)),
      setAttribute: vi.fn((name, value) => attributes.set(name, value)),
      textContent: 'Show more'
    }

    await initializeApplication([], [toggle])

    toggle.clickListener()
    expect(controlledContent.hidden).toBe(false)
    expect(attributes.get('aria-expanded')).toBe('true')
    expect(toggle.textContent).toBe('Show less')

    toggle.clickListener()
    expect(controlledContent.hidden).toBe(true)
    expect(attributes.get('aria-expanded')).toBe('false')
    expect(toggle.textContent).toBe('Show more')
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

    await initializeApplication([], [], [radios])

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
})
