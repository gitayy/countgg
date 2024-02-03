import React, { useState } from 'react'
import { Container, FormControl, InputLabel, Input, Button, Snackbar, Box, AlertColor } from '@mui/material'
import { Alert } from '@mui/material'
import { adminCreateNewItem } from '../utils/api'

const AdminNewItemPage = () => {
  const [name, setName] = useState('')
  const [internalName, setInternalName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [unlockMethod, setUnlockMethod] = useState('')
  const [unlockDescription, setUnlockDescription] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [levelToUnlock, setLevelToUnlock] = useState('')
  const [achievementId, setAchievementId] = useState('')

  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState('error')

  const handleClose = () => {
    setSnackbarOpen(false)
  }

  const sendValues = async () => {
    try {
      // Convert necessary values to appropriate types (e.g., number)
      const parsedPrice = parseFloat(price)
      const parsedQuantity = parseInt(quantity)
      const parsedLevelToUnlock = parseInt(levelToUnlock)
      const parsedAchievementId = parseInt(achievementId)

      // Call your admin API function to create a new item
      const res = await adminCreateNewItem(
        name,
        internalName,
        description,
        category,
        unlockMethod,
        unlockDescription,
        parsedPrice,
        parsedQuantity,
        parsedLevelToUnlock,
        parsedAchievementId,
      )

      if (res.status === 201) {
        setSnackbarSeverity('success')
        setSnackbarOpen(true)
        setSnackbarMessage('Item created successfully')
      }
    } catch (err) {
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
      setSnackbarMessage('Error: Item creation failed')
    }
  }

  return (
    <Container maxWidth="xl" sx={{ bgcolor: 'primary.light', flexGrow: 1, p: 2 }}>
      <Box sx={{ bgcolor: 'white', color: 'black', p: 3 }}>
        {/* Input fields for item attributes */}
        <FormControl variant="standard" sx={{}}>
          <InputLabel htmlFor="name" shrink>
            Name
          </InputLabel>
          <Input onInput={(e) => setName((e.target as HTMLInputElement).value)} value={name} id="name" />
        </FormControl>
        <FormControl variant="standard" sx={{}}>
          <InputLabel htmlFor="internalName" shrink>
            Internal Name
          </InputLabel>
          <Input onInput={(e) => setInternalName((e.target as HTMLInputElement).value)} value={internalName} id="internalName" />
        </FormControl>
        <FormControl variant="standard" sx={{}}>
          <InputLabel htmlFor="description" shrink>
            Description
          </InputLabel>
          <Input onInput={(e) => setDescription((e.target as HTMLInputElement).value)} value={description} id="description" />
        </FormControl>
        <FormControl variant="standard" sx={{}}>
          <InputLabel htmlFor="category" shrink>
            Category
          </InputLabel>
          <Input onInput={(e) => setCategory((e.target as HTMLInputElement).value)} value={category} id="category" />
        </FormControl>
        <FormControl variant="standard" sx={{}}>
          <InputLabel htmlFor="unlockMethod" shrink>
            Unlock Method
          </InputLabel>
          <Input onInput={(e) => setUnlockMethod((e.target as HTMLInputElement).value)} value={unlockMethod} id="unlockMethod" />
        </FormControl>
        <FormControl variant="standard" sx={{}}>
          <InputLabel htmlFor="unlockDescription" shrink>
            Unlock Description
          </InputLabel>
          <Input
            onInput={(e) => setUnlockDescription((e.target as HTMLInputElement).value)}
            value={unlockDescription}
            id="unlockDescription"
          />
        </FormControl>
        <FormControl variant="standard" sx={{}}>
          <InputLabel htmlFor="price" shrink>
            Price
          </InputLabel>
          <Input onInput={(e) => setPrice((e.target as HTMLInputElement).value)} value={price} id="price" />
        </FormControl>
        <FormControl variant="standard" sx={{}}>
          <InputLabel htmlFor="quantity" shrink>
            Quantity
          </InputLabel>
          <Input onInput={(e) => setQuantity((e.target as HTMLInputElement).value)} value={quantity} id="quantity" />
        </FormControl>
        <FormControl variant="standard" sx={{}}>
          <InputLabel htmlFor="levelToUnlock" shrink>
            Level to Unlock
          </InputLabel>
          <Input onInput={(e) => setLevelToUnlock((e.target as HTMLInputElement).value)} value={levelToUnlock} id="levelToUnlock" />
        </FormControl>
        <FormControl variant="standard" sx={{}}>
          <InputLabel htmlFor="achievementId" shrink>
            Achievement ID
          </InputLabel>
          <Input onInput={(e) => setAchievementId((e.target as HTMLInputElement).value)} value={achievementId} id="achievementId" />
        </FormControl>
        <Button variant="contained" onClick={sendValues}>
          Submit
        </Button>
        {/* Snackbar for showing success/error messages */}
        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleClose}>
          <Alert severity={(snackbarSeverity as AlertColor) || 'error'} onClose={handleClose}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  )
}

export default AdminNewItemPage
