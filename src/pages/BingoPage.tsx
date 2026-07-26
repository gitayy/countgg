import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Paper, Stack, TextField, Typography, Chip, Divider, Tab, Tabs, Pagination } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import ExtensionRoundedIcon from '@mui/icons-material/ExtensionRounded'
import SportsEsportsRoundedIcon from '@mui/icons-material/SportsEsportsRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded'
import { useNavigate } from 'react-router-dom'
import { SocketContext } from '../utils/contexts/SocketContext'
import { UserContext } from '../utils/contexts/UserContext'
import { getBingoCompletedGames } from '../utils/api'
import { BingoBoard, BingoMember, BingoSquare } from '../components/bingo/BingoBoard'
import { BingoTeamList } from '../components/bingo/BingoTeamList'
import { bingoFocusRingSx, getBingoRankColor, getBingoRankLabel } from '../components/bingo/bingoTheme'
import { BingoGameView } from '../components/bingo/BingoGameView'

type BingoGameListItem = {
  id: number
  host: string
  status: 'lobby' | 'running' | 'finished'
  mode?: string
  rank?: string
  allowJoin: boolean
  joinMode?: 'closed' | 'free' | 'code'
  players: number
  teams?: Array<{ id: number; key: string; name: string }>
  members?: BingoMember[]
  squares?: BingoSquare[]
  startedAt?: number
  finishedAt?: number
}

