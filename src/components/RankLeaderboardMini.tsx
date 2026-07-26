import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Avatar,
  Box,
  Button,
  CardHeader,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { RankIconBadge } from './RankIconBadge'
import { RankName } from '../utils/types'
import { RANK_COLORS } from '../utils/rankColors'
import { discordAvatarLink } from '../utils/helpers'

export type LeaderboardEntry = {
  counterUuid: string
  username: string
  name: string
  avatar: string
  discordId: string
  color: string
  rank: RankName
  division: 1 | 2 | 3
  gg: number
  ggTotal: number
}

type Props = {
  entries: LeaderboardEntry[]
}

// Compact ranked-member table for the Rank tab — shows top 5 by default, expandable to full
// list. Sorted by ggTotal (all-time) so rank-ups don't make someone disappear (gg resets to 0
// on promotion). Shows all tiers together so higher-rank counters are visible to everyone.
export const RankLeaderboardMini = ({ entries: allEntries }: Props) => {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)

  // Filter out entries with no total GG yet — gg (current-rank progress) can be 0 after a
  // rank-up, but ggTotal reflects all-time earnings and is the right signal for "has real standing".
  const entries = allEntries.filter((e) => e.ggTotal > 0)
  if (entries.length === 0) return null

  const collapsedCount = 5
  const visibleEntries = expanded ? entries : entries.slice(0, collapsedCount)
  const canExpand = !expanded && entries.length > collapsedCount

  return (
    <Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Tier</TableCell>
              <TableCell align="right">GG</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleEntries.map((entry, i) => {
              const rankColor = RANK_COLORS[entry.rank] ?? 'rgba(255,255,255,0.15)'
              return (
                <TableRow key={entry.counterUuid}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>
                    <CardHeader
                      sx={{ p: 0 }}
                      avatar={
                        <Avatar
                          component="span"
                          sx={{ width: 24, height: 24 }}
                          alt={entry.name || entry.username}
                          src={discordAvatarLink(entry)}
                        />
                      }
                      title={
                        <Link
                          color={entry.color || undefined}
                          underline="hover"
                          href={`/counter/${entry.username}`}
                          onClick={(e) => {
                            e.preventDefault()
                            navigate(`/counter/${entry.username}`)
                          }}
                        >
                          {entry.name || entry.username}
                        </Link>
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <RankIconBadge rank={entry.rank} division={entry.division} size="mini" />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="caption" sx={{ color: rankColor }}>
                      {entry.ggTotal.toLocaleString()} GG
                    </Typography>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {canExpand && (
        <Button size="small" onClick={() => setExpanded(true)} sx={{ mt: 0.5, fontSize: '0.7rem' }}>
          Show all {entries.length}
        </Button>
      )}
    </Box>
  )
}
