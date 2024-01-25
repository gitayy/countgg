import { alpha, Box, LinearProgress, LinearProgressProps, ListItemButton, Typography, useTheme } from "@mui/material";
import { borderRadius } from "@mui/system";

export const ListButton = (props) => {
    const theme = useTheme();
    return <ListItemButton sx={{
        fontSize: '22px',
        bgcolor: alpha(theme.palette.background.paper, 0.2),
        color: theme.palette.text.primary
    }}> {props.children} </ListItemButton>
}

export function LinearProgressWithLabel(props: LinearProgressProps & { color: string, progress: number, max: number, dontUseComplete?: boolean } = {color: 'primary', progress: 0, max: 100, dontUseComplete: false}) {
    const normalise = Math.min(((props.progress) * 100) / (props.max), 100);
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', filter: 'none' }}>
        <Box sx={{ width: '100%', mr: 1 }}>
          {/* <LinearProgress variant="determinate" {...props} /> */}
          <LinearProgress sx={{borderRadius: '5px', height: 10}} variant="determinate" color={props.color} value={normalise} />
        </Box>
        <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">{normalise >= 100 ? (!props.dontUseComplete ? `Complete` : `${props.progress.toLocaleString()}/${props.max.toLocaleString()}`) : `${props.progress.toLocaleString()}/${props.max.toLocaleString()}`}</Typography>
          {/* <Typography variant="body2" color="text.secondary">{`${Math.round(
            props.progress,
          )}%`}</Typography> */}
        </Box>
      </Box>
    );
  }