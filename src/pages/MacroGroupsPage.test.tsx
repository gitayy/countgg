import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MacroGroupsPage from './MacroGroupsPage'
import { UserContext } from '../utils/contexts/UserContext'
import { defaultPreferences } from '../utils/helpers'
import {
  getMacroGroupThreadUsage,
  getMacroGroupVersion,
  getMacroGroupVersions,
  listMacroGroups,
} from '../utils/api'

jest.mock('../utils/api', () => ({
  listMacroGroups: jest.fn(),
  getMacroGroupVersions: jest.fn(),
  getMacroGroupVersion: jest.fn(),
  getMacroGroupThreadUsage: jest.fn(),
  macroGroupsFeatureEnabled: true,
}))

const mockedListMacroGroups = listMacroGroups as jest.Mock
const mockedGetMacroGroupVersions = getMacroGroupVersions as jest.Mock
const mockedGetMacroGroupVersion = getMacroGroupVersion as jest.Mock
const mockedGetMacroGroupThreadUsage = getMacroGroupThreadUsage as jest.Mock

const renderPage = () =>
  render(
    <MemoryRouter>
      <UserContext.Provider
        value={{
          user: { id: 'u1', uuid: 'u1', username: 'tester' } as any,
          loading: false,
          preferences: defaultPreferences,
        }}
      >
        <MacroGroupsPage />
      </UserContext.Provider>
    </MemoryRouter>,
  )

describe('MacroGroupsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockedListMacroGroups
      .mockResolvedValueOnce({
        data: {
          total: 1,
          items: [
            {
              id: 10,
              name: 'Main Thread Pack',
              handle: 'main-thread-pack',
              description: 'submit + backspace helpers',
              visibility: 'PUBLIC',
              isDeleted: false,
              createdAt: '2026-03-01T00:00:00.000Z',
              updatedAt: '2026-03-01T00:00:00.000Z',
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          total: 1,
          items: [
            {
              id: 10,
              name: 'Main Thread Pack',
              handle: 'main-thread-pack',
              description: 'submit + backspace helpers',
              visibility: 'PUBLIC',
              isDeleted: false,
              createdAt: '2026-03-01T00:00:00.000Z',
              updatedAt: '2026-03-01T00:00:00.000Z',
            },
          ],
        },
      })

    mockedGetMacroGroupVersions.mockResolvedValue({
      data: [{ id: 201, versionNumber: 6 }],
    })
    mockedGetMacroGroupVersion.mockResolvedValue({
      data: {
        id: 201,
        versionNumber: 6,
        entries: [
          {
            id: 1,
            triggerKey: 'q',
            macroType: 'CHAR_INSERT',
            payloadJson: { char: '1' },
          },
        ],
      },
    })
    mockedGetMacroGroupThreadUsage.mockResolvedValue({
      data: {
        macroGroupId: 10,
        total: 1,
        items: [{ threadId: 'abc', threadName: 'main', appliesCount: 44 }],
      },
    })
  })

  it('renders discover results with macro-aware search helper', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByText('Main Thread Pack')).toBeInTheDocument())

    expect(
      screen.getByText(/Search by display name, handle, description, trigger key, or behavior/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy To Draft' })).toBeInTheDocument()
    expect(screen.getAllByText('Owned').length).toBeGreaterThan(0)
  })

  it('copies a group into draft and switches to create view', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByText('Main Thread Pack')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Copy To Draft' }))

    await waitFor(() =>
      expect(screen.getByText('Copied "Main Thread Pack" into draft.')).toBeInTheDocument(),
    )
    expect(screen.getByText('Create Macro Group')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Main Thread Pack (copy)')).toBeInTheDocument()
  })
})
