import { Box, Button, Typography } from '@mui/material'
import { useContext, useEffect, useRef, useState } from 'react'
import { SocketContext } from '../utils/contexts/SocketContext'
import { useIsMounted } from '../utils/hooks/useIsMounted'

export const TheRockPage = () => {
  const [okScale, setOkScale] = useState(100.0)
  const [presses, setPresses] = useState(0)
  const reverse = useRef(false)
  const lastThrottle = useRef(performance.now())

  const socket = useContext(SocketContext)
  const isMounted = useIsMounted()

  const [socketStatus, setSocketStatus] = useState('LIVE')
  const [socketViewers, setSocketViewers] = useState(1)
  const [rockCount, setRockCount] = useState(0)

  useEffect(() => {
    if (isMounted.current) {
      socket.on('connect', () => {
        console.log('Connected to socket!')
        setSocketStatus('LIVE')
      })
      setSocketStatus('LIVE')

      socket.on('disconnect', () => {
        console.log('Disconnected from socket')
        setSocketStatus('DISCONNECTED')
        return
      })

      socket.on('reconnect', () => {
        console.log('Reconnected to socket.')
        setSocketStatus('LIVE')
      })
      socket.on('connect_error', (err) => {
        console.log(`connect_error due to ${err.message}`)
        setSocketStatus('DISCONNECTED')
      })
    }
  }, [])

  useEffect(() => {
    if (isMounted.current && socketStatus === 'LIVE') {
      socket.emit('watchRock')

      socket.on(`watcher_count`, function (data) {
        setSocketViewers(data)
      })

      socket.on(`rock_count`, function (data) {
        setRockCount(data)
      })
    }
  }, [socketStatus])

  const handlePress = () => {
    const now = performance.now()
    if (now > lastThrottle.current + 100) {
      lastThrottle.current = now
      socket.emit('rock')
      setPresses((prevPresses) => {
        return prevPresses + 1
      })
      setOkScale((prevScale) => {
        if (prevScale + 1 === 1101) {
          reverse.current = true
        } else if (prevScale - 1 === 99) {
          reverse.current = false
        }
        if (reverse.current) {
          return prevScale - 1
        } else {
          return prevScale + 1
        }
      })
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
        bgcolor: 'background.paper',
        color: 'text.primary',
        flexGrow: 1,
        p: 2,
        background: 'url("https://i.imgur.com/ByxzxU4.jpg")',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '100% 100%',
      }}
    >
      {presses > 0 && rockCount > 0 && (
        <Typography sx={{ position: 'absolute', bottom: 0, zIndex: 999 }}>{rockCount.toLocaleString()}</Typography>
      )}
      <Button onClick={() => handlePress()} variant="contained" color="primary" sx={{ scale: `${okScale}%`, height: 'fit-content' }}>
        {presses > 0 ? `Ok (${presses.toLocaleString()})` : 'Ok'}
      </Button>
    </Box>
  )
}
