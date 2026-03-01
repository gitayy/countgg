import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import MacroGroupManager from './MacroGroupManager'
import {
  createMacroGroup,
  getMacroGroupVersion,
  getMacroGroupVersions,
} from '../utils/api'

jest.mock('../utils/api', () => ({
  createMacroGroup: jest.fn(),
  enqueueMacroGroupUpdate: jest.fn(),
  getMacroGroupVersion: jest.fn(),
  getMacroGroupVersions: jest.fn(),
}))

const mockedCreateMacroGroup = createMacroGroup as jest.Mock
const mockedGetMacroGroupVersions = getMacroGroupVersions as jest.Mock
const mockedGetMacroGroupVersion = getMacroGroupVersion as jest.Mock

describe('MacroGroupManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates a macro group from the UI', async () => {
    mockedCreateMacroGroup.mockResolvedValue({
      data: {
        id: 42,
      },
    })

    const refreshMacroGroups = jest.fn().mockResolvedValue(undefined)

    render(
      <MacroGroupManager
        ownedMacroGroups={[]}
        refreshMacroGroups={refreshMacroGroups}
      />,
    )

    fireEvent.change(screen.getByLabelText('New Group Name'), {
      target: { value: 'Fast Main' },
    })
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Starter macros' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add First Entry' }))
    fireEvent.change(screen.getByLabelText('Trigger'), {
      target: { value: 'q' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create Group' }))

    await waitFor(() =>
      expect(mockedCreateMacroGroup).toHaveBeenCalledWith(
        'Fast Main',
        'Starter macros',
        'Initial version',
        [
          {
            triggerKey: 'q',
            macroType: 'CHAR_INSERT',
            payloadJson: { char: '1' },
          },
        ],
      ),
    )
    expect(refreshMacroGroups).toHaveBeenCalled()
  })

  it('loads the selected group latest version', async () => {
    mockedGetMacroGroupVersions.mockResolvedValue({
      data: [{ id: 501, versionNumber: 3, changeNote: 'latest' }],
    })
    mockedGetMacroGroupVersion.mockResolvedValue({
      data: {
        id: 501,
        versionNumber: 3,
        changeNote: 'latest',
        entries: [],
      },
    })

    render(
      <MacroGroupManager
        ownedMacroGroups={[
          {
            id: 7,
            name: 'Main Thread Macro Set',
            description: '',
            visibility: 'PUBLIC',
            isDeleted: false,
            createdAt: '2026-03-01T00:00:00.000Z',
            updatedAt: '2026-03-01T00:00:00.000Z',
          },
        ]}
        refreshMacroGroups={jest.fn().mockResolvedValue(undefined)}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.mouseDown(screen.getByLabelText('Your Group'))
    fireEvent.click(await screen.findByText('Main Thread Macro Set'))

    await waitFor(() =>
      expect(mockedGetMacroGroupVersions).toHaveBeenCalledWith(7),
    )
    await waitFor(() =>
      expect(mockedGetMacroGroupVersion).toHaveBeenCalledWith(7, 3),
    )
  })

  it('keeps create mode when forcedMode is create', async () => {
    mockedCreateMacroGroup.mockResolvedValue({
      data: {
        id: 99,
      },
    })

    render(
      <MacroGroupManager
        ownedMacroGroups={[]}
        refreshMacroGroups={jest.fn().mockResolvedValue(undefined)}
        forcedMode="create"
      />,
    )

    fireEvent.change(screen.getByLabelText('New Group Name'), {
      target: { value: 'Copy Draft Group' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add First Entry' }))
    fireEvent.change(screen.getByLabelText('Trigger'), {
      target: { value: 'q' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create Group' }))

    await waitFor(() =>
      expect(mockedCreateMacroGroup).toHaveBeenCalledWith(
        'Copy Draft Group',
        '',
        'Initial version',
        [
          {
            triggerKey: 'q',
            macroType: 'CHAR_INSERT',
            payloadJson: { char: '1' },
          },
        ],
      ),
    )

    expect(screen.getByText('Create Macro Group')).toBeInTheDocument()
    expect(screen.queryByText('Edit Macro Group')).not.toBeInTheDocument()
  })

  it('loads draft seed values into create form', async () => {
    render(
      <MacroGroupManager
        ownedMacroGroups={[]}
        refreshMacroGroups={jest.fn().mockResolvedValue(undefined)}
        forcedMode="create"
        draftSeed={{
          token: 1,
          name: 'Imported Group',
          description: 'Imported description',
          entries: [],
        }}
      />,
    )

    expect(screen.getByDisplayValue('Imported Group')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Imported description')).toBeInTheDocument()
  })
})
