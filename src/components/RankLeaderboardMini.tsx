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
}

type Props = {
  entries: LeaderboardEntry[]
  myUsername?: string
}

// Compact ranked-member table for the Rank tab — collapsed by default to positions 1/2/3 plus
// "you" (or just 1/2/3 if you're already in the top 3, since you'd otherwise be listed twice).
// Expandable to the full list on click. Everyone in `entries` already has a non-zero/real rank
// in this scope (thread or sitewide) — a counter with no real standing yet simply has no
// ThreadRank row and never appears in the leaderboard query that produces these entries.
//
// Table chrome (TableContainer/TableHead, CardHeader avatar+name, Link for the name) matches
// LeaderboardTable/SpeedTable — the standard leaderboard styling used on the Stats page — rather
// than a bespoke look. Rank/GG columns and the collapse-to-top-3 behavior are kept since they're
// specific to this feature and have no standard-leaderboard equivalent.
export const RankLeaderboardMini = ({ entries: allEntries, myUsername }: Props) => {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)

  // 0 GG means no real standing yet (e.g. just assigned to the thread/season) — not worth
  // cluttering the leaderboard with rows that have nothing to show.
  const entries = allEntries.filter((e) => e.gg > 0)
  if (entries.length === 0) return null

  const myIndex = myUsername ? entries.findIndex((e) => e.username === myUsername) : -1
  const isMeInTop3 = myIndex >= 0 && myIndex < 3
  const collapsedIndices =
    isMeInTop3 || myIndex < 0 ? [0, 1, 2].filter((i) => i < entries.length) : [0, 1, 2, myIndex].filter((i) => i < entries.length)
  const visibleIndices = expanded ? entries.map((_, i) => i) : collapsedIndices
  const canExpand = !expanded && entries.length > collapsedIndices.length

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
            {visibleIndices.map((i) => {
              const entry = entries[i]
              const isMe = entry.username === myUsername
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
                          {isMe && ' (you)'}
                        </Link>
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <RankIconBadge rank={entry.rank} division={entry.division} size="mini" />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="caption" sx={{ color: rankColor }}>
                      {entry.gg.toLocaleString()} GG
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
