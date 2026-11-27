import {
  createAll,
  Button,
  Checkboxes,
  ErrorSummary,
  Radios,
  SkipLink,
  Tabs
} from 'govuk-frontend'
import cookies from './cookies.js'

const ARIA_CONTROLS = 'aria-controls'
const ARIA_EXPANDED = 'aria-expanded'
const VISIBLE_ACTION_OPTION_COUNT = 3

cookies.init()

document.querySelectorAll('[data-goods-toggle]').forEach((button) => {
  const goodsRows = document.getElementById(button.getAttribute(ARIA_CONTROLS))
  if (!goodsRows) {
    return
  }

  goodsRows.hidden = true
  button.hidden = false
  button.addEventListener('click', () => {
    const isExpanded = button.getAttribute(ARIA_EXPANDED) === 'true'
    goodsRows.hidden = isExpanded
    button.setAttribute(ARIA_EXPANDED, String(!isExpanded))
    button.textContent = isExpanded ? 'Show more' : 'Show less'
  })
})

document.querySelectorAll('.inspection-action-options').forEach((radios) => {
  const additionalItems = Array.from(radios.children)
    .filter((item) => item.classList.contains('govuk-radios__item'))
    .slice(VISIBLE_ACTION_OPTION_COUNT)

  if (additionalItems.length === 0) {
    return
  }

  const extra = document.createElement('div')
  extra.id = `${radios.closest('[data-action-radios]').id}-additional`

  const divider = document.createElement('hr')
  divider.className =
    'govuk-section-break govuk-section-break--m govuk-section-break--visible'

  const more = document.createElement('button')
  more.type = 'button'
  more.className = 'govuk-link inspection-action-options__toggle'
  more.textContent = 'Show more options'
  more.setAttribute(ARIA_CONTROLS, extra.id)

  const less = document.createElement('button')
  less.type = 'button'
  less.className = more.className
  less.textContent = 'Show less'
  less.setAttribute(ARIA_CONTROLS, extra.id)

  extra.append(divider, ...additionalItems, less)
  radios.append(more, extra)

  const setExpanded = (expanded) => {
    extra.hidden = !expanded
    more.hidden = expanded
    more.setAttribute(ARIA_EXPANDED, String(expanded))
    less.setAttribute(ARIA_EXPANDED, String(expanded))
  }

  setExpanded(
    additionalItems.some((item) => item.querySelector('input:checked'))
  )

  more.addEventListener('click', () => {
    setExpanded(true)
    additionalItems[0].querySelector('input').focus()
  })

  less.addEventListener('click', () => {
    const selected = extra.querySelector('input:checked')
    if (selected) {
      selected.checked = false
      selected.dispatchEvent(new Event('change', { bubbles: true }))
    }
    setExpanded(false)
    more.focus()
  })
})

document
  .querySelectorAll('[data-decision-confirmation]')
  .forEach((confirmation) => {
    const actionRadios = confirmation
      .closest('form')
      .querySelectorAll('input[name="inspection-action"]')
    const updateConfirmationVisibility = () => {
      confirmation.hidden = !Array.from(actionRadios).some(
        (radio) => radio.checked && radio.value === 'issue-decision'
      )
    }

    actionRadios.forEach((radio) =>
      radio.addEventListener('change', updateConfirmationVisibility)
    )
    updateConfirmationVisibility()
  })

createAll(Button)
createAll(Checkboxes)
createAll(ErrorSummary)
createAll(Radios)
createAll(SkipLink)

const resultsCount = document.getElementById(window.location.hash.slice(1))
const resultsTab = resultsCount?.dataset.resultsTab
if (resultsTab) {
  // GOV.UK Tabs selects a panel by its hash. Consume the Apply target before setup.
  window.history.replaceState(window.history.state, '', `#${resultsTab}`)
}
createAll(Tabs)

if (resultsTab) {
  window.addEventListener(
    'pageshow',
    () => {
      resultsCount.focus({ preventScroll: true })
      resultsCount.scrollIntoView({ block: 'start' })
    },
    { once: true }
  )
}

const updateSummaryCards = (tab) => {
  if (tab !== 'active' && tab !== 'completed') {
    return
  }

  document
    .querySelectorAll('.inspection-dashboard__summary-card')
    .forEach((card) => {
      const variant = card.querySelector(`[data-summary-tab="${tab}"]`)
      const count = card.querySelector('[data-summary-count]')
      const link = card.querySelector('[data-summary-link]')
      if (!variant || !count || !link) {
        return
      }

      count.textContent = variant.dataset.count
      link.setAttribute('href', variant.dataset.href)
    })
}

document.querySelectorAll('.govuk-tabs__tab').forEach((tabLink) => {
  tabLink.addEventListener('click', () => {
    updateSummaryCards(tabLink.getAttribute('href').slice(1))
  })
})

const selectedTab = document.querySelector(
  '.govuk-tabs__list-item--selected .govuk-tabs__tab'
)
if (selectedTab) {
  updateSummaryCards(selectedTab.getAttribute('href').slice(1))
}

window.addEventListener('hashchange', () =>
  updateSummaryCards(window.location.hash.slice(1))
)
