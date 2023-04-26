import { Box, Button } from "@mui/material"
import { useState } from "react"

export const TheRockPage = () => {

    const [okScale, setOkScale] = useState(100.0);

    const handlePress = () => {
        setOkScale(prevScale => {return prevScale + 1})
    }

return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.paper', color: 'text.primary', flexGrow: 1, p: 2, background: 'url("https://i.imgur.com/ByxzxU4.jpg")', backgroundRepeat: 'no-repeat', backgroundSize: '100% 100%',}}>
  <Button onClick={() => handlePress()} variant="contained" color="primary" sx={{scale: `${okScale}%`, height: 'fit-content'}}>
    Ok
  </Button>
    </Box>
    )
  }
