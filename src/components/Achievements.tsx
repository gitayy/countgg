import { Grid, Link } from "@mui/material";
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
