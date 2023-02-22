import { Box, CircularProgress } from "@mui/material";


export function Loading(props) {

    return (
        <Box sx={{ bgcolor: 'primary.light', flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <CircularProgress color="secondary" size={'200px'} />
        </Box>
    )
}