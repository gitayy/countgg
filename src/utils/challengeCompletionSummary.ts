import { ChallengeLog } from './types'
import { formatClockTime } from './helpers'
import { getAccuracyWindowStats } from './accuracyWindow'

export type CompletionSummary = {
  // Big line shown directly under "Complete!" — the qualifying threshold itself, e.g.
  // "1,000 Counts" or "0:04.500 Split".
  main: string
  // Optional smaller line underneath, for secondary/misc info that doesn't deserve equal
  // visual weight, e.g. "-1,000 counts-" under an accuracy percentage.
  sub?: string
}

// One formula per challenge type, extensible for future types — computes the "what did you
// actually just qualify for" summary shown in the completion animation. Falls back to a
// generic "Target: N" for any type without a dedicated formula, so a forgotten/future type
// still shows something reasonable instead of nothing.
const COMPLETION_SUMMARY_FORMULAS: Partial<Record<string, (ch: ChallengeLog) => CompletionSummary>> = {
  // 1. X Count
  thread_counts: (ch) => ({ main: `${ch.target.toLocaleString()} Counts` }),
  counts_in_day: (ch) => ({ main: `${ch.target.toLocaleString()} Counts / Day` }),

  // 2. <formatted time> Get
  get_under_ms: (ch) => ({ main: `${formatClockTime(ch.params?.maxMs ?? 0)} Get` }),

  // 3. <formatted time> Split
  split_under_ms: (ch) => ({ main: `${formatClockTime(ch.params?.maxMs ?? 0)} Split` }),
  bars_within_ms: (ch) => ({ main: `${formatClockTime(ch.params?.maxMs ?? 0)} Split` }),

  // 4. X% Accuracy (sublabel: y counts)
  accuracy_rate: (ch) => {
    const windowSize = ch.params?.windowSize ?? ch.target
    const stats = getAccuracyWindowStats(ch.accuracyWindow, windowSize)
    const pct = stats.pct ?? ch.params?.minAccuracyPercent ?? 0
    return {
      main: `${pct}% Accuracy`,
      sub: `-${stats.effective.toLocaleString()} counts-`,
    }
  },

  // 5. Xms bar (bar under ms) — bars_within_ms is covered above alongside split_under_ms,
  // both format as "<time> Split" since a bar-validation-type split is still a split.

  // Not explicitly requested, but given a formula so these don't silently fall back to the
  // generic "Target: N" — extend/adjust wording here as these types get real completion UX.
  roll: (ch) => ({
    main: ch.params?.direction === 'over' ? `Roll ≥ ${ch.params?.threshold ?? 0}` : `Roll ≤ ${ch.params?.threshold ?? 0}`,
  }),
  lrwoed_score: (ch) => ({ main: `Score ≤ ${ch.params?.maxScore ?? 0}` }),
  number_shuffle_win: () => ({ main: 'Number Shuffle Win' }),
  bingo_win: () => ({ main: 'Bingo!' }),
  bingo_complete_squares: (ch) => ({ main: `${ch.target.toLocaleString()} Squares` }),
}

export function getCompletionSummary(ch: ChallengeLog): CompletionSummary {
  const formula = COMPLETION_SUMMARY_FORMULAS[ch.type]
  if (formula) return formula(ch)
  // Generic fallback for any type without a dedicated formula above.
  return { main: `Target: ${ch.target.toLocaleString()}` }
}
