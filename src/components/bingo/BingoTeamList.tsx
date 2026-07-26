import { Avatar, Box, Paper, Stack, Typography, useTheme } from '@mui/material'
import WavesIcon from '@mui/icons-material/Waves'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import WbSunnyIcon from '@mui/icons-material/WbSunny'
import { BingoMember, getTeamColorMap } from './BingoBoard'
import { bingoThemeTokens, getBingoTeamVisual } from './bingoTheme'

type Props = {
  members: BingoMember[]
  compact?: boolean
}

const avatarSrc = (m: BingoMember) =>
  m.counter.avatar && m.counter.discordId
    ? `https://cdn.discordapp.com/avatars/${m.counter.discordId}/${m.counter.avatar}`
    : 'https://cdn.discordapp.com/embed/avatars/0.png'

export const BingoTeamList = ({ members, compact = false }: Props) => {
  const theme = useTheme()
  const teamColors = getTeamColorMap(members)
  const teamIconByKey = {
    wave: WavesIcon,
    blaze: LocalFireDepartmentIcon,
    radiant: WbSunnyIcon,
  } as const
  const membersByTeam = Array.from(new Set(members.map((m) => m.teamId)))
    .sort((a, b) => a - b)
    .map((teamId) => ({
      teamId,
      members: members.filter((m) => m.teamId === teamId),
    }))

  if (compact) {
    return (
      <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', alignItems: 'center' }}>
        {membersByTeam.map((team) => {
          const rep = team.members[0]
          const visual = getBingoTeamVisual(rep?.teamKey || rep?.teamName)
          const Icon = teamIconByKey[visual.key as keyof typeof teamIconByKey] || WavesIcon
          return (
            <Paper
              key={`team-compact-${team.teamId}`}
              variant="outlined"
              sx={{
                px: 0.7,
                py: 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: 0.6,
                borderColor: `${teamColors[team.teamId] || bingoThemeTokens.fallback}77`,
                bgcolor: 'rgba(16, 28, 52, 0.78)',
                borderLeft: `3px solid ${teamColors[team.teamId] || bingoThemeTokens.fallback}`,
              }}
            >
              <Stack direction="row" spacing={0.3} alignItems="center">
                <Icon sx={{ fontSize: 13, color: teamColors[team.teamId] || visual.color }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: teamColors[team.teamId] || theme.palette.primary.main }}>
                  {visual.name}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={-0.35} alignItems="center">
                {team.members.slice(0, 3).map((m) => (
                  <Avatar
                    key={m.counter.uuid}
                    sx={{ width: 17, height: 17, border: '1px solid rgba(8, 15, 29, 0.85)' }}
                    alt={m.counter.name || m.counter.username}
                    src={avatarSrc(m)}
                  />
                ))}
              </Stack>
              <Typography variant="caption" sx={{ color: theme.palette.primary.contrastText }}>
                {team.members.length}
              </Typography>
            </Paper>
          )
        })}
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
      {membersByTeam.map((team) => {
        const rep = team.members[0]
        const visual = getBingoTeamVisual(rep?.teamKey || rep?.teamName)
        const Icon = teamIconByKey[visual.key as keyof typeof teamIconByKey] || WavesIcon
        return (
          <Box
            key={`team-${team.teamId}`}
            sx={{
              flex: `1 1 ${Math.max(160, Math.floor(100 / Math.max(1, membersByTeam.length)))}px`,
              maxWidth: `${Math.floor(100 / Math.max(1, membersByTeam.length))}%`,
              minWidth: 180,
            }}
          >
            <Paper
              variant="outlined"
              sx={{
                p: 1,
                borderTop: `4px solid ${teamColors[team.teamId] || bingoThemeTokens.fallback}`,
                minHeight: 120,
                bgcolor: 'rgba(16, 28, 52, 0.78)',
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Icon sx={{ fontSize: 17, color: teamColors[team.teamId] || visual.color }} />
                  <Typography
                    variant="subtitle2"
                    sx={{ color: teamColors[team.teamId] || theme.palette.primary.main, fontWeight: 700 }}
                  >
                    {visual.name}
                  </Typography>
                </Stack>
                <Typography variant="caption" sx={{ color: theme.palette.primary.contrastText }}>
                  {team.members.length} members
                </Typography>
              </Stack>
              <Stack spacing={0.75} alignItems="center">
                {team.members.map((m) => (
                  <Stack key={m.counter.uuid} direction="row" alignItems="center" spacing={0.8} justifyContent="center">
                    <Avatar sx={{ width: 26, height: 26 }} alt={m.counter.name || m.counter.username} src={avatarSrc(m)} />
                    <Typography variant="caption" sx={{ color: m.counter.color || theme.palette.primary.main }}>
                      {m.counter.username}
                      {m.role === 'host' ? ' (host)' : ''}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          </Box>
        )
      })}
    </Box>
  )
}
