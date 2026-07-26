import { Box, Tooltip, Typography } from '@mui/material'
import { RankName } from '../utils/types'
import { RANK_COLORS, RANK_LABELS } from '../utils/rankColors'

type Props = {
  rank: RankName
  division: 1 | 2 | 3
  gg?: number
  size?: 'small' | 'medium'
}

export const RankBadge = ({ rank, division, gg, size = 'medium' }: Props) => {
  const color = RANK_COLORS[rank]
  const label = RANK_LABELS[rank]
  // Peak has no divisions (see rankColors.ts) — show "≈" instead of diamonds that don't
  // actually correspond to a real division at peak.
  const divStr = rank === 'peak' ? '≈' : '◆'.repeat(division)
  const fontSize = size === 'small' ? '0.7rem' : '0.85rem'

  return (
    <Tooltip title={gg != null ? `${gg} GG` : ''} placement="top">
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: size === 'small' ? 0.75 : 1,
          py: size === 'small' ? 0.25 : 0.5,
          borderRadius: 1,
          border: `1px solid ${color}`,
          backgroundColor: `${color}22`,
          userSelect: 'none',
        }}
      >
        <Typography sx={{ fontSize, fontWeight: 700, color, lineHeight: 1 }}>{label}</Typography>
        <Typography sx={{ fontSize, color, lineHeight: 1, opacity: 0.85 }}>{divStr}</Typography>
      </Box>
    </Tooltip>
  )
}
