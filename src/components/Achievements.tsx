import { Box, Card, CardActionArea, CardActions, CardContent, CardMedia, Grid, Tooltip, Typography } from "@mui/material";
import HelpIcon from '@mui/icons-material/Help';
import CountggLogo from '../assets/countgg-128.png'

export function Achievements(props) {

    const achievementList = props.achievements.map((achievement) => 
    <Grid item xs={12} md={6} lg={4} xl={3} sx={{p: 1, filter: props.locked ? 'grayscale(100%)' : '', opacity: props.locked ? '0.75' : '1'}}>
      <Card sx={{ display: 'flex', borderRadius: '16px', boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.1)' }} raised>
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
