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
  if (!runtime.macroGroupId || !runtime.macroGroupVersionId) return undefined
  return {
    macroGroupId: runtime.macroGroupId,
    macroGroupVersionId: runtime.macroGroupVersionId,
  }
}
