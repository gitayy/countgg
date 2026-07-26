import { RankName } from './types'

// Single source of truth for rank tier colors, used by RankBadge, RankPage, RankUpOverlay,
// and anywhere else a rank needs a color. Previously duplicated (and drifted) across those
// files independently — consolidated here so a color change only needs to happen once.
export const RANK_COLORS: Record<RankName, string> = {
  bronze: '#b06a3a',
  silver: '#c0c0c0',
  gold: '#d4af00',
  platinum: '#b9f2ff',
  emerald: '#5fe0a0',
  diamond: '#3a85c9',
  countmeister: '#dc143c',
  grandcounter: '#ff8c00',
  peak: '#ffb3d9',
}

export const RANK_LABELS: Record<RankName, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
  emerald: 'Emerald',
  diamond: 'Diamond',
  countmeister: 'Countmeister',
  grandcounter: 'Grandcounter',
  peak: 'Peak',
}

// Mirrors countgg-api/src/rank/rank.constants.ts RANK_ORDER — single source of truth for
// tier progression on the frontend (e.g. what comes after the last division of a rank).
export const RANK_ORDER: RankName[] = [
  'bronze',
  'silver',
  'gold',
  'platinum',
  'emerald',
  'diamond',
  'countmeister',
  'grandcounter',
  'peak',
]

export function nextRank(rank: RankName): RankName | null {
  const idx = RANK_ORDER.indexOf(rank)
  if (idx === -1 || idx === RANK_ORDER.length - 1) return null
  return RANK_ORDER[idx + 1]
}

// Mirrors countgg-api/src/rank/rank.constants.ts GG_PER_RANK — total GG required to clear
// all 3 divisions of a rank.
export const RANK_GG: Record<string, number> = {
  bronze: 300,
  silver: 700,
  gold: 1400,
  platinum: 2500,
  emerald: 4000,
  diamond: 6500,
  countmeister: 10000,
  grandcounter: 16000,
  peak: Infinity,
}

export function divFloor(rank: string, div: 1 | 2 | 3) {
  const t = RANK_GG[rank] ?? 300
  return isFinite(t) ? Math.floor((t / 3) * (div - 1)) : 0
}

export function divCeil(rank: string, div: 1 | 2 | 3) {
  const t = RANK_GG[rank] ?? 300
  return isFinite(t) ? Math.floor((t / 3) * div) : Infinity
}

// Total lifetime GG required to have fully cleared every rank before `rank` — e.g. for
// 'gold', this is bronze's + silver's full RANK_GG. Used to convert a rank-relative
// divFloor/divCeil (both 0-based within just that rank) into an absolute "GG since the
// very start" figure, which is what a division ladder showing progress toward EVERY
// division (not just the current one) needs to plot each row against the same scale.
function cumulativeGgBeforeRank(rank: RankName): number {
  const idx = RANK_ORDER.indexOf(rank)
  let sum = 0
  for (let i = 0; i < idx; i++) {
    sum += RANK_GG[RANK_ORDER[i]]
  }
  return sum
}

// Absolute (not rank-relative) total GG needed to reach the START/END of a given
// rank+division — e.g. cumulativeDivFloor('silver', 2) is bronze's full RANK_GG plus
// silver's own divFloor(2). isFinite(divCeil) is false only for peak's terminal division,
// which has no further ceiling.
export function cumulativeDivFloor(rank: RankName, div: 1 | 2 | 3): number {
  return cumulativeGgBeforeRank(rank) + divFloor(rank, div)
}

export function cumulativeDivCeil(rank: RankName, div: 1 | 2 | 3): number {
  const ceil = divCeil(rank, div)
  return isFinite(ceil) ? cumulativeGgBeforeRank(rank) + ceil : Infinity
}
