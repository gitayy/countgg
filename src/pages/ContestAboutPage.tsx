import { Box, Paper, Typography } from '@mui/material'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { EmojiTest } from '../utils/helpers'

export const ContestAboutPage = () => {
  const location = useLocation()
  useEffect(() => {
    document.title = `Contest Info | Counting!`
    return () => {
      document.title = 'Counting!'
    }
  }, [location.pathname])

  return (
    <Box sx={{ bgcolor: 'background.paper', color: 'text.primary', flexGrow: 1, p: 2 }}>
      <Typography sx={{ mb: 1.5 }} variant="h4">
        Contest Info
      </Typography>
    </Box>
  )
}
