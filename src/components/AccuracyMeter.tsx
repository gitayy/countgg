import { useMemo, useState } from 'react'
import { Box, Collapse, Tooltip, Typography, useTheme } from '@mui/material'
import {
  getAccuracyBuckets,
  getAccuracyWindowStats,
  getBatchColorSignal,
  drillAccuracyBucket,
  minValidForThreshold,
  AccuracyBucket,
} from '../utils/accuracyWindow'
import { useAnimatedNumber } from '../utils/hooks/useAnimatedNumber'

type Props = {
  window: string | null
  windowSize: number
  minAccuracyPercent: number
  height?: number
}

const BIG_FONT_SX = { fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.1 } as const
const MAX_BATCHES = 25
// Plain RGB triples (not theme-dependent) so the batch strip is always unambiguously red/green
// regardless of theme customization — matches MUI's default success/error hues.
const GOOD_RGB = '76, 175, 80'
const BAD_RGB = '244, 67, 54'

// Renders a compact "X/Y attempts - Z%" label plus a batch-strip of hit-rate squares.
// The strip batches the (possibly huge, e.g. 10,000+) attempt window into at most
// MAX_BATCHES squares, each individually hoverable to show that batch's own accuracy
// alongside the overall accuracy — so it stays cheap and readable regardless of window size.
// Clicking a batch that spans more than one attempt expands a nested strip of its own
// sub-batches directly beneath it (see BatchStrip below); clicking it again collapses that
// nested strip. Bottoms out once a batch is down to a single attempt (nothing left to drill).
export const AccuracyMeter = ({ window: rleWindow, windowSize, minAccuracyPercent, height = 20 }: Props) => {
  const stats = getAccuracyWindowStats(rleWindow, windowSize)
  const needValid = minValidForThreshold(windowSize, minAccuracyPercent)
  const isPassing = stats.pct != null && stats.pct >= minAccuracyPercent

  // Count up/down smoothly to the new percentage and attempt counts instead of snapping
  // instantly — same "count up" language BigProgressBar/RankProgressCard already use
  // elsewhere, applied here without touching the batch-strip logic below (which stays an
  // instant re-render; only the numbers animate). useAnimatedNumber needs a real number, so
  // "no attempts yet" (pct === null) is animated toward 0 rather than passed through as null —
  // the '—' placeholder is shown instead of the animated value in that case anyway.
  const animatedPct = useAnimatedNumber(stats.pct ?? 0)
  const animatedValidCount = useAnimatedNumber(stats.validCount)
  const animatedEffective = useAnimatedNumber(stats.effective)

  const buckets = useMemo(
    () => getAccuracyBuckets(rleWindow, windowSize, MAX_BATCHES),
    [rleWindow, windowSize],
  )

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
        <Typography sx={BIG_FONT_SX} color={stats.pct == null ? 'text.secondary' : isPassing ? 'success.main' : 'error.main'}>
          {stats.pct != null ? `${animatedPct}%` : '—'}
        </Typography>
        <Typography sx={BIG_FONT_SX} color="text.secondary">
          accuracy
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mt: 0.25, mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          {animatedValidCount}/{animatedEffective} Attempts
        </Typography>
        <Typography variant="caption" color="text.secondary">
          need {needValid}/{windowSize} · {minAccuracyPercent}%
        </Typography>
      </Box>
      {buckets.length === 0 ? (
        <Tooltip title="No attempts recorded yet" placement="top">
          <Box sx={{ width: '100%', height, borderRadius: 1, bgcolor: 'action.disabledBackground' }} />
        </Tooltip>
      ) : (
        <BatchStrip
          window={rleWindow}
          buckets={buckets}
          overallStats={stats}
          minAccuracyPercent={minAccuracyPercent}
          height={height}
        />
      )}
    </Box>
  )
}

type BatchStripProps = {
  window: string | null
  buckets: AccuracyBucket[]
  overallStats: { validCount: number; effective: number; pct: number | null }
  minAccuracyPercent: number
  height: number
}

