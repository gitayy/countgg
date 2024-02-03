import { createContext } from 'react'

type SnackbarContextType = {
  snack?: object
  setSnack?: Function
}

export const SnackbarContext = createContext<SnackbarContextType>({})
