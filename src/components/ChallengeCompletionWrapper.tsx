import { ReactNode, useEffect, useRef, useState } from 'react'
import { Box, Card, CardContent, Typography } from '@mui/material'
import { keyframes } from '@emotion/react'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { RankName } from '../utils/types'
import { RANK_COLORS, RANK_LABELS } from '../utils/rankColors'

// Overshoot/bounce curve for the "pop" moments (checkmark, text), a snappier
// ease for the collapse — matches the feel of native iOS success animations.
const BOUNCE_BEZIER = 'cubic-bezier(0.34, 1.56, 0.64, 1)'
const COLLAPSE_BEZIER = 'cubic-bezier(0.4, 0, 0.2, 1)'

const splashIn = keyframes`
  from { transform: scale(0.85); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`

const checkPop = keyframes`
  0% { transform: scale(0) rotate(-15deg); opacity: 0; }
  60% { transform: scale(1.15) rotate(5deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
`

const textSlideIn = keyframes`
  from { transform: translateY(12px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`

// The summary line grows in from the middle outward (scaleX from 0 -> 1) rather than sliding
// up like "Complete!" — gives it a distinct "unfurling" feel so it doesn't just look like a
// second copy of the same slide-in, and reads as "here's the detail behind that".
const summarySlideIn = keyframes`
  from { transform: translateY(8px) scaleX(0); opacity: 0; }
  60% { transform: translateY(0) scaleX(1.05); opacity: 1; }
  100% { transform: translateY(0) scaleX(1); opacity: 1; }
`

const ringExpand = keyframes`
  from { transform: scale(0.6); opacity: 0.6; }
  to { transform: scale(2.2); opacity: 0; }
`

// Plays only when `firstAppearance` is true — i.e. genuinely the first time this specific
// challenge has ever been rendered (e.g. a freshly-assigned challenge, or the next step in a
// chain appearing right after the previous one completes and collapses away) — so a brand new
// card eases in instead of abruptly appearing. Gated by the server-persisted entranceSeenAt
// (see RankTabPanel's isFirstAppearance) rather than firing on every mount, since this
// component's parent tree (the whole Rank tab) unmounts on every tab switch — without that
// gate this would replay every single time the tab was reopened, even for challenges the user
// has already seen many times.
const cardEnter = keyframes`
  from { transform: translateY(-6px) scale(0.97); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
`

const GG_ORANGE = '#ff8c00'

type Props = {
  challengeId: string
  ggReward: number
  completedCount: number
  isComplete: boolean
  // Small top-left indicator, e.g. "Bronze • 1/4" — this challenge's rank and its position
  // within its chain's current sequence steps at that rank. Omitted entirely if either value
  // isn't provided (e.g. older card variants that don't yet pass them through).
  rank?: RankName
  sequencePosition?: number
  sequenceTotal?: number
  // Fires once the full completion animation (splash + collapse) has finished,
  // so the caller can move this card into the completed section.
  onAnimationDone?: (challengeId: string) => void
  // Lets a test control (e.g. an admin "preview animation" button) trigger the
  // sequence without waiting for a real completion to come in from the server.
  forcePlay?: boolean
  // The qualifying threshold that was just met, e.g. "1,000 Counts" or "0:04.500 Split" —
  // shown as a second line under "Complete!", appearing shortly after it so there's time to
  // read/appreciate each in turn. Never the challenge's name/description, just the
  // qualification info (see getCompletionSummary in utils/challengeCompletionSummary.ts).
  summary?: { main: string; sub?: string }
  // Whether this is the very first time this specific challenge has ever been rendered
  // (server-authoritative — see RankTabPanel's isFirstAppearance/entranceSeenAt). Gates the
  // one-time "pop in" mount animation (cardEnter) below — defaults to true (the historical
  // behavior, unconditional pop-in) so callers that don't pass this prop at all (e.g. any
  // other usage of this shared wrapper) are unaffected.
  firstAppearance?: boolean
  // The challenge type's own body content (progress bar, speed card, accuracy meter,
  // etc), rendered below the standardized header. Receives isAnimating so it can hide
  // itself during the splash.
  children: (isAnimating: boolean) => ReactNode
}

type Phase = 'idle' | 'splash' | 'collapsing'

