import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, Divider, MenuItem, Select, Tab, Tabs, TextField, Typography } from '@mui/material'
import { socket as socketSingleton } from '../utils/contexts/SocketContext'
import {
  getRankCounterProfile,
  adminSetThreadRank,
  getRankReplayData,
  markRankCompletionSeen,
  markRankUpSeen,
  markRankEntranceSeen,
  getRankSitewideLeaderboard,
  getRankThreadLeaderboard,
} from '../utils/api'
import {
  Counter,
  ThreadType,
  ChallengeLog,
  ThreadRankRow,
  RankName,
  ChallengeLogWithChainKey,
  RankUpEvent,
  RankUpdatedDelta,
  CounterRankProfileResponse,
  ThreadLeaderboardResponse,
  SitewideLeaderboardResponse,
} from '../utils/types'
import { RANK_ORDER, divFloor, divCeil, RANK_COLORS } from '../utils/rankColors'
import { RankProgressCard } from './RankProgressCard'
import { AccuracyMeter } from './AccuracyMeter'
import { SpeedChallengeCard } from './SpeedChallengeCard'
import { ThreadCountsChallengeCard } from './ThreadCountsChallengeCard'
import { ChallengeCompletionWrapper } from './ChallengeCompletionWrapper'
import { BigProgressBar } from './BigProgressBar'
import { RankUpOverlay } from './RankUpOverlay'
import { RankLeaderboardMini, LeaderboardEntry } from './RankLeaderboardMini'
import { getCompletionSummary } from '../utils/challengeCompletionSummary'
import { getChallengeTitle, getProgressLabel } from '../utils/challengeTitle'
import { encodeWindow, pushBit } from '../utils/accuracyWindow'

const REPLAY_BAR_DURATION_MS = 3000

// Everything the Rank tab needs that ISN'T exclusive to it: rankThreadRow and the callback to
// update it are lifted to ThreadPage because the "Rank" tab's own label/icon badge reads
// rankThreadRow independent of whether this panel is even mounted, and onThreadRankUpdated
// keeps ThreadPage's allThreadRanks (used by the thread-picker sidebar's mini badges) in sync
// with the same rank_updated socket event this panel listens to for its own state.
export type RankTabPanelProps = {
  counter: Counter | null | undefined
  thread: ThreadType | null | undefined
  thread_name: string
  isMounted: React.MutableRefObject<boolean>
  active: boolean
  rankThreadRow: ThreadRankRow | null
  onRankThreadRowChange: (row: ThreadRankRow | null) => void
  onThreadRankUpdated: (byThreadUuid: Record<string, ThreadRankRow>) => void
  // Reports newly-completed logs up to ThreadPage the moment a rank_updated delta contains any,
  // so the unseen-completion badge count can be incremented client-side instead of needing its
  // own always-on rank_updated listener + re-fetch (see ThreadPage.tsx's unseenCounts state).
  onCompletionsAdded: (completions: ChallengeLog[]) => void
  // ThreadPage already fetches getRankCounterProfile eagerly on page mount (to populate the
  // sidebar's per-thread badge data) — exposed here as the raw in-flight promise (not just its
  // eventually-resolved state) so the Rank tab's OWN first-activation fetch (below) can await
  // and reuse it instead of issuing an identical second request the moment the tab is opened.
  // Opening the tab before that mount-time fetch has resolved is completely ordinary (click
  // into a thread, then immediately click Rank), so first activation awaits this rather than
  // racing ahead of it and falling back to a duplicate fetch nearly every time. Consumed exactly
  // once — see the comment on the activation effect below.
  initialRankProfilePromiseRef: React.MutableRefObject<Promise<CounterRankProfileResponse | null> | null>
  // Same pattern as initialRankProfilePromiseRef, for the two leaderboard fetches: ThreadPage
  // fetches both eagerly (sitewide once per page load; thread-scoped once per thread switch) so
  // this panel's own first activation can await and reuse them instead of re-fetching from
  // scratch on every Rank-tab remount (i.e. every tab switch), which is what happened before
  // this existed since RankTabPanel is fully unmounted/remounted by MUI's TabPanel.
  initialSitewideLeaderboardPromiseRef: React.MutableRefObject<Promise<SitewideLeaderboardResponse | null> | null>
  initialThreadLeaderboardPromiseRef: React.MutableRefObject<Promise<ThreadLeaderboardResponse | null> | null>
  sidebarScrollRef: React.RefObject<HTMLDivElement>
  sidebarScrollTopRef: React.MutableRefObject<number>
}

type ChallengeSlot = {
  key: string
  challengeId: string
  // 'progress': showing live progress. 'completing': the same slot, now playing its
  // completion animation in place. Once the animation finishes the slot is simply dropped —
  // completed challenges aren't shown here at all; the separate /rank pages have the history.
  phase: 'progress' | 'completing'
  data: ChallengeLog
  // True only for the render(s) immediately after this slot was first created, if it already
  // had partial progress at that point (e.g. an in-progress challenge the user is seeing for
  // the first time after a replay catch-up, or on initial tab load). Lets the card animate its
  // bar filling 0 -> current progress once, instead of snapping straight to it. Cleared by
  // markEntranceAnimated once that one-time animation finishes; never set again for this slot.
  entering: boolean
  // Set once, at slot-creation time, from isFirstAppearance(data) — whether this specific
  // challenge has never been rendered anywhere before (regardless of progress). Gates the
  // card's one-time "pop in" mount animation. Deliberately immutable for the slot's lifetime
  // (unlike `entering`): a CSS mount animation only ever plays once per actual DOM mount
  // anyway, so there's no "animation finished" callback needed to clear it — it just needs to
  // be accurate at the moment this slot (and its card) is first created.
  firstAppearance: boolean
}

// Whether this is the very first time this specific challenge has ever been rendered anywhere
// (any card type, any progress level) — gates the card's one-time "pop in" mount animation
// (see ChallengeCompletionWrapper's cardEnter). Server-authoritative (entranceSeenAt) rather
// than a purely client-side flag, since MUI's TabPanel unmounts the whole Rank tab every time
// it's switched away from — a client-only "have I shown this" flag would be wiped and the pop
// would replay on every reopen, which is exactly the bug this fixes.
function isFirstAppearance(log: ChallengeLog): boolean {
  return log.entranceSeenAt == null
}

// Merges a rank_updated delta's touched logs into an existing progress/completions array by id
// — replace-if-present, append-if-new — instead of the caller re-fetching the whole array.
// `wantCompleted` selects which half of the delta this particular array cares about: a log that
// just transitioned progress -> completed (or, via a repeat-assignment, completed -> a fresh
// progress instance) needs to be REMOVED from the array it's no longer in, not just left there
// stale, hence the filter-out-then-conditionally-append shape rather than a plain upsert.
function mergeDelta(existing: ChallengeLog[], deltaLogs: ChallengeLog[], wantCompleted: boolean): ChallengeLog[] {
  const deltaIds = new Set(deltaLogs.map((l) => l.id))
  const kept = existing.filter((l) => !deltaIds.has(l.id))
  const toAdd = deltaLogs.filter((l) => (l.completedAt != null) === wantCompleted)
  return [...kept, ...toAdd]
}

