import { useEffect, useState } from 'react'
import { BigProgressBar } from './BigProgressBar'
import { useAnimatedNumber } from '../utils/hooks/useAnimatedNumber'
import { formatClockTime } from '../utils/helpers'
import { useTheme } from '@mui/material/styles'

const ENTRANCE_BAR_DURATION_MS = 3000

type Props = {
  type: 'split_under_ms' | 'get_under_ms' | 'bars_within_ms'
  maxMs: number
  target: number
  progress: number
  // Mirrors ThreadCountsChallengeCard's entrance-animation contract exactly — see its own
  // comment for the full explanation. Lets a challenge the counter is seeing for the first
  // time with already-nonzero progress fill 0 -> progress once instead of snapping straight
  // there.
  entranceAnimate?: boolean
  onEntranceAnimationDone?: () => void
  hidden?: boolean
}

// Speed/split challenges now use the same tall BigProgressBar every other challenge type uses
// (previously a bespoke two-line-text + thin-bar layout) — one consistent progress visual
// across the whole Rank tab. Label reads "<progress>/<target> <time> <Gets|Splits>" (or
// singular "Get"/"Split" when target is 1 — there's nothing to pluralize for a one-off
// threshold).
export const SpeedChallengeCard = ({ type, maxMs, target, progress, entranceAnimate, onEntranceAnimationDone, hidden }: Props) => {
  const theme = useTheme()
  const pct = target > 0 ? Math.min(100, Math.round((progress / target) * 100)) : 0

  // Mount at 0%, flip to the real pct one tick later so BigProgressBar's replayDurationMs
  // transition has something to actually animate (matches ThreadCountsChallengeCard/the replay
  // 'bar' step's approach).
  const [displayPct, setDisplayPct] = useState(entranceAnimate ? 0 : pct)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entranceAnimate])

  const animatedProgress = useAnimatedNumber(animateTarget, ENTRANCE_BAR_DURATION_MS)
  const displayProgress = entranceAnimate ? animatedProgress : progress

  let progressLabel: string
  if (type === 'bars_within_ms') {
    const barNoun = target === 1 ? 'bar' : 'bars'
    progressLabel = `${displayProgress.toLocaleString()}/${target.toLocaleString()} sub-${formatClockTime(maxMs)} ${barNoun}`
  } else {
    const verb = type === 'get_under_ms' ? 'Get' : 'Split'
    const noun = target > 1 ? `${verb}s` : verb
    progressLabel = `${displayProgress.toLocaleString()}/${target.toLocaleString()} ${formatClockTime(maxMs)} ${noun}`
  }

  return (
    <BigProgressBar
      pct={entranceAnimate ? displayPct : pct}
      label={progressLabel}
      color={theme.palette.primary.main}
      hidden={hidden}
      replayDurationMs={entranceAnimate ? ENTRANCE_BAR_DURATION_MS : undefined}
      onAnimationDone={entranceAnimate ? onEntranceAnimationDone : undefined}
    />
  )
}
