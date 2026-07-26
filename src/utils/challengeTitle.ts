import { formatClockTime } from './helpers'

// Minimal shape both RankChallenge (template) and ChallengeLog (instance) satisfy —
// title generation never needs progress/completion state, just the qualifying rule.
type TitleSource = {
  type: string
  target: number
  params: Record<string, any> | null
}

export const CHALLENGE_TYPE_NAMES: Record<string, string> = {
  thread_counts: 'Thread Counts',
  split_under_ms: 'Split Speed',
  get_under_ms: 'Get Speed',
  bars_within_ms: 'Bars Speed',
  roll: 'Dice Roll',
  lrwoed_score: 'LRWOED Score',
  number_shuffle_win: 'Number Shuffle',
  accuracy_rate: 'Accuracy Rate',
  counts_in_day: 'Daily Counts',
  count_attempts: 'Count Attempts',
  bingo_win: 'Bingo Win',
  bingo_complete_squares: 'Bingo Squares',
}

export function getPrettyTypeName(type: string): string {
  return (
    CHALLENGE_TYPE_NAMES[type] ??
    type
      .replace(/_/g, ' ')
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  )
}

// One formula per challenge type, extensible for future types — generates a short display
// title purely from the challenge's type/target/params, e.g. "1,000 Counts" or "0:04.500
// Split". This replaces the old admin-authored label/description fields: every challenge's
// name is now derived, so there's nothing to keep in sync and no risk of a stale/missing
// label. Falls back to a generic "Target: N" for any type without a dedicated formula.
const TITLE_FORMULAS: Partial<Record<string, (ch: TitleSource) => string>> = {
  thread_counts: (ch) => `${ch.target.toLocaleString()} Counts`,
  counts_in_day: (ch) => `${ch.target.toLocaleString()} Counts / Day`,
  count_attempts: (ch) => `${ch.target.toLocaleString()} Attempts`,

  get_under_ms: (ch) => `${formatClockTime(ch.params?.maxMs ?? 0)} Get`,

  split_under_ms: (ch) => `${formatClockTime(ch.params?.maxMs ?? 0)} Split`,
  bars_within_ms: (ch) => `${formatClockTime(ch.params?.maxMs ?? 0)} Split`,

  accuracy_rate: (ch) => `${ch.params?.minAccuracyPercent ?? 0}% Accuracy`,

  roll: (ch) => (ch.params?.direction === 'over' ? `Roll ≥ ${ch.params?.threshold ?? 0}` : `Roll ≤ ${ch.params?.threshold ?? 0}`),
  lrwoed_score: (ch) => `Score ≤ ${ch.params?.maxScore ?? 0}`,
  number_shuffle_win: () => 'Number Shuffle Win',
  bingo_win: () => 'Bingo!',
  bingo_complete_squares: (ch) => `${ch.target.toLocaleString()} Squares`,
}

export function getChallengeTitle(ch: TitleSource): string {
  const formula = TITLE_FORMULAS[ch.type]
  if (formula) return formula(ch)
  return `Target: ${ch.target.toLocaleString()}`
}

// Count-style types show "current / target Counts" while their bar animates (e.g. in the
// replay system's bar-fill step) instead of a bare percentage — matches
// ThreadCountsChallengeCard's own progress label. Types without a real "count" progress
// (roll/etc, which are pass/fail rather than an accumulating number) fall back to the
// static title itself, since there's nothing more meaningful to show mid-animation.
const COUNT_STYLE_TYPES = new Set(['thread_counts', 'bingo_complete_squares', 'counts_in_day'])

// count_attempts progresses on every post attempt (valid or not) — its own progress label
// says "Attempts" rather than "Counts" to make clear invalid posts count toward it too.
const ATTEMPTS_STYLE_TYPES = new Set(['count_attempts'])

// Speed/split types accumulate a repeat-count toward target too (e.g. "get under 5s, 3
// times") — same "current/target" progress shape as count-style types, just with the time
// threshold and a Get/Split noun instead of "Counts". Matches SpeedChallengeCard's own label.
const SPEED_STYLE_TYPES = new Set(['split_under_ms', 'get_under_ms', 'bars_within_ms'])

export function getProgressLabel(ch: TitleSource, currentValue: number): string {
  if (COUNT_STYLE_TYPES.has(ch.type)) {
    return `${Math.round(currentValue).toLocaleString()} / ${ch.target.toLocaleString()} Counts`
  }
  if (ATTEMPTS_STYLE_TYPES.has(ch.type)) {
    return `${Math.round(currentValue).toLocaleString()} / ${ch.target.toLocaleString()} Attempts`
  }
  if (SPEED_STYLE_TYPES.has(ch.type)) {
    const verb = ch.type === 'get_under_ms' ? 'Get' : 'Split'
    const noun = ch.target > 1 ? `${verb}s` : verb
    return `${Math.round(currentValue).toLocaleString()}/${ch.target.toLocaleString()} ${formatClockTime(ch.params?.maxMs ?? 0)} ${noun}`
  }
  return getChallengeTitle(ch)
}
