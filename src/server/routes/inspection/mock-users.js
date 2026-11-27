const mockUsers = [
  {
    id: 'felixstowe-test',
    name: 'Aren Valtoris-Okafor',
    roles: ['PHA'],
    organisationId: 'PHA-FELIXSTOWE',
    organisationName: 'Port of Felixstowe Port Health Authority',
    portId: 'FELIXSTOWE'
  },
  {
    id: 'dover-test',
    name: 'Sefa Quillan-Mirabeau',
    roles: ['PHA'],
    organisationId: 'PHA-DOVER',
    organisationName: 'Port of Dover Port Health Authority',
    portId: 'DOVER'
  },
  {
    id: 'non-pha-test',
    name: 'Rowan Teskaya',
    roles: ['IMPORTER'],
    organisationId: 'TEST-IMPORTER',
    organisationName: 'Non-Port Health Authority User'
  }
]

const findMockUser = (id) => mockUsers.find((user) => user.id === id)

export { findMockUser, mockUsers }