// One independent slot-machine instance per challenge scope (thread-scoped vs sitewide) — each
// scope needs its own animation/queue state so a sitewide completion animating doesn't block a
// thread challenge's new arrival, and vice versa. See RankTabPanel.test.tsx for the regression
// scenarios this state machine protects against (rewritten multiple times before landing here).
function useChallengeSlots(progress: ChallengeLog[], completions: ChallengeLog[], onEntering: (log: ChallengeLog) => void) {
  const [slots, setSlots] = useState<ChallengeSlot[]>([])
  const slotsRef = useRef<ChallengeSlot[]>([])
  slotsRef.current = slots
  const pendingNewChallengeIdsRef = useRef<string[]>([])
  const seenCompletedLogIdsRef = useRef<Set<number>>(new Set())
  // finishAnimation is invoked from a callback captured by the PARENT's `content` useMemo,
  // whose deps don't include `progress` — so a `rank_updated` fetch that lands a freshly
  // chain-assigned next challenge into `progress` can arrive without `content` re-rendering
  // (and re-closing-over a fresh `finishAnimation`) before the just-finished completion's
  // animation calls it. finishAnimation used to close over the `progress` PARAMETER directly,
  // so it could read a stale, pre-fetch value and silently drop the queued next challenge
  // (`if (!data) return withoutFinished` below) — the user then had to wait for a completely
  // unrelated later rank_updated (e.g. their next count) to notice it existed. Reading through
  // a ref instead always sees the latest progress regardless of which render's closure fired.
  const progressRef = useRef(progress)
  progressRef.current = progress

  useEffect(() => {
    const currentSlots = slotsRef.current
    const anyAnimating = currentSlots.some((s) => s.phase === 'completing')
    let next = currentSlots

    // 1. New completions: find the existing progress-slot for this challengeId and flip it
    // in place to 'completing' — never remove it and push a new one elsewhere. If somehow no
    // slot exists yet (e.g. missed the in-between progress state), insert at the end.
    for (const log of completions) {
      if (seenCompletedLogIdsRef.current.has(log.id)) continue
      seenCompletedLogIdsRef.current.add(log.id)
      const idx = next.findIndex((s) => s.challengeId === log.challengeId)
      if (idx >= 0) {
        const updated = [...next]
        updated[idx] = { ...updated[idx], phase: 'completing', data: log }
        next = updated
      } else {
        if (isFirstAppearance(log)) onEntering(log)
        next = [
          ...next,
          {
            key: `slot-${log.id}`,
            challengeId: log.challengeId,
            phase: 'completing',
            data: log,
            entering: false,
            firstAppearance: isFirstAppearance(log),
          },
        ]
      }
    }

    // 2. New in-progress challenges: append immediately if nothing is animating right now;
    // otherwise queue them to be appended once everything finishes (finishAnimation below).
    // If a freshly-created slot already has partial progress (the counter is seeing this
    // challenge for the first time, e.g. right after a replay catch-up or on initial tab load,
    // and it wasn't started from scratch), mark it "entering" so its card animates the bar
    // filling 0 -> current progress once instead of snapping straight there.
    for (const inProgress of progress) {
      const hasSlot = next.some((s) => s.challengeId === inProgress.challengeId)
      const alreadyQueued = pendingNewChallengeIdsRef.current.includes(inProgress.challengeId)
      if (hasSlot || alreadyQueued) continue
      if (anyAnimating || next.some((s) => s.phase === 'completing')) {
        pendingNewChallengeIdsRef.current.push(inProgress.challengeId)
      } else {
        const firstAppearance = isFirstAppearance(inProgress)
        const entering = firstAppearance && inProgress.progress > 0
        if (firstAppearance) onEntering(inProgress)
        next = [
          ...next,
          {
            key: inProgress.challengeId,
            challengeId: inProgress.challengeId,
            phase: 'progress',
            data: inProgress,
            entering,
            firstAppearance,
          },
        ]
      }
    }

    // 3. Keep existing progress slots' data fresh (progress ticking up) without moving them.
    next = next.map((s) => {
      if (s.phase !== 'progress') return s
      const fresh = progress.find((l) => l.challengeId === s.challengeId)
      return fresh ? { ...s, data: fresh } : s
    })

    if (next !== currentSlots) setSlots(next)
  }, [progress, completions])

  // Called once a slot's completion animation finishes: drops that slot entirely (completed
  // challenges aren't shown in this tab), then flushes exactly one queued challenge (if any)
  // in — never more than one per completion, so arrivals stay staggered.
  //
  // Peeks (not shifts) the next queued id and looks it up via progressRef (see above, not the
  // stale `progress` closure) — if it's not in `progress` YET (e.g. its own rank_updated fetch
  // hasn't landed at this exact instant), leave it in the queue rather than discarding it. The
  // main reconciliation effect's "already queued" check (step 2 above) will then pick it up and
  // flush it in on its own the moment `progress` actually contains it — previously this used
  // `.shift()` unconditionally, permanently losing a challenge that hadn't arrived yet, which is
  // exactly the "have to submit another count attempt to see it" bug.
  const finishAnimation = (key: string) => {
    setSlots((prev) => {
      const withoutFinished = prev.filter((s) => s.key !== key)
      const stillAnimating = withoutFinished.some((s) => s.phase === 'completing')
      if (stillAnimating || pendingNewChallengeIdsRef.current.length === 0) {
        return withoutFinished
      }
      const nextChallengeId = pendingNewChallengeIdsRef.current[0]
      const data = progressRef.current.find((l) => l.challengeId === nextChallengeId)
      if (!data) return withoutFinished
      pendingNewChallengeIdsRef.current.shift()
      const firstAppearance = isFirstAppearance(data)
      const entering = firstAppearance && data.progress > 0
      if (firstAppearance) onEntering(data)
      return [
        ...withoutFinished,
        {
          key: nextChallengeId,
          challengeId: nextChallengeId,
          phase: 'progress',
          data,
          entering,
          firstAppearance,
        },
      ]
    })
  }

  // Called once a slot's one-time entrance bar-fill animation finishes — clears the flag so
  // subsequent live progress ticks snap normally, same as before this existed.
  const markEntranceAnimated = (key: string) => {
    setSlots((prev) => prev.map((s) => (s.key === key ? { ...s, entering: false } : s)))
  }

  const reset = () => {
    setSlots([])
    pendingNewChallengeIdsRef.current = []
    seenCompletedLogIdsRef.current = new Set()
  }

  // Seed "already seen" so completions from an initial fetch are treated as pre-existing
  // history, not fresh arrivals to animate — used right before setSlots(initial progress).
  const seedSeenCompletions = (completionIds: number[]) => {
    seenCompletedLogIdsRef.current = new Set(completionIds)
  }

  return { slots, setSlots, finishAnimation, markEntranceAnimated, reset, seedSeenCompletions }
}

// One step in a replay sequence. 'bar': animate a challenge's progress bar from its previous
// checkpoint up to this completion's target (bezier, ~3s). 'completion': play that same
// challenge's completion splash. 'rankup': show the full rank-up overlay, blocked on a click.
// Always exactly one 'bar' followed by its paired 'completion' per unseen ChallengeLog.
type ReplayStep =
  | { kind: 'bar'; log: ChallengeLogWithChainKey; fromProgress: number }
  | { kind: 'completion'; log: ChallengeLogWithChainKey }
  | { kind: 'rankup'; event: RankUpEvent }

// Every rank-up shares this one lane — only one RankUpOverlay is ever shown at a time (it's a
// dedicated "achievement" moment worth undivided attention, and there's only one on-screen slot
// for it), so rank-ups still replay strictly one at a time, oldest first. Completions are laned
// by chainKey instead: different chains (different challenge types, or the same type in a
// different thread/validation-type grouping) can play their bar-fill/splash concurrently, since
// they render as entirely separate cards — nothing about a bar-fill+splash for one challenge
// type depends on another type's animation finishing. A single chain's own steps still can't
// race each other even without extra bookkeeping: a chain's step 2 doesn't exist as an unseen
// completion until step 1's completion is marked seen and the backend assigns it, so same-chain
// steps naturally arrive to the client already ordered and one-at-a-time.
const RANKUP_LANE = '__rankup__'

function laneKeyFor(step: ReplayStep): string {
  return step.kind === 'rankup' ? RANKUP_LANE : step.log.chainKey
}

// Builds one queue PER LANE (chainKey, or the shared rank-up lane) instead of one global queue —
// within a lane, steps stay chronologically ordered (so a chain still plays its steps in the
// right sequence, and rank-ups still play oldest-first), but different lanes are independent of
// each other and drain concurrently.
//
// Every queued 'bar' step is for a challenge the user is seeing for the very first time (that's
// the definition of "unseen") — always animates 0 -> 100%, regardless of chain position. Each
// chain step has its own unrelated `target`, so carrying over a prior step's target as the
// "from" checkpoint (the old behavior) produced nonsense percentages — e.g. step 1's target of
// 5 read as 100% of step 2's target of 5, so step 2 popped in already complete with no visible
// animation. There is no such thing as a partially-through-a-chain-step "from" checkpoint for a
// completed challenge — it's always 0 -> its own target.
function buildReplayLanes(completions: ChallengeLogWithChainKey[], rankUps: RankUpEvent[]): Record<string, ReplayStep[]> {
  const completionSteps = completions.map((log) => ({
    at: log.completedAt ?? 0,
    step: { kind: 'bar' as const, log, fromProgress: 0 },
  }))

  const rankUpSteps = rankUps.map((event) => ({ at: event.createdAt, step: { kind: 'rankup', event } as ReplayStep }))

  const lanes: Record<string, ReplayStep[]> = {}
  for (const entry of [...completionSteps, ...rankUpSteps].sort((a, b) => a.at - b.at)) {
    const key = laneKeyFor(entry.step)
    ;(lanes[key] ??= []).push(entry.step)
  }
  return lanes
}

