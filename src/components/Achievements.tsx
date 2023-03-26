import { Box, Card, CardActionArea, CardActions, CardContent, CardMedia, Grid, Link, Tooltip, Typography } from "@mui/material";
import HelpIcon from '@mui/icons-material/Help';
import CountggLogo from '../assets/countgg-128.png'
import { AchievementSmall } from "./AchievementSmall";
import { useNavigate } from "react-router-dom";
import { AchievementType, Counter, CounterAchievementType } from "../utils/types";

interface Props {
  achievements: AchievementType[];
  locked: boolean;
  counterAchievements?: CounterAchievementType[],
  counter?: Counter
}

export function Achievements({achievements, locked, counterAchievements, counter}: Props) {

  const navigate = useNavigate();

    const achievementList = achievements.map((achievement) => {

    const counter_achievement = counterAchievements && counter ? counterAchievements.find((counterachievement) => {return counterachievement.achievementId === achievement.id && counterachievement.counterUUID === counter.uuid }) : undefined

    return (
    <Grid item xs={12} md={6} lg={4} xl={3} sx={{p: 1, /*filter: locked ? 'grayscale(100%)' : '', opacity: locked ? '0.75' : '1'*/}}>
      <Link color={'inherit'} underline='none' href={`/achievements/${achievement.id}`} onClick={(e) => {e.preventDefault();navigate(`/achievements/${achievement.id}`);}}>
      <AchievementSmall achievement={achievement} counterAchievement={counter_achievement} locked={locked}></AchievementSmall>
      </Link>
      {/* <Card sx={{ display: 'flex', borderRadius: '16px', boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.1)' }} raised>
        <Box sx={{ display: 'flex', flexDirection: 'row' }}>
          <CardMedia
            component="img"
            sx={{  width: '33.33%', borderTopLeftRadius: '16px', borderBottomLeftRadius: '16px', objectFit: 'contain', p: 1 }}
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
            </CardContent>
            <CardActions sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Typography variant="body2" color="text.secondary">
                Counters with achievement: {achievement.countersEarned}
              </Typography>
            </CardActions>
          </Box>
        </Box>
      </Card> */}
     </Grid>
     );}
    )

return (<>
<Grid container>
{achievementList}
</Grid>
    </>
)
}
