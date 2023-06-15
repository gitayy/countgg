import { Card, Box, CardMedia, CardContent, Typography, Grid, createTheme, responsiveFontSizes, ThemeProvider } from "@mui/material";
import CountggLogo from '../assets/countgg-128.png'
import CountggLogo2 from '../assets/emotes/gg.png'

import { card_backgrounds, titles } from "../utils/helpers";


export function CounterCard(props) {

  const titleInfo = titles[props.counter.title];
  const backgroundInfo = card_backgrounds[props.counter.cardStyle];
  let counterCardTheme = createTheme({
    palette: {
      mode: backgroundInfo ? backgroundInfo.style : 'light',
    },
  });
  counterCardTheme = responsiveFontSizes(counterCardTheme);

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
                  // alt={`${props.counter.name}`}
                />
                {/* <CardMedia
                  component="img"
                  className={`${props.counter.cardBorderStyle}`}
                  sx={{ width: '100%', maxWidth: props.maxWidth, maxHeight: props.maxHeight}}
                  image={`${props.counter.avatar.length > 5 && `https://cdn.discordapp.com/avatars/${props.counter.discordId}/${props.counter.avatar}` || CountggLogo}`}
                  alt={`${props.counter.name}`}
                /> */}
            </Box>
            </Grid>
            <Grid item xs={10}>
              <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                <CardContent sx={{ flex: '1 0 auto', p: 0, '&:last-child':{pb: 0} }}>
                    {/* <Box sx={{}}> */}
                        <Typography component="div" variant="h6" color={"text.primary"} sx={{}}>{props.counter.emoji ? `${props.counter.emoji} ${props.counter.name} ${props.counter.emoji}` : props.counter.name}
                            {/* <View>
                            <Text style={{fontSize: 20}} adjustFontSizeToFit={true} numberOfLines={1}>{props.counter.firstName} {props.counter.firstName} {props.counter.lastName}</Text>
                            </View> */}
                        </Typography>
                    {/* </Box> */}
                    <Typography className={titleInfo && titleInfo.style ? titleInfo.style : 'title-default'} variant="subtitle1" color={"text.secondary"} component="div">
                      {props.counter.title}&nbsp;
                      </Typography>

                      {props.fullSize && <Typography variant="subtitle2" color={"text.secondary"} component="div">
                      {props.team}
                      </Typography>}
                </CardContent>
                {/* <Box sx={{ flex: '1 0 auto', p: 0, pl: 2 }}>
                  <Typography variant="subtitle1" color="text.secondary" component="div">
                    {props.team}
                  </Typography>
                </Box> */}
              </Box>
              </Grid>
              </Grid>
              </Box>
              </ThemeProvider>
              </Box>
            </Card>
            
    )

}