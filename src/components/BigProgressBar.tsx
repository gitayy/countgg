import { useEffect, useRef } from 'react'
import { Box, Typography } from '@mui/material'

const COLLAPSE_BEZIER = 'cubic-bezier(0.4, 0, 0.2, 1)'

// Duration scales with how far the bar actually has to move. A fixed 0.6s duration looks
// sluggish for a tiny tick (one count while actively counting fast) and rushed for a big
// jump — this keeps the same easing FEEL (still bezier) but compresses/stretches the time
// window to match the distance traveled, clamped to a sane range.
const MIN_DURATION_MS = 150
const MAX_DURATION_MS = 600
const MS_PER_PCT_POINT = 6

function durationForDelta(deltaPct: number) {
  const ms = Math.abs(deltaPct) * MS_PER_PCT_POINT
  return Math.max(MIN_DURATION_MS, Math.min(MAX_DURATION_MS, ms))
}

type Props = {
  pct: number
  label: string
  color: string
  // Hides the fill/label entirely (used mid-animation, e.g. the challenge completion
  // splash takes over the same footprint instead).
  hidden?: boolean
  // Replay-mode override: a flat, longer bezier tween (instead of the distance-based
  // snap-fast duration used for live counting) so a "catch up on what you missed" progress
  // step is actually watchable. Live mode passes nothing, so today's responsive behavior is
  // unaffected.
  replayDurationMs?: number
  // Fires once the fill transition has visually finished — only meaningful (and only ever
  // called) when replayDurationMs is set, since that's the only case anything needs to know
  // when a bar animation completes (the replay engine's sequencing).
  onAnimationDone?: () => void
}

// Shared tall progress bar used by both challenge cards (thread_counts) and the rank
// division progress card: dark-slate track (not flat gray/black), rank- or theme-colored
// fill, and the label centered inside the bar itself rather than above/below it.
export const BigProgressBar = ({ pct, label, color, hidden, replayDurationMs, onAnimationDone }: Props) => {
  const clampedPct = Math.max(0, Math.min(100, pct))
  const prevPctRef = useRef(clampedPct)
  const durationMsRef = useRef(MIN_DURATION_MS)

  // Distance-based duration is computed once per pct change (not on every render) so it
  // reflects the actual jump size that's about to be animated, not whatever the last
  // render happened to compute. Replay mode overrides this with a flat duration instead.
  if (prevPctRef.current !== clampedPct) {
    durationMsRef.current = replayDurationMs ?? durationForDelta(clampedPct - prevPctRef.current)
  }
  useEffect(() => {
    prevPctRef.current = clampedPct
  }, [clampedPct])

  useEffect(() => {
    if (replayDurationMs == null || !onAnimationDone) return
    const t = setTimeout(() => onAnimationDone(), durationMsRef.current)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clampedPct, replayDurationMs])

  return (
    <Box
      sx={{
        position: 'relative',
        height: 56,
        borderRadius: 1.5,
        backgroundColor: '#232a3d',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          width: `${hidden ? 100 : clampedPct}%`,
          backgroundColor: color,
          transition: hidden ? 'none' : `width ${durationMsRef.current}ms ${COLLAPSE_BEZIER}`,
          opacity: hidden ? 0 : 1,
        }}
      />
      {!hidden && (
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
            {label}
          </Typography>
        </Box>
      )}
    </Box>
  )
}
