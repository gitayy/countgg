import { Box, CircularProgress, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useSocketStatus } from '../utils/hooks/useSocketStatus'

type LoadingStatus = {
  label: string
  ready: boolean
}

type LoadingProps = {
  mini?: boolean
  statuses?: LoadingStatus[]
  statusDelayMs?: number
  statusStepMs?: number
}

export function Loading(props: LoadingProps) {
  const connected = useSocketStatus()
  const [showStatuses, setShowStatuses] = useState(false)
  const [visibleStatusCount, setVisibleStatusCount] = useState(0)
  const statusDelayMs = props.statusDelayMs ?? 1400
  const statusStepMs = props.statusStepMs ?? 200
  const statuses = useMemo(() => props.statuses ?? [], [props.statuses])

  useEffect(() => {
    setShowStatuses(false)
    setVisibleStatusCount(0)
    const timeoutId = setTimeout(() => {
      setShowStatuses(true)
      setVisibleStatusCount(statuses.length > 0 ? 1 : 0)
    }, statusDelayMs)

    return () => clearTimeout(timeoutId)
  }, [statusDelayMs, statuses.length])

  useEffect(() => {
    if (!showStatuses || statuses.length <= 1) {
      return
    }

    const intervalId = setInterval(() => {
      setVisibleStatusCount((current) => {
        if (current >= statuses.length) {
          clearInterval(intervalId)
          return current
        }
        return current + 1
      })
    }, statusStepMs)

    return () => clearInterval(intervalId)
  }, [showStatuses, statusStepMs, statuses.length])

  return (
    <Box
      sx={{
        bgcolor: props.mini ? 'initial' : 'primary.light',
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <CircularProgress color="secondary" size="200px" />

      {showStatuses && (
        <Typography
          variant="body2"
          color={connected ? 'success.main' : 'error.main'}
          sx={{ fontFamily: 'monospace' }}
        >
          Socket: {connected ? 'Connected' : 'Disconnected 🥀'}
        </Typography>
      )}

      {showStatuses &&
        statuses.slice(0, visibleStatusCount).map((status) => (
          <Typography
            key={status.label}
            variant="body2"
            color={status.ready ? 'success.main' : 'warning.main'}
            sx={{ fontFamily: 'monospace' }}
          >
            {status.label}: {status.ready ? 'Ready' : 'Loading'}
          </Typography>
        ))}
    </Box>
  )
}
