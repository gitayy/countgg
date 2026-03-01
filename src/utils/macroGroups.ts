import { MacroGroup } from './types'

export const prioritizeOwnedMacroGroups = (
  groups: MacroGroup[],
  ownedGroupIds: Set<number>,
): MacroGroup[] => {
  const copy = [...groups]
  copy.sort((a, b) => {
    const aOwned = ownedGroupIds.has(a.id) ? 1 : 0
    const bOwned = ownedGroupIds.has(b.id) ? 1 : 0
    if (aOwned !== bOwned) return bOwned - aOwned
    return a.name.localeCompare(b.name)
  })
  return copy
}

