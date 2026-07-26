import { Box, Typography } from '@mui/material'
import { keyframes } from '@emotion/react'
import { RankName } from '../utils/types'
import { RANK_COLORS, RANK_LABELS } from '../utils/rankColors'
import { RankIconBadge } from './RankIconBadge'

const BOUNCE_BEZIER = 'cubic-bezier(0.34, 1.56, 0.64, 1)'

// Mixes a #rrggbb hex color toward black (negative amount) or white (positive amount).
// Used to derive two ray tints from the rank color that are each distinct from the raw
// rank color used on the badge/text, so rays never exactly match the on-screen text color.
function mixHex(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const target = amount < 0 ? 0 : 255
  const a = Math.abs(amount)
  const mix = (channel: number) => Math.round(channel * (1 - a) + target * a)
  const r = mix((num >> 16) & 0xff)
  const g = mix((num >> 8) & 0xff)
  const b = mix(num & 0xff)
  return `rgb(${r}, ${g}, ${b})`
}

const fadeInBackdrop = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

const badgePop = keyframes`
  0% { transform: scale(0) rotate(-20deg); opacity: 0; }
  60% { transform: scale(1.2) rotate(8deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
`

const textSlideUp = keyframes`
  from { transform: translateY(16px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`

// Rotates in place around its own center — the translate(-50%, -50%) keeps the
// oversized square centered on its positioned point (top/left: 50%) throughout,
// since percentage `margin` offsets (the previous approach) are computed against the
// *parent's* box, not the element's own size, and drifted the pivot off-center.
const raysRotate = keyframes`
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
`

type Props = {
  rank: RankName
  division: 1 | 2 | 3
  threadName?: string
  onDismiss: () => void
}

// "You ranked up" takeover — scoped to just the RankProgressCard it's rendered inside
// (matching how ChallengeCompletionWrapper's splash only covers its own card), so it
// doesn't interrupt counting/chat/other tabs or even the rest of the rank tab. Only shown
// when the rank tier itself changes (e.g. bronze -> silver), not on every division bump
// within a rank. Stays up until the user clicks anywhere on it, so it can be
// screenshotted as a fun achievement. Requires a `position: relative` ancestor (the card).
export const RankUpOverlay = ({ rank, division, threadName, onDismiss }: Props) => {
  const color = RANK_COLORS[rank]
  // Two ray tints derived from the rank color (not the raw color itself, which is also
  // used for the badge/text) so a ray never exactly matches the on-screen text color.
  const rayColorA = mixHex(color, -0.35)
  const rayColorB = mixHex(color, -0.75)
  const label = RANK_LABELS[rank]
  // Peak has no divisions (see rankColors.ts) — "≈" instead of a division numeral that
  // doesn't actually mean anything at peak.
  const divStr = rank === 'peak' ? '≈' : division === 1 ? 'I' : division === 2 ? 'II' : 'III'
  // Alternating conic-gradient wedges (like an umbrella's panels/sunburst rays), slowly
  // rotating behind the badge, instead of a dim backdrop. Each wedge boundary blends over
  // a fraction of a degree instead of a hard cutoff, so edges are anti-aliased rather than
  // jagged (conic-gradient hard stops don't get smoothed by the renderer on their own).
  const rayCount = 12
  const wedgeDeg = 360 / rayCount
  const featherDeg = 0.75
  const featheredStops = Array.from({ length: rayCount }, (_, i) => {
    const start = i * wedgeDeg
    const mid = start + wedgeDeg / 2
    const end = start + wedgeDeg
    const colorHere = i % 2 === 0 ? rayColorA : rayColorB
    const colorNext = i % 2 === 0 ? rayColorB : rayColorA
    return [`${colorHere} ${start}deg`, `${colorHere} ${mid - featherDeg}deg`, `${colorNext} ${mid + featherDeg}deg`, `${colorNext} ${end}deg`]
  }).flat()
  const rayGradient = featheredStops.join(', ')

  return (
    <Box
      onClick={onDismiss}
      sx={{
        position: 'absolute',
        inset: 0,
        zIndex: 20,
        overflow: 'hidden',
        // Solid fallback fill so there's never a gap/transparent sliver at the edges —
        // the conic-gradient rays render on top of this.
        bgcolor: rayColorB,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        animation: `${fadeInBackdrop} 0.3s ease`,
        px: 2,
        py: 1.5,
        textAlign: 'center',
      }}
    >
      {/* Rotating sunburst/"umbrella" rays. aspect-ratio: 1 forces a true square (a plain
          width/height: 300% would stretch into the card's own aspect ratio and distort the
          conic-gradient's wedges into an ellipse). Sized at 300% of the card's width so the
          square's half-diagonal always exceeds the card's own half-diagonal, guaranteeing
          full corner coverage at every rotation angle. Centered via translate(-50%, -50%)
          baked into the rotation keyframes. */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '400%',
          aspectRatio: '1 / 1',
          background: `conic-gradient(${rayGradient})`,
          animation: `${raysRotate} 16s linear infinite`,
        }}
      />

      {/* Dark radial vignette centered on the content, so the badge/text always sit over a
          calmer, dimmed patch of the rays rather than fighting whatever ray colors happen
          to be spinning through that spot. */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 45%, transparent 70%)',
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Soft blurred dark plate behind the badge+text block — a stable, low-contrast
            surface for text to sit on regardless of what's spinning behind it. */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '140%',
            height: '140%',
            borderRadius: '50%',
            bgcolor: 'rgba(0,0,0,0.35)',
            filter: 'blur(18px)',
          }}
        />

        <Box sx={{ animation: `${badgePop} 0.6s ${BOUNCE_BEZIER} both`, mb: 1 }}>
          <RankIconBadge rank={rank} division={division} size="normal" animated />
        </Box>

        <Typography
          sx={{
            position: 'relative',
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: 1.5,
            color: 'rgba(255,255,255,0.85)',
            textTransform: 'uppercase',
            textShadow: '0 1px 4px rgba(0,0,0,0.9)',
            animation: `${textSlideUp} 0.5s ${BOUNCE_BEZIER} 0.2s both`,
          }}
        >
          Rank up!
        </Typography>
        <Typography
          sx={{
            position: 'relative',
            fontSize: '1.25rem',
            fontWeight: 800,
            color: '#fff',
            lineHeight: 1.1,
            textShadow: `0 0 14px ${color}, 0 2px 6px rgba(0,0,0,0.9)`,
            animation: `${textSlideUp} 0.5s ${BOUNCE_BEZIER} 0.3s both`,
          }}
        >
          {label} {divStr}
        </Typography>

        {threadName && (
          <Typography
            sx={{
              position: 'relative',
              mt: 0.25,
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.8)',
              textShadow: '0 1px 4px rgba(0,0,0,0.9)',
              animation: `${textSlideUp} 0.5s ${BOUNCE_BEZIER} 0.4s both`,
            }}
          >
            {threadName}
          </Typography>
        )}

        <Typography
          sx={{
            position: 'relative',
            mt: 1,
            fontSize: '0.65rem',
            color: 'rgba(255,255,255,0.7)',
            textShadow: '0 1px 4px rgba(0,0,0,0.9)',
            animation: `${textSlideUp} 0.5s ${BOUNCE_BEZIER} 0.5s both`,
          }}
        >
          Click to continue
        </Typography>
      </Box>
    </Box>
  )
}
