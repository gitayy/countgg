import { makeStyles, Box, Typography, Button, useTheme, AlertColor, Alert, Snackbar } from '@mui/material'
import React, { useState } from 'react'
import { adminSendSystemMessage, unlockReward } from '../utils/api'
import giftPng from '../assets/gift.png'

interface GiftBoxProps {
  level: number
}

const GiftBox = ({ level }: GiftBoxProps) => {
  const theme = useTheme()
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('error')

  const useStyles = {
    giftBox: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      backgroundColor: theme.palette.primary.main,
      padding: theme.spacing(3),
      borderRadius: theme.shape.borderRadius,
      boxShadow: theme.shadows[3],
    },
    giftImage: {
      width: 200,
      height: 200,
      marginBottom: theme.spacing(2),
    },
  }
  const handleOpenClick = async () => {
    try {
      const res = await unlockReward(level)
      if (res.status == 201) {
        // console.log(`Item unlocked successfully!!!`);
        // console.log(res.data);
        // setSnackbarSeverity('success');
        // setSnackbarOpen(true)
        // setSnackbarMessage('Message sent successfully')
      }
    } catch (err) {
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
      setSnackbarMessage(`Error opening this gift. Reach out to admins if you see this and aren't trying to get a gift early.`)
    }
  }

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return
    }
    setSnackbarOpen(false)
  }

  return (
    <>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleClose}>
        <Alert severity={snackbarSeverity} onClose={handleClose}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <Box sx={useStyles.giftBox}>
        <Box component="img" src={giftPng} sx={{ cursor: 'pointer' }} onClick={handleOpenClick} className="threadcard" alt="Gift" />
        <Typography variant="h6" component="h2" gutterBottom>
          🎁 Level {level} Gift 🎁
        </Typography>
        {/* <Typography variant="body2" fontSize={12}>click to open</Typography> */}
        {/* <Button variant="contained" className="rainbow" onClick={handleOpenClick}>
        Open
      </Button> */}
      </Box>
    </>
  )
}

export default GiftBox
