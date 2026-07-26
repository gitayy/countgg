import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  alpha,
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import VpnKeyIcon from '@mui/icons-material/VpnKey'
import { useNavigate } from 'react-router-dom'
import { SocketContext } from '../../utils/contexts/SocketContext'
import { UserContext } from '../../utils/contexts/UserContext'
import { formatTimeDiff } from '../../utils/helpers'
import { BingoBoard, BingoBoardVariant, BingoMember, BingoSquare, BingoWinningLine, getTeamColorMap } from './BingoBoard'
import { BingoTeamList } from './BingoTeamList'
import { BingoTeamManager } from './BingoTeamManager'
import {
  bingoFocusRingSx,
  getBingoColorToggleSx,
  getBingoRankColor,
  getBingoRankLabel,
  getBingoRankToggleSx,
  getBingoTeamVisual,
} from './bingoTheme'
import { RANK_LABELS, RANK_ORDER } from '../../utils/rankColors'
import { RankName } from '../../utils/types'

const formatSeconds = (secs: number) => {
  if (secs >= 3600) {
    const h = secs / 3600
    return `${h % 1 === 0 ? h : h.toFixed(1)}h`
  }
  return `${Math.round(secs / 60)}m`
}

type BingoGameState = {
  game: {
    id: number
    hostUserUuid: string
    status: string
    mode: string
    rank?: string
    allowJoin: boolean
    joinMode: 'closed' | 'free' | 'code'
    joinCode?: string | null
    timeLimitSeconds: number
    createdAt: number
    startedAt: number
    endsAt: number
    finishedAt: number
    winnerUserUuid?: string
    winnerTeamId?: number
    winnerAt?: number
    winnerTeamSize?: number
    winnerUsername?: string | null
    winningLine?: number[] | null
    winningLines?: BingoWinningLine[] | null
  }
  teamSwapMode?: 'locked' | 'open'
  teams?: Array<{ id: number; key: string; name: string; locked: boolean }>
  members: BingoMember[]
  squares: BingoSquare[]
}

type BingoUnlockEvent = {
  gameId: number
  unlockSeq?: number
  squareId: number
  index: number
  challengeType: string
  unlockerUserUuid: string
  unlockerUsername: string
  unlockerTeamId: number
  unlockedAt: number
}

type BingoGameEndedEvent = {
  gameId: number
  winnerTeamId?: number | null
  winnerUserUuid?: string | null
  winnerTeamSize?: number
  winningLine?: number[] | null
  winningLines?: BingoWinningLine[] | null
  endedAt?: number
  reason?: string
}

type Props = {
  gameId: number | string
  embedded?: boolean
  onLeave?: () => void
}

