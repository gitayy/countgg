import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, Chip, Paper, Stack, Typography, useTheme } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { SocketContext } from '../../utils/contexts/SocketContext'
import { UserContext } from '../../utils/contexts/UserContext'
import { BingoBoard, BingoMember, BingoSquare } from './BingoBoard'
import { BingoTeamList } from './BingoTeamList'
import { bingoThemeTokens } from './bingoTheme'

type BingoGameState = {
  game: {
    id: number
    status: string
    endsAt?: number
    allowJoin: boolean
    hostUserUuid: string
    winnerUsername?: string | null
  }
  members: BingoMember[]
  squares: BingoSquare[]
}

type Props = {
  title?: string
}

const STORAGE_KEY = 'bingo_active_game_id'

export const BingoMiniWidget = ({ title = 'Bingo' }: Props) => {
  const theme = useTheme()
  const socket = useContext(SocketContext)
  const { counter } = useContext(UserContext)
  const navigate = useNavigate()
  const [activeGameId, setActiveGameId] = useState<number | null>(null)
  const [gameState, setGameState] = useState<BingoGameState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now())
  const activeGameIdRef = useRef<number | null>(null)

  const isMember = useMemo(() => {
    if (!counter || !gameState) {
      return false
    }
    return gameState.members.some((member) => member.counter.uuid === counter.uuid)
  }, [counter, gameState])

  const stateBanner = useMemo(() => {
    if (!gameState?.game) {
      return null
    }
    if (gameState.game.status === 'finished') {
      return 'Finished'
    }
    return isMember ? 'In Game' : 'Spectating'
  }, [gameState, isMember])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const timeRemainingLabel = useMemo(() => {
    if (!gameState?.game?.endsAt) {
      return null
    }
    const diff = Math.max(0, gameState.game.endsAt - now)
    if (diff >= 3600000) {
      const mins = Math.ceil(diff / 60000)
      const hours = Math.floor(mins / 60)
      const remMins = mins % 60
      return `${hours}h ${remMins}m`
    }
    const totalSeconds = Math.max(0, Math.floor(diff / 1000))
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
    const ss = String(totalSeconds % 60).padStart(2, '0')
    return `${mm}:${ss}`
  }, [gameState, now])

  useEffect(() => {
    activeGameIdRef.current = activeGameId
  }, [activeGameId])

  useEffect(() => {
    if (!socket) {
      return
    }

    const storedId = Number(window.localStorage.getItem(STORAGE_KEY))
    if (storedId > 0) {
      setActiveGameId(storedId)
      activeGameIdRef.current = storedId
      socket.emit('bingo_game', { gameId: storedId })
    }
    socket.emit('bingo_active')

    const handleActive = (data: { gameId?: number | null }) => {
      if (data?.gameId && Number(data.gameId) > 0) {
        const gameId = Number(data.gameId)
        setActiveGameId(gameId)
        activeGameIdRef.current = gameId
        window.localStorage.setItem(STORAGE_KEY, gameId.toString())
        socket.emit('bingo_game', { gameId })
      } else {
        setActiveGameId(null)
        activeGameIdRef.current = null
        setGameState(null)
        setError(null)
        window.localStorage.removeItem(STORAGE_KEY)
      }
    }

    const handleActionResult = (payload: any) => {
      const gameId = Number(payload?.result?.gameId)
      if (gameId > 0) {
        setActiveGameId(gameId)
        activeGameIdRef.current = gameId
        window.localStorage.setItem(STORAGE_KEY, gameId.toString())
        socket.emit('bingo_game', { gameId })
      }
    }

    const handleGame = (data: any) => {
      if (data?.error) {
        setError(data.error)
        setGameState(null)
        return
      }
      const currentGameId = activeGameIdRef.current
      if (data?.game?.id && currentGameId && data.game.id !== currentGameId) {
        return
      }
      if (data?.game?.id && !currentGameId) {
        setActiveGameId(Number(data.game.id))
        activeGameIdRef.current = Number(data.game.id)
        window.localStorage.setItem(STORAGE_KEY, String(data.game.id))
      }
      setError(null)
      setGameState({
        ...data,
        game: data.game ? { ...data.game } : data.game,
        members: Array.isArray(data.members) ? [...data.members] : [],
        squares: Array.isArray(data.squares) ? [...data.squares] : [],
      })
    }

    const handleGameUpdate = (data: { gameId: number; payload?: BingoGameState }) => {
      const currentGameId = activeGameIdRef.current
      if (!currentGameId || data.gameId !== currentGameId) {
        return
      }
      if (data.payload) {
        setGameState({
          ...data.payload,
          game: data.payload.game ? { ...data.payload.game } : data.payload.game,
          members: Array.isArray(data.payload.members) ? [...data.payload.members] : [],
          squares: Array.isArray(data.payload.squares) ? [...data.payload.squares] : [],
        })
      } else {
        socket.emit('bingo_game', { gameId: currentGameId })
      }
    }

    socket.on('bingo_active', handleActive)
    socket.on('bingo_action_result', handleActionResult)
    socket.on('bingo_game', handleGame)
    socket.on('bingo_game_update', handleGameUpdate)

    return () => {
      socket.off('bingo_active', handleActive)
      socket.off('bingo_action_result', handleActionResult)
      socket.off('bingo_game', handleGame)
      socket.off('bingo_game_update', handleGameUpdate)
    }
  }, [socket])

  if (!counter) {
    return null
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        mb: 2,
        borderColor: theme.palette.background.paper,
        bgcolor: 'rgba(14, 22, 42, 0.72)',
        color: theme.palette.primary.main,
      }}
    >
      {activeGameId && gameState && stateBanner && (
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
          <Chip
            size="small"
            label={stateBanner}
            sx={{
              bgcolor: stateBanner === 'Finished' ? `${theme.palette.success.main}24` : `${theme.palette.secondary.main}24`,
              color: stateBanner === 'Finished' ? theme.palette.success.main : theme.palette.secondary.main,
              border: `1px solid ${stateBanner === 'Finished' ? `${theme.palette.success.main}66` : `${theme.palette.secondary.main}66`}`,
            }}
          />
          {timeRemainingLabel && (
            <Typography variant="caption" sx={{ color: theme.palette.primary.contrastText, fontWeight: 700 }}>
              {timeRemainingLabel}
            </Typography>
          )}
        </Stack>
      )}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Button
          size="small"
          sx={{ textTransform: 'none', px: 0.5, minWidth: 0 }}
          onClick={() => navigate(activeGameId ? `/bingo/${activeGameId}` : '/bingo')}
        >
          {activeGameId ? `Bingo Game #${activeGameId}` : title}
        </Button>
        {activeGameId && gameState && (
          <Typography variant="caption" sx={{ textAlign: 'right', color: theme.palette.primary.contrastText }}>
            {gameState.game.status}
          </Typography>
        )}
      </Stack>

      {!activeGameId && (
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            No active game yet.
          </Typography>
          <Button size="small" variant="contained" onClick={() => navigate('/bingo')}>
            Create / Join
          </Button>
        </Box>
      )}

      {error && (
        <Typography variant="body2" color="error" sx={{ mb: 1 }}>
          {error}
        </Typography>
      )}

      {activeGameId && gameState && (
        <>
          <Box sx={{ mt: 1 }}>
            <BingoTeamList members={gameState.members} compact />
          </Box>
          <BingoBoard squares={gameState.squares} members={gameState.members} variant="small" />
        </>
      )}
    </Paper>
  )
}
