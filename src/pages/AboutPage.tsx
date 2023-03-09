import { Box, Typography } from '@mui/material';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { EmojiTest } from '../utils/helpers';

  export const AboutPage = () => {

    const location = useLocation();
    useEffect(() => {
        document.title = `About | countGG`;
        return (() => {
          document.title = 'countGG';
        })
      }, [location.pathname]);
      
      return (
        <Box sx={{ bgcolor: 'background.paper', color: 'text.primary', flexGrow: 1, p: 2}}>
            <Typography sx={{mb: 1.5}} variant='h4'>About countGG</Typography>   
            <Typography sx={{mb: 1.5}}>countGG is a free community-driven counting website. The community is centered around our Discord server, and a Discord account is required to join.</Typography>
            <Typography sx={{mb: 1.5}}>After signing up, you'll need to create your profile. To avoid abuse, profiles are manually approved at the moment. If your account is not approved in a reasonable amount of time, please message the moderators.</Typography>
            <Typography sx={{mb: 1.5}}>Once your profile is approved, you'll be ready to count!</Typography>
            <Typography sx={{mb: 1.5}} variant='h4'>Why? Why would people waste their time on this?</Typography>
            <Typography sx={{mb: 1.5}}>Sign up and ask them! {EmojiTest({id: 'face_with_cowboy_hat', size: 32, set: 'twitter'})} But don't harass or insult them.</Typography>
            <Typography sx={{mb: 1.5}} variant='h4'>Can I use bots to count?</Typography>
            <Typography sx={{mb: 1.5}}>No.</Typography>
            <Typography sx={{mb: 1.5}} variant='h4'>How does the site work?</Typography>
            <Typography sx={{mb: 1.5}}>The site is divided into several "threads," each having their own unique rules. The main thread is the simplest—count up 1 at a time. No double counting, and mistakes are allowed.</Typography>
            <Typography sx={{mb: 1.5}}>Other threads have different rules. Some threads may reset on a mistake. Other threads may not count by numbers—the "letters" thread counts from A to Z, then AA, AB, and so on...</Typography>
            <Typography sx={{mb: 1.5}}>You can access a list of threads from the left-hand sidebar, under "Threads." Once you open a thread, there is an about page with more information.</Typography>
            <Typography sx={{mb: 1.5}} variant='h4'>Is countGG free?</Typography>
            <Typography sx={{mb: 1.5}}>Yes.</Typography>
            <Typography sx={{mb: 1.5}} variant='h4'>How can I contact you?</Typography>
            <Typography sx={{mb: 1.5}}>Message me over Discord! Press the "login" to receive a discord invite.</Typography>
            <Typography sx={{mb: 1.5}} variant='h4'>I have more questions!</Typography>
            <Typography sx={{mb: 1.5}}>Feel free to sign up to join the discord. There's zero commitment in joining and you can quit whenever you need to. Ask others and feel free to send a direct message to the discord admins if needed.</Typography>
        </Box>
        )
    };

