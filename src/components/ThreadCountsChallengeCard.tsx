import { useEffect, useState } from 'react'
import { ChallengeCompletionWrapper } from './ChallengeCompletionWrapper'
import { BigProgressBar } from './BigProgressBar'
import { useAnimatedNumber } from '../utils/hooks/useAnimatedNumber'
import { useTheme } from '@mui/material/styles'
import { RankName } from '../utils/types'

const ENTRANCE_BAR_DURATION_MS = 3000

type Props = {
  challengeId: string
  ggReward: number
  progress: number
  target: number
  isComplete: boolean
  completedCount: number
  rank?: RankName
  sequencePosition?: number
  sequenceTotal?: number
  onAnimationDone?: (challengeId: string) => void
  forcePlay?: boolean
  // True only for the first render(s) of a challenge the counter is seeing for the first time
  // with already-nonzero progress (e.g. right after a replay catch-up) — animates the bar
  // filling 0 -> progress once via a bezier tween instead of snapping straight there. Cleared
  // by the caller (via onEntranceAnimationDone) once that one-time animation finishes; every
  // subsequent live tick renders with entranceAnimate false and snaps normally.
  entranceAnimate?: boolean
  onEntranceAnimationDone?: () => void
  // The qualifying threshold shown in the completion animation — see
  // utils/challengeCompletionSummary.ts. Passed straight through to ChallengeCompletionWrapper.
  summary?: { main: string; sub?: string }
  // Passed straight through to ChallengeCompletionWrapper — gates its one-time card-pop mount
  // animation. See that component's Props for the full explanation.
  firstAppearance?: boolean
}

export const ThreadCountsChallengeCard = ({
  challengeId,
  ggReward,
  progress,
  target,
  isComplete,
  completedCount,
  rank,
  sequencePosition,
  sequenceTotal,
  onAnimationDone,
  forcePlay,
  entranceAnimate,
  onEntranceAnimationDone,
  summary,
  firstAppearance,
}: Props) => {
  const theme = useTheme()
  const pct = target > 0 ? Math.min(100, Math.round((progress / target) * 100)) : 0

  // Mount at 0%, flip to the real pct one tick later so BigProgressBar's replayDurationMs
  // transition has something to actually animate (matches the replay 'bar' step's approach).
  const [displayPct, setDisplayPct] = useState(entranceAnimate ? 0 : pct)
  // Mirrors displayPct's 0-then-real-value flip so useAnimatedNumber (below) has a real "from
  // 0" starting point on first render, then animates up to `progress` in step with the bar.
  const [animateTarget, setAnimateTarget] = useState(entranceAnimate ? 0 : progress)
  useEffect(() => {
    if (!entranceAnimate) {
      setDisplayPct(pct)
      setAnimateTarget(progress)
      return
    }
    const raf = requestAnimationFrame(() => {
      setDisplayPct(pct)
      setAnimateTarget(progress)
    })
    return () => cancelAnimationFrame(raf)
    // Only re-run when entranceAnimate itself changes — once true->false, later pct/progress
    // ticks are handled by the else-branch snap above, not this one-time animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entranceAnimate])

  // The label's count animates in step with the bar (same duration) so the number visibly
  // counts up 0 -> progress alongside the fill, instead of sitting at the final value while
  // only the bar visually animates.
  const animatedProgress = useAnimatedNumber(animateTarget, ENTRANCE_BAR_DURATION_MS)
  const progressLabel = `${(entranceAnimate ? animatedProgress : progress).toLocaleString()} / ${target.toLocaleString()} Counts`

  return (
    <ChallengeCompletionWrapper
      challengeId={challengeId}
      ggReward={ggReward}
      completedCount={completedCount}
      isComplete={isComplete}
      rank={rank}
      sequencePosition={sequencePosition}
      sequenceTotal={sequenceTotal}
      onAnimationDone={onAnimationDone}
      forcePlay={forcePlay}
      summary={summary}
      firstAppearance={firstAppearance}
    >
      {(isAnimating) => (
        <BigProgressBar
          pct={entranceAnimate ? displayPct : pct}
          label={progressLabel}
          color={theme.palette.primary.main}
          hidden={isAnimating}
          replayDurationMs={entranceAnimate ? ENTRANCE_BAR_DURATION_MS : undefined}
          onAnimationDone={entranceAnimate ? onEntranceAnimationDone : undefined}
        />
      )}
    </ChallengeCompletionWrapper>
  )
}