// Drives the "replay" system for one scope (thread-scoped or sitewide, each gets its own
// independent instance — a still-playing sitewide rank-up must not block a thread challenge's
// replay, and vice versa). Plays every unseen completion/rank-up, marking each "seen" server-side
// only once its animation has ACTUALLY finished (bar fill done, splash done, or the rank-up
// overlay clicked) — never before. If interrupted (unmount, navigate away), nothing in flight was
// marked seen, so the next load's getRankReplayData naturally re-includes it and replays that
// same step again, no special resume logic needed. Different lanes (see laneKeyFor) play
// concurrently; within a lane, steps still play strictly one at a time in order.
function useRankReplay(username: string | undefined, isMounted: React.MutableRefObject<boolean>) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'done'>('idle')
  const [lanes, setLanes] = useState<Record<string, ReplayStep[]>>({})
  const [current, setCurrent] = useState<Record<string, ReplayStep>>({})
  // Set true only when start() actually had something queued to play — lets callers tell "done
  // because the backlog was genuinely empty" apart from "done because it just finished playing
  // real steps" (see skipNextThreadReplayFetchRef/skipNextSitewideReplayFetchRef below, which
  // must only skip their post-replay fetch in the former case: a just-played rank-up/completion
  // can itself change the assigned-challenge list server-side, so skipping that fetch would
  // leave stale challenges on screen exactly when a refetch matters most).
  const playedAnythingRef = useRef(false)

  const start = (completions: ChallengeLogWithChainKey[], rankUps: RankUpEvent[]) => {
    const built = buildReplayLanes(completions, rankUps)
    if (Object.keys(built).length === 0) {
      playedAnythingRef.current = false
      setStatus('done')
      return
    }
    playedAnythingRef.current = true
    setLanes(built)
    setStatus('playing')
  }

  // Feeds newly-arrived rank-up events (from a LIVE rank_updated socket delta, not the
  // mount-time getRankReplayData backlog) into this same queue — the one and only path that
  // ever shows a rank-up overlay or calls markRankUpSeen. Appended onto the RANKUP_LANE's
  // existing queue (or started fresh if the lane's empty/absent) rather than replacing it, so a
  // rank-up that arrives while an earlier one is still mid-animation queues up behind it instead
  // of clobbering it. If the replay was 'done'/'idle', this also (re)starts it playing.
  const enqueueRankUps = (rankUps: RankUpEvent[]) => {
    if (rankUps.length === 0) return
    playedAnythingRef.current = true
    setLanes((prev) => {
      const existing = prev[RANKUP_LANE] ?? []
      const steps: ReplayStep[] = rankUps.map((event) => ({ kind: 'rankup' as const, event }))
      return { ...prev, [RANKUP_LANE]: [...existing, ...steps] }
    })
    setStatus((prev) => (prev === 'playing' ? prev : 'playing'))
  }

  // For every lane that has nothing currently playing, pop its next queued step (if any).
  // Runs whenever lanes/current change, so newly-vacated lanes (a step just finished) and
  // freshly-started lanes both get picked up in the same pass.
  useEffect(() => {
    if (status !== 'playing') return
    const laneKeys = Array.from(new Set([...Object.keys(lanes), ...Object.keys(current)]))
    if (laneKeys.length === 0) {
      setStatus('done')
      return
    }
    const nextLanes = { ...lanes }
    const nextCurrent = { ...current }
    let changed = false
    for (const key of laneKeys) {
      if (nextCurrent[key] != null) continue
      const queue = nextLanes[key]
      if (!queue || queue.length === 0) {
        delete nextLanes[key]
        continue
      }
      const [next, ...rest] = queue
      nextCurrent[key] = next
      if (rest.length > 0) nextLanes[key] = rest
      else delete nextLanes[key]
      changed = true
    }
    if (changed) {
      setLanes(nextLanes)
      setCurrent(nextCurrent)
    } else if (Object.keys(nextCurrent).length === 0 && Object.keys(nextLanes).length === 0) {
      setStatus('done')
    }
  }, [status, lanes, current])

  // Called once a lane's 'bar' step fill animation genuinely finishes — advances that lane
  // straight to the paired 'completion' step (the bar alone isn't a "seen" boundary, only a
  // full completion is). laneKey identifies which concurrently-playing step finished.
  const onBarDone = (laneKey: string) => {
    setCurrent((prev) => {
      const step = prev[laneKey]
      if (!step || step.kind !== 'bar') return prev
      return { ...prev, [laneKey]: { kind: 'completion', log: step.log } }
    })
  }

  const onCompletionDone = (laneKey: string, log: ChallengeLogWithChainKey) => {
    if (username) {
      markRankCompletionSeen(username, log.id).catch(console.error)
    }
    if (isMounted.current) {
      setCurrent((prev) => {
        const { [laneKey]: _removed, ...rest } = prev
        return rest
      })
    }
  }

  const onRankUpDone = (event: RankUpEvent) => {
    if (username) {
      markRankUpSeen(username, event.id).catch(console.error)
    }
    if (isMounted.current) {
      setCurrent((prev) => {
        const { [RANKUP_LANE]: _removed, ...rest } = prev
        return rest
      })
    }
  }

  const reset = () => {
    setStatus('idle')
    setLanes({})
    setCurrent({})
  }

  return { status, current, start, enqueueRankUps, onBarDone, onCompletionDone, onRankUpDone, reset, playedAnythingRef }
}

// A minimal standalone card for a replay 'bar' step: mounts showing startPct, then flips to
// 100% one tick later so BigProgressBar's replayDurationMs transition actually animates the
// fill (a single render at 100% with no prior state wouldn't have anything to transition
// from). Calls onDone once BigProgressBar's own timer confirms the fill finished. The visible
// label animates using the same "current / target Counts" formatting as a live challenge card
// (via getProgressLabel), not a bare percentage — pct is purely the bar-fill mechanism.
function ReplayBarStep({ startPct, log, onDone }: { startPct: number; log: ChallengeLogWithChainKey; onDone: () => void }) {
  const [pct, setPct] = useState(startPct)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setPct(100))
    return () => cancelAnimationFrame(raf)
  }, [])
  const currentValue = (pct / 100) * log.target
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        {getChallengeTitle(log)}
      </Typography>
      <BigProgressBar
        pct={pct}
        label={getProgressLabel(log, currentValue)}
        color={RANK_COLORS.bronze}
        replayDurationMs={REPLAY_BAR_DURATION_MS}
        onAnimationDone={onDone}
      />
    </Box>
  )
}

// Renders one challenge card from a ChallengeLog — shared by thread-scoped and sitewide
// sections. Completed challenges are never rendered as history here; isComplete/isAnimating
// only ever describe a slot that's actively mid-animation.
function renderChallengeCard(
  key: string,
  ch: ChallengeLog,
  isComplete: boolean,
  isAnimating: boolean,
  onAnimationDone: () => void,
  forcePlayOverride: boolean,
  entranceAnimate?: boolean,
  onEntranceAnimationDone?: () => void,
  firstAppearance?: boolean,
) {
  const isAccuracy = ch.type === 'accuracy_rate'
  const isSpeed = ch.type === 'split_under_ms' || ch.type === 'get_under_ms' || ch.type === 'bars_within_ms'
  const windowSize = ch.params?.windowSize ?? ch.target
  const minAccuracyPct = ch.params?.minAccuracyPercent ?? 100
  // ch.ggReward is this specific assignment's reward, fixed at assignment time (a repeated
  // chain-terminal assignment may be worth less than the template's base reward — see
  // RankAssignmentService.assignNextInChain). ggAwarded mirrors it once complete; fall back
  // to ggReward either way so a stale/missing ggAwarded can never render a blank "+ GG".
  const displayGgReward = isComplete ? Math.round(ch.ggAwarded || ch.ggReward) : ch.ggReward
  const forcePlay = forcePlayOverride || isAnimating
  // Only computed/shown for a genuine completion animation, never for a still-in-progress card.
  const summary = isComplete || forcePlay ? getCompletionSummary(ch) : undefined

  if (isSpeed && ch.params?.maxMs != null) {
    return (
      <ChallengeCompletionWrapper
        key={key}
        challengeId={key}
        ggReward={displayGgReward}
        completedCount={isComplete ? 1 : 0}
        isComplete={isComplete}
        rank={ch.rank}
        sequencePosition={ch.sequencePosition}
        sequenceTotal={ch.sequenceTotal}
        onAnimationDone={onAnimationDone}
        forcePlay={forcePlay}
        summary={summary}
        firstAppearance={firstAppearance}
      >
        {(isAnimating) => (
          <SpeedChallengeCard
            type={ch.type as 'split_under_ms' | 'get_under_ms' | 'bars_within_ms'}
            maxMs={ch.params!.maxMs}
            target={ch.target}
            progress={ch.progress}
            hidden={isAnimating}
            entranceAnimate={entranceAnimate}
            onEntranceAnimationDone={onEntranceAnimationDone}
          />
        )}
      </ChallengeCompletionWrapper>
    )
  }

  if (isAccuracy) {
    return (
      <ChallengeCompletionWrapper
        key={key}
        challengeId={key}
        ggReward={displayGgReward}
        completedCount={isComplete ? 1 : 0}
        isComplete={isComplete}
        rank={ch.rank}
        sequencePosition={ch.sequencePosition}
        sequenceTotal={ch.sequenceTotal}
        onAnimationDone={onAnimationDone}
        forcePlay={forcePlay}
        summary={summary}
        firstAppearance={firstAppearance}
      >
        {() => <AccuracyMeter window={ch.accuracyWindow} windowSize={windowSize} minAccuracyPercent={minAccuracyPct} />}
      </ChallengeCompletionWrapper>
    )
  }

  return (
    <ThreadCountsChallengeCard
      key={key}
      challengeId={key}
      ggReward={displayGgReward}
      progress={ch.progress}
      target={ch.target}
      isComplete={isComplete}
      completedCount={isComplete ? 1 : 0}
      rank={ch.rank}
      sequencePosition={ch.sequencePosition}
      sequenceTotal={ch.sequenceTotal}
      forcePlay={forcePlay}
      onAnimationDone={onAnimationDone}
      entranceAnimate={entranceAnimate}
      onEntranceAnimationDone={onEntranceAnimationDone}
      summary={summary}
      firstAppearance={firstAppearance}
    />
  )
}

