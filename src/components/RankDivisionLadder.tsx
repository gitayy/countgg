import { Box, Typography } from '@mui/material'
import { RankName } from '../utils/types'
import { RANK_ORDER, RANK_COLORS, RANK_LABELS, cumulativeDivFloor } from '../utils/rankColors'
import { RankIconBadge } from './RankIconBadge'

type Props = {
  // Total lifetime GG earned right now — plotted against every division's cumulative
  // floor/ceil below, not just the current one.
  totalGg: number
}

const DIVISIONS: Array<1 | 2 | 3> = [1, 2, 3]

// Full ladder of every division across every rank (Bronze I through Peak), each row showing GG
// needed to GET TO that division — its cumulative FLOOR, not its ceiling. E.g. Bronze III's
// floor is 200 (bronze I's 100 + bronze II's own 100), so sitting at 50 GG into Bronze I reads
// "50 / 200 GG" on the Bronze III row: "you need 200 to reach this division, you have 50".
// Division 1 of every rank has floor 0 (you're there the instant you enter the rank) so it has
// nothing to show progress toward — rendered as "-" instead of a degenerate "50 / 0". Peak has
// no ceiling (RANK_GG.peak is Infinity) but IS reachable (finite floor), so it renders as a
// single terminal row with the cumulative total needed to reach it, same floor-based logic as
// any other division.
export const RankDivisionLadder = ({ totalGg }: Props) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {RANK_ORDER.map((rank) => {
        const isPeak = rank === 'peak'
        const divisions = isPeak ? [1 as const] : DIVISIONS
        return divisions.map((division) => {
          const floor = cumulativeDivFloor(rank, division)
          const hasFloor = floor > 0
          const pct = Math.max(0, Math.min(100, hasFloor ? (totalGg / floor) * 100 : 100))
          const rankColor = RANK_COLORS[rank]
          const divLabel = isPeak ? RANK_LABELS[rank] : `${RANK_LABELS[rank]} ${division === 1 ? 'I' : division === 2 ? 'II' : 'III'}`
          return (
            <Box key={`${rank}-${division}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <RankIconBadge rank={rank} division={division} size="mini" />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {divLabel}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {hasFloor ? `${Math.min(totalGg, floor).toLocaleString()} / ${floor.toLocaleString()} GG` : '-'}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    position: 'relative',
                    height: 6,
                    borderRadius: 1,
                    bgcolor: '#232a3d',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      width: `${pct}%`,
                      bgcolor: rankColor,
                      transition: 'width 300ms ease',
                    }}
                  />
                </Box>
              </Box>
            </Box>
          )
        })
      })}
    </Box>
  )
}
