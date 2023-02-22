import { Box, Card, CardActionArea, CardActions, CardContent, CardMedia, Grid, Tooltip, Typography } from "@mui/material";
import HelpIcon from '@mui/icons-material/Help';

export function Achievements(props) {

    const achievementList = props.achievements.map((achievement) => 
    <Grid item xs={6} md={4} lg={3} sx={{p: 1}}>
    <Card sx={{ display: 'flex' }} raised>
        <Box sx={{display: 'flex', flexDirection: 'column'}}>
    <CardActionArea>
    <CardMedia
        component="img"
        width="25%"
        image={achievement.icon}
        alt={achievement.name}
      />
      <CardContent>
        <Typography gutterBottom variant="h5" component="div">
            {achievement.name} 
        </Typography>
        {achievement.description && <Typography variant="body2" color="text.secondary">
          {achievement.description}
        </Typography>}
        {!(achievement.isPublic) && !(achievement.description) && <Typography variant="body2" color="text.secondary"><Tooltip title="Secret achievement">
                <HelpIcon sx={{fontSize: '0.875rem'}}></HelpIcon>
                </Tooltip>
                </Typography>}
      </CardContent>
      <CardActions>
        <Typography variant="body2" color="text.secondary">
          Counters with achievement: {achievement.countersEarned}
        </Typography>
    </CardActions>
    </CardActionArea>
      </Box>
  </Card>
  </Grid>
    )

return (<>
<Grid container>
{achievementList}
</Grid>
    </>
)
}
