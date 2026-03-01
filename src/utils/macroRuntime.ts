import { ActiveMacroRuntime, MacroEntry } from './types'

export const normalizeMacroTriggerKey = (key: string) => (key || '').toLowerCase()

export const findActiveMacroEntry = (
  runtime: ActiveMacroRuntime | undefined,
  key: string,
  isDesktop: boolean,
  chatsOnly: boolean,
): MacroEntry | undefined => {
  if (!runtime || !runtime.enabled || !isDesktop || chatsOnly || !runtime.entries?.length) {
    return undefined
  }
  const normalized = normalizeMacroTriggerKey(key)
  return runtime.entries.find((entry) => normalizeMacroTriggerKey(entry.triggerKey) === normalized)
}

export const buildMacroSubmitMetadata = (
  runtime: ActiveMacroRuntime | undefined,
  didUseMacro: boolean,
) => {
  if (!runtime || !runtime.enabled || !didUseMacro) return undefined
  if (!runtime.macroPresetId || !runtime.macroPresetVersionId) return undefined
  return {
    macroPresetId: runtime.macroPresetId,
    macroPresetVersionId: runtime.macroPresetVersionId,
  }
}
