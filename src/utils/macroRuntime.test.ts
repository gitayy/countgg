import { buildMacroSubmitMetadata, findActiveMacroEntry } from './macroRuntime'
import { ActiveMacroRuntime, MacroEntryType } from './types'

const runtimeWithEntries = (): ActiveMacroRuntime => ({
  source: 'thread',
  enabled: true,
  macroPresetId: 8,
  macroPresetVersionId: 13,
  macroPresetVersionNumber: 2,
  entries: [
    {
      id: 1,
      triggerKey: 'Q',
      macroType: 'CHAR_INSERT' as MacroEntryType,
      payloadJson: { char: '1' },
      createdAt: '',
      updatedAt: '',
    },
  ],
})

describe('macroRuntime helpers', () => {
  it('resolves trigger keys case-insensitively when desktop runtime is active', () => {
    const entry = findActiveMacroEntry(runtimeWithEntries(), 'q', true, false)
    expect(entry?.triggerKey).toBe('Q')
  })

  it('disables macro matching outside desktop mode', () => {
    const entry = findActiveMacroEntry(runtimeWithEntries(), 'q', false, false)
    expect(entry).toBeUndefined()
  })

  it('disables macro matching for chats list', () => {
    const entry = findActiveMacroEntry(runtimeWithEntries(), 'q', true, true)
    expect(entry).toBeUndefined()
  })

  it('builds submit metadata when runtime ids are present', () => {
    const metadata = buildMacroSubmitMetadata(runtimeWithEntries())
    expect(metadata).toEqual({
      macroPresetId: 8,
      macroPresetVersionId: 13,
    })
  })

  it('still builds metadata regardless of submit trigger source', () => {
    const metadata = buildMacroSubmitMetadata(runtimeWithEntries())
    expect(metadata).toEqual({
      macroPresetId: 8,
      macroPresetVersionId: 13,
    })
  })

  it('returns undefined metadata when runtime is disabled', () => {
    const disabledRuntime: ActiveMacroRuntime = {
      ...runtimeWithEntries(),
      enabled: false,
    }
    const metadata = buildMacroSubmitMetadata(disabledRuntime)
    expect(metadata).toBeUndefined()
  })
})