export const BingoGameView = ({ gameId, embedded = false, onLeave }: Props) => {
  const navigate = useNavigate()
  const socket = useContext(SocketContext)
  const { counter } = useContext(UserContext)
  const [gameState, setGameState] = useState<BingoGameState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [recentUnlocks, setRecentUnlocks] = useState<BingoUnlockEvent[]>([])
  const [gameEndedEvent, setGameEndedEvent] = useState<BingoGameEndedEvent | null>(null)
  const [winOverlayEvent, setWinOverlayEvent] = useState<BingoGameEndedEvent | null>(null)
  const localUnlockSeq = useRef(0)
  const [now, setNow] = useState(Date.now())
  const [boardVariant, setBoardVariant] = useState<BingoBoardVariant>(embedded ? 'small' : 'large')
  const [codeCopied, setCodeCopied] = useState(false)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [joinCodeInput, setJoinCodeInput] = useState('')
  const theme = useTheme()

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const numericGameId = Number(gameId)

  useEffect(() => {
    if (!numericGameId) {
      setError('Invalid game id.')
      return
    }
    setRecentUnlocks([])
    localUnlockSeq.current = 0
    socket.emit('bingo_game', { gameId: numericGameId })
    const handleGame = (data: any) => {
      if (data?.error) {
        setError(data.error)
        setGameState(null)
        return
      }
      setGameState(data)
      if (data?.game?.id) {
        window.localStorage.setItem('bingo_active_game_id', String(data.game.id))
      }
      setError(null)
    }
    const handleGameUpdate = (data: { gameId: number; payload?: BingoGameState }) => {
      if (data?.gameId !== numericGameId) return
      if (data.payload) {
        setGameState(data.payload)
      } else {
        socket.emit('bingo_game', { gameId: numericGameId })
      }
    }
    const handleSquareUnlocked = (data: BingoUnlockEvent) => {
      if (data?.gameId !== numericGameId) return
      const unlockSeq = Number(data?.unlockSeq)
      const eventWithSeq = {
        ...data,
        unlockSeq: Number.isFinite(unlockSeq) ? unlockSeq : ++localUnlockSeq.current,
      }
      setRecentUnlocks((prev) => [eventWithSeq, ...prev].slice(0, 3))
    }
    const handleGameEnded = (data: BingoGameEndedEvent) => {
      if (data?.gameId !== numericGameId) return
      setGameEndedEvent(data)
      if (data.winnerTeamId) setWinOverlayEvent(data)
    }
    const handleActionResult = (payload: { action?: string; error?: string }) => {
      if (payload?.error) setActionError(payload.error)
    }
    socket.on('bingo_game', handleGame)
    socket.on('bingo_game_update', handleGameUpdate)
    socket.on('bingo_square_unlocked', handleSquareUnlocked)
    socket.on('bingo_game_ended', handleGameEnded)
    socket.on('bingo_action_result', handleActionResult)
    return () => {
      socket.off('bingo_game', handleGame)
      socket.off('bingo_game_update', handleGameUpdate)
      socket.off('bingo_square_unlocked', handleSquareUnlocked)
      socket.off('bingo_game_ended', handleGameEnded)
      socket.off('bingo_action_result', handleActionResult)
    }
  }, [numericGameId, socket])

  useEffect(() => {
    if (!winOverlayEvent) return
    const timer = setTimeout(() => setWinOverlayEvent(null), 5000)
    return () => clearTimeout(timer)
  }, [winOverlayEvent])

  const teamColors = useMemo(() => (gameState ? getTeamColorMap(gameState.members) : {}), [gameState])

  const winOverlayInfo = useMemo(() => {
    if (!winOverlayEvent || !gameState) return null
    const teamMember = gameState.members.find((m) => m.teamId === winOverlayEvent.winnerTeamId)
    const visual = getBingoTeamVisual(teamMember?.teamKey || teamMember?.teamName)
    const color = winOverlayEvent.winnerTeamId ? teamColors[winOverlayEvent.winnerTeamId] || visual.color : visual.color
    const winnerName =
      gameState.members.find((m) => m.counter.uuid === winOverlayEvent.winnerUserUuid)?.counter.name ||
      teamMember?.teamName ||
      visual.name
    return {
      color,
      teamName: teamMember?.teamName || visual.name,
      winnerName,
      lineCount: winOverlayEvent.winningLines?.length || 1,
      isTiebreak: winOverlayEvent.reason === 'lockout_tiebreak',
    }
  }, [winOverlayEvent, gameState, teamColors])

  const userIsMember = useMemo(() => {
    if (!gameState || !counter) return false
    return gameState.members.some((m) => m.counter.uuid === counter.uuid)
  }, [gameState, counter])

  const userIsHost = useMemo(() => {
    if (!gameState || !counter) return false
    return gameState.game.hostUserUuid === counter.uuid
  }, [gameState, counter])

  const timeRemaining = useMemo(() => {
    if (!gameState?.game.endsAt) return null
    const diff = gameState.game.endsAt - now
    return diff > 0 ? formatTimeDiff(0, diff, true) : '00s'
  }, [gameState, now])

  const goBack = () => {
    if (onLeave) onLeave()
    else navigate('/bingo')
  }

  const handleJoin = (code?: string) => {
    if (!gameState) return
    setActionError(null)
    socket.emit('bingo_join', { gameId: gameState.game.id, joinCode: code })
    setJoinDialogOpen(false)
    setJoinCodeInput('')
  }
  const handleStart = () => {
    if (!gameState) return
    setActionError(null)
    socket.emit('bingo_start', { gameId: gameState.game.id })
  }
  const handleUpdateSettings = (settings: {
    rank?: RankName
    mode?: 'bingo' | 'lockout'
    timeLimitSeconds?: number
    joinMode?: 'closed' | 'free' | 'code'
  }) => {
    if (!gameState) return
    setActionError(null)
    socket.emit('bingo_update_settings', { gameId: gameState.game.id, ...settings })
  }
  const handleForfeit = () => {
    if (!gameState) return
    socket.emit('bingo_forfeit', { gameId: gameState.game.id })
    goBack()
  }
  const handleDelete = () => {
    if (!gameState) return
    socket.emit('bingo_cancel', { gameId: gameState.game.id })
    goBack()
  }
  const handleLeave = () => {
    if (!gameState) return
    socket.emit('bingo_leave', { gameId: gameState.game.id })
    goBack()
  }
  const handleLeaveGame = () => {
    if (!gameState) return
    socket.emit('bingo_leave_game', { gameId: gameState.game.id })
    goBack()
  }

  if (error) {
    return (
      <Box sx={{ p: embedded ? 1 : 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {error}
        </Typography>
        {!embedded && (
          <Button variant="outlined" onClick={() => navigate('/bingo')}>
            Back to Bingo
          </Button>
        )}
      </Box>
    )
  }

  if (!gameState) {
    return (
      <Box sx={{ p: embedded ? 1 : 2 }}>
        <Typography variant={embedded ? 'body2' : 'h5'}>Loading bingo game...</Typography>
      </Box>
    )
  }

  const actionButtons = (size: 'small' | 'medium' = 'medium') => (
    <>
      {gameState.game.allowJoin && !userIsMember && (
        <Button
          size={size}
          variant="contained"
          onClick={() => (gameState.game.joinMode === 'code' ? setJoinDialogOpen(true) : handleJoin())}
          sx={{
            fontWeight: 700,
            background: theme.palette.background.paper,
            '&:hover': { background: '#2689de' },
            flex: embedded ? 1 : undefined,
            ...bingoFocusRingSx,
          }}
          aria-label={`Join game ${gameState.game.id}`}
        >
          Join
        </Button>
      )}
      {userIsHost && gameState.game.status === 'lobby' && (
        <Button
          size={size}
          variant="contained"
          onClick={handleStart}
          sx={{
            fontWeight: 700,
            background: theme.palette.success.main,
            '&:hover': { background: '#2f9f5e' },
            flex: embedded ? 1 : undefined,
            ...bingoFocusRingSx,
          }}
          aria-label={`Start game ${gameState.game.id}`}
        >
          Start
        </Button>
      )}
      {userIsHost && gameState.game.status === 'lobby' && (
        <Button
          size={size}
          color="error"
          variant="outlined"
          onClick={handleDelete}
          sx={{ flex: embedded ? 1 : undefined, ...bingoFocusRingSx }}
          aria-label={`Cancel game ${gameState.game.id}`}
        >
          Cancel Game
        </Button>
      )}
      {!userIsHost && userIsMember && gameState.game.status === 'lobby' && (
        <Button
          size={size}
          color="error"
          variant="outlined"
          onClick={handleLeave}
          sx={{ flex: embedded ? 1 : undefined, ...bingoFocusRingSx }}
          aria-label={`Leave game ${gameState.game.id}`}
        >
          Leave
        </Button>
      )}
      {userIsMember && gameState.game.status === 'running' && (
        <Button
          size={size}
          color="warning"
          variant="outlined"
          onClick={handleForfeit}
          sx={{ flex: embedded ? 1 : undefined, ...bingoFocusRingSx }}
          aria-label={`Vote to forfeit game ${gameState.game.id}`}
        >
          Forfeit
        </Button>
      )}
      {userIsMember && gameState.game.status === 'running' && (
        <Button
          size={size}
          color="error"
          variant="outlined"
          onClick={handleLeaveGame}
          sx={{ flex: embedded ? 1 : undefined, ...bingoFocusRingSx }}
          aria-label={`Leave game ${gameState.game.id}`}
        >
          Leave
        </Button>
      )}
    </>
  )

  return (
    <Box
      sx={{
        p: embedded ? 0 : 2,
        flexGrow: 1,
        flex: '1 1 auto',
        minHeight: embedded ? undefined : '100%',
        position: 'relative',
        background: embedded
          ? undefined
          : `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.paper0} 100%)`,
      }}
    >
      {/* Win overlay — only show in non-embedded mode to avoid z-index conflicts */}
      {!embedded && winOverlayInfo && (
        <Box
          role="status"
          aria-live="assertive"
          onClick={() => setWinOverlayEvent(null)}
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 1400,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            pt: { xs: 8, md: 12 },
            pointerEvents: 'none',
            background: alpha('#050914', 0.001),
          }}
        >
          <Paper
            sx={{
              pointerEvents: 'auto',
              cursor: 'pointer',
              px: { xs: 3, md: 5 },
              py: { xs: 2, md: 2.5 },
              textAlign: 'center',
              border: `2px solid ${winOverlayInfo.color}`,
              bgcolor: 'rgba(10, 16, 32, 0.94)',
              boxShadow: `0 0 40px 6px ${alpha(winOverlayInfo.color, 0.55)}`,
              animation: 'bingoOverlayIn 420ms cubic-bezier(0.2, 0.9, 0.3, 1.3)',
              '@keyframes bingoOverlayIn': {
                '0%': { opacity: 0, transform: 'translateY(-24px) scale(0.9)' },
                '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
              },
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                letterSpacing: 1,
                color: winOverlayInfo.color,
                textShadow: `0 0 18px ${alpha(winOverlayInfo.color, 0.75)}`,
                lineHeight: 1,
              }}
            >
              {winOverlayInfo.isTiebreak ? "TIME'S UP!" : 'BINGO!'}
            </Typography>
            <Typography variant="h6" sx={{ mt: 1, color: theme.palette.primary.main, fontWeight: 700 }}>
              {winOverlayInfo.isTiebreak
                ? `${winOverlayInfo.teamName} wins with the most squares!`
                : `${winOverlayInfo.teamName} wins${winOverlayInfo.lineCount > 1 ? ` with ${winOverlayInfo.lineCount} lines!` : '!'}`}
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Header bar */}
      <Paper
        sx={{
          p: { xs: 1.5, md: embedded ? 1.5 : 2 },
          mb: 1.5,
          border: `1px solid ${theme.palette.background.paper}`,
          bgcolor: 'rgba(14, 22, 42, 0.74)',
          color: theme.palette.primary.main,
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <Typography variant={embedded ? 'h6' : 'h5'} sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                Game #{gameState.game.id}
              </Typography>
              <Chip
                size="small"
                label={gameState.game.status}
                sx={{
                  textTransform: 'capitalize',
                  bgcolor: `${theme.palette.warning.main}20`,
                  color: theme.palette.warning.main,
                  border: `1px solid ${theme.palette.warning.main}66`,
                }}
              />
              <Chip
                size="small"
                label={getBingoRankLabel(gameState.game.rank)}
                sx={{ bgcolor: getBingoRankColor(gameState.game.rank), color: '#fff', fontWeight: 700 }}
              />
              {timeRemaining && (
                <Chip
                  size="small"
                  label={timeRemaining}
                  sx={{ borderColor: theme.palette.background.paper }}
                  variant="outlined"
                  aria-live="polite"
                />
              )}
            </Stack>
          </Box>
          <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap alignItems="center">
            {actionButtons('small')}
            {!embedded && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => navigate('/bingo')}
                sx={{ borderColor: theme.palette.background.paper, color: theme.palette.primary.main, ...bingoFocusRingSx }}
                aria-label="Return to bingo lobby"
              >
                Back to Bingo
              </Button>
            )}
            {embedded && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => navigate(`/bingo/${gameState.game.id}`)}
                sx={{ borderColor: theme.palette.background.paper, color: theme.palette.primary.main, ...bingoFocusRingSx }}
                aria-label="Open full game page"
              >
                Full Page
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      {actionError && (
        <Alert severity="error" onClose={() => setActionError(null)} sx={{ mb: 1.5 }}>
          {actionError}
        </Alert>
      )}

      {/* Lobby settings */}
      {gameState.game.status === 'lobby' && (
        <Paper
          sx={{
            p: { xs: 1.5, md: embedded ? 1.5 : 2 },
            mb: 1.5,
            border: `1px solid ${theme.palette.background.paper}`,
            bgcolor: 'rgba(14, 22, 42, 0.74)',
            color: theme.palette.primary.main,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
            Game Settings
          </Typography>
          {userIsHost ? (
            <Stack spacing={1.5}>
              <Box>
                <ToggleButtonGroup
                  size="small"
                  value={gameState.game.mode === 'lockout' ? 'lockout' : 'bingo'}
                  exclusive
                  onChange={(_, value) => {
                    if (value) handleUpdateSettings({ mode: value })
                  }}
                  sx={{
                    bgcolor: 'rgba(7, 12, 24, 0.64)',
                    borderRadius: 1.5,
                    p: 0.3,
                    '& .MuiToggleButton-root': { px: 1.15, py: 0.45, fontWeight: 700 },
                  }}
                >
                  <ToggleButton value="bingo" sx={getBingoColorToggleSx(theme.palette.secondary.main)}>
                    Reclaim
                  </ToggleButton>
                  <ToggleButton value="lockout" sx={getBingoColorToggleSx(theme.palette.error.main)}>
                    Lockout
                  </ToggleButton>
                </ToggleButtonGroup>
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: theme.palette.primary.contrastText }}>
                  {gameState.game.mode === 'lockout' ? 'Lockout: first claim is permanent.' : 'Reclaim: squares can be stolen.'}
                </Typography>
              </Box>
              <Box>
                <ToggleButtonGroup
                  size="small"
                  value={(gameState.game.rank || 'bronze') as RankName}
                  exclusive
                  onChange={(_, value) => {
                    if (value) handleUpdateSettings({ rank: value })
                  }}
                  sx={{
                    bgcolor: 'rgba(7, 12, 24, 0.64)',
                    borderRadius: 1.5,
                    p: 0.3,
                    flexWrap: 'wrap',
                    '& .MuiToggleButton-root': { px: 1.15, py: 0.45, fontWeight: 700 },
                  }}
                >
                  {RANK_ORDER.map((rank) => (
                    <ToggleButton key={rank} value={rank} sx={getBingoRankToggleSx(rank)}>
                      {RANK_LABELS[rank]}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: theme.palette.primary.contrastText }}>
                  Time limit
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    size="small"
                    type="number"
                    value={Math.floor((gameState.game.timeLimitSeconds ?? 10800) / 3600)}
                    onChange={(e) => {
                      const h = Math.max(0, Math.min(24, parseInt(e.target.value) || 0))
                      const m = Math.round(((gameState.game.timeLimitSeconds ?? 10800) % 3600) / 60)
                      const total = h * 3600 + m * 60
                      if (total >= 60) handleUpdateSettings({ timeLimitSeconds: Math.min(total, 86400) })
                    }}
                    inputProps={{ min: 0, max: 24 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Typography variant="caption" sx={{ color: theme.palette.primary.contrastText }}>
                            h
                          </Typography>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      width: 80,
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(7, 12, 24, 0.64)',
                        color: theme.palette.primary.main,
                        '& fieldset': { borderColor: theme.palette.background.paper },
                      },
                    }}
                  />
                  <TextField
                    size="small"
                    type="number"
                    value={Math.round(((gameState.game.timeLimitSeconds ?? 10800) % 3600) / 60)}
                    onChange={(e) => {
                      const m = Math.max(0, Math.min(59, parseInt(e.target.value) || 0))
                      const h = Math.floor((gameState.game.timeLimitSeconds ?? 10800) / 3600)
                      const total = h * 3600 + m * 60
                      if (total >= 60) handleUpdateSettings({ timeLimitSeconds: Math.min(total, 86400) })
                    }}
                    inputProps={{ min: 0, max: 59 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Typography variant="caption" sx={{ color: theme.palette.primary.contrastText }}>
                            m
                          </Typography>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      width: 80,
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(7, 12, 24, 0.64)',
                        color: theme.palette.primary.main,
                        '& fieldset': { borderColor: theme.palette.background.paper },
                      },
                    }}
                  />
                </Stack>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: theme.palette.primary.contrastText }}>
                  Join mode
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <ToggleButtonGroup
                    size="small"
                    value={gameState.game.joinMode || 'closed'}
                    exclusive
                    onChange={(_, value) => {
                      if (value) handleUpdateSettings({ joinMode: value })
                    }}
                    sx={{
                      bgcolor: theme.palette.primary.light,
                      borderRadius: 1.5,
                      p: 0.3,
                      '& .MuiToggleButton-root': { px: 1.15, py: 0.45, fontWeight: 700 },
                    }}
                  >
                    <ToggleButton value="closed">
                      <LockIcon sx={{ fontSize: 14, mr: 0.5 }} />
                      Closed
                    </ToggleButton>
                    <ToggleButton value="free">
                      <LockOpenIcon sx={{ fontSize: 14, mr: 0.5 }} />
                      Free Join
                    </ToggleButton>
                    <ToggleButton value="code">
                      <VpnKeyIcon sx={{ fontSize: 14, mr: 0.5 }} />
                      With Code
                    </ToggleButton>
                  </ToggleButtonGroup>
                  {gameState.game.joinMode === 'code' && gameState.game.joinCode && (
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.5}
                      sx={{
                        bgcolor: 'rgba(7, 12, 24, 0.64)',
                        border: `1px solid ${theme.palette.background.paper}`,
                        borderRadius: 1,
                        px: 1.2,
                        py: 0.4,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 2, color: theme.palette.primary.main }}
                      >
                        {'•'.repeat(gameState.game.joinCode.length)}
                      </Typography>
                      <Tooltip title={codeCopied ? 'Copied!' : 'Copy code'} placement="top">
                        <IconButton
                          size="small"
                          onClick={() => {
                            navigator.clipboard.writeText(gameState.game.joinCode!)
                            setCodeCopied(true)
                            setTimeout(() => setCodeCopied(false), 2000)
                          }}
                          sx={{ color: codeCopied ? theme.palette.success.main : theme.palette.primary.contrastText, p: 0.3 }}
                        >
                          <ContentCopyIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  )}
                </Stack>
              </Box>
              {gameState.teams && gameState.teams.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.75, color: theme.palette.primary.contrastText }}>
                    Team Management
                  </Typography>
                  <BingoTeamManager
                    gameId={gameState.game.id}
                    members={gameState.members}
                    teams={gameState.teams}
                    teamSwapMode={gameState.teamSwapMode || 'locked'}
                    isHost={true}
                    currentUserUuid={counter?.uuid}
                  />
                </Box>
              )}
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                label={gameState.game.mode === 'lockout' ? 'Lockout' : 'Reclaim'}
                sx={{
                  bgcolor:
                    gameState.game.mode === 'lockout' ? `${theme.palette.secondary.main}22` : `${theme.palette.secondary.main}22`,
                  color: gameState.game.mode === 'lockout' ? theme.palette.error.main : theme.palette.secondary.main,
                  border: `1px solid ${gameState.game.mode === 'lockout' ? theme.palette.error.main : theme.palette.secondary.main}66`,
                  fontWeight: 700,
                }}
              />
              <Chip
                size="small"
                label={`Rank: ${getBingoRankLabel(gameState.game.rank)}`}
                sx={{ bgcolor: getBingoRankColor(gameState.game.rank), color: '#fff', fontWeight: 700 }}
              />
              {gameState.game.timeLimitSeconds && (
                <Chip
                  size="small"
                  label={`Time: ${formatSeconds(gameState.game.timeLimitSeconds)}`}
                  variant="outlined"
                  sx={{ borderColor: theme.palette.background.paper, color: theme.palette.primary.contrastText }}
                />
              )}
              {gameState.game.joinMode === 'free' && (
                <Chip
                  size="small"
                  label="Open to join"
                  sx={{
                    bgcolor: `${theme.palette.success.main}22`,
                    color: theme.palette.success.main,
                    border: `1px solid ${theme.palette.success.main}66`,
                  }}
                />
              )}
              {gameState.game.joinMode === 'code' && (
                <Chip
                  size="small"
                  label="Join with code"
                  sx={{
                    bgcolor: `${theme.palette.warning.main}22`,
                    color: theme.palette.warning.main,
                    border: `1px solid ${theme.palette.warning.main}66`,
                  }}
                />
              )}
              <Typography variant="caption" sx={{ color: theme.palette.primary.contrastText, alignSelf: 'center' }}>
                Waiting on host to start.
              </Typography>
            </Stack>
          )}
        </Paper>
      )}

      {/* Game ended banner */}
      {gameEndedEvent && (
        <Paper
          sx={{
            p: 1.3,
            mb: 1.5,
            border: `1px solid ${theme.palette.success.main}`,
            bgcolor: 'rgba(26, 59, 45, 0.55)',
            color: theme.palette.primary.main,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            Game Over
          </Typography>
          <Typography variant="body2">Winning team size: {gameEndedEvent.winnerTeamSize || 0}</Typography>
        </Paper>
      )}

      {/* Board + sidebar */}
      <Grid container spacing={embedded ? 1 : 2}>
        <Grid item xs={12} lg={embedded ? 12 : 9}>
          <Paper
            sx={{
              p: embedded ? 1 : 2,
              mb: embedded ? 1 : 2,
              border: `1.5px solid ${alpha(theme.palette.secondary.main, 0.4)}`,
              boxShadow: `0 0 0 1px ${alpha(theme.palette.secondary.main, 0.12)}`,
              bgcolor: 'rgba(14, 22, 42, 0.72)',
              color: theme.palette.primary.main,
            }}
          >
            {!embedded && (
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h5">Board</Typography>
                <ToggleButtonGroup
                  size="small"
                  value={boardVariant}
                  exclusive
                  onChange={(_, v) => {
                    if (v) setBoardVariant(v)
                  }}
                >
                  <ToggleButton value="small">Small</ToggleButton>
                  <ToggleButton value="large">Large</ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            )}
            <BingoBoard
              squares={gameState.squares}
              members={gameState.members}
              variant={embedded ? 'small' : boardVariant}
              winningLines={gameState.game.winningLines || gameEndedEvent?.winningLines || null}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} lg={embedded ? 12 : 3}>
          <Paper
            sx={{
              p: 1.5,
              mb: embedded ? 1 : 2,
              border: `1px solid ${alpha(theme.palette.background.paper, 0.7)}`,
              bgcolor: 'rgba(14, 22, 42, 0.5)',
              color: theme.palette.primary.contrastText,
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 0.75, fontWeight: 700 }}>
              Members
            </Typography>
            <Divider sx={{ mb: 1.5, borderColor: alpha(theme.palette.background.paper, 0.7) }} />
            {gameState.teams && gameState.teams.length > 0 ? (
              <BingoTeamManager
                gameId={gameState.game.id}
                members={gameState.members}
                teams={gameState.teams}
                teamSwapMode={gameState.teamSwapMode || 'locked'}
                isHost={userIsHost}
                currentUserUuid={counter?.uuid}
              />
            ) : (
              <BingoTeamList members={gameState.members} />
            )}
          </Paper>

          {gameState.game.status !== 'lobby' && (
            <Paper
              sx={{
                p: 1.5,
                mb: embedded ? 1 : 2,
                border: `1px solid ${alpha(theme.palette.background.paper, 0.7)}`,
                bgcolor: 'rgba(14, 22, 42, 0.5)',
                color: theme.palette.primary.contrastText,
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 0.75, fontWeight: 700 }}>
                Recent Unlocks
              </Typography>
              <Divider sx={{ mb: 1.5, borderColor: alpha(theme.palette.background.paper, 0.7) }} />
              {recentUnlocks.length === 0 ? (
                <Typography variant="body2">No unlocks yet.</Typography>
              ) : (
                <Stack spacing={1}>
                  {recentUnlocks.map((unlock) => (
                    <Paper
                      key={`${unlock.gameId}-${unlock.unlockSeq ?? `${unlock.squareId}-${unlock.unlockedAt}`}`}
                      variant="outlined"
                      sx={{
                        p: 1,
                        borderColor: theme.palette.background.paper,
                        bgcolor: 'rgba(17, 29, 54, 0.78)',
                        animation: 'bingoFeedIn 220ms ease-out',
                        '@keyframes bingoFeedIn': {
                          '0%': { opacity: 0, transform: 'translateY(-6px)' },
                          '100%': { opacity: 1, transform: 'translateY(0)' },
                        },
                      }}
                      aria-live="polite"
                    >
                      <Typography variant="body2">
                        {unlock.unlockerUsername || unlock.unlockerUserUuid || 'Unknown'} unlocked {unlock.challengeType} (#
                        {unlock.index + 1})
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Paper>
          )}

          {gameState.game.status === 'finished' && (
            <Paper
              sx={{
                p: 1.5,
                border: `1px solid ${alpha(theme.palette.background.paper, 0.7)}`,
                bgcolor: 'rgba(14, 22, 42, 0.5)',
                color: theme.palette.primary.contrastText,
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 0.75, fontWeight: 700 }}>
                Result
              </Typography>
              <Divider sx={{ mb: 1.5, borderColor: alpha(theme.palette.background.paper, 0.7) }} />
              <Typography variant="body2">
                Winner: {gameState.game.winnerUsername || gameState.game.winnerUserUuid || 'Unknown'}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>
                Team size: {gameState.game.winnerTeamSize || 0}
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Join code dialog */}
      <Dialog
        open={joinDialogOpen}
        onClose={() => {
          setJoinDialogOpen(false)
          setJoinCodeInput('')
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Enter Join Code</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Code"
            value={joinCodeInput}
            onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && joinCodeInput.trim()) handleJoin(joinCodeInput.trim())
            }}
            inputProps={{ style: { fontFamily: 'monospace', letterSpacing: 3, fontWeight: 700 } }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setJoinDialogOpen(false)
              setJoinCodeInput('')
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" disabled={!joinCodeInput.trim()} onClick={() => handleJoin(joinCodeInput.trim())}>
            Join
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mobile action bar — only in full-page mode */}
      {!embedded && (
        <Paper
          sx={{
            display: { xs: 'block', md: 'none' },
            position: 'fixed',
            left: 10,
            right: 10,
            bottom: 10,
            p: 1,
            zIndex: 1200,
            border: `1px solid ${theme.palette.background.paper}`,
            bgcolor: 'rgba(10, 17, 33, 0.92)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <Stack direction="row" spacing={0.8} sx={{ width: '100%' }}>
            {actionButtons('small')}
            <Button
              size="small"
              variant="outlined"
              onClick={() => navigate('/bingo')}
              sx={{ flex: 1, borderColor: theme.palette.background.paper, color: theme.palette.primary.main, ...bingoFocusRingSx }}
              aria-label="Return to bingo lobby"
            >
              Back
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  )
}
