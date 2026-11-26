const ALL_FILTER_VALUE = '__all__'
const ACTIVE_TAB = 'active'
const COMPLETED_TAB = 'completed'
const DEFAULT_SORT_BY = 'estimated-arrival'
const DEFAULT_SORT_ORDER = 'asc'
const GOVUK_TAG_RED = 'govuk-tag--red'
const GOVUK_TAG_YELLOW = 'govuk-tag--yellow'
const MISMATCHES_FLAGGED_FILTER = 'mismatches-flagged'
const ARRIVAL_RED_TAG_THRESHOLD_DAYS = 3
const ARRIVAL_YELLOW_TAG_MAX_DAYS = 8

const STATUS_LABELS = {
  REQUIRES_DOCUMENT_CHECK: 'Requires document check',
  IN_PROGRESS: 'In progress',
  REQUEST_ADDITIONAL_INFORMATION:
    'Request Additional Information from Importer',
  REFERRED_TO_MMO: 'Referred To MMO',
  COMPLETED: 'Completed',
  REQUIRES_PHYSICAL_INSPECTION: 'Requires physical inspection',
  APPEAL_UNDER_REVIEW: 'Appeal under review',
  REFERRED_TO_ENFORCEMENT: 'Referred to enforcement',
  REJECTED: 'Rejected',
  CLOSED: 'Closed'
}

const STATUS_TAG_CLASSES = {
  REQUIRES_DOCUMENT_CHECK: GOVUK_TAG_RED,
  IN_PROGRESS: 'govuk-tag--blue',
  REQUEST_ADDITIONAL_INFORMATION: GOVUK_TAG_YELLOW,
  REFERRED_TO_MMO: 'govuk-tag--purple',
  COMPLETED: 'govuk-tag--green',
  REQUIRES_PHYSICAL_INSPECTION: GOVUK_TAG_RED,
  APPEAL_UNDER_REVIEW: GOVUK_TAG_YELLOW,
  REFERRED_TO_ENFORCEMENT: 'govuk-tag--purple',
  REJECTED: GOVUK_TAG_RED,
  CLOSED: 'govuk-tag--grey'
}

const RISK_FLAG_LABELS = {
  COMMODITY_MISMATCH: 'Declared commodity mismatch',
  WEIGHT_MISMATCH: 'Weight Mismatch',
  MISSING_EVIDENCE: 'Missing Evidence',
  IMPORTER_DECLARATION_MISSING: 'Importer Declaration Missing',
  TRANSPORT_INFORMATION_MISSING: 'Transport Information Missing'
}

const hasEvidenceIssues = (consignment) => consignment.riskFlags.length > 0

const hasMismatch = (consignment) =>
  consignment.riskFlags.some(
    (flag) => flag === 'COMMODITY_MISMATCH' || flag === 'WEIGHT_MISMATCH'
  )

const QUICK_FILTER_GROUPS = [
  {
    key: 'awaiting-inspection',
    label: 'Awaiting inspection',
    tab: ACTIVE_TAB,
    status: 'REQUIRES_DOCUMENT_CHECK'
  },
  {
    key: 'in-progress',
    label: 'In progress',
    tab: ACTIVE_TAB,
    status: 'IN_PROGRESS',
    useFormStatus: true
  },
  {
    key: 'completed-today',
    label: 'Completed today',
    tab: COMPLETED_TAB,
    status: 'COMPLETED',
    matches: (consignment) => consignment.isCompletedToday
  },
  {
    key: MISMATCHES_FLAGGED_FILTER,
    label: 'Mismatches flagged',
    matches: hasMismatch
  }
]

const matchesQuickFilterGroup = (group, consignment) =>
  (!group.status || group.status === consignment.status) &&
  (!group.matches || group.matches(consignment))

const SORT_OPTIONS = [
  { value: DEFAULT_SORT_BY, text: 'Estimated Arrival' },
  { value: 'importer', text: 'Importer' },
  { value: 'status', text: 'Status' },
  { value: 'reference', text: 'Consignment Reference' }
]

const SORT_ORDER_OPTIONS = [
  { value: 'asc', text: 'Ascending' },
  { value: 'desc', text: 'Descending' }
]

export {
  ACTIVE_TAB,
  ALL_FILTER_VALUE,
  ARRIVAL_RED_TAG_THRESHOLD_DAYS,
  ARRIVAL_YELLOW_TAG_MAX_DAYS,
  COMPLETED_TAB,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
  GOVUK_TAG_RED,
  GOVUK_TAG_YELLOW,
  hasEvidenceIssues,
  matchesQuickFilterGroup,
  MISMATCHES_FLAGGED_FILTER,
  QUICK_FILTER_GROUPS,
  RISK_FLAG_LABELS,
  SORT_OPTIONS,
  SORT_ORDER_OPTIONS,
  STATUS_LABELS,
  STATUS_TAG_CLASSES
}
