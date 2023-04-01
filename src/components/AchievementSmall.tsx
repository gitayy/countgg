import { Card, Box, CardMedia, CardContent, Typography, Tooltip, CardActions } from "@mui/material";
import { AchievementType, CounterAchievementType } from "../utils/types";
import HelpIcon from '@mui/icons-material/Help';
import CountggLogo from '../assets/countgg-128.png'
import { LinearProgressWithLabel } from "../utils/styles";
// import ProgressBar from 'react-bootstrap/ProgressBar';

interface Props {
    achievement: AchievementType;
    locked: boolean;
    counterAchievement?: CounterAchievementType
  }

export function AchievementSmall({ achievement, locked, counterAchievement }: Props) {

    return (
    <Card sx={{ display: 'flex', borderRadius: '16px', boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.1)', opacity: locked ? '0.75' : '1' }} raised>
    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
      <CardMedia
        component="img"
        sx={{ filter: locked ? 'grayscale(100%)' : '',  width: '33.33%', maxWidth: '128px', borderTopLeftRadius: '16px', borderBottomLeftRadius: '16px', objectFit: 'contain', p: 1 }}
        image={achievement.icon ? achievement.icon : CountggLogo}
        alt={achievement.name}
      />
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
          {/* {counterAchievement && !counterAchievement.isComplete && <ProgressBar label={counterAchievement.progress > 0 && `${counterAchievement.progress}`} now={counterAchievement.progress} max={achievement.maxProgress} />} */}
          {/* {counterAchievement && counterAchievement.isComplete && <ProgressBar variant="success" label={`Complete`} now={1} max={1} />} */}
          {counterAchievement && !counterAchievement.isComplete && counterAchievement.progress !== undefined && achievement.maxProgress !== undefined && <LinearProgressWithLabel color="success" progress={counterAchievement.progress} max={achievement.maxProgress} />}
          {counterAchievement && counterAchievement.isComplete && <LinearProgressWithLabel color="success" progress={1} max={1} />}
        </CardContent>
        <CardActions sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Typography variant="body2" color="text.secondary">
            Counters with achievement: {achievement.countersEarned}
          </Typography>
        </CardActions>
      </Box>
    </Box>
  </Card>
    )
}