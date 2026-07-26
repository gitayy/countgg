import { useEffect, useState } from 'react'
import { Box, Card, CardContent, Collapse, Typography } from '@mui/material'
import { RankName } from '../utils/types'
import { useAnimatedNumber } from '../utils/hooks/useAnimatedNumber'
import { RankUpOverlay } from './RankUpOverlay'
import { BigProgressBar } from './BigProgressBar'
import { RANK_COLORS, cumulativeDivFloor } from '../utils/rankColors'
import { RankIconBadge } from './RankIconBadge'
import { RankDivisionLadder } from './RankDivisionLadder'

const GG_COUNT_DURATION_MS = 700
const RANK_UP_BEZIER = 'cubic-bezier(0.4, 0, 0.2, 1)'
// RankUpOverlay's content (badge + 3 lines of text) needs more vertical room than this card's
// normal compact height provides. Rather than permanently taller (which would waste space on
// every ordinary render), the card grows to this height only while the overlay is showing, and
// eases back down to its natural height on dismiss — never affects the card's baseline layout.
const RANK_UP_MIN_HEIGHT = 220
const RANK_UP_GROW_DURATION_MS = 400

type Props = {
  rank: RankName
  division: 1 | 2 | 3
  gg: number
  divFloor: number
  divCeil: number
  // Displayed on the rank-up overlay (e.g. "main") so it's clear which thread's rank
  // just changed.
  threadName?: string
  // Set when a rank-tier change (not just a division bump) has been detected. The overlay
  // is held back until the GG count-up/bar-fill animation above finishes, then plays over
  // just this card (not the whole tab), and clears itself via onRankUpAnimationDone.
  pendingRankUp?: { rank: RankName; division: 1 | 2 | 3 } | null
  onRankUpAnimationDone?: () => void
}

// Single progress bar toward the counter's next division within their current rank
// (e.g. Bronze I -> Bronze II), not toward the next rank tier — the rank tier change
// itself is celebrated separately via RankUpOverlay, scoped to this card. GG count and
// bar fill both animate (bar via a bezier width transition, GG number via
// useAnimatedNumber's overshoot tween) whenever `gg`/`ggTotal` change, e.g. right after a
// count comes in.
export const RankProgressCard = ({
  rank,
  division,
  gg,
  divFloor,
  divCeil,
  threadName,
  pendingRankUp,
  onRankUpAnimationDone,
}: Props) => {
  const animatedGg = useAnimatedNumber(gg, GG_COUNT_DURATION_MS)
  // Grown: the card has expanded (or is expanding) to fit the overlay. Content: the overlay's
  // own contents (badge/text) are actually mounted. These are deliberately two separate flags,
  // not one — the card's min-height transition (0.4s) and the overlay's own fade/slide-in
  // animations were racing when both started at the same instant: the overlay's `inset: 0` ties
  // its box to the card's still-growing height, so its centered/sized text got squeezed and
  // clipped by the card's `overflow: hidden` for that whole 0.4s window instead of appearing
  // cleanly once there was room. Growing the card first, THEN mounting the overlay's content
  // once that transition finishes, avoids the overlay ever rendering into a too-small box.
  const [grown, setGrown] = useState(false)
  const [showRankUp, setShowRankUp] = useState(false)
  // Click the card to reveal a compact ladder of every division across every rank, each with
  // its own small progress bar toward that division's cumulative GG requirement — see
  // RankDivisionLadder. Nothing new is visible in the collapsed state; only the cursor changes.
  const [ladderExpanded, setLadderExpanded] = useState(false)

  // Wait for the GG count-up/bar-fill to finish before growing the card, so the two animations
  // play in sequence rather than on top of each other.
  useEffect(() => {
    if (!pendingRankUp) {
      setGrown(false)
      setShowRankUp(false)
      return
    }
    const growTimer = setTimeout(() => setGrown(true), GG_COUNT_DURATION_MS + 150)
    return () => clearTimeout(growTimer)
  }, [pendingRankUp])

  // Only mount the overlay's content once the card has actually finished growing to its full
  // height — never while the min-height transition is still in flight.
  useEffect(() => {
    if (!grown) return
    const contentTimer = setTimeout(() => setShowRankUp(true), RANK_UP_GROW_DURATION_MS)
    return () => clearTimeout(contentTimer)
  }, [grown])

  const hasNextDiv = isFinite(divCeil) && divCeil > divFloor
  const pct = hasNextDiv ? Math.min(100, Math.round(((gg - divFloor) / (divCeil - divFloor)) * 100)) : 100
  const rankColor = RANK_COLORS[rank]
  // GG earned within THIS division vs. GG needed to clear it — not the rank-relative absolute
  // gg/divCeil (e.g. "230 / 300" for Bronze III), which reads as "gained 230 out of 300 total"
  // when it should read as "gained 30 of the 100 this division needs".
  const divGg = Math.max(0, animatedGg - divFloor)
  const divSpan = divCeil - divFloor
  const progressLabel = `${divGg.toLocaleString()} / ${divSpan.toLocaleString()} GG`
  // Total lifetime GG (not rank-relative) — cumulativeDivFloor(rank, 1) is exactly the sum of
  // every earlier rank's full GG requirement, since division 1's floor within a rank is always
  // 0. Used by the division ladder below, which plots progress toward EVERY division on one
  // shared absolute scale, not just this rank's own 0..RANK_GG[rank] range.
  const totalGg = cumulativeDivFloor(rank, 1) + gg

  return (
    <Card
      variant="outlined"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: grown ? RANK_UP_MIN_HEIGHT : 0,
        transition: `min-height ${RANK_UP_GROW_DURATION_MS}ms ${RANK_UP_BEZIER}`,
      }}
    >
      {pendingRankUp && showRankUp && (
        <RankUpOverlay
          rank={pendingRankUp.rank}
          division={pendingRankUp.division}
          threadName={threadName}
          onDismiss={() => {
            // Hide the overlay's content first, then shrink the card back down — mirrors the
            // grow sequence, so the content is never visible while the card's height is mid-
            // transition (which is what clipped/squeezed it in the first place).
            setShowRankUp(false)
            setGrown(false)
            onRankUpAnimationDone?.()
          }}
        />
      )}
      <CardContent
        onClick={() => setLadderExpanded((prev) => !prev)}
        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', '&:last-child': { pb: 2 } }}
      >
        <RankIconBadge rank={rank} division={division} size="normal" />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {hasNextDiv ? (
            <BigProgressBar pct={pct} label={progressLabel} color={rankColor} />
          ) : (
            <Typography variant="body2" color="success.main" fontWeight={600}>
              Max division for this rank
            </Typography>
          )}
        </Box>
      </CardContent>
      <Collapse in={ladderExpanded} unmountOnExit>
        <Box sx={{ px: 2, pb: 2 }}>
          <RankDivisionLadder totalGg={totalGg} />
        </Box>
      </Collapse>
    </Card>
  )
}
