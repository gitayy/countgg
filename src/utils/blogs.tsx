import { Typography } from '@mui/material'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import adminAvatar from '../assets/pumpkaboo.png'
import data from '@emoji-mart/data/sets/14/twitter.json'
import { EmojiTest } from './helpers'
import { Link } from 'react-router-dom'

const components = {
    p: ('span' as any),
    li: ({ children }) => <li style={{whiteSpace: 'initial'}}>{children}</li>,
    code: ({ children }) => { return (Object.keys(data.emojis).includes((children[0] as string).toLowerCase()) ? EmojiTest({id: (children[0] as string).toLowerCase(), size: 24, set: 'twitter'}) : <code>{children}</code>)}
  }

export const blogs = [
    {
        title: "Welcome to countGG!",
        author: "admin", 
        avatarImage: adminAvatar, 
        date: "February 27, 2023", 
        body: (
            <>
            <Typography sx={{mb: 2}} component={'div'}>Welcome to countGG! The main thread is officially open: <Link to={`../thread/main`}>https://countgg.com/thread/main</Link></Typography>
            <Typography sx={{mb: 2}} component={'div'}>If you're new, click the login button to sign in with Discord. Follow the steps and you'll soon be ready to join!</Typography>
            <Typography sx={{mb: 2}} component={'div'}>Participating is quite simple. No worries about making mistakes in the main thread. You won't be penalized!</Typography>
            <Typography sx={{mb: 2}} component={'div'}>Need something to spice things up? There are plenty more threads available! Count solo, or try different challenges: <Link to={`../threads`}>https://countgg.com/threads</Link></Typography>
            <Typography sx={{mb: 2}} component={'div'}>Have any questions? Feel free to contact us over Discord!</Typography>
            </>
        ), 
    },
    {
        title: "We hit 100,000 on the first day",
        author: "admin", 
        avatarImage: adminAvatar, 
        date: "February 28, 2023", 
        body: (
            <>
            <Typography sx={{mb: 2}} component={'div'}>Major accomplishment for the site... 100K counts in the main thread on the first day!</Typography>
            <Typography sx={{mb: 2}} component={'div'}>Thanks for the amazing first day on countGG &lt;3 More updates will be coming soon, thank you for your patience.</Typography>
            <Typography sx={{mb: 2}} component={'div'}>Again, here's a link to the main thread: <Link to={`../thread/main`}>https://countgg.com/thread/main</Link></Typography>
            </>
        ), 
    },
    {
        title: "countGG reaches half a million counts",
        author: "admin", 
        avatarImage: adminAvatar, 
        date: "March 19, 2023", 
        body: (
            <>
            <Typography sx={{mb: 2}} component={'div'}>In under 3 weeks since we opened the site, we've reached the 500,000 count milestone! Congratulations to all!</Typography>
            <Typography sx={{mb: 2}} component={'div'}>As of this writing, the main thread is still the largest thread on the site, sitting at over 200,000 counts. However, double counting threads have been growing at a fast pace. Specifically, odds and evens double counting, which best simulate speedrunning main thread solo, are neck-and-neck.</Typography>
            <Typography sx={{mb: 2}} component={'div'}>TheMatsValk was the first to reach 100,000 sitewide counts. Not only is he #1 in the main thread leaderboard, but he also has over 70,000 counts in Odds double counting.</Typography>
            <Typography sx={{mb: 2}} component={'div'}>One million total counts would be a staggering achievement. Few communities have ever reached such an accomplishment... yet we're halfway there in just three weeks.</Typography>
            <Typography sx={{mb: 2}} component={'div'}>countGG has seen various updates over the previous weeks. Check out the stats page for a more in-depth dive...</Typography>
            <Typography sx={{mb: 2}} component={'div'}>April is sure to bring some surprises... check in soon!</Typography>
            </>
        ), 
    }, 
]