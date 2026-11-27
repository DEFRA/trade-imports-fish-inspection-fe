// Seed values use document references, species labels, product codes and origin examples
// from the supplied "FES Data Dictionary 01-06 v1.xlsx" workbook.
import {
  ATLANTIC_TUNA_IMPORTS,
  BULK_COMMODITY_WEIGHT,
  HARBOUR_CATCH_IMPORTS,
  NEW_ENGLAND_SEAFOOD_INTERNATIONAL_LTD,
  SKIPJACK_TUNA,
  YELLOWFIN_TUNA
} from './inspection-dashboard-consignment-seed-values.js'

const detailedFelixstoweConsignmentSeeds = [
  {
    id: 'consignment-11001',
    reference: 'GB-IUU-2026-11002',
    importer: NEW_ENGLAND_SEAFOOD_INTERNATIONAL_LTD,
    originCountry: 'France',
    arrivalOffsetDays: -1,
    arrivalTime: '9:00am',
    vesselName: 'PENDRUC',
    imoNumber: '9741102',
    containerNumber: 'MSCU2205101',
    commodityCodes: ['030343', '03048720'],
    commoditySpecies: [
      {
        commodityCode: '030343',
        species: SKIPJACK_TUNA,
        weight: '62,000 kg'
      },
      {
        commodityCode: '03048720',
        species: YELLOWFIN_TUNA,
        weight: '56,000 kg'
      }
    ],
    species: 'Skipjack tuna (Katsuwonus pelamis)',
    declaredWeightKg: 118000,
    catchCertificateCount: 1,
    processingStatementCount: 0,
    nmdCount: 0,
    additionalDocumentCount: 0,
    status: 'REQUIRES_DOCUMENT_CHECK',
    recentChanges: [
      {
        label: 'Inspector status changed to Requires document check',
        actor: 'Port Health Authority',
        occurredAt: '2026-10-27T14:01:00Z',
        description:
          'The notification is ready for an inspector to review the supporting documents.'
      },
      {
        label: 'Supporting documents received',
        actor: 'Importer',
        occurredAt: '2026-10-26T11:42:00Z',
        description:
          'Catch certificate documents were added to the notification.'
      }
    ],
    riskFlags: [
      'WEIGHT_MISMATCH',
      'MISSING_EVIDENCE',
      'IMPORTER_DECLARATION_MISSING'
    ],
    riskNotes:
      'Weight Reconciliation (Fail). Catch Certificate contains both Skipjack and Yellowfin tuna, and certified weight exceeds the declaration by 34,000 kg.'
  },
  {
    id: 'consignment-11002',
    reference: 'GB-IUU-2026-11003',
    importer: NEW_ENGLAND_SEAFOOD_INTERNATIONAL_LTD,
    originCountry: 'Spain, France, Seychelles and Chile',
    arrivalOffsetDays: 105,
    arrivalTime: '',
    port: 'Grimsby',
    containerNumber: 'MSCU1000030',
    vesselName: 'Multiple vessels',
    commodityCodes: ['030343', '03048720', '16041416'],
    commoditySpecies: [
      {
        commodityCode: '030343',
        species: SKIPJACK_TUNA,
        weight: BULK_COMMODITY_WEIGHT
      },
      {
        commodityCode: '03048720',
        species: YELLOWFIN_TUNA,
        weight: BULK_COMMODITY_WEIGHT
      },
      {
        commodityCode: '16041416',
        species: 'Bigeye tuna',
        weight: BULK_COMMODITY_WEIGHT
      }
    ],
    species: 'Skipjack Tuna (Katsuwonus pelamis)',
    declaredWeightKg: 360000,
    catchCertificateCount: 4,
    processingStatementCount: 3,
    nmdCount: 2,
    additionalDocumentCount: 2,
    status: 'REQUIRES_DOCUMENT_CHECK',
    recentChanges: [
      {
        label: 'Supporting documents reviewed',
        actor: 'Port Health Authority',
        occurredAt: '2026-10-26T10:15:00Z',
        description:
          'The submitted documents are being checked by an inspector.'
      },
      {
        label: 'Notification submitted',
        actor: NEW_ENGLAND_SEAFOOD_INTERNATIONAL_LTD,
        occurredAt: '2026-10-25T09:30:00Z',
        description: 'The importer submitted the notification for review.'
      }
    ],
    riskFlags: ['WEIGHT_MISMATCH', 'MISSING_EVIDENCE'],
    riskNotes: '1 catch certificate not accounted for',
    warningText:
      'Possible discrepancy detected: 4 catch certificates were supplied but only 3 are referenced on the attached processing statement. Catch certificate SYC/SFA/10/2026-SW0454 (64,000 kg) is not represented in the processing evidence.',
    assessmentSummary:
      'The commodity, species and product code information supplied within the notification is consistent with the supporting documentary evidence. However, one Catch Certificate supplied by the importer is not referenced within the Processing Statement. This means that 64,000 kg of certified catch cannot currently be linked to the processing activity described in the accompanying documentation. Additional information should be requested from the importer to determine whether an updated Processing Statement or further supporting evidence exists for Catch Certificate SYC/SFA/10/2026-SW0454.'
  },
  {
    id: 'consignment-11003',
    reference: 'GB-IUU-2026-11001',
    importer: NEW_ENGLAND_SEAFOOD_INTERNATIONAL_LTD,
    originCountry: 'France',
    arrivalOffsetDays: 4,
    arrivalTime: '',
    port: 'Grimsby',
    containerNumber: 'MSCU1000333',
    vesselName: 'BERNICA',
    commodityCodes: ['030343', '03048720', '16041416', '03047400'],
    commoditySpecies: [
      {
        commodityCode: '030343',
        species: SKIPJACK_TUNA,
        weight: '48,000 kg'
      },
      {
        commodityCode: '03048720',
        species: YELLOWFIN_TUNA,
        weight: '48,000 kg'
      },
      {
        commodityCode: '16041416',
        species: 'Bigeye tuna',
        weight: '48,000 kg'
      },
      {
        commodityCode: '03047400',
        species: 'Hake',
        weight: '31,564 kg'
      }
    ],
    species: 'Skipjack Tuna (Katsuwonus pelamis)',
    declaredWeightKg: 175564,
    catchCertificateCount: 1,
    processingStatementCount: 0,
    nmdCount: 0,
    additionalDocumentCount: 0,
    status: 'REQUIRES_DOCUMENT_CHECK',
    riskFlags: [],
    riskNotes: ''
  },
  {
    id: 'consignment-11004',
    reference: 'GB-IUU-2026-11004',
    importer: ATLANTIC_TUNA_IMPORTS,
    originCountry: 'Spain',
    arrivalOffsetDays: 5,
    arrivalTime: '8:30am',
    commodityCodes: ['03048720', '16041416'],
    commoditySpecies: [
      {
        commodityCode: '03048720',
        species: 'Bluefin tuna',
        weight: '4,850 kg'
      },
      {
        commodityCode: '16041416',
        species: 'Albacore tuna',
        weight: '4,850 kg'
      }
    ],
    species: 'Bluefin tuna loins',
    declaredWeightKg: 9700,
    catchCertificateCount: 2,
    processingStatementCount: 1,
    nmdCount: 1,
    additionalDocumentCount: 1,
    status: 'REQUIRES_DOCUMENT_CHECK',
    riskFlags: ['IMPORTER_DECLARATION_MISSING']
  },
  {
    id: 'consignment-11005',
    reference: 'GB-IUU-2026-11005',
    importer: HARBOUR_CATCH_IMPORTS,
    originCountry: 'Ecuador',
    arrivalOffsetDays: 6,
    arrivalTime: '4:20pm',
    commodityCodes: ['16041416', '03047400', '03038955'],
    commoditySpecies: [
      {
        commodityCode: '16041416',
        species: SKIPJACK_TUNA,
        weight: '1,400 kg'
      },
      {
        commodityCode: '03047400',
        species: 'Hake',
        weight: '1,400 kg'
      },
      {
        commodityCode: '03038955',
        species: 'Swordfish',
        weight: '1,400 kg'
      }
    ],
    species: 'Skipjack tuna (SKJ)',
    declaredWeightKg: 4200,
    catchCertificateCount: 2,
    processingStatementCount: 2,
    nmdCount: 0,
    additionalDocumentCount: 3,
    status: 'REFERRED_TO_MMO',
    riskFlags: ['TRANSPORT_INFORMATION_MISSING', 'MISSING_EVIDENCE']
  }
]

export default detailedFelixstoweConsignmentSeeds
