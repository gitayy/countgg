import { MacroPreset } from './types'

export const prioritizeOwnedMacroPresets = (
  groups: MacroPreset[],
  ownedGroupIds: Set<number>,
): MacroPreset[] => {
  const copy = [...groups]
  copy.sort((a, b) => {
    const aOwned = ownedGroupIds.has(a.id) ? 1 : 0
    const bOwned = ownedGroupIds.has(b.id) ? 1 : 0
    if (aOwned !== bOwned) return bOwned - aOwned
    return a.name.localeCompare(b.name)
  })
  return copy
}

