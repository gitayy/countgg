import { useContext } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Avatar, Box, Chip, IconButton, Paper, Stack, Switch, Tooltip, Typography, useTheme } from '@mui/material'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import WavesIcon from '@mui/icons-material/Waves'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import WbSunnyIcon from '@mui/icons-material/WbSunny'
import { BingoMember, getTeamColorMap } from './BingoBoard'
import { getBingoTeamVisual } from './bingoTheme'
import { SocketContext } from '../../utils/contexts/SocketContext'

type Team = { id: number; key: string; name: string; locked: boolean }

type Props = {
  gameId: number
  members: BingoMember[]
  teams: Team[]
  teamSwapMode: 'locked' | 'open'
  isHost: boolean
  currentUserUuid?: string
}

const teamIconByKey = {
  wave: WavesIcon,
  blaze: LocalFireDepartmentIcon,
  radiant: WbSunnyIcon,
} as const

const avatarSrc = (m: BingoMember) =>
  m.counter.avatar && m.counter.discordId
    ? `https://cdn.discordapp.com/avatars/${m.counter.discordId}/${m.counter.avatar}`
    : 'https://cdn.discordapp.com/embed/avatars/0.png'

export const BingoTeamManager = ({ gameId, members, teams, teamSwapMode, isHost, currentUserUuid }: Props) => {
  const socket = useContext(SocketContext)
  const theme = useTheme()
  const teamColors = getTeamColorMap(members)

  const membersByTeam = teams.map((team) => ({
    team,
    members: members.filter((m) => m.teamId === team.id),
  }))

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const userUuid = result.draggableId
    const targetTeamId = parseInt(result.destination.droppableId, 10)
    const member = members.find((m) => m.counter.uuid === userUuid)
    if (!member || member.teamId === targetTeamId) return
    socket.emit('bingo_move_member', { gameId, targetUserUuid: userUuid, targetTeamId })
  }

  const toggleTeamLock = (teamId: number, locked: boolean) => {
    socket.emit('bingo_update_team_lock', { gameId, teamId, locked })
  }

  const toggleSwapMode = () => {
    socket.emit('bingo_update_settings', { gameId, teamSwapMode: teamSwapMode === 'open' ? 'locked' : 'open' })
  }

  const canDrag = (member: BingoMember) => {
    if (isHost) return true
    if (teamSwapMode === 'locked') return false
    return member.counter.uuid === currentUserUuid
  }

  return (
    <Box>
      {isHost && (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <Switch size="small" checked={teamSwapMode === 'open'} onChange={toggleSwapMode} />
          <Typography variant="caption" sx={{ color: theme.palette.primary.contrastText }}>
            {teamSwapMode === 'open' ? 'Members can swap teams' : 'Team swapping locked (host only)'}
          </Typography>
        </Stack>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {membersByTeam.map(({ team, members: teamMembers }) => {
            const visual = getBingoTeamVisual(team.key || team.name)
            const Icon = teamIconByKey[visual.key as keyof typeof teamIconByKey] || WavesIcon
            const color = teamColors[team.id] || visual.color

            return (
              <Box key={team.id} sx={{ flex: '1 1 160px', minWidth: 160, maxWidth: 260 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    borderTop: `3px solid ${team.locked ? '#555' : color}`,
                    bgcolor: 'rgba(16, 28, 52, 0.78)',
                    overflow: 'hidden',
                  }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, pt: 0.75, pb: 0.5 }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Icon sx={{ fontSize: 15, color: team.locked ? '#666' : color }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: team.locked ? '#888' : color }}>
                        {visual.name}
                      </Typography>
                      {team.locked && (
                        <Chip size="small" label="Locked" sx={{ height: 16, fontSize: 10, bgcolor: '#333', color: '#888', ml: 0.3 }} />
                      )}
                    </Stack>
                    {isHost && (
                      <Tooltip title={team.locked ? 'Unlock team' : 'Lock team'} placement="top">
                        <IconButton
                          size="small"
                          onClick={() => toggleTeamLock(team.id, !team.locked)}
                          sx={{ p: 0.2, color: team.locked ? '#666' : theme.palette.primary.contrastText }}
                        >
                          {team.locked ? <LockIcon sx={{ fontSize: 14 }} /> : <LockOpenIcon sx={{ fontSize: 14 }} />}
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>

                  <Droppable droppableId={String(team.id)}>
                    {(provided, snapshot) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        sx={{
                          minHeight: 52,
                          px: 0.75,
                          pb: 0.75,
                          bgcolor: snapshot.isDraggingOver ? `${team.locked ? '#333' : color}18` : undefined,
                          transition: 'background 150ms',
                        }}
                      >
                        {teamMembers.map((member, index) => {
                          const draggable = canDrag(member)
                          return (
                            <Draggable
                              key={member.counter.uuid}
                              draggableId={member.counter.uuid}
                              index={index}
                              isDragDisabled={!draggable}
                            >
                              {(drag, dragSnapshot) => (
                                <Stack
                                  ref={drag.innerRef}
                                  {...drag.draggableProps}
                                  {...drag.dragHandleProps}
                                  direction="row"
                                  alignItems="center"
                                  spacing={0.6}
                                  sx={{
                                    mb: 0.5,
                                    px: 0.6,
                                    py: 0.4,
                                    borderRadius: 1,
                                    bgcolor: dragSnapshot.isDragging ? 'rgba(30,50,90,0.95)' : 'rgba(20,34,64,0.6)',
                                    border: draggable
                                      ? `1px dashed ${dragSnapshot.isDragging ? color : '#445'}`
                                      : '1px solid transparent',
                                    cursor: draggable ? 'grab' : 'default',
                                  }}
                                >
                                  <Avatar
                                    sx={{ width: 20, height: 20, flexShrink: 0 }}
                                    alt={member.counter.name || member.counter.username}
                                    src={avatarSrc(member)}
                                  />
                                  <Typography
                                    variant="caption"
                                    noWrap
                                    sx={{ color: member.counter.color || theme.palette.primary.main, flex: 1, minWidth: 0 }}
                                  >
                                    {member.counter.username}
                                    {member.role === 'host' ? ' ★' : ''}
                                  </Typography>
                                </Stack>
                              )}
                            </Draggable>
                          )
                        })}
                        {provided.placeholder}
                        {teamMembers.length === 0 && (
                          <Typography variant="caption" sx={{ color: '#555', px: 0.5, display: 'block', py: 0.5 }}>
                            Empty
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Droppable>
                </Paper>
              </Box>
            )
          })}
        </Box>
      </DragDropContext>
    </Box>
  )
}
