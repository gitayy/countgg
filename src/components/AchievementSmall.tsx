import { Card, Box, CardMedia, CardContent, Typography, Tooltip, CardActions, LinearProgress, useTheme } from "@mui/material";
import { AchievementType, CounterAchievementType } from "../utils/types";
import HelpIcon from '@mui/icons-material/Help';
import CountggLogo from '../assets/countgg-128.png'
import { LinearProgressWithLabel } from "../utils/styles";

interface Props {
    ofall?: number;
    achievement: AchievementType;
    locked: boolean;
    counterAchievement?: CounterAchievementType
  }

export function AchievementSmall({ ofall, achievement, locked, counterAchievement }: Props) {

  const percentage = (achievement.countersEarned / (ofall ? ofall : 1)) * 100;

const getColor = () => {
  if (percentage >= 50) {
    return 'primary'; // Green color for >= 80%
  } else if (percentage >= 40) {
    return 'info'; // Blue color for >= 60% and < 80%
  } else if (percentage >= 20) {
    return 'secondary'; // Red color for >= 40% and < 60%
  } else if (percentage >= 5) {
    return 'warning'; // Orange color for >= 20% and < 40%
  } else {
    return 'error'; // Grey color for < 20%
  }
};

const color = getColor();
const theme = useTheme();

    return (
    <Card sx={{ display: 'flex', borderRadius: '16px', border: `2px solid ${theme.palette[color].main}`, bgcolor: theme.palette.background.paper, boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.1)', opacity: locked ? '0.75' : '1' }} raised>
    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', background: `${theme.palette[color].main}30` }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexGrow: 1, p: 2 }}>
        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            {achievement.name}
          </Typography>
          {achievement.description && (
            <Typography variant="body2" color="text.secondary">
              {achievement.description}
            </Typography>
          )}
          {!achievement.isPublic && !achievement.description && (
            <Typography variant="body2" color="text.secondary">
              <Tooltip title="Secret achievement">
                <HelpIcon sx={{ fontSize: '0.875rem' }} />
              </Tooltip>
            </Typography>
          )}
          {counterAchievement && !counterAchievement.isComplete && counterAchievement.progress !== undefined && achievement.maxProgress !== undefined && <LinearProgressWithLabel color="success" progress={counterAchievement.progress} max={achievement.maxProgress} />}
          {counterAchievement && counterAchievement.isComplete && <LinearProgressWithLabel color="success" progress={1} max={1} />}
        </CardContent>
        <CardActions sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Typography variant="body2" color="text.secondary" sx={{display: "flex", flexDirection: "column"}}>
            {ofall ? `${achievement.countersEarned} / ${ofall} (${Math.round((achievement.countersEarned / ofall) * 10000) / 100}%)` : achievement.countersEarned}
            <LinearProgress variant="determinate" color={getColor()} value={percentage} sx={{borderRadius: '10px'}} />
          </Typography>
        </CardActions>
      </Box>
    </Box>
  </Card>
    )
}