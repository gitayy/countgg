import { Card, Box, CardMedia, CardContent, Typography, Grid, createTheme, responsiveFontSizes, ThemeProvider, Alert, Badge, Chip } from "@mui/material";
import CountggLogo from '../assets/countgg-128.png'
import CountggLogo2 from '../assets/emotes/gg.png'

import { calculateLevel, card_backgrounds, titles } from "../utils/helpers";
import StarBadge from "./StarBadge";


export function CounterCard(props) {

  const titleInfo = titles[props.counter.title];
  const backgroundInfo = card_backgrounds[props.counter.cardStyle];
  let counterCardTheme = createTheme({
    palette: {
      mode: backgroundInfo ? backgroundInfo.style : 'light',
    },
  });
  counterCardTheme = responsiveFontSizes(counterCardTheme);


  const level = parseInt(calculateLevel(props.counter.xp).level || "1")

  const xpToNext = calculateLevel(props.counter.xp).xpRequired;

    return (
        <Card elevation={8} id={`card_${props.counter.uuid}`} sx={{}}>
          <Box className={`card_${props.counter.cardStyle}`}>
            <ThemeProvider theme={counterCardTheme}>
            <Box>
                <Grid container>
                    <Grid item xs={2}>
            <Box sx={{p: props.boxPadding,}} className={`border_${props.counter.cardBorderStyle}-parent`}>
              <CardMedia
                  component="div"
                  className={`border_${props.counter.cardBorderStyle} pfp-image`}
                  sx={{ backgroundSize: 'contain', width: '100%', maxWidth: props.maxWidth, maxHeight: props.maxHeight, backgroundImage: props.counter.avatar.length > 5 ? `url(https://cdn.discordapp.com/avatars/${props.counter.discordId}/${props.counter.avatar})` : `url(${CountggLogo2})`}}
                />
            </Box>
            </Grid>
            <Grid item xs={10}>
              <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                <CardContent sx={{ flex: '1 0 auto', p: 0, '&:last-child':{pb: 0} }}>
                    {/* <Box sx={{}}> */}
                        <Typography component="div" variant="h6" color={"text.primary"} sx={{display: "flex", alignItems: 'center'}}>
                        <Chip component={"span"} size="small" title={`${props.counter.xp} / ${xpToNext}`} label={level} color={level === 50 ? "warning" : level > 40 ? "success" : level > 20 ? "secondary" : "primary"} sx={{}}></Chip>
                        &nbsp;
                        {props.counter.emoji ? `${props.counter.emoji} ${props.counter.name} ${props.counter.emoji}` : props.counter.name}
                        &nbsp;
                        <Typography component="span" variant="body2" sx={{}}>@{props.counter.username}</Typography>
                        </Typography>
                    <Typography className={titleInfo && titleInfo.style ? titleInfo.style : 'title-default'} variant="subtitle1" color={"text.secondary"} component="div">
                      {props.counter.title}&nbsp;
                      </Typography>

                      {props.fullSize && <Typography variant="subtitle2" color={"text.secondary"} component="div">
                      {props.team}
                      </Typography>}
                </CardContent>
              </Box>
              </Grid>
              </Grid>
              </Box>
              </ThemeProvider>
              </Box>
            </Card>            
    )

}