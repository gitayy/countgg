import { RankName } from './types'

// Mirrors countgg-api/src/rank/rank.constants.ts — pseudo-thread UUIDs for minigame rank rows.
export const LRWOED_PSEUDO_THREAD_UUID = '00000000-0000-0000-0000-000000000001'
export const NUMBER_SHUFFLE_PSEUDO_THREAD_UUID = '00000000-0000-0000-0000-000000000002'

export const PSEUDO_THREAD_LABELS: Record<string, string> = {
  [LRWOED_PSEUDO_THREAD_UUID]: 'LRWOED',
  [NUMBER_SHUFFLE_PSEUDO_THREAD_UUID]: 'Number Shuffle',
}

export const CHALLENGE_TYPES = [
  'thread_counts',
  'split_under_ms',
  'get_under_ms',
  'bars_within_ms',
  'roll',
  'lrwoed_score',
  'number_shuffle_win',
  'accuracy_rate',
  'counts_in_day',
  'count_attempts',
]

// split types require a threadUuid — a split/get/bars time is meaningless outside the specific
// thread it was posted in, so these can never be sitewide. lrwoed_score and number_shuffle_win
// use sentinel pseudo-thread UUIDs (see rank.constants.ts) so their GG is isolated from sitewide
// and from each other. thread_counts and counts_in_day are deliberately in neither set — both
// are optionally thread-scoped (threadUuid set = that thread, null = sitewide), same as
// accuracy_rate.
export const SITEWIDE_ONLY_TYPES = new Set<string>()
export const THREAD_REQUIRED_TYPES = new Set([
  'split_under_ms',
  'get_under_ms',
  'bars_within_ms',
  'count_attempts',
  'roll',
  'lrwoed_score',
  'number_shuffle_win',
])

export const RANK_OPTIONS: RankName[] = [
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
