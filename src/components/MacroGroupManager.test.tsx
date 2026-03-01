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
        macroGroups={[]}
        refreshMacroGroups={refreshMacroGroups}
      />,
    )

    fireEvent.change(screen.getByLabelText('New Group Name'), {
      target: { value: 'Fast Main' },
    })
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Starter macros' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() =>
      expect(mockedCreateMacroGroup).toHaveBeenCalledWith(
        'Fast Main',
        'Starter macros',
        'Initial version',
        [],
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
        macroGroups={[
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

    fireEvent.mouseDown(screen.getByLabelText('Edit Macro Group'))
    fireEvent.click(await screen.findByRole('option', { name: 'Main Thread Macro Set' }))

    await waitFor(() =>
      expect(mockedGetMacroGroupVersions).toHaveBeenCalledWith(7),
    )
    await waitFor(() =>
      expect(mockedGetMacroGroupVersion).toHaveBeenCalledWith(7, 3),
    )
  })
})