export const BingoPage = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const socket = useContext(SocketContext)
  const { counter } = useContext(UserContext)
  const [activeGames, setActiveGames] = useState<BingoGameListItem[]>([])
  const [myActiveGameId, setMyActiveGameId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [joinDialogGame, setJoinDialogGame] = useState<BingoGameListItem | null>(null)
  const [joinCodeInput, setJoinCodeInput] = useState('')
  const [rightTab, setRightTab] = useState(0)
  const [completedGames, setCompletedGames] = useState<BingoGameListItem[]>([])
  const [completedTotal, setCompletedTotal] = useState(0)
  const [completedPage, setCompletedPage] = useState(1)
  const [completedLoaded, setCompletedLoaded] = useState(false)
  const [completedLoading, setCompletedLoading] = useState(false)
  const COMPLETED_LIMIT = 25

  const otherActiveGames = useMemo(
    () =>
      [...activeGames]
        .filter((g) => g.id !== myActiveGameId)
        .sort((a, b) => {
          // lobby first, running second
          const statusOrder: Record<string, number> = { lobby: 0, running: 1, finished: 2 }
          return (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9)
        }),
    [activeGames, myActiveGameId],
  )

  const fetchCompleted = useCallback(async (page: number) => {
    setCompletedLoading(true)
    try {
      const res = await getBingoCompletedGames((page - 1) * COMPLETED_LIMIT, COMPLETED_LIMIT)
      setCompletedGames(res.data.games)
      setCompletedTotal(res.data.total)
      setCompletedLoaded(true)
    } catch {
      // silently ignore
    } finally {
      setCompletedLoading(false)
    }
  }, [COMPLETED_LIMIT])

  useEffect(() => {
    socket.emit('bingo_list')
    const handleList = (data: {
      activeGames: BingoGameListItem[]
      myActiveGameId?: number | null
    }) => {
      setActiveGames(data.activeGames || [])
      setMyActiveGameId(data.myActiveGameId || null)
    }
    const handleAction = (payload: { action?: string; result?: { gameId?: number }; error?: string }) => {
      if (payload?.error) {
        setActionError(payload.error)
        return
      }
      if (payload?.action === 'create' && payload?.result?.gameId) {
        navigate(`/bingo/${payload.result.gameId}`)
      }
      socket.emit('bingo_list')
    }
    const handleListUpdate = () => {
      socket.emit('bingo_list')
    }
    socket.on('bingo_list', handleList)
    socket.on('bingo_list_update', handleListUpdate)
    socket.on('bingo_action_result', handleAction)
    return () => {
      socket.off('bingo_list', handleList)
      socket.off('bingo_list_update', handleListUpdate)
      socket.off('bingo_action_result', handleAction)
    }
  }, [navigate, socket])

  const handleCreateGame = () => {
    setActionError(null)
    socket.emit('bingo_create', { allowJoin: true })
  }

  const handleJoinGame = (game: BingoGameListItem) => {
    setActionError(null)
    if (game.joinMode === 'code') {
      setJoinDialogGame(game)
      setJoinCodeInput('')
    } else {
      socket.emit('bingo_join', { gameId: game.id })
    }
  }

  const handleJoinWithCode = () => {
    if (!joinDialogGame || !joinCodeInput.trim()) return
    socket.emit('bingo_join', { gameId: joinDialogGame.id, joinCode: joinCodeInput.trim() })
    setJoinDialogGame(null)
    setJoinCodeInput('')
  }

  const handleViewGame = (gameId: number) => {
    navigate(`/bingo/${gameId}`)
  }

  const createDisabled = !counter || !counter.roles?.includes('counter') || Boolean(myActiveGameId)
  const pageTextColor = theme.palette.primary.main;
  const mutedTextColor = theme.palette.secondary.main;
  const panelBorderColor = theme.palette.background.default;
  const panelBg = theme.palette.background.default;
  const cardBg = theme.palette.background.paper;
  const pageBg = theme.palette.background.default;
  const intelPillBg = theme.palette.background.paper;
  const intelPillBorder = theme.palette.background.default;
  const intelIconColor = theme.palette.background.default;
  const statCardBg = theme.palette.background.paper;

  const metaPills = (game: BingoGameListItem, keyPrefix: string) =>
    [
      { label: game.host, icon: <PersonRoundedIcon sx={{ fontSize: 15, color: intelIconColor }} />, hint: 'Host' },
      { label: (game.mode || 'bingo').toUpperCase(), icon: <ExtensionRoundedIcon sx={{ fontSize: 15, color: intelIconColor }} />, hint: 'Mode' },
      { label: getBingoRankLabel(game.rank).toUpperCase(), icon: <SportsEsportsRoundedIcon sx={{ fontSize: 15, color: intelIconColor }} />, hint: 'Rank' },
      { label: `${game.players} PLAYERS`, icon: <GroupsRoundedIcon sx={{ fontSize: 15, color: intelIconColor }} />, hint: 'Players' },
    ].map((meta) => (
      <Paper
        key={`${keyPrefix}-${game.id}-${meta.hint}`}
        variant="outlined"
        sx={{
          px: 1,
          py: 0.55,
          borderRadius: 999,
          borderColor: intelPillBorder,
          bgcolor: intelPillBg,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.55,
        }}
      >
        {meta.icon}
        <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 0.35, color: pageTextColor }}>
          {meta.label}
        </Typography>
      </Paper>
    ))

  return (
    <Box
      sx={{
        height: 'calc(100vh - 65px)',
        width: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        boxSizing: 'border-box',
        bgcolor: theme.palette.background.default,
        background: pageBg,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        color: pageTextColor,
      }}
    >
      {actionError && (
        <Alert severity="error" onClose={() => setActionError(null)} sx={{ mb: 2 }}>
          {actionError}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ flex: 1, height: '100%', overflow: 'hidden' }}>
        {/* ── Left: embedded game view or giant create button (8/12 on lg, full on xs/md) ── */}
        <Grid
          item
          xs={12}
          md={12}
          lg={8}
          sx={{ height: { lg: '100%' }, overflowY: { lg: 'auto' }, order: { xs: 1, lg: 1 } }}
        >
          {myActiveGameId ? (
            <Paper
              sx={{
                border: `1px solid ${panelBorderColor}`,
                bgcolor: theme.palette.background.default,
                color: pageTextColor,
                overflow: 'hidden',
                height: { lg: '100%' },
                overflowY: { lg: 'auto' },
                boxSizing: 'border-box',
              }}
            >
              <BingoGameView
                gameId={myActiveGameId}
                embedded
                onLeave={() => setMyActiveGameId(null)}
              />
            </Paper>
          ) : (
            <Paper
              sx={{
                p: 3,
                border: `2px dashed ${panelBorderColor}`,
                bgcolor: panelBg,
                color: pageTextColor,
                minHeight: 320,
                height: { lg: '100%' },
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
              }}
            >
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body1" sx={{ color: mutedTextColor }}>
                  {!counter || !counter.roles?.includes('counter')
                    ? 'Only counters can create games.'
                    : ''}
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="large"
                disabled={createDisabled}
                onClick={handleCreateGame}
                sx={{
                  px: 5,
                  py: 1.8,
                  fontSize: '4.15rem',
                  fontWeight: 800,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, #1e88e5 100%)`,
                  boxShadow: '0 12px 28px rgba(62, 166, 255, 0.45)',
                  '&:hover': {
                    boxShadow: '0 16px 32px rgba(62, 166, 255, 0.52)',
                    background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, #1577cb 100%)`,
                  },
                  '&.Mui-disabled': { opacity: 0.45 },
                  ...bingoFocusRingSx,
                }}
                aria-label="Create a new bingo game"
              >
                <AddCircleOutlineRoundedIcon sx={{ fontSize: 72, color: '#ddd'}} />
                Create Lobby
              </Button>
            </Paper>
          )}
        </Grid>

        {/* ── Right: tabs for active lobbies / completed games (4/12 on lg, full on xs/md) ── */}
        <Grid
          item
          xs={12}
          md={12}
          lg={4}
          sx={{ height: { lg: '100%' }, overflowY: 'auto', order: { xs: 2, lg: 2 } }}
        >
          <Paper
            sx={{
              border: `1px solid ${panelBorderColor}`,
              backdropFilter: 'blur(6px)',
              bgcolor: panelBg,
              color: pageTextColor,
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100%',
            }}
          >
            <Tabs
              value={rightTab}
              onChange={(_e, v) => {
                setRightTab(v)
                if (v === 1 && !completedLoaded) fetchCompleted(1)
              }}
              sx={{ borderBottom: `1px solid ${panelBorderColor}`, px: 2, pt: 1 }}
            >
              <Tab label={`Active Lobbies (${otherActiveGames.length})`} />
              <Tab label="Completed Games" />
            </Tabs>

            {/* Active Lobbies tab */}
            {rightTab === 0 && (
            <Box sx={{ p: 2 }}>
            {otherActiveGames.length === 0 && (
              <Typography variant="body1" sx={{ color: mutedTextColor }}>No other active lobbies right now.</Typography>
            )}
            <Stack spacing={1.5}>
              {otherActiveGames.map((game) => (
                <Paper
                  key={game.id}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    pl: 1.9,
                    display: 'grid',
                    gap: 1.2,
                    gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 190px 100px' },
                    borderColor: panelBorderColor,
                    bgcolor: cardBg,
                    borderLeftWidth: 3,
                    borderLeftStyle: 'solid',
                    borderLeftColor: game.status === 'running' ? theme.palette.success.main : getBingoRankColor(game.rank),
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.6 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        Game #{game.id}
                      </Typography>
                      <Chip
                        size="small"
                        label={game.status === 'lobby' ? 'Not started' : game.status}
                        sx={{
                          bgcolor: game.status === 'running' ? `${theme.palette.success.main}22` : `${theme.palette.warning.main}2a`,
                          color:
                            game.status === 'running' ? theme.palette.success.main : theme.palette.warning.main,
                          border: `1px solid ${game.status === 'running' ? `${theme.palette.success.main}66` : `${theme.palette.warning.main}66`}`,
                          textTransform: 'capitalize',
                        }}
                      />
                      {game.allowJoin && game.status === 'lobby' && (
                        <Chip
                          size="small"
                          label={game.joinMode === 'code' ? 'Join with code' : 'Joinable'}
                          sx={{
                            bgcolor: `${theme.palette.secondary.main}20`,
                            color: theme.palette.secondary.main,
                            border: `1px solid ${theme.palette.secondary.main}66`,
                          }}
                        />
                      )}
                    </Stack>
                    <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={{ mt: 0.5 }}>
                      {metaPills(game, 'active')}
                    </Stack>
                    {Array.isArray(game.members) && game.members.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <BingoTeamList members={game.members} compact />
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ width: '100%', alignSelf: 'center' }}>
                    {Array.isArray(game.squares) && game.squares.length > 0 && Array.isArray(game.members) && game.members.length > 0 ? (
                      <BingoBoard squares={game.squares} members={game.members} variant="xsmall" />
                    ) : (
                      <></>
                    )}
                  </Box>
                  <Stack spacing={1} alignItems={{ xs: 'stretch', md: 'flex-end' }} justifyContent="center">
                    {game.allowJoin && game.status === 'lobby' && (
                      <Button
                        variant="contained"
                        onClick={() => handleJoinGame(game)}
                        sx={{
                          fontWeight: 700,
                          background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, #1976d2 100%)`,
                          '&:hover': { background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, #155ea8 100%)` },
                          ...bingoFocusRingSx,
                        }}
                        aria-label={`Join game ${game.id}`}
                      >
                        Join
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      onClick={() => handleViewGame(game.id)}
                      sx={{ borderColor: panelBorderColor, color: pageTextColor, ...bingoFocusRingSx }}
                      aria-label={`View game ${game.id}`}
                    >
                      View
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
            </Box>
            )}

            {/* Completed Games tab */}
            {rightTab === 1 && (
            <Box sx={{ p: 2 }}>
            {completedLoading && (
              <Typography variant="body2" sx={{ color: mutedTextColor, mb: 1 }}>Loading...</Typography>
            )}
            {!completedLoading && completedLoaded && completedGames.length === 0 && (
              <Typography variant="body1" sx={{ color: mutedTextColor }}>No completed games yet.</Typography>
            )}
            <Stack spacing={1.5}>
              {completedGames.map((game) => (
                <Paper
                  key={game.id}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    pl: 1.9,
                    display: 'grid',
                    gap: 1.2,
                    gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 190px' },
                    borderColor: panelBorderColor,
                    bgcolor: cardBg,
                    borderLeftWidth: 3,
                    borderLeftStyle: 'solid',
                    borderLeftColor: theme.palette.success.main,
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.6 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        Game #{game.id}
                      </Typography>
                      <Chip
                        size="small"
                        label="Finished"
                        sx={{
                          bgcolor: `${theme.palette.success.main}1f`,
                          color: theme.palette.success.main,
                          border: `1px solid ${theme.palette.success.main}66`,
                        }}
                      />
                    </Stack>
                    <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={{ mt: 0.5 }}>
                      {metaPills(game, 'completed')}
                    </Stack>
                  </Box>
                  <Box sx={{ width: '100%', alignSelf: 'center' }}>
                    {Array.isArray(game.squares) && game.squares.length > 0 && Array.isArray(game.members) && game.members.length > 0 ? (
                      <BingoBoard squares={game.squares} members={game.members} variant="xsmall" />
                    ) : (
                      <Box
                        sx={{
                          height: 100,
                          border: `1px dashed ${panelBorderColor}`,
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: mutedTextColor,
                          fontSize: 12,
                          bgcolor: statCardBg,
                        }}
                      >
                        Final board unavailable
                      </Box>
                    )}
                  </Box>
                </Paper>
              ))}
            </Stack>
            {completedTotal > COMPLETED_LIMIT && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination
                  count={Math.ceil(completedTotal / COMPLETED_LIMIT)}
                  page={completedPage}
                  onChange={(_e, page) => {
                    setCompletedPage(page)
                    fetchCompleted(page)
                  }}
                  color="primary"
                />
              </Box>
            )}
            </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Join code dialog */}
      <Dialog open={!!joinDialogGame} onClose={() => { setJoinDialogGame(null); setJoinCodeInput('') }} maxWidth="xs" fullWidth>
        <DialogTitle>Enter Join Code</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Code"
            value={joinCodeInput}
            onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === 'Enter' && joinCodeInput.trim()) handleJoinWithCode() }}
            inputProps={{ style: { fontFamily: 'monospace', letterSpacing: 3, fontWeight: 700 } }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setJoinDialogGame(null); setJoinCodeInput('') }}>Cancel</Button>
          <Button variant="contained" disabled={!joinCodeInput.trim()} onClick={handleJoinWithCode}>Join</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