// One row of batch squares — at most one per row can be expanded at a time (clicking a
// different drillable batch swaps the expansion to it). The expanded batch gets an obvious
// highlight (thick outline + lift), and a vertical "{"-shaped brace connects it down to its own
// nested BatchStrip of sub-batches rendered directly underneath. Clicking the already-expanded
// batch again collapses it. Recursion bottoms out once drillAccuracyBucket can no longer split a
// batch further (span down to a single attempt), at which point it's not clickable at all.
const BatchStrip = ({ window: rleWindow, buckets, overallStats, minAccuracyPercent, height }: BatchStripProps) => {
  const theme = useTheme()
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const toggle = (i: number) => {
    setExpandedIndex((prev) => (prev === i ? null : i))
  }

  const expandedBucket = expandedIndex != null ? buckets[expandedIndex] : null
  const subBuckets = expandedBucket
    ? drillAccuracyBucket(rleWindow, expandedBucket.rangeStart, expandedBucket.rangeEnd, MAX_BATCHES)
    : []

  const highlightColor = theme.palette.primary.main

  return (
    <Box>
      <Box sx={{ display: 'flex', width: '100%', height, gap: buckets.length > 60 ? 0 : '2px' }}>
        {buckets.map((bucket, i) => {
          const canDrill = bucket.total > 1
          const isExpanded = expandedIndex === i
          const batchPct = bucket.total > 0 ? Math.round((bucket.valid / bucket.total) * 1000) / 10 : 0
          const { side, opacity } = getBatchColorSignal(bucket.valid, bucket.total, minAccuracyPercent)
          // Plain red/green only (never blended toward a third neutral color) — a batch right at
          // the threshold is opacity ~0 (transparent, shows the panel's own background through),
          // and gets more solidly colored the further from the threshold it confidently sits.
          // See getBatchColorSignal for the confidence + saturation curve behind the opacity.
          const color = side === 'good'
            ? `rgba(${GOOD_RGB}, ${opacity})`
            : `rgba(${BAD_RGB}, ${opacity})`
          return (
            <Tooltip
              key={i}
              placement="top"
              title={
                <>
                  Batch: {bucket.valid}/{bucket.total} ({batchPct}%)
                  <br />
                  Overall: {overallStats.validCount}/{overallStats.effective} ({overallStats.pct}%)
                  {canDrill && (
                    <>
                      <br />
                      {isExpanded ? 'Click to collapse' : 'Click to view sub-batches'}
                    </>
                  )}
                </>
              }
            >
              <Box
                onClick={canDrill ? () => toggle(i) : undefined}
                sx={{
                  flex: `${bucket.total} 0 0`,
                  height: '100%',
                  bgcolor: color,
                  borderRadius: buckets.length <= 60 ? 0.5 : 0,
                  cursor: canDrill ? 'pointer' : 'default',
                  // Highlight reads clearly without a heavy outline/shadow washing out the fill
                  // underneath: a slim colored ring just outside the square's own edge (doesn't
                  // overlap the fill at all) plus a small filled marker dot below it. Row height
                  // never changes — no scaling/growing the square itself.
                  boxShadow: isExpanded ? `0 0 0 2px ${theme.palette.background.default}, 0 0 0 4px ${highlightColor}` : 'none',
                  transition: 'box-shadow 120ms ease',
                }}
              />
            </Tooltip>
          )
        })}
      </Box>
      <Collapse in={expandedBucket != null && subBuckets.length > 0} unmountOnExit>
        {expandedBucket && subBuckets.length > 0 && (
          <BraceConnector
            color={highlightColor}
            // Position of the highlighted batch as a 0..1 fraction of the row's total width
            // (weighted by each batch's own proportional flex-basis, same as the row's layout),
            // so the brace's downward tick lines up exactly under it regardless of where it sits.
            position={(() => {
              const totalWidth = buckets.reduce((sum, b) => sum + b.total, 0)
              const before = buckets.slice(0, expandedIndex!).reduce((sum, b) => sum + b.total, 0)
              return totalWidth > 0 ? (before + buckets[expandedIndex!].total / 2) / totalWidth : 0.5
            })()}
          />
        )}
        {subBuckets.length > 0 && (
          <BatchStrip
            window={rleWindow}
            buckets={subBuckets}
            overallStats={overallStats}
            minAccuracyPercent={minAccuracyPercent}
            height={height}
          />
        )}
      </Collapse>
    </Box>
  )
}

// Frames the nested strip below like a pair of brackets pointing at the highlighted batch above:
// a "[" whose vertical spine runs down the LEFT edge from the MIDDLE of this gap to the bottom,
// and a "]" whose spine runs down the RIGHT edge the same way — each with a horizontal arm
// reaching in, at that same mid-height, to `position` (0..1, the highlighted batch's own
// horizontal center), where a vertical tick rises from the mid-height line up to the top (the
// highlighted batch sitting right above). The two edge spines never move; only the horizontal
// arms' reach and the tick's position change as a different batch is highlighted.
const BraceConnector = ({ color, position }: { color: string; position: number }) => {
  const width = 400
  const height = 20
  const midY = height / 2
  const tickX = Math.max(0, Math.min(width, position * width))

  return (
    <Box sx={{ width: '100%', height, mt: 0.25 }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        <path
          d={
            // Left edge spine (mid-height to bottom) + its horizontal arm reaching to the tick.
            `M 0 ${midY} L 0 ${height} M 0 ${midY} L ${tickX} ${midY} ` +
            // Right edge spine (mid-height to bottom) + its horizontal arm reaching to the tick.
            `M ${width} ${midY} L ${width} ${height} M ${width} ${midY} L ${tickX} ${midY} ` +
            // Vertical tick from the mid-height line up to the highlighted batch above.
            `M ${tickX} ${midY} L ${tickX} 0`
          }
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </Box>
  )
}
