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

cookies.init()

const INSPECTION_SORT_SCROLL_POSITION_KEY = 'inspection-sort-scroll-position'

const getSortScrollPosition = () => {
  try {
    return sessionStorage.getItem(INSPECTION_SORT_SCROLL_POSITION_KEY)
  } catch {
    return null
  }
}

const removeSortScrollPosition = () => {
  try {
    sessionStorage.removeItem(INSPECTION_SORT_SCROLL_POSITION_KEY)
  } catch {
    return false
  }
  return true
}

const saveSortScrollPosition = (position) => {
  try {
    sessionStorage.setItem(INSPECTION_SORT_SCROLL_POSITION_KEY, position)
  } catch {
    return false
  }
  return true
}

const sortScrollPosition = getSortScrollPosition()
if (sortScrollPosition !== null) {
  removeSortScrollPosition()
  globalThis.requestAnimationFrame(() =>
    window.scrollTo(0, Number(sortScrollPosition))
  )
}

document
  .querySelectorAll('[data-inspection-sort-control]')
  .forEach((control) => {
    control.addEventListener('change', () => {
      saveSortScrollPosition(String(window.scrollY))
      control.form.requestSubmit()
    })
  })

document.querySelectorAll('[data-goods-toggle]').forEach((button) => {
  const goodsRows = document.getElementById(
    button.getAttribute('aria-controls')
  )
  if (!goodsRows) {
    return
  }

  goodsRows.hidden = true
  button.hidden = false
  button.addEventListener('click', () => {
    const isExpanded = button.getAttribute('aria-expanded') === 'true'
    goodsRows.hidden = isExpanded
    button.setAttribute('aria-expanded', String(!isExpanded))
    button.textContent = isExpanded ? 'Show more' : 'Show less'
  })
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
