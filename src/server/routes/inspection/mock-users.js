const mockUsers = [
  {
    id: 'felixstowe-test',
    name: 'John Smith',
    roles: ['PHA'],
    organisationId: 'PHA-FELIXSTOWE',
    organisationName: 'Port of Felixstowe Port Health Authority',
    portId: 'FELIXSTOWE'
  },
  {
    id: 'dover-test',
    name: 'Jane Doe',
    roles: ['PHA'],
    organisationId: 'PHA-DOVER',
    organisationName: 'Port of Dover Port Health Authority',
    portId: 'DOVER'
  },
  {
    id: 'non-pha-test',
    name: 'Michael Brown',
    roles: ['IMPORTER'],
    organisationId: 'TEST-IMPORTER',
    organisationName: 'Test importer (non-Port Health Authority)'
  }
]

const findMockUser = (id) => mockUsers.find((user) => user.id === id)

export { findMockUser, mockUsers }
