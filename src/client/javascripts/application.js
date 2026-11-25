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

document.querySelectorAll('[data-goods-toggle]').forEach((toggle) => {
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true'
    const controlledContent = document.getElementById(
      toggle.getAttribute('aria-controls')
    )
    controlledContent.hidden = expanded
    toggle.setAttribute('aria-expanded', String(!expanded))
    toggle.textContent = expanded ? 'Show more' : 'Show less'
  })
})

document.querySelectorAll('.inspection-action-options').forEach((radios) => {
  const additionalItems = Array.from(radios.children)
    .filter((item) => item.classList.contains('govuk-radios__item'))
    .slice(3)

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
  more.setAttribute('aria-controls', extra.id)

  const less = document.createElement('button')
  less.type = 'button'
  less.className = more.className
  less.textContent = 'Show less'
  less.setAttribute('aria-controls', extra.id)

  extra.append(divider, ...additionalItems, less)
  radios.append(more, extra)

  const setExpanded = (expanded) => {
    extra.hidden = !expanded
    more.hidden = expanded
    more.setAttribute('aria-expanded', String(expanded))
    less.setAttribute('aria-expanded', String(expanded))
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
createAll(Tabs)
