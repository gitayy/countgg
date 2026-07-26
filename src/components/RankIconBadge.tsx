import { Box, Tooltip, Typography } from '@mui/material'
import { keyframes } from '@emotion/react'
import { RankName } from '../utils/types'
import { RANK_COLORS } from '../utils/rankColors'

const shineSweep = keyframes`
  from { transform: translateX(-120%) rotate(20deg); }
  to { transform: translateX(120%) rotate(20deg); }
`

// Dims a #rrggbb hex color toward black by `amount` (0-1) — used for the ring, which is
// the same hue as the coin's fill but darker, rather than a gradient bevel.
function dimHex(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const mix = (channel: number) => Math.round(channel * (1 - amount))
  const r = mix((num >> 16) & 0xff)
  const g = mix((num >> 8) & 0xff)
  const b = mix(num & 0xff)
  return `rgb(${r}, ${g}, ${b})`
}

type Props = {
  rank: RankName
  division: 1 | 2 | 3
  gg?: number
  // 'mini' = compact — for tight spots like the thread picker row.
  // 'normal' = larger — for headline rank displays (rank card header, etc).
  size?: 'mini' | 'normal'
  // Plays the shine sweep across the badge. Opt-in and off by default — this is a
  // celebration flourish for the rank-up moment specifically, not something a static
  // rank display (picker row, rank card header) should show continuously.
  animated?: boolean
}

// The circular ring + division-number "logo" used on the rank-up overlay, extracted so it
// can be reused anywhere a rank needs a compact visual identity instead of plain text
// (thread picker rows, rank card headers, etc).
export const RankIconBadge = ({ rank, division, gg, size = 'normal', animated = false }: Props) => {
  const color = RANK_COLORS[rank]
  const ringColor = dimHex(color, 0.35)
  // Peak has no divisions (see rankColors.ts) — a "≈" reads as "the top, no further tiers"
  // instead of a division numeral that doesn't actually mean anything at peak.
  const divStr = rank === 'peak' ? '≈' : division === 1 ? 'I' : division === 2 ? 'II' : 'III'
  const isMini = size === 'mini'
  const dimension = isMini ? 20 : 64
  const fontSize = isMini ? '0.6rem' : '1.5rem'
  // Whole-pixel border width — subpixel values (e.g. 1.5px) render inconsistently across
  // the four sides of a small circle, making the ring look uneven/thicker on some edges.
  const borderWidth = isMini ? 2 : 3
  // 8-direction dark shadow acts as a simple text-stroke so the flat white division letters
  // stay readable against the coin's fill regardless of how light that fill gets.
  const outlineOffset = isMini ? 0.6 : 1
  const textOutline = [-1, 0, 1]
    .flatMap((x) => [-1, 0, 1].map((y) => [x, y]))
    .filter(([x, y]) => x !== 0 || y !== 0)
    .map(([x, y]) => `${x * outlineOffset}px ${y * outlineOffset}px 1.5px rgba(0,0,0,0.95)`)
    .join(', ')

  return (
    <Tooltip title={gg != null ? `${gg} GG` : ''} placement="top">
      <Box
        sx={{
          position: 'relative',
          width: dimension,
          height: dimension,
          flexShrink: 0,
          borderRadius: '50%',
          // Ring is a flat, dimmed version of the coin's hue (via the padding-box trick:
          // outer box is this dimmed color, inner box is inset by borderWidth with the full
          // solid color), so the ring reads as a distinct but related shade, not a gradient.
          bgcolor: ringColor,
          boxShadow: isMini ? '0 1px 2px rgba(0,0,0,0.4)' : '0 2px 6px rgba(0,0,0,0.45)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: `${borderWidth}px`,
            borderRadius: '50%',
            bgcolor: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {!isMini && animated && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(60deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%)',
                animation: `${shineSweep} 1.8s ease-in-out 0.5s infinite backwards`,
              }}
            />
          )}
          <Typography
            sx={{
              position: 'relative',
              fontSize,
              fontWeight: 800,
              lineHeight: 1,
              color: '#fff',
              textShadow: textOutline,
            }}
          >
            {divStr}
          </Typography>
        </Box>
      </Box>
    </Tooltip>
  )
}
