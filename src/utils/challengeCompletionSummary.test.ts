import { getCompletionSummary } from './challengeCompletionSummary'
import { ChallengeLog } from './types'

const makeLog = (overrides: Partial<ChallengeLog> = {}): ChallengeLog => ({
  id: 1,
  counterUuid: 'counter-1',
  challengeId: 'challenge-1',
  seasonId: 1,
  context: 'rank',
  progress: 5,
  target: 1000,
  accuracyWindow: null,
  completedAt: Date.now(),
  ggAwarded: 10,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  type: 'thread_counts',
  params: null,
  threadUuid: 'thread-1',
  ggReward: 10,
  rank: 'bronze',
  sequencePosition: 1,
  sequenceTotal: 1,
  ...overrides,
})

describe('getCompletionSummary', () => {
  it('formats thread_counts as "X Counts"', () => {
    expect(getCompletionSummary(makeLog({ type: 'thread_counts', target: 1000 }))).toEqual({
      main: '1,000 Counts',
    })
  })

  it('formats counts_in_day as "X Counts / Day"', () => {
    expect(getCompletionSummary(makeLog({ type: 'counts_in_day', target: 500 }))).toEqual({
      main: '500 Counts / Day',
    })
  })

  it('formats get_under_ms as "<time> Get"', () => {
    const summary = getCompletionSummary(makeLog({ type: 'get_under_ms', params: { maxMs: 4500 } }))
    expect(summary.main).toMatch(/Get$/)
    expect(summary.main).toContain('4.500')
  })

  it('formats split_under_ms as "<time> Split"', () => {
    const summary = getCompletionSummary(makeLog({ type: 'split_under_ms', params: { maxMs: 4500 } }))
    expect(summary.main).toMatch(/Split$/)
  })

  it('formats bars_within_ms as "<time> Split" too', () => {
    const summary = getCompletionSummary(makeLog({ type: 'bars_within_ms', params: { maxMs: 4500 } }))
    expect(summary.main).toMatch(/Split$/)
  })

  it('formats accuracy_rate as "X% Accuracy" with a sublabel of the effective count', () => {
    // No accuracyWindow data — falls back to the configured minAccuracyPercent, 0 effective counts.
    const summary = getCompletionSummary(
      makeLog({ type: 'accuracy_rate', accuracyWindow: null, params: { windowSize: 20, minAccuracyPercent: 95 } }),
    )
    expect(summary.main).toBe('95% Accuracy')
    expect(summary.sub).toBe('-0 counts-')
  })

  it('falls back to a generic "Target: N" for an unrecognized type', () => {
    expect(getCompletionSummary(makeLog({ type: 'some_future_type', target: 42 }))).toEqual({
      main: 'Target: 42',
    })
  })
})
