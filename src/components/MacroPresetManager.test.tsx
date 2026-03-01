import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import MacroPresetManager from './MacroPresetManager'
import {
  createMacroPreset,
  getMacroPresetVersion,
  getMacroPresetVersions,
} from '../utils/api'

jest.mock('../utils/api', () => ({
  createMacroPreset: jest.fn(),
  enqueueMacroPresetUpdate: jest.fn(),
  getMacroPresetVersion: jest.fn(),
  getMacroPresetVersions: jest.fn(),
}))

const mockedCreateMacroPreset = createMacroPreset as jest.Mock
const mockedGetMacroPresetVersions = getMacroPresetVersions as jest.Mock
const mockedGetMacroPresetVersion = getMacroPresetVersion as jest.Mock

describe('MacroPresetManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates a macro preset from the UI', async () => {
    mockedCreateMacroPreset.mockResolvedValue({
      data: {
        id: 42,
      },
    })

    const refreshMacroPresets = jest.fn().mockResolvedValue(undefined)

    render(
      <MacroPresetManager
        ownedMacroPresets={[]}
        refreshMacroPresets={refreshMacroPresets}
      />,
    )

    fireEvent.change(screen.getByLabelText('Display Name'), {
      target: { value: 'Fast Main' },
    })
    fireEvent.change(screen.getByLabelText('Handle (URL Name)'), {
      target: { value: 'fast-main' },
    })
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Starter macros' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add First Entry' }))
    fireEvent.change(screen.getByLabelText('Trigger'), {
      target: { value: 'q' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create Preset' }))

    await waitFor(() =>
      expect(mockedCreateMacroPreset).toHaveBeenCalledWith(
        'Fast Main',
        'fast-main',
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
    expect(refreshMacroPresets).toHaveBeenCalled()
  })

  it('loads the selected preset latest version', async () => {
    mockedGetMacroPresetVersions.mockResolvedValue({
      data: [{ id: 501, versionNumber: 3, changeNote: 'latest' }],
    })
    mockedGetMacroPresetVersion.mockResolvedValue({
      data: {
        id: 501,
        versionNumber: 3,
        changeNote: 'latest',
        entries: [],
      },
    })

    render(
      <MacroPresetManager
        ownedMacroPresets={[
          {
            id: 7,
            name: 'Main Thread Macro Set',
            handle: 'main-thread-macro-set',
            description: '',
            visibility: 'PUBLIC',
            isDeleted: false,
            createdAt: '2026-03-01T00:00:00.000Z',
            updatedAt: '2026-03-01T00:00:00.000Z',
          },
        ]}
        refreshMacroPresets={jest.fn().mockResolvedValue(undefined)}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.mouseDown(screen.getByLabelText('Your Preset'))
    fireEvent.click(await screen.findByText('Main Thread Macro Set'))

    await waitFor(() =>
      expect(mockedGetMacroPresetVersions).toHaveBeenCalledWith(7),
    )
    await waitFor(() =>
      expect(mockedGetMacroPresetVersion).toHaveBeenCalledWith(7, 3),
    )
  })

  it('keeps create mode when forcedMode is create', async () => {
    mockedCreateMacroPreset.mockResolvedValue({
      data: {
        id: 99,
      },
    })

    render(
      <MacroPresetManager
        ownedMacroPresets={[]}
        refreshMacroPresets={jest.fn().mockResolvedValue(undefined)}
        forcedMode="create"
      />,
    )

    fireEvent.change(screen.getByLabelText('Display Name'), {
      target: { value: 'Copy Draft Preset' },
    })
    fireEvent.change(screen.getByLabelText('Handle (URL Name)'), {
      target: { value: 'copy-draft-preset' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add First Entry' }))
    fireEvent.change(screen.getByLabelText('Trigger'), {
      target: { value: 'q' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create Preset' }))

    await waitFor(() =>
      expect(mockedCreateMacroPreset).toHaveBeenCalledWith(
        'Copy Draft Preset',
        'copy-draft-preset',
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

    expect(screen.getByText('Create Macro Preset')).toBeInTheDocument()
    expect(screen.queryByText('Edit Macro Preset')).not.toBeInTheDocument()
  })

  it('loads draft seed values into create form', async () => {
    render(
      <MacroPresetManager
        ownedMacroPresets={[]}
        refreshMacroPresets={jest.fn().mockResolvedValue(undefined)}
        forcedMode="create"
        draftSeed={{
          token: 1,
          name: 'Imported Preset',
          description: 'Imported description',
          entries: [],
        }}
      />,
    )

    expect(screen.getByDisplayValue('Imported Preset')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Imported description')).toBeInTheDocument()
  })
})
