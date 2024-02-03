import { useContext, useEffect, useState } from 'react'
import {
  Container,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Input,
  Alert,
  AlertColor,
  Snackbar,
  FormControlLabel,
  Checkbox,
  SelectChangeEvent,
  Typography,
} from '@mui/material'
import { useFetchAllThreads } from '../utils/hooks/useFetchAllThreads'
import { adminAwardAchievement, adminCreateThread, adminSendSystemMessage } from '../utils/api'
import { ThreadType } from '../utils/types'
import { UserContext } from '../utils/contexts/UserContext'

export const AdminSystemMessagePage = () => {
  const { counter, loading } = useContext(UserContext)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('error')

  const [message, setMessage] = useState('')

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return
    }
    setSnackbarOpen(false)
  }

  const sendValues = async () => {
    if (message && message.length > 0) {
      try {
        const res = await adminSendSystemMessage(message)
        if (res.status == 201) {
          setSnackbarSeverity('success')
          setSnackbarOpen(true)
          setSnackbarMessage('Message sent successfully')
        }
      } catch (err) {
        setSnackbarSeverity('error')
        setSnackbarOpen(true)
        setSnackbarMessage('Error: Submission rejected. If this comes as a surprise, please reach out to discord mods via DM!')
      }
    }
  }

  if (counter && counter.roles.includes('admin')) {
    return (
      <>
        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleClose}>
          <Alert severity={snackbarSeverity} onClose={handleClose}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
        <Container maxWidth="xl" sx={{ bgcolor: 'primary.light', flexGrow: 1, p: 2 }}>
          <Box sx={{ bgcolor: 'white', color: 'black', p: 3 }}>
            <FormControl variant="standard" sx={{}}>
              <InputLabel htmlFor="systemMessage" shrink>
                System Message
              </InputLabel>
              <Input
                onInput={(e) => setMessage((e.target as HTMLInputElement).value)}
                defaultValue={message}
                value={message}
                id="systemMessage"
              />
            </FormControl>
            <Button variant="contained" onClick={sendValues}>
              Submit
            </Button>
          </Box>
        </Container>
      </>
    )
  } else {
    return <div>Page Not Found</div>
  }
}
