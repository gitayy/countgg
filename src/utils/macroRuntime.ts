import { ActiveMacroRuntime, MacroEntry } from './types'

const MACRO_TRIGGER_KEY_ALIASES: Record<string, string> = {
  win: 'meta',
  windows: 'meta',
  cmd: 'meta',
  command: 'meta',
  os: 'meta',
  ctrl: 'control',
  option: 'alt',
  esc: 'escape',
  return: 'enter',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
}

export const normalizeMacroTriggerKey = (key: string) => {
  const raw = (key || '').toLowerCase()
  if (raw === ' ' || raw === 'spacebar') return 'space'
  const normalized = raw.trim()
  return MACRO_TRIGGER_KEY_ALIASES[normalized] || normalized
}

export const getMacroTriggerCandidates = (key: string, code?: string): string[] => {
  const candidates: string[] = []
  const add = (value: string) => {
    const normalized = normalizeMacroTriggerKey(value)
    if (normalized && !candidates.includes(normalized)) {
      candidates.push(normalized)
    }
  }

  if (code) add(code)
  if (key) add(key)

  const normalizedCode = normalizeMacroTriggerKey(code || '')
  const keyCodeMatch = normalizedCode.match(/^key([a-z])$/)
  if (keyCodeMatch?.[1]) add(keyCodeMatch[1])

  const digitCodeMatch = normalizedCode.match(/^digit([0-9])$/)
  if (digitCodeMatch?.[1]) add(digitCodeMatch[1])

  const numpadCodeMatch = normalizedCode.match(/^numpad([0-9])$/)
  if (numpadCodeMatch?.[1]) add(numpadCodeMatch[1])

  return candidates
}

export const findActiveMacroEntry = (
  runtime: ActiveMacroRuntime | undefined,
  key: string,
  code: string | undefined,
  _isDesktop: boolean,
  chatsOnly: boolean,
): MacroEntry | undefined => {
  if (!runtime || !runtime.enabled || chatsOnly || !runtime.entries?.length) {
    return undefined
  }
  const candidates = getMacroTriggerCandidates(key, code)
  return runtime.entries.find((entry) =>
    candidates.includes(normalizeMacroTriggerKey(entry.triggerKey)),
  )
}

export const buildMacroSubmitMetadata = (
  runtime: ActiveMacroRuntime | undefined,
) => {
  if (!runtime || !runtime.enabled) return undefined
  if (!runtime.macroPresetId || !runtime.macroPresetVersionId) return undefined
  return {
    macroPresetId: runtime.macroPresetId,
    macroPresetVersionId: runtime.macroPresetVersionId,
  }
}