// Shared shell used by every challenge card type (thread_counts, speed, accuracy, ...):
// renders the standardized title/GG-badge/Completed header, detects the not-complete ->
// complete transition, plays a green splash + checkmark pop + "Complete!" text over the
// card, then collapses it from the top so the caller can move it into the completed
// section afterward.
export const ChallengeCompletionWrapper = ({
  challengeId,
  ggReward,
  completedCount,
  isComplete,
  rank,
  sequencePosition,
  sequenceTotal,
  onAnimationDone,
  forcePlay,
  summary,
  firstAppearance = true,
  children,
}: Props) => {
  const [phase, setPhase] = useState<Phase>('idle')
  // Always starts false (NOT useRef(isComplete)) so a card that mounts already complete is
  // treated the same as one that transitions to complete — both are genuine, never-yet-shown
  // completions that must play the full splash. This matters for two real cases: a replay
  // 'completion' step (always mounts fresh with isComplete=true, paired with forcePlay=true),
  // and a live completion that arrived with no pre-existing progress slot to flip in place
  // (useChallengeSlots' "no slot exists yet" fallback, e.g. a challenge completed so fast no
  // in-progress state was ever locally seen). There is no "remounted mid-splash, already seen"
  // case to guard against in this codebase — RankTabPanel itself remounting (e.g. tab switch)
  // restarts the WHOLE replay from its 'bar' step via a fresh unseen-completions fetch, never
  // resumes directly into a 'completion' step, so mount-time isComplete=true always means
  // "show it", never "skip it".
  const wasCompleteRef = useRef(false)
  const forcePlayHandledRef = useRef(false)

  useEffect(() => {
    if (isComplete && !wasCompleteRef.current) {
      setPhase('splash')
    }
    wasCompleteRef.current = isComplete
  }, [isComplete])

  // Test-button completion: plays the same sequence without needing real progress data.
  useEffect(() => {
    if (forcePlay && !forcePlayHandledRef.current) {
      forcePlayHandledRef.current = true
      setPhase('splash')
    }
    if (!forcePlay) {
      forcePlayHandledRef.current = false
    }
  }, [forcePlay])

  // Splash holds longer when there's a summary line to show — "Complete!" appears first
  // (0.3s delay), the summary line unfurls in shortly after (0.7s delay), leaving time to
  // read both before the card collapses. Both durations padded by an extra 3s of hold time
  // (on top of the base 1400ms/2200ms) so there's more time to appreciate the completion.
  // Depends on `phase` alone, NOT `summary` — `summary` is a fresh object literal on every
  // parent render (getCompletionSummary is never memoized), so depending on it directly used
  // to restart this timer from scratch on every unrelated re-render (e.g. any `rank_updated`
  // socket tick while actively counting), leaving the splash stuck indefinitely. `hasSummary`
  // is captured once via a ref when entering 'splash' so a later summary prop change (there
  // isn't one in practice, but just in case) can't reset the clock either.
  const hasSummaryAtSplashRef = useRef(Boolean(summary))
  useEffect(() => {
    if (phase !== 'splash') return
    hasSummaryAtSplashRef.current = Boolean(summary)
    const t = setTimeout(() => setPhase('collapsing'), (hasSummaryAtSplashRef.current ? 2200 : 1400) + 3000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  useEffect(() => {
    if (phase !== 'collapsing') return
    const t = setTimeout(() => {
      setPhase('idle')
      onAnimationDone?.(challengeId)
    }, 420)
    return () => clearTimeout(t)
  }, [phase, challengeId, onAnimationDone])

  const isAnimating = phase !== 'idle'

  return (
    <Box
      sx={{
        maxHeight: phase === 'collapsing' ? 0 : 500,
        opacity: phase === 'collapsing' ? 0 : 1,
        transform: phase === 'collapsing' ? 'translateY(-8px)' : 'translateY(0)',
        transition: `max-height 0.4s ${COLLAPSE_BEZIER}, opacity 0.25s ease, transform 0.4s ${COLLAPSE_BEZIER}`,
        overflow: 'hidden',
      }}
    >
      <Card
        variant="outlined"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          animation: firstAppearance ? `${cardEnter} 0.35s ${BOUNCE_BEZIER} both` : 'none',
        }}
      >
        {isAnimating && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 2,
              bgcolor: 'success.main',
              animation: `${splashIn} 0.35s ${BOUNCE_BEZIER}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
            }}
          >
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              {/* Expanding ring behind the checkmark for extra "pop" */}
              <Box
                sx={{
                  position: 'absolute',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.9)',
                  animation: `${ringExpand} 0.7s ease-out 0.15s both`,
                }}
              />
              <CheckCircleIcon
                sx={{
                  fontSize: 32,
                  color: '#fff',
                  animation: `${checkPop} 0.5s ${BOUNCE_BEZIER} 0.1s both`,
                  filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.35))',
                }}
              />
              <Typography
                sx={{
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: '#fff',
                  textShadow: '0 1px 3px rgba(0,0,0,0.35)',
                  animation: `${textSlideIn} 0.4s ${BOUNCE_BEZIER} 0.3s both`,
                }}
              >
                Complete!
              </Typography>
            </Box>
            {summary && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography
                  sx={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#fff',
                    textShadow: '0 1px 3px rgba(0,0,0,0.35)',
                    animation: `${summarySlideIn} 0.45s ${BOUNCE_BEZIER} 0.7s both`,
                  }}
                >
                  {summary.main}
                </Typography>
                {summary.sub && (
                  <Typography
                    sx={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.85)',
                      animation: `${summarySlideIn} 0.45s ${BOUNCE_BEZIER} 0.85s both`,
                    }}
                  >
                    {summary.sub}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        )}
        <CardContent sx={{ p: 1, position: 'relative', '&:last-child': { pb: 1 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, px: 0.25, gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
              {rank && sequencePosition != null && sequenceTotal != null && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: RANK_COLORS[rank], fontWeight: 700, textTransform: 'capitalize', lineHeight: 1 }}
                  >
                    {RANK_LABELS[rank]}
                  </Typography>
                  <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'text.disabled', flexShrink: 0 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                    {sequencePosition}/{sequenceTotal}
                  </Typography>
                </Box>
              )}
              {isComplete && completedCount > 0 && (
                <Typography variant="caption" color="success.main" sx={{ flexShrink: 0 }}>
                  Completed ×{completedCount}
                </Typography>
              )}
            </Box>
            <Box
              sx={{
                flexShrink: 0,
                transform: 'rotate(2deg)',
                bgcolor: GG_ORANGE,
                color: '#1a1200',
                fontWeight: 800,
                fontSize: '0.7rem',
                lineHeight: 1,
                px: 1,
                py: 0.5,
                borderRadius: 1,
                boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                whiteSpace: 'nowrap',
              }}
            >
              +{ggReward} GG
            </Box>
          </Box>
          {children(isAnimating)}
        </CardContent>
      </Card>
    </Box>
  )
}
