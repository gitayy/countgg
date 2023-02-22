import { alpha, ListItemButton, useTheme } from "@mui/material";

export const ListButton = (props) => {
    const theme = useTheme();
    return <ListItemButton sx={{
        fontSize: '22px',
        bgcolor: alpha(theme.palette.background.paper, 0.2),
        color: theme.palette.text.primary
    }}> {props.children} </ListItemButton>
}