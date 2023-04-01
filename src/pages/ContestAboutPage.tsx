import { Box, Paper, Typography } from '@mui/material';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { EmojiTest } from '../utils/helpers';

  export const ContestAboutPage = () => {

    const location = useLocation();
    useEffect(() => {
        document.title = `Contest Info | countGG`;
        return (() => {
          document.title = 'countGG';
        })
      }, [location.pathname]);
      
      return (
        <Box sx={{ bgcolor: 'background.paper', color: 'text.primary', flexGrow: 1, p: 2}}>
            <Typography sx={{mb: 1.5}} variant='h4'>Contest Info</Typography>   
            <Typography sx={{mt: 1}} variant="h6">What is this?</Typography>
            <Typography sx={{mt: 1}} variant="body1">Three teams. One winner.</Typography>
            <Typography sx={{mt: 1}} variant="body1">The Count Allegiance pits three teams against each other: Blaze, Radiant, and Wave.</Typography>
            <Typography sx={{mt: 1}} variant="body1">Pledge your support to one of these teams, and collaborate on a series of puzzles and challenges.</Typography>
            <Typography sx={{mt: 1}} variant="body1">You'll be randomly assigned a team.</Typography>
            <Typography sx={{mt: 1}} variant="body1">Participants in this special event will receive exclusive achievements and other rewards.</Typography>
            <Typography sx={{mt: 1}} variant="body1">But definitely not money because of laws. And if a winner gets a $25 gift card that's just a coincidence.</Typography>

            <Typography sx={{mt: 1}} variant="body1">&nbsp;</Typography>

            <Typography sx={{mt: 1}} variant="h6">What is the Count Allegiance?</Typography>
            <Typography sx={{mt: 1}} variant="body1">Following a series of unmitigated natural disasters, society has been divided into three color-coded groups.</Typography>
            <Typography sx={{mt: 1}} variant="body1">Rising sea levels caused oceans to flood over our towns, our cities. Our homes.</Typography>
            <Typography sx={{mt: 1}} variant="body1">But not everyone wanted to move away. They didn't quit. They adapted in the face of a challenge. As the generations go by, it's as if they had always lived underwater. Submersion is a way of life.</Typography>
            <Typography sx={{mt: 1}} variant="body1">Others didn't want to live such a lifestyle. They moved to dry land. But they, too, had to adapt.</Typography>
            <Typography sx={{mt: 1}} variant="body1">Rising temperatures made life on land much more difficult. But as the years went by, they were no longer battling the extreme heat. They were molded by it. Soon, they couldn't stop their children from going outside and staring directly into the sun for hours at a time. They were addicted to the heat and could never go back to their old way of life. </Typography>
            <Typography sx={{mt: 1}} variant="body1">And yet, a third group emerged. Not wanting to deal with this wasteland of a planet. This final group wanted to innovate, to expand their horizons. To find somewhere new. Somewhere better.</Typography>
            <Typography sx={{mt: 1}} variant="body1">Why is it called the Count Allegiance? Well... following the destructive global disasters, people came to realize that they should just enjoy what they have. And everyone seems to love counting. So rather than avoiding it they each embraced it. It's like it's the only thing they have in common.</Typography>
            <Typography sx={{mt: 1}} variant="body1">Aside from counting, these groups are quite secretive. They rarely, if at all, contact each other. Not necessarily out of hatred, but their differences make it difficult to communicate in the first place.</Typography>
            <Typography sx={{mt: 1}} variant="body1">But each group wants to be the first one to achieve The Prophecy.</Typography>

            <Typography sx={{mt: 1}} variant="body1">&nbsp;</Typography>

            <Typography sx={{mt: 1}} variant="h6">What is the Prophecy?</Typography>
            <Typography sx={{mt: 1}} variant="body1">Ancient texts warned that a great disaster would divide society into three groups. These groups would live in harmony until, one day, they tried to unite.</Typography>
            <Typography sx={{mt: 1}} variant="body1">Once united, they would suffer a series of challenges that pit them against one another, causing division and despair.</Typography>
            <Typography sx={{mt: 1}} variant="body1">However...</Typography>
            <Typography sx={{mt: 1}} variant="body1">With hard work and diligence, one group will make a major breakthrough that will advance their society by unimaginable means.</Typography>
            <Typography sx={{mt: 1}} variant="body1">They are prophecized to enjoy years of prosperity.</Typography>
            <Typography sx={{mt: 1}} variant="body1">But not all will reap such rewards...</Typography>
            <Typography sx={{mt: 1}} variant="body1">After generations of near-isolation, the groups are once again back together on the brand new counting website, countGG.com. Their new favorite website.</Typography>
            <Typography sx={{mt: 1}} variant="body1">Thus triggering the Prophecy... who will win?</Typography>

            <Typography sx={{mt: 1}} variant="body1">&nbsp;</Typography>

            <Typography sx={{mt: 1}} variant="h6">Team Blaze 🔥</Typography>
            <Typography sx={{mt: 1}} variant="body1">Team Blaze is known for being fearless and aggressive. No matter how harsh or volatile their environment, they will overcome. Unless it's water. That sucks.</Typography>
            <Typography sx={{mt: 1}} variant="body1">They are driven and passionate. Never fearing any challenges. Not a day passes where they don't test their limits.</Typography>

            <Typography sx={{mt: 1}} variant="body1">&nbsp;</Typography>

            <Typography sx={{mt: 1}} variant="h6">Team Radiant ⭐</Typography>
            <Typography sx={{mt: 1}} variant="body1">Team Radiant is, well, bright. Intelligent. But also bright because they are sailing among the stars. In space.</Typography>
            <Typography sx={{mt: 1}} variant="body1">They are graceful and precise. Wise, and intuitive. They see the bigger picture, and take a pragmatic approach to their issues.</Typography>

            <Typography sx={{mt: 1}} variant="body1">&nbsp;</Typography>

            <Typography sx={{mt: 1}} variant="h6">Team Wave 🌊</Typography>
            <Typography sx={{mt: 1}} variant="body1">Team Wave is the most fluid and adaptable. They aren't set in their ways, and have no issue resolving unpredictable challenges they face.</Typography>
            <Typography sx={{mt: 1}} variant="body1">They are resourceful and creative. Few can match their flexibility. They can also breathe underwater somehow.</Typography>
        </Box>
        )
    };