// Extracted from ThreadPage.tsx (was `rankTabContentMemo` + surrounding state/effects) so the
// rank/challenge feature — rewritten multiple times before landing on the current explicit
// `slots` state machine — can be tested and changed in isolation instead of inside a 4000+
// line file. See RankTabPanel.test.tsx for the regression scenarios this protects against.
export const RankTabPanel = ({
  counter,
  thread,
  thread_name,
  isMounted,
  active,
  rankThreadRow,
  onRankThreadRowChange,
  onThreadRankUpdated,
  onCompletionsAdded,
  initialRankProfilePromiseRef,
  initialSitewideLeaderboardPromiseRef,
  initialThreadLeaderboardPromiseRef,
  sidebarScrollRef,
  sidebarScrollTopRef,
}: RankTabPanelProps) => {
  const [rankProgress, setRankProgress] = useState<ChallengeLog[]>([])
  const [rankCompletions, setRankCompletions] = useState<ChallengeLog[]>([])
  const [sitewideProgress, setSitewideProgress] = useState<ChallengeLog[]>([])
  const [sitewideCompletions, setSitewideCompletions] = useState<ChallengeLog[]>([])
  const [sitewideRankRow, setSitewideRankRow] = useState<ThreadRankRow | null>(null)
  // Which scope the Ranks section is currently showing — thread is the default since it's the
  // one relevant to the page the user is actually on; sitewide is a secondary tab, not shown
  // by default.
  const [rankScopeTab, setRankScopeTab] = useState<'thread' | 'sitewide'>('thread')
  const [sitewideLeaderboard, setSitewideLeaderboard] = useState<LeaderboardEntry[]>([])
  const [threadLeaderboard, setThreadLeaderboard] = useState<LeaderboardEntry[]>([])
  const [rankTabLoaded, setRankTabLoaded] = useState(false)
  const rankTabLoadedRef = useRef(false)
  // Set when initialRankProfilePromiseRef is consumed (nulled and awaited) instead of a real
  // instead of a real fetch — the two "replay just finished, jump to live state" effects below
  // otherwise always call fetchRankData themselves the moment each scope's (typically instant,
  // nothing-to-replay) backlog finishes, which would immediately re-fetch the exact data
  // initialRankProfile just supplied. Each of those effects clears its own scope's flag after
  // skipping once, so a LATER genuine replay-done event (a real backlog draining sometime after
  // the initial mount) still triggers its normal live-jump fetch.
  const skipNextThreadReplayFetchRef = useRef(false)
  const skipNextSitewideReplayFetchRef = useRef(false)
  // A burst of rank_updated events (e.g. rapid-fire invalid count attempts, each evaluated —
  // and each firing its own event — independently on the backend) can fire this panel's
  // getRankCounterProfile fetch multiple times in quick succession with no guarantee the
  // responses resolve in the same order the requests were sent. Without a guard, an EARLIER
  // request's response landing AFTER a later one overwrites fresh state with stale data —
  // in the worst case, a response from before a challenge was even assigned, making
  // everything appear to vanish. Only ever apply the response belonging to the most recently
  // issued request.
  const rankUpdatedRequestSeqRef = useRef(0)
  const [testAnimateChallengeId, setTestAnimateChallengeId] = useState<string | null>(null)
  // Pure client-side admin QA preview (no backend RankUpEvent, no markRankUpSeen) — see the
  // "Test rank up" button below. Only ever shown when there's no REAL rank-up currently playing
  // from the replay queue (threadReplay.current[RANKUP_LANE]), which is the one and only path
  // for actual promotions — see enqueueRankUps/getRankReplayData.
  const [testRankUpPreview, setTestRankUpPreview] = useState<{ rank: RankName; division: 1 | 2 | 3 } | null>(null)
  const hasSyncedCompletionsRef = useRef(false)
  // Frontend-only test controls (admin): lets GG count-up/bar-fill be previewed with an
  // arbitrary amount, and the rank-up overlay be previewed for any chosen rank, without
  // touching real backend data.
  const [testGgDelta, setTestGgDelta] = useState(0)
  const [testGgAmountInput, setTestGgAmountInput] = useState('50')
  const [testRankUpTarget, setTestRankUpTarget] = useState<RankName>('silver')
  const [testRankUpDivision, setTestRankUpDivision] = useState<1 | 2 | 3>(1)
  // Frontend-only accuracy-meter perf test: renders a real AccuracyMeter fed by a synthetic RLE
  // window generated at an arbitrary rate/size (nothing sent to the backend), so bucket-strip
  // redraw + count-up animation cost can be profiled independent of any real challenge. Every
  // real 'post' event on this thread while active pushes one new random bit (weighted by the
  // same configured rate) onto the fake window, so live-update performance can be watched too.
  const [testAccuracyRateInput, setTestAccuracyRateInput] = useState('85')
  const [testAccuracyWindowSizeInput, setTestAccuracyWindowSizeInput] = useState('20')
  const [testAccuracyWindow, setTestAccuracyWindow] = useState<string | null>(null)
  const testAccuracyRateRef = useRef(85)
  const testAccuracyWindowSizeRef = useRef(20)
  // Real admin action (persisted to the backend, unlike the preview controls above): sets
  // this counter's actual rank/division/gg for the current thread, triggering the same
  // cancel-old/assign-new challenge side effects as an earned promotion when the tier changes.
  const [setRankTarget, setSetRankTarget] = useState<RankName>('bronze')
  const [setRankDivision, setSetRankDivision] = useState<1 | 2 | 3>(1)
  const [setRankGgInput, setSetRankGgInput] = useState('0')
  const [setRankPending, setSetRankPending] = useState(false)

  const threadReplay = useRankReplay(counter?.username, isMounted)
  const sitewideReplay = useRankReplay(counter?.username, isMounted)
  // Every challengeId currently mid-replay (its own 'bar' or 'completion' step is actively
  // showing) for each scope — used to keep the live challenge list and the replay section from
  // ever double-showing the same challenge. getCounterProfile's recentCompletions is NOT
  // filtered by seenAt server-side, so a completion can legitimately appear in both the replay
  // queue AND the live fetch at the same time; without this filter the live reconciliation
  // effect would flip a slot to 'completing' for something the replay lane already owns.
  const threadReplayingIds = useMemo(
    () =>
      new Set(
        Object.values(threadReplay.current)
          .filter((step): step is Extract<ReplayStep, { kind: 'bar' | 'completion' }> => step.kind !== 'rankup')
          .map((step) => step.log.challengeId),
      ),
    [threadReplay.current],
  )
  const sitewideReplayingIds = useMemo(
    () =>
      new Set(
        Object.values(sitewideReplay.current)
          .filter((step): step is Extract<ReplayStep, { kind: 'bar' | 'completion' }> => step.kind !== 'rankup')
          .map((step) => step.log.challengeId),
      ),
    [sitewideReplay.current],
  )
  const threadCompletionsForSlots = useMemo(
    () => rankCompletions.filter((l) => !threadReplayingIds.has(l.challengeId)),
    [rankCompletions, threadReplayingIds],
  )
  const sitewideCompletionsForSlots = useMemo(
    () => sitewideCompletions.filter((l) => !sitewideReplayingIds.has(l.challengeId)),
    [sitewideCompletions, sitewideReplayingIds],
  )
  // Marks entranceSeenAt the MOMENT we decide a slot should play its entrance animation, not
  // once that 3-second animation finishes — the Rank tab is a MUI TabPanel, which unmounts this
  // whole component on every tab switch, and 3 seconds is easily long enough for that to happen
  // mid-animation. Waiting until completion meant an interrupted view never persisted "seen" at
  // all, so the animation replayed every single time the tab was reopened. Firing the request
  // as soon as the decision is made means it's only ever skipped by a genuine failure to persist
  // (network error), not by the ordinary act of looking away before 3 seconds are up.
  const markEntranceSeenImmediately = (log: ChallengeLog) => {
    if (counter?.username) markRankEntranceSeen(counter.username, log.id).catch(console.error)
  }
  const threadSlots = useChallengeSlots(rankProgress, threadCompletionsForSlots, markEntranceSeenImmediately)
  const sitewideSlots = useChallengeSlots(sitewideProgress, sitewideCompletionsForSlots, markEntranceSeenImmediately)

  // Applies one getRankCounterProfile response to state — shared by fetchRankData (a real
  // network call) and the initial-mount path, which can instead reuse the profile ThreadPage
  // already fetched (see initialRankProfile prop) rather than issuing a second identical
  // request the moment the Rank tab is opened. scope narrows which half actually gets applied:
  // 'both' is the original all-at-once behavior (used on initial load / replay-fetch failure
  // fallback); 'thread'/'sitewide' let each scope jump to live state independently, as soon as
  // THAT scope's own replay finishes, instead of waiting on the other scope's replay too (which
  // could otherwise leave a scope's live data stale/stuck while looking at it, just because the
  // OTHER, invisible scope's replay hadn't finished yet).
  const applyRankProfileData = (data: any, threadUuid: string, scope: 'thread' | 'sitewide' | 'both') => {
    if (scope === 'thread' || scope === 'both') {
      const threadProgress = data.challengeProgress.filter((l: ChallengeLog) => l.threadUuid === threadUuid)
      const threadCompletions = data.recentCompletions.filter((l: ChallengeLog) => l.threadUuid === threadUuid)
      // Seed "already seen" with this real fetch's completions so the slot-reconciliation
      // effect treats them as history, not fresh arrivals to animate.
      threadSlots.seedSeenCompletions(threadCompletions.map((l: ChallengeLog) => l.id))
      threadSlots.setSlots(
        threadProgress.map((l: ChallengeLog) => {
          const firstAppearance = isFirstAppearance(l)
          if (firstAppearance) markEntranceSeenImmediately(l)
          return {
            key: l.challengeId,
            challengeId: l.challengeId,
            phase: 'progress' as const,
            data: l,
            entering: firstAppearance && l.progress > 0,
            firstAppearance,
          }
        }),
      )
      setRankProgress(threadProgress)
      setRankCompletions(threadCompletions)
      onRankThreadRowChange(data.ranks.find((r: ThreadRankRow) => r.threadUuid === threadUuid) ?? null)
    }

    if (scope === 'sitewide' || scope === 'both') {
      const sitewideProg = data.challengeProgress.filter((l: ChallengeLog) => l.threadUuid == null)
      const sitewideComp = data.recentCompletions.filter((l: ChallengeLog) => l.threadUuid == null)
      sitewideSlots.seedSeenCompletions(sitewideComp.map((l: ChallengeLog) => l.id))
      sitewideSlots.setSlots(
        sitewideProg.map((l: ChallengeLog) => {
          const firstAppearance = isFirstAppearance(l)
          if (firstAppearance) markEntranceSeenImmediately(l)
          return {
            key: l.challengeId,
            challengeId: l.challengeId,
            phase: 'progress' as const,
            data: l,
            entering: firstAppearance && l.progress > 0,
            firstAppearance,
          }
        }),
      )
      setSitewideProgress(sitewideProg)
      setSitewideCompletions(sitewideComp)
      setSitewideRankRow(data.ranks.find((r: ThreadRankRow) => r.threadUuid == null) ?? null)
    }

    hasSyncedCompletionsRef.current = true
  }

  const fetchRankData = (threadUuid: string, username: string, scope: 'thread' | 'sitewide' | 'both' = 'both') => {
    getRankCounterProfile(username)
      .then(({ data }: any) => {
        if (!isMounted.current) return
        applyRankProfileData(data, threadUuid, scope)
      })
      .catch(console.error)
  }

  // Reset rank state on thread switch; re-fetch if tab already open
  useEffect(() => {
    setRankProgress([])
    setRankCompletions([])
    setSitewideProgress([])
    setSitewideCompletions([])
    onRankThreadRowChange(null)
    setRankTabLoaded(false)
    threadSlots.reset()
    sitewideSlots.reset()
    threadReplay.reset()
    sitewideReplay.reset()
    rankTabLoadedRef.current = false
    hasSyncedCompletionsRef.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread_name])

  // Fetch when the tab is activated for the first time for this thread (mirrors ThreadPage's
  // old handleTabChange 'tab_rank' branch). Live progress/completions are fetched IMMEDIATELY,
  // in parallel with the replay backlog — NOT gated behind the replay finishing. The two are
  // independent: the replay queue plays unseen completions/rank-ups one at a time regardless of
  // what else is happening, while the live list (de-duplicated against whatever the replay is
  // currently showing — see threadReplayingIds/sitewideReplayingIds above) always reflects
  // current state. Previously fetchRankData only ran once a replay finished (or immediately if
  // there was nothing to replay), which meant the live challenge list was both hidden AND
  // completely unpopulated for as long as any replay backlog was draining.
  useEffect(() => {
    if (active && !rankTabLoadedRef.current && thread && counter) {
      setRankTabLoaded(true)
      rankTabLoadedRef.current = true
      // Reuse ThreadPage's own mount-time getRankCounterProfile fetch instead of issuing an
      // identical second request the instant the tab opens — but only once, ever, across the
      // page's lifetime — a later thread switch's
      // first activation needs this specific thread's CURRENT data, not whatever the page
      // happened to have loaded when it first mounted.
      //
      // Opening the Rank tab before that mount-time fetch has actually resolved is completely
      // ordinary (click into a thread, then immediately click Rank) — checking only whether the
      // data has already arrived would fall back to a duplicate fetch nearly every time in
      // practice. Awaiting the in-flight promise instead means this only falls back to
      // fetchRankData when there's genuinely no mount-time fetch to reuse (e.g. it already
      // failed) or a later thread switch correctly wants fresh data instead.
      const thisThreadUuid = thread.uuid
      const thisUsername = counter.username
      // Null out the ref after consuming it so that if RankTabPanel unmounts and remounts
      // (tab switch away then back), a subsequent activation can't re-use the same
      // page-load-time promise, which would apply stale pre-completion data on top of
      // already-applied socket deltas (the original bug: old challenge reappears at 0
      // progress alongside the new chain challenge, GG resets to pre-completion value).
      const initialPromise = initialRankProfilePromiseRef.current
      if (initialPromise) {
        initialRankProfilePromiseRef.current = null
        initialPromise.then((data) => {
          if (!isMounted.current) return
          if (data) {
            skipNextThreadReplayFetchRef.current = true
            skipNextSitewideReplayFetchRef.current = true
            applyRankProfileData(data, thisThreadUuid, 'both')
          } else {
            fetchRankData(thisThreadUuid, thisUsername)
          }
        })
      } else {
        fetchRankData(thisThreadUuid, thisUsername)
      }
      getRankReplayData(counter.username)
        .then(({ data }) => {
          if (!isMounted.current) return
          const threadCompletions = data.unseenCompletions.filter((l) => l.threadUuid === thread.uuid)
          const threadRankUps = data.unseenRankUps.filter((e) => e.threadUuid === thread.uuid)
          const sitewideCompletionsUnseen = data.unseenCompletions.filter((l) => l.threadUuid == null)
          const sitewideRankUpsUnseen = data.unseenRankUps.filter((e) => e.threadUuid == null)
          threadReplay.start(threadCompletions, threadRankUps)
          sitewideReplay.start(sitewideCompletionsUnseen, sitewideRankUpsUnseen)
        })
        .catch((err) => {
          console.error(err)
          // Live data was already fetched above regardless — just make sure no replay is left
          // dangling in a stuck state if the replay-specific fetch itself failed.
          if (isMounted.current) {
            threadReplay.reset()
            sitewideReplay.reset()
          }
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, thread?.uuid, counter?.username])

  // rank_updated deltas only carry what changed during the connection that emitted them — a
  // socket reconnect can mean missed events while disconnected, so a full re-fetch is the one
  // other place (besides initial mount, above) a resync is actually needed. Guarded the same way
  // as the mount effect so this only fires once the tab has actually loaded data at least once.
  useEffect(() => {
    const handleReconnect = () => {
      if (!rankTabLoadedRef.current || !thread || !counter) return
      fetchRankData(thread.uuid, counter.username)
    }
    socketSingleton.on('reconnect', handleReconnect)
    return () => {
      socketSingleton.off('reconnect', handleReconnect)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread?.uuid, counter?.username])

  // Admin-only perf test tool: once a fake accuracy window has been generated (see the "Test
  // accuracy meter" admin control below), every real 'post' event on this thread pushes one more
  // bit onto it reflecting that post's ACTUAL validity (post.isValidCount) — nothing
  // backend-driven, purely so re-render/animation cost of the AccuracyMeter under continuous
  // live updates can be watched the same way a real accuracy_rate challenge would update, but
  // matching what you'd expect to see: post something wrong (isCount but not isValidCount, i.e.
  // stricken) and the new square is red; post correctly and it's green.
  useEffect(() => {
    const handlePost = (data: { post: { isValidCount?: boolean } }) => {
      setTestAccuracyWindow((prev) => {
        if (prev == null) return prev
        return pushBit(prev, !!data.post?.isValidCount, testAccuracyWindowSizeRef.current)
      })
    }
    socketSingleton.on('post', handlePost)
    return () => {
      socketSingleton.off('post', handlePost)
    }
  }, [])

  // Each scope jumps to live current state independently, as soon as ITS OWN replay queue
  // finishes draining (or there was nothing to replay) — this is the "resume live behavior"
  // handoff back to the normal useChallengeSlots-driven rendering. Previously this waited for
  // BOTH scopes' replays to finish before refreshing either one, so a slow/stuck replay on the
  // scope you weren't even looking at could leave the scope you WERE looking at stuck on stale
  // data indefinitely.
  useEffect(() => {
    if (threadReplay.status === 'done' && thread && counter) {
      // Only honor the skip if this "done" was a genuinely empty backlog — if real rank-up/
      // completion steps just played, the initial mount snapshot is now stale (a rank-up can
      // cancel/assign challenges server-side), so this fetch must NOT be skipped even though
      // skipNextThreadReplayFetchRef is still set from mount reuse.
      if (skipNextThreadReplayFetchRef.current && !threadReplay.playedAnythingRef.current) {
        skipNextThreadReplayFetchRef.current = false
      } else {
        skipNextThreadReplayFetchRef.current = false
        fetchRankData(thread.uuid, counter.username, 'thread')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadReplay.status])

  useEffect(() => {
    if (sitewideReplay.status === 'done' && thread && counter) {
      if (skipNextSitewideReplayFetchRef.current && !sitewideReplay.playedAnythingRef.current) {
        skipNextSitewideReplayFetchRef.current = false
      } else {
        skipNextSitewideReplayFetchRef.current = false
        fetchRankData(thread.uuid, counter.username, 'sitewide')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sitewideReplay.status])

  // A live rank-up (socket rank_updated delta carrying rankUpEvents) is fed into the replay
  // queue via enqueueRankUps below, in the rank_updated handler — see that effect. There is no
  // separate detector here anymore: RankProgressCard's pendingRankUp is derived directly from
  // threadReplay.current[RANKUP_LANE]/sitewideReplay.current[RANKUP_LANE] above, so a live
  // rank-up and a pre-existing unseen one from getRankReplayData both resolve through the exact
  // same queue, overlay, and markRankUpSeen call — never two competing overlays for one event.

  // Fetches the sitewide leaderboard the first time the Sitewide rank tab is actually selected —
  // no reason to pull the full ranked member list before the user ever looks at it. Normalizes
  // the sitewide entry shape (totalGg) to the same LeaderboardEntry shape RankLeaderboardMini
  // expects (gg), matching the thread leaderboard's ThreadRankRow (gg) naming.
  //
  // ThreadPage fetches this same endpoint eagerly on page mount and exposes it as an in-flight
  // promise — reused here (awaited, not raced) instead of a duplicate fetch, since RankTabPanel
  // fully remounts on every Rank-tab switch and would otherwise re-fetch the leaderboard from
  // scratch every time. The ref is nulled out after first consumption so a later remount
  // (tab switch away then back) fetches fresh data instead of re-applying the stale promise.
  useEffect(() => {
    if (rankScopeTab !== 'sitewide') return
    const applyEntries = (data: SitewideLeaderboardResponse) => {
      if (!isMounted.current) return
      setSitewideLeaderboard(
        data.entries.map((e) => ({
          counterUuid: e.counterUuid,
          username: e.username,
          name: e.name,
          avatar: e.avatar,
          discordId: e.discordId,
          color: e.color,
          rank: e.rank,
          division: e.division,
          gg: e.totalGg,
          ggTotal: e.totalGg,
        })),
      )
    }
    const initialPromise = initialSitewideLeaderboardPromiseRef.current
    if (initialPromise) {
      initialSitewideLeaderboardPromiseRef.current = null
      initialPromise.then((data) => {
        if (data) applyEntries(data)
        else
          getRankSitewideLeaderboard()
            .then(({ data }) => applyEntries(data))
            .catch(console.error)
      })
    } else {
      getRankSitewideLeaderboard()
        .then(({ data }) => applyEntries(data))
        .catch(console.error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rankScopeTab])

  // Fetches this thread's leaderboard once the thread rank card first has a real row to show —
  // same "don't fetch before there's something to show" reasoning as the sitewide fetch above.
  // ThreadRankRow already uses `gg` (not `totalGg` like the sitewide entry shape), so only the
  // enriched display fields (optional on ThreadRankRow, required on LeaderboardEntry) need a
  // fallback — the leaderboard endpoint always populates them in practice.
  //
  // Same reuse-ThreadPage's-in-flight-promise pattern as the sitewide fetch above, but keyed to
  // thread_name (re-consumed on every thread switch, unlike the once-ever sitewide reuse) since
  // ThreadPage's own thread-leaderboard fetch is itself re-issued per thread_name change.
  useEffect(() => {
    if (!rankThreadRow || !thread_name) return
    const applyEntries = (data: ThreadLeaderboardResponse) => {
      if (!isMounted.current) return
      setThreadLeaderboard(
        data.entries.map((e) => ({
          counterUuid: e.counterUuid,
          username: e.username ?? '',
          name: e.name ?? '',
          avatar: e.avatar ?? '',
          discordId: e.discordId ?? '',
          color: e.color ?? '',
          rank: e.rank,
          division: e.division,
          gg: e.gg,
          ggTotal: e.ggTotal,
        })),
      )
    }
    const initialPromise = initialThreadLeaderboardPromiseRef.current
    if (initialPromise) {
      initialThreadLeaderboardPromiseRef.current = null
      initialPromise.then((data) => {
        if (data) applyEntries(data)
        else
          getRankThreadLeaderboard(thread_name)
            .then(({ data }) => applyEntries(data))
            .catch(console.error)
      })
    } else {
      getRankThreadLeaderboard(thread_name)
        .then(({ data }) => applyEntries(data))
        .catch(console.error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rankThreadRow != null, thread_name])

  // Own rank_updated listener (rather than sharing ThreadPage's giant socket-setup effect) —
  // updates this panel's own state, and reports rank changes up via
  // onThreadRankUpdated/onCompletionsAdded so ThreadPage can keep the thread-picker's mini
  // badges and unseen-completion count live too.
  //
  // The payload now carries the actual touched rows directly (RankUpdatedDelta) — the backend
  // only emits when something genuinely changed, and never emits at all for the common case of
  // an invalid count attempt that doesn't move anything (see challenge.processor.ts). This
  // handler MERGES the delta into existing state rather than re-fetching the whole profile:
  // re-fetching per event was the root cause of a real incident — a burst of rapid invalid
  // attempts fired one HTTP re-fetch per event with no coalescing, blew through the sitewide
  // rate limit (429s), and out-of-order responses overwrote fresh state with stale data,
  // making challenges appear to vanish. A full re-fetch now only ever happens at mount and on
  // socket reconnect (see the reconnect effect below).
  useEffect(() => {
    const handler = (delta: RankUpdatedDelta) => {
      if (!counter?.username) return

      if (delta.threadRank) onThreadRankUpdated({ [delta.threadRank.threadUuid as string]: delta.threadRank })
      if (delta.completions.length > 0) onCompletionsAdded(delta.completions)

      if (!active || !rankTabLoadedRef.current) return
      if (delta.threadUuid !== thread?.uuid) return

      // Live state always updates regardless of replay status — the replay queue (its own
      // independent lanes in useRankReplay) is what "waits its turn" to visually play out;
      // the live challenge list underneath must always reflect current reality, or a
      // newly-assigned chain-progression challenge (or any other live change) sits invisible
      // until some LATER, unrelated rank_updated happens to fire once replay finally
      // finishes draining. De-duplication against whatever the replay is actively showing
      // happens via threadReplayingIds/sitewideReplayingIds (see above), not by withholding
      // the live update entirely.
      const threadDelta = [...delta.progress, ...delta.completions].filter((l) => l.threadUuid === thread?.uuid)
      const sitewideDelta = [...delta.progress, ...delta.completions].filter((l) => l.threadUuid == null)

      if (threadDelta.length > 0) {
        setRankProgress((prev) => mergeDelta(prev, threadDelta, false))
        setRankCompletions((prev) => mergeDelta(prev, threadDelta, true))
      }
      if (delta.threadRank) onRankThreadRowChange(delta.threadRank)

      if (sitewideDelta.length > 0) {
        setSitewideProgress((prev) => mergeDelta(prev, sitewideDelta, false))
        setSitewideCompletions((prev) => mergeDelta(prev, sitewideDelta, true))
      }
      if (delta.sitewideRank) setSitewideRankRow(delta.sitewideRank)

      // A rank-up that happens live (while this tab is already open) arrives here, not through
      // getRankReplayData's mount-time poll — feeding it into the SAME replay queue (rather than
      // a separate "live promotion" overlay) is what guarantees exactly one rank-up overlay ever
      // shows for a given event, and that markRankUpSeen always gets called on dismiss.
      if (delta.rankUpEvents.length > 0) {
        const threadRankUps = delta.rankUpEvents.filter((e) => e.threadUuid === thread?.uuid)
        const sitewideRankUps = delta.rankUpEvents.filter((e) => e.threadUuid == null)
        if (threadRankUps.length > 0) threadReplay.enqueueRankUps(threadRankUps)
        if (sitewideRankUps.length > 0) sitewideReplay.enqueueRankUps(sitewideRankUps)
      }
    }
    socketSingleton.on('rank_updated', handler)
    return () => {
      socketSingleton.off('rank_updated', handler)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counter?.username, thread?.uuid, active])

  const content = useMemo(() => {
    if (!counter) {
      return <Typography color="text.secondary">Log in to see your rank progress.</Typography>
    }
    const testableSlot =
      threadSlots.slots.find((s) => s.phase !== 'completing') ?? sitewideSlots.slots.find((s) => s.phase !== 'completing')
    const handleAdminSetRank = () => {
      if (!thread?.uuid || !counter.username) return
      const parsedGg = Number(setRankGgInput)
      if (!Number.isFinite(parsedGg)) return
      setSetRankPending(true)
      adminSetThreadRank(counter.username, {
        threadUuid: thread.uuid,
        rank: setRankTarget,
        // Peak has no divisions — always send 3 (same "maxed out" value divisionFromGg
        // hard-codes for peak) regardless of what's selected, so a stale selector value from
        // before switching to peak can't slip a meaningless division through.
        division: setRankTarget === 'peak' ? 3 : setRankDivision,
        gg: parsedGg,
      })
        .then(() => fetchRankData(thread.uuid, counter.username))
        .catch(console.error)
        .finally(() => setSetRankPending(false))
    }

    const renderSlotList = (
      slotList: ChallengeSlot[],
      finishAnimation: (key: string) => void,
      markEntranceAnimated: (key: string) => void,
    ) =>
      slotList.map((slot) => {
        const isCompleting = slot.phase === 'completing'
        return renderChallengeCard(
          slot.key,
          slot.data,
          isCompleting,
          isCompleting,
          () => {
            // Only mark seen for a REAL completion (isCompleting) — the test-preview button
            // (testAnimateChallengeId) plays the same splash on a still-in-progress challenge
            // purely for visual preview, and must never touch that log's real seenAt.
            if (isCompleting && counter?.username) {
              markRankCompletionSeen(counter.username, slot.data.id).catch(console.error)
            }
            finishAnimation(slot.key)
            setTestAnimateChallengeId((prev) => (prev === slot.key ? null : prev))
          },
          testAnimateChallengeId === slot.key,
          slot.entering,
          // entranceSeenAt is persisted the moment we DECIDE to animate (see
          // markEntranceSeenImmediately), not here on completion — this only clears the local
          // "still animating" flag so subsequent live progress ticks snap normally.
          () => markEntranceAnimated(slot.key),
          slot.firstAppearance,
        )
      })

    // Renders everything currently playing for one scope's replay — one node per concurrently-
    // active lane (see laneKeyFor/useRankReplay): a 'bar' step shows the still-old challenge
    // card with its progress bar bezier-animating up to the completed log's target;
    // 'completion' plays that same card's completion splash; 'rankup' shows the rank-up
    // overlay, blocked until clicked. Different lanes render as a stacked list here so, e.g., a
    // thread_counts chain and a split_under_ms chain can visibly animate at the same time
    // instead of waiting on each other. Returns [] once a scope has nothing left to replay
    // (status 'idle'/'done'), so normal live rendering takes over seamlessly.
    //
    // 'rankup' steps are deliberately excluded here — they're rendered by RankProgressCard
    // instead (see pendingRankUp below), which grows/shrinks its own card around the overlay
    // rather than stacking a separate full-width box above the challenge list. Both draw from
    // this exact same replay.current[RANKUP_LANE] entry, so there is exactly one rank-up
    // overlay on screen at a time, backed by exactly one queue and one seenAt-marking path
    // (replay.onRankUpDone) — no separate "live promotion" detector racing against it.
    const renderReplay = (replay: typeof threadReplay) => {
      return Object.entries(replay.current).map(([laneKey, step]) => {
        if (step.kind === 'rankup') return null
        if (step.kind === 'bar') {
          const { log, fromProgress } = step
          const pct = log.target > 0 ? Math.min(100, Math.round((fromProgress / log.target) * 100)) : 0
          // Mount at fromProgress (0%), then immediately animate to 100% via replayDurationMs —
          // two renders: first paints the starting point, the pct flip on the next tick is what
          // the bezier transition actually animates.
          return <ReplayBarStep key={`replay-bar-${log.id}`} startPct={pct} log={log} onDone={() => replay.onBarDone(laneKey)} />
        }
        // 'completion'
        return renderChallengeCard(
          `replay-completion-${step.log.id}`,
          step.log,
          true,
          true,
          () => replay.onCompletionDone(laneKey, step.log),
          true,
        )
      })
    }

    const hasThreadRank = rankThreadRow || (rankTabLoaded && (rankProgress.length > 0 || rankCompletions.length > 0))
    const hasAnyRank = hasThreadRank || sitewideRankRow

    const activeReplay = rankScopeTab === 'thread' ? threadReplay : sitewideReplay
    const activeSlots = rankScopeTab === 'thread' ? threadSlots : sitewideSlots
    const activeScopeLabel = rankScopeTab === 'thread' ? thread?.title ?? thread_name : 'sitewide'

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* ── Scope picker: governs BOTH challenges and rank/leaderboard below — picking
             Thread/Sitewide shows only that scope's content everywhere in this tab, no
             merging. Placed at the top since it's the first decision that shapes everything
             else on the page. ── */}
        {hasAnyRank && (
          <Tabs
            value={rankScopeTab}
            onChange={(_e, value) => setRankScopeTab(value)}
            sx={{ minHeight: 0, mb: -1, '& .MuiTab-root': { minHeight: 0, py: 0.5 } }}
          >
            <Tab label="Thread" value="thread" />
            <Tab label="Sitewide" value="sitewide" />
          </Tabs>
        )}

        {/* ── Rank progress card: above Challenges, same scope as the picker above. ── */}
        {hasAnyRank && (
          <Box>
            {rankScopeTab === 'thread'
              ? hasThreadRank &&
                (() => {
                  const { rank, division, gg: realGg } = rankThreadRow ?? { rank: 'bronze' as RankName, division: 1 as const, gg: 0 }
                  const gg = realGg + testGgDelta
                  const floor = divFloor(rank, division)
                  const ceil = divCeil(rank, division)
                  // The replay queue's RANKUP_LANE step is the ONE source of truth for "is there a
                  // rank-up to celebrate right now" — whether it arrived via the mount-time
                  // getRankReplayData backlog or a live rank_updated socket delta (see
                  // enqueueRankUps), both end up here. testRankUpPreview is a pure client-side admin
                  // QA affordance (no backend event, no markRankUpSeen) — only ever shown as a
                  // fallback when there's no real one playing, so it can never mask/collide with
                  // an actual rank-up.
                  const threadRankUpStep = threadReplay.current[RANKUP_LANE]
                  const pendingRankUp =
                    threadRankUpStep?.kind === 'rankup'
                      ? { rank: threadRankUpStep.event.toRank, division: threadRankUpStep.event.toDivision }
                      : testRankUpPreview

                  return (
                    <RankProgressCard
                      rank={rank}
                      division={division}
                      gg={gg}
                      divFloor={floor}
                      divCeil={ceil}
                      threadName={thread?.title ?? thread_name}
                      pendingRankUp={pendingRankUp}
                      onRankUpAnimationDone={() => {
                        if (threadRankUpStep?.kind === 'rankup') {
                          threadReplay.onRankUpDone(threadRankUpStep.event)
                        } else {
                          setTestRankUpPreview(null)
                        }
                      }}
                    />
                  )
                })()
              : sitewideRankRow &&
                (() => {
                  const sitewideRankUpStep = sitewideReplay.current[RANKUP_LANE]
                  const pendingRankUp =
                    sitewideRankUpStep?.kind === 'rankup'
                      ? { rank: sitewideRankUpStep.event.toRank, division: sitewideRankUpStep.event.toDivision }
                      : null
                  return (
                    <RankProgressCard
                      rank={sitewideRankRow.rank}
                      division={sitewideRankRow.division}
                      gg={sitewideRankRow.gg}
                      divFloor={divFloor(sitewideRankRow.rank, sitewideRankRow.division)}
                      divCeil={divCeil(sitewideRankRow.rank, sitewideRankRow.division)}
                      threadName="Sitewide"
                      pendingRankUp={pendingRankUp}
                      onRankUpAnimationDone={() => {
                        if (sitewideRankUpStep?.kind === 'rankup') sitewideReplay.onRankUpDone(sitewideRankUpStep.event)
                      }}
                    />
                  )
                })()}
          </Box>
        )}

        {/* ── Challenges: scoped to whichever tab is selected above. Replay steps (if any are
             currently playing) render FIRST, immediately followed by the live challenge list —
             never one-or-the-other. The live list already excludes whatever the replay is
             actively showing (threadReplayingIds/sitewideReplayingIds), so nothing double-shows;
             everything else (other in-progress challenges, or a brand-new one that arrives
             mid-replay) stays visible and updates live the whole time. ── */}
        {activeReplay.status === 'playing' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>{renderReplay(activeReplay)}</Box>
        )}

        {activeSlots.slots.length > 0 && (
          <Box>
            <Divider sx={{ mb: 1 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {renderSlotList(activeSlots.slots, activeSlots.finishAnimation, activeSlots.markEntranceAnimated)}
            </Box>
          </Box>
        )}

        {activeSlots.slots.length === 0 && activeReplay.status !== 'playing' && rankTabLoaded && (
          <Typography variant="body2" color="text.secondary">
            No challenges assigned for {activeScopeLabel} yet.
          </Typography>
        )}

        {/* ── Rank leaderboard: below Challenges, same scope as the picker above. ── */}
        {hasAnyRank && (
          <Box>
            <Divider sx={{ mb: 1 }} />
            {rankScopeTab === 'thread'
              ? hasThreadRank && <RankLeaderboardMini entries={threadLeaderboard} />
              : sitewideRankRow && <RankLeaderboardMini entries={sitewideLeaderboard} />}
          </Box>
        )}

        {/* ── Admin tools (bottom of tab) ── */}
        {counter?.roles?.includes('admin') && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              Admin tools
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <TextField
                label="Test GG"
                type="number"
                size="small"
                value={testGgAmountInput}
                onChange={(e) => setTestGgAmountInput(e.target.value)}
                sx={{ width: 100 }}
              />
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  const parsed = Number(testGgAmountInput)
                  if (Number.isFinite(parsed)) {
                    setTestGgDelta((prev) => prev + parsed)
                  }
                }}
              >
                Add GG
              </Button>
              {testGgDelta !== 0 && (
                <Button size="small" onClick={() => setTestGgDelta(0)}>
                  Reset GG
                </Button>
              )}
              <Select
                size="small"
                value={testRankUpTarget}
                onChange={(e) => setTestRankUpTarget(e.target.value as RankName)}
                sx={{ minWidth: 140 }}
              >
                {RANK_ORDER.map((r) => (
                  <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>
                    {r}
                  </MenuItem>
                ))}
              </Select>
              <Select
                size="small"
                value={testRankUpDivision}
                onChange={(e) => setTestRankUpDivision(Number(e.target.value) as 1 | 2 | 3)}
                sx={{ minWidth: 90 }}
              >
                <MenuItem value={1}>Div I</MenuItem>
                <MenuItem value={2}>Div II</MenuItem>
                <MenuItem value={3}>Div III</MenuItem>
              </Select>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setTestRankUpPreview({ rank: testRankUpTarget, division: testRankUpDivision })}
              >
                Test rank up
              </Button>
              {testableSlot && (
                <Button
                  size="small"
                  variant="outlined"
                  disabled={testAnimateChallengeId != null}
                  onClick={() => setTestAnimateChallengeId(testableSlot.key)}
                >
                  Test completion animation
                </Button>
              )}
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="caption" color="text.secondary" sx={{ width: '100%' }}>
                  Test accuracy meter (frontend-only, nothing sent to backend — real incoming counts on this thread will keep updating
                  it once generated)
                </Typography>
                <TextField
                  label="Rate %"
                  type="number"
                  size="small"
                  value={testAccuracyRateInput}
                  onChange={(e) => setTestAccuracyRateInput(e.target.value)}
                  sx={{ width: 100 }}
                />
                <TextField
                  label="Window size"
                  type="number"
                  size="small"
                  value={testAccuracyWindowSizeInput}
                  onChange={(e) => setTestAccuracyWindowSizeInput(e.target.value)}
                  sx={{ width: 110 }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    const rate = Math.min(100, Math.max(0, Number(testAccuracyRateInput)))
                    const size = Math.max(1, Math.round(Number(testAccuracyWindowSizeInput)))
                    if (!Number.isFinite(rate) || !Number.isFinite(size)) return
                    testAccuracyRateRef.current = rate
                    testAccuracyWindowSizeRef.current = size
                    const bits = Array.from({ length: size }, () => Math.random() * 100 < rate)
                    setTestAccuracyWindow(encodeWindow(bits))
                  }}
                >
                  Generate
                </Button>
                {testAccuracyWindow != null && (
                  <Button size="small" onClick={() => setTestAccuracyWindow(null)}>
                    Clear
                  </Button>
                )}
              </Box>
              {testAccuracyWindow != null && (
                <Box sx={{ maxWidth: 400 }}>
                  <AccuracyMeter
                    window={testAccuracyWindow}
                    windowSize={testAccuracyWindowSizeRef.current}
                    minAccuracyPercent={testAccuracyRateRef.current}
                  />
                </Box>
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="caption" color="text.secondary" sx={{ width: '100%' }}>
                Set my rank (real, persisted to backend)
              </Typography>
              <Select
                size="small"
                value={setRankTarget}
                onChange={(e) => setSetRankTarget(e.target.value as RankName)}
                sx={{ minWidth: 140 }}
              >
                {RANK_ORDER.map((r) => (
                  <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>
                    {r}
                  </MenuItem>
                ))}
              </Select>
              <Select
                size="small"
                value={setRankTarget === 'peak' ? 3 : setRankDivision}
                disabled={setRankTarget === 'peak'}
                onChange={(e) => setSetRankDivision(Number(e.target.value) as 1 | 2 | 3)}
                sx={{ minWidth: 90 }}
              >
                {setRankTarget === 'peak' ? (
                  <MenuItem value={3}>N/A</MenuItem>
                ) : (
                  [
                    <MenuItem key={1} value={1}>
                      Div I
                    </MenuItem>,
                    <MenuItem key={2} value={2}>
                      Div II
                    </MenuItem>,
                    <MenuItem key={3} value={3}>
                      Div III
                    </MenuItem>,
                  ]
                )}
              </Select>
              <TextField
                label="GG"
                type="number"
                size="small"
                value={setRankGgInput}
                onChange={(e) => setSetRankGgInput(e.target.value)}
                sx={{ width: 100 }}
              />
              <Button size="small" variant="contained" disabled={setRankPending} onClick={handleAdminSetRank}>
                Set rank
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    counter,
    rankThreadRow,
    rankTabLoaded,
    testGgDelta,
    testGgAmountInput,
    testRankUpTarget,
    testRankUpDivision,
    testAccuracyRateInput,
    testAccuracyWindowSizeInput,
    testAccuracyWindow,
    testRankUpPreview,
    thread?.title,
    thread_name,
    rankCompletions,
    threadSlots.slots,
    sitewideSlots.slots,
    sitewideRankRow,
    rankScopeTab,
    sitewideLeaderboard,
    threadLeaderboard,
    testAnimateChallengeId,
    setRankTarget,
    setRankDivision,
    setRankGgInput,
    setRankPending,
    thread?.uuid,
    threadReplay.status,
    threadReplay.current,
    sitewideReplay.status,
    sitewideReplay.current,
  ])

  // While the Rank tab is open and the user is actively counting, rankProgress/
  // rankCompletions/rankThreadRow legitimately update on roughly every count (via the
  // rank_updated socket event) — that's real data, correctly re-rendering `content`. But each
  // update reflows the challenge list's height as items move between the active list and the
  // completed accordion, and the shared scroll container resets its scrollTop to 0 when that
  // happens. Restore the last-known scroll position synchronously (before paint) whenever the
  // content changes, so an in-place update never visibly resets scroll position.
  useLayoutEffect(() => {
    const el = sidebarScrollRef.current
    if (el) el.scrollTop = sidebarScrollTopRef.current
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content])

  return content
}
