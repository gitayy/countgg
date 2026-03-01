import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MacroPresetsPage from './MacroPresetsPage'
import { UserContext } from '../utils/contexts/UserContext'
import { defaultPreferences } from '../utils/helpers'
import {
  getMacroPresetThreadUsage,
  getMacroPresetVersion,
  getMacroPresetVersions,
  listMacroPresets,
} from '../utils/api'

jest.mock('../utils/api', () => ({
  listMacroPresets: jest.fn(),
  getMacroPresetVersions: jest.fn(),
  getMacroPresetVersion: jest.fn(),
  getMacroPresetThreadUsage: jest.fn(),
  macroPresetsFeatureEnabled: true,
}))

const mockedListMacroPresets = listMacroPresets as jest.Mock
const mockedGetMacroPresetVersions = getMacroPresetVersions as jest.Mock
const mockedGetMacroPresetVersion = getMacroPresetVersion as jest.Mock
const mockedGetMacroPresetThreadUsage = getMacroPresetThreadUsage as jest.Mock

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
        <MacroPresetsPage />
      </UserContext.Provider>
    </MemoryRouter>,
  )

describe('MacroPresetsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockedListMacroPresets
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

    mockedGetMacroPresetVersions.mockResolvedValue({
      data: [{ id: 201, versionNumber: 6 }],
    })
    mockedGetMacroPresetVersion.mockResolvedValue({
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
    mockedGetMacroPresetThreadUsage.mockResolvedValue({
      data: {
        macroPresetId: 10,
        total: 1,
        items: [{ threadId: 'abc', threadName: 'main', appliesCount: 44 }],
      },
    })
  })

  it('renders discover results with macro-aware search helper', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByText('Main Thread Pack')).toBeInTheDocument())

    expect(
      screen.getByText(/Use plain text or filters: creator:pull name:test1 handle:test1 thread:used/i),
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
    expect(screen.getByText('Create Macro Preset')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Main Thread Pack (copy)')).toBeInTheDocument()
  })
})
