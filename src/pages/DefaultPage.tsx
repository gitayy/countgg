import { useNavigate } from 'react-router-dom';
import { UserContext } from '../utils/contexts/UserContext';
import { useContext, useEffect, useState } from 'react';
import { Alert, AlertColor, Badge, Box, Button, CardMedia, Chip, Grid, Link, Modal, Paper, Skeleton, Snackbar, Typography, useTheme } from '@mui/material';
import { Loading } from '../components/Loading';
import { calculateLevel, modalStyle } from '../utils/helpers';
import { SocketContext } from '../utils/contexts/SocketContext';
import { useIsMounted } from '../utils/hooks/useIsMounted';
import PlusOneIcon from '@mui/icons-material/PlusOne';
import GroupsIcon from '@mui/icons-material/Groups';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import FeedIcon from '@mui/icons-material/Feed';
import StarsIcon from '@mui/icons-material/Stars';
import AbcIcon from '@mui/icons-material/Abc';
import SportsBaseballIcon from '@mui/icons-material/SportsBaseball';
import ChatIcon from '@mui/icons-material/Chat';
import ReorderIcon from '@mui/icons-material/Reorder';
import { DailyHOCTable } from '../components/DailyHOCTable';
import { Counter, PostType } from '../utils/types';
import RedditIcon from '@mui/icons-material/Reddit';
import { TopThreadsTable } from '../components/TopThreadsTable';
import { ThreadsContext } from '../utils/contexts/ThreadsContext';

export const DefaultPage = () => {
  const navigate = useNavigate();
  const { user, counter, loading, items } = useContext(UserContext);
  const [lastCount, setLastCount] = useState<{lastCount: PostType, lastCounter: Counter}>();
  const [dailyLeaderboard, setDailyLeaderboard] = useState<{[authorUUID: string]: {counter: Counter, counts: number}}>();
  const sumCounts = dailyLeaderboard ? Object.values(dailyLeaderboard).reduce((acc, { counts }) => acc + counts, 0) : 0;
  const sumUsers = dailyLeaderboard ? Object.values(dailyLeaderboard).length : 0;
  const [ modalOpen, setModalOpen ] = useState(false);
  const [threadLeaderboards, setThreadLeaderboards] = useState<{[threadUUID: string]: {[counterUUID: string]: {counter: Counter, counts: number}}}>();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('error');
  const socket = useContext(SocketContext);
  const theme = useTheme();
  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
      if (reason === 'clickaway') {
        return;
      }    
      setSnackbarOpen(false);
  };
  const loginRedirect = process.env.REACT_APP_API_HOST + '/api/auth/login'

  const {allThreads, allThreadsLoading} = useContext(ThreadsContext)
  const [sums, setSums] = useState<{[thread_uuid: string]: number}>({});

  // Calculate the sum of counts for each thread
const sumCountsForThreads = () => {
  let sums: { [threadUUID: string]: number } = {};
  let sortedSums: any = [];
  // Check if threadLeaderboards is defined and not empty
  if (threadLeaderboards) {
    Object.keys(threadLeaderboards).forEach((threadUUID) => {
      if(['all', 'last_updated', 'total_counts'].includes(threadUUID)) return;
      const threadData = threadLeaderboards[threadUUID];
      const sum = Object.values(threadData).reduce((acc, { counts }) => acc + counts, 0);
      sums[threadUUID] = sum;
    });
    // sortedSums = Object.entries(sums).sort(([, countA], [, countB]) => countB - countA);
  }

  // console.log(sortedSums);

  // return sortedSums;
  return sums;
};

useEffect(() => {
  if(!allThreadsLoading && allThreads && threadLeaderboards) {
    const summy = sumCountsForThreads();
    console.log("lol");
    console.log(summy);
    setSums(summy);
  }
}, [allThreadsLoading, allThreads, threadLeaderboards])


  // Call the function to get the sum of counts for each thread
  const summy = sumCountsForThreads();
  console.log(summy);

  const isMounted = useIsMounted();
  useEffect(() => {

    // if(isMounted.current) {
      socket.emit('watch', 'all')
    // }

    socket.on('defaultPage', function(data) {
      const {users_online, total_counts, daily_leaderboard, all_leaderboards } = data;
      setTotalCounts(total_counts);
      setUsersOnline(users_online);
      setDailyLeaderboard(daily_leaderboard);
      setThreadLeaderboards(all_leaderboards);
    });
    

    socket.on('post', function(data) {
      const { post, counter, thread, total_counts } = data;
      // console.log(data);
      // console.log(post, counter, thread, total_counts);
      setTotalCounts(total_counts);
      if(post.isValidCount) {
        setLastCount({lastCount: post, lastCounter: counter});
        if(counter && counter.uuid) {
          setDailyLeaderboard(prevDailyHOC => {
            const updatedHOC = {
              ...prevDailyHOC,
              [counter.uuid]: {
                counter: counter,
                counts: prevDailyHOC !== undefined ? ((prevDailyHOC[counter.uuid]?.counts || 0) + 1) : 1,
              }
            };
            return updatedHOC;
        });
        }
        if(thread && thread.uuid) {
          setSums(prevSums => {
            const updatedSums = {
              ...prevSums,
              [thread.uuid]: thread && thread.uuid ? (prevSums[thread.uuid] ?? 0) + 1 : 1,
            };
            return updatedSums;
          });
        }
      }
    });

    socket.on(`dailyHOC`, function(data) {
      // console.log("DAILY HOC");
      // console.log(data);
      // setDailyHOC(data);
    });

    return () => {
      console.log("Disconnected: Disabling socket functions.");
        socket.emit('leave_threads');
        socket.off('defaultPage');
        socket.off('post');
        socket.off('dailyHOC');
    }
  }, [])


  const [isCat, setIsCat] = useState(false);
  const catify = () => {
    setIsCat(!isCat)
  }

  const [count, setCount] = useState(30);
  const [totalCounts, setTotalCounts] = useState(-1);
  const [usersOnline, setUsersOnline] = useState(-1);

  useEffect(() => {
    var testTimeout;
    const updateCount = () => {
      testTimeout = setTimeout(function() {

      if(count < 33) {
        setCount(prevCount => {
          return ((prevCount + 1) % 10 == 0 ? prevCount + 1 : prevCount + 1)
        });
      }

    }, 700);
    };

    updateCount();
    return () => {
      clearTimeout(testTimeout);
    };
  }, [count]);

  let unclaimedRewards = 0;
  if(counter && items) {
    const xpItemsClaimed = items.filter(item => {return item.unlockMethod === 'xp'}).length;
    unclaimedRewards = parseInt(calculateLevel(counter.xp).level) - xpItemsClaimed;
  }

    const [registerModalOpen, setRegisterModalOpen] = useState(false);

  const handleRegisterModalOpen = () => {
    setRegisterModalOpen(true);
  };

  const handleRegisterModalClose = () => {
    setRegisterModalOpen(false);
  };

  const isRegistered = user && counter;
  const isCounter = counter && counter.roles.includes('counter');

  if(!loading && totalCounts > -1 && !allThreadsLoading) {
    return (<>
    <Snackbar
    open={snackbarOpen}
    autoHideDuration={6000}
    onClose={handleClose}
    >
        <Alert severity={snackbarSeverity} onClose={handleClose}>
            {snackbarMessage}
        </Alert>
    </Snackbar>
      <Box sx={{ bgcolor: theme.palette.mode === 'light' ? 'primary.light' : 'background.paper', flexGrow: 1, p: 2, backgroundImage: isCat ? `url(https://placekitten.com/1500/1000?${new Date().getDay()})` : 'none', backgroundSize: `100% 100%`, backgroundRepeat: 'no-repeat'}}>
      <Typography variant="h1" sx={{ textAlign: 'center', m: 1 }}>
     <Typography variant='h1' component={'span'} sx={{ textAlign: 'center', borderRadius: '10px', background: 'linear-gradient(to right, #FF8C00, #FFA500)', }}>&nbsp;{totalCounts > -1 ? totalCounts.toLocaleString() : ''}&nbsp;</Typography> Counts
      </Typography>
      <Typography variant="body1" component={'div'} sx={{ textAlign: 'center', m: 1, }}>
         <Chip variant='filled' color='success' 
        //  icon={<Box component='span' sx={{ml: '9px!important', bgcolor: theme.palette.mode === 'dark' ? `#44b700` : `#7fff19`, display: 'inline-block', width: 8, height: 8, borderRadius: '50%'}}></Box>} 
         label={`${usersOnline.toLocaleString()} user${usersOnline === 1 ? `` : 's'} online`} /> <Chip label={`${sumCounts.toLocaleString()} counts today`} />
      </Typography>
        {!counter && <Paper elevation={8} sx={{mb: 2, display: 'flex', alignItems: 'stretch', background: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)),url(https://i.imgur.com/IOj9OZI.png)`, minHeight: '33vh', p: 2, backgroundSize: 'cover', backgroundPosition: 'top right'}}>
          <Grid container direction={'row'}>
            <Grid item xs={12}>
              <Typography color="white" variant='h4' sx={{textShadow: '1px 1px black'}}>Welcome to counting.gg!</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography color="white" variant='body1' sx={{m: 2, textShadow: '1px 1px black'}}>counting.gg is the largest counting website ever, averaging over a million posts per month!</Typography>
              <Typography color="white" variant='h6' sx={{m: 2, textShadow: '1px 1px black'}}>Sign up for free. Drop a count. Make history.</Typography>
            </Grid>
            <Grid item xs={12} sx={{flexGrow: 1}}>
              <Typography></Typography>
            </Grid>
            <Grid item xs={12} sx={{alignSelf: 'flex-end'}}>
              <Button sx={{m: 1}} onClick={()=>{navigate(`/about`)}}>Learn more</Button>
              <Button sx={{m: 1}} href={loginRedirect} variant="contained">Sign up</Button>
            </Grid>
          </Grid>
        </Paper>}

        <Modal
            open={modalOpen}
            onClose={() => {setModalOpen(!modalOpen)}}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
          >
            <Box sx={modalStyle}>
              {counter && (counter.roles.includes('unverified') || counter.roles.includes('unverified') || counter.roles.includes('discord_verified')) && <>
              <Typography id="modal-modal-title" variant="h6" component="h2" sx={{mt: 2}}>
                You need to finish registration first
              </Typography>
              <Typography id="modal-modal-description" sx={{ mt: 2 }}>
              Your registration is incomplete, once your registration is complete you'll be able to play.              
              </Typography>
              <Button variant='contained' href={'https://discord.gg/bfS9RQht6M'} sx={{mt: 1}}>Join Discord</Button>
              </>}
              {!counter && <>
              <Typography id="modal-modal-title" variant="h6" component="h2" sx={{mt: 2}}>
              You need to register before you can play
              </Typography>
              <Typography id="modal-modal-description" sx={{ mt: 2 }}>
              Click the Login button in the header to register!
              </Typography>
              </>}
            </Box>
          </Modal>

          <Grid container spacing={1.5} sx={{mt: 0}}>

<Grid item xs={12} lg={6} sx={{padding: "6px"}}>
 {/* Bigger items */}

 <Grid container spacing={1.5}>

 <Grid item xs={12} sx={{padding: "6px"}}>
          <Link color={'inherit'} underline='none' href={`/threads`} onClick={(e) => {e.preventDefault();navigate(`/threads`);}}>
        <Paper className="littlescale card" elevation={8} sx={{
          background: 'linear-gradient(135deg,#1f005c, #5b0060, #870160, #ac255e, #ca485c, #e16b5c, #f39060, #ffb56b)',
          cursor: 'pointer', mb: 2, display: 'flex', alignItems: 'stretch', p: 2, }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={12}>
            <Typography variant="h2" color={'black'} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', 
            }}>
            <PlusOneIcon style={{fontSize: 'inherit', marginRight: '5%'}} /> Counting
            </Typography>
          </Grid>
        </Grid>
        </Paper></Link>
        </Grid>
        {/* <Grid item xs={12} md={12}>
            <Link color={'inherit'} underline='none' href={`/rps`} onClick={(e) => {e.preventDefault();navigate(`/rps`);}}>
              <Paper className="littlescale card" elevation={8} sx={{
                background: 'linear-gradient(135deg,#1f005c, #5b0060, #870160, #ac255e, #ca485c, #e16b5c, #f39060, #ffb56b)',
                cursor: 'pointer', mb: 2, display: 'flex', alignItems: 'stretch', p: 2, }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={12}>
                  <Typography variant="h2" color={'black'} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', 
                  }}>
                  <ContentCutIcon style={{fontSize: 'inherit', marginRight: '30px'}} /> RPS
                  </Typography>
                </Grid>
              </Grid>
              </Paper>
            </Link>
          </Grid> */}
          {/* <Grid item xs={12} md={6}>
            <Link color={'inherit'} underline='none' href={`/battleship`} onClick={(e) => {e.preventDefault();navigate(`/battleship`);}}>
              <Paper className="littlescale card" elevation={8} sx={{
                background: 'linear-gradient(135deg,#1f005c, #5b0060, #870160, #ac255e, #ca485c, #e16b5c, #f39060, #ffb56b)',
                cursor: 'pointer', mb: 2, display: 'flex', alignItems: 'stretch', p: 2, }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={12}>
                  <Typography variant="h2" color={'black'} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', 
                  }}>
                  <Box style={{fontSize: 'inherit', marginRight: '30px'}}>💥</Box> Battleship
                  </Typography>
                </Grid>
              </Grid>
              </Paper>
            </Link>
          </Grid> */}
          <Grid item xs={12} sx={{padding: "6px"}}>
            <Link color={'inherit'} underline='none' href={`/lrwoed`} onClick={(e) => {e.preventDefault();navigate(`/lrwoed`);}}>
              <Paper className="littlescale card" elevation={8} sx={{
                background: 'linear-gradient(135deg,#1f005c, #5b0060, #870160, #ac255e, #ca485c, #e16b5c, #f39060, #ffb56b)',
                cursor: 'pointer', mb: 2, display: 'flex', alignItems: 'stretch', p: 2, }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={12}>
                  <Typography variant="h2" color={'black'} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', 
                  }}>
                  <AbcIcon style={{fontSize: 'inherit', marginRight: '5%'}} /> LRWOED
                  </Typography>
                </Grid>
              </Grid>
              </Paper>
            </Link>
          </Grid>
          <Grid item xs={12} sx={{padding: "6px"}}>
            <Link color={'inherit'} underline='none' href={`/shuffle`} onClick={(e) => {e.preventDefault();navigate(`/shuffle`);}}>
              <Paper className="littlescale card" elevation={8} sx={{
                background: 'linear-gradient(135deg,#1f005c, #5b0060, #870160, #ac255e, #ca485c, #e16b5c, #f39060, #ffb56b)',
                cursor: 'pointer', mb: 2, display: 'flex', alignItems: 'stretch', p: 2, }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={12}>
                  <Typography variant="h2" color={'black'} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', 
                  }}>
                  <ReorderIcon style={{fontSize: 'inherit', marginRight: '5%'}} /> Number Shuffle
                  </Typography>
                </Grid>
              </Grid>
              </Paper>
            </Link>
          </Grid>
          <Grid item xs={12} sx={{padding: "6px"}}>
            <Link color={'inherit'} underline='none' href={isCounter ? `/r/livecounting` : undefined} onClick={isCounter ? (e) => {e.preventDefault();navigate(`/r/livecounting`);} : handleRegisterModalOpen}>
              <Paper className="littlescale card" elevation={8} sx={{
                background: 'linear-gradient(135deg,#1f005c, #5b0060, #870160, #ac255e, #ca485c, #e16b5c, #f39060, #ffb56b)',
                cursor: 'pointer', mb: 2, display: 'flex', alignItems: 'stretch', p: 2, }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={12}>
                  <Typography variant="h2" color={'black'} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', 
                  }}>
                  <RedditIcon style={{fontSize: 'inherit', marginRight: '5%'}} /> Reddit Live
                  </Typography>
                </Grid>
              </Grid>
              </Paper>
            </Link>
          </Grid>
          {/* <Grid item xs={12} md={6}>
            <Link color={'inherit'} underline='none' href={`/baseball`} onClick={(e) => {e.preventDefault();navigate(`/baseball`);}}>
              <Paper className="littlescale card" elevation={8} sx={{
                background: 'linear-gradient(135deg,#1f005c, #5b0060, #870160, #ac255e, #ca485c, #e16b5c, #f39060, #ffb56b)',
                cursor: 'pointer', mb: 2, display: 'flex', alignItems: 'stretch', p: 2, }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={12}>
                  <Typography variant="h2" color={'black'} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', 
                  }}>
                  <SportsBaseballIcon style={{fontSize: 'inherit', marginRight: '30px'}} /> Baseball
                  </Typography>
                </Grid>
              </Grid>
              </Paper>
            </Link>
          </Grid> */}

</Grid>
</Grid>

<Grid item xs={12} lg={6} sx={{padding: "6px"}}>
   {/* Smaller items */}
   <Grid container spacing={1.5}>
   <Grid item xs={12} sm={6} sx={{padding: "6px"}}>
          <Link color={'inherit'} underline='none' href={`/counters`} onClick={(e) => {e.preventDefault();navigate(`/counters`);}}>
            <Paper className="littlescale card" elevation={8} sx={{
              background: 'linear-gradient(to right, #faf8f3, #eae4d9)', 
              cursor: 'pointer', mb: 2, display: 'flex', alignItems: 'stretch', p: 2, }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={12}>
                <Typography variant="h2" color={'black'} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', 
                }}>
                <GroupsIcon style={{fontSize: 'inherit', marginRight: '5%'}} /> Users
                </Typography>
              </Grid>
            </Grid>
            </Paper>
            </Link>
          </Grid>
          <Grid item xs={12} sm={6} sx={{padding: "6px"}}>
          <Link color={'inherit'} underline='none' href={`/stats`} onClick={(e) => {e.preventDefault();navigate(`/stats`);}}>
            <Paper className="littlescale card" elevation={8} sx={{
              background: 'linear-gradient(to right, #faf8f3, #eae4d9)', 
              cursor: 'pointer', mb: 2, display: 'flex', alignItems: 'stretch', p: 2, }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={12}>
                <Typography variant="h2" color={'black'} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', 
                }}>
                <QueryStatsIcon style={{fontSize: 'inherit', marginRight: '5%'}} /> Stats
                </Typography>
              </Grid>
            </Grid>
            </Paper>
            </Link>
          </Grid>
          <Grid item xs={12} sm={6}>
          <Link color={'inherit'} underline='none' href={isCounter ? `/shop` : undefined} onClick={isCounter ? (e) => {e.preventDefault();navigate(`/shop`);} : handleRegisterModalOpen}>
            <Paper className="littlescale card" elevation={8} sx={{
              background: 'linear-gradient(to right, #faf8f3, #eae4d9)', 
              cursor: 'pointer', mb: 2, display: 'flex', alignItems: 'stretch', p: 2, }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={12}>
                <Typography variant="h2" color={'black'} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', 
                }}>
                <ShoppingCartIcon style={{fontSize: 'inherit', marginRight: '30px'}} /> Shop
                </Typography>
              </Grid>
            </Grid>
            </Paper>
            </Link>
          </Grid>
          {/* <Grid item xs={6} md={3}>
          <Link color={'inherit'} underline='none' href={`/blog`} onClick={(e) => {e.preventDefault();navigate(`/blog`);}}>
            <Paper className="littlescale card" elevation={8} sx={{
              background: 'linear-gradient(to right, #faf8f3, #eae4d9)', 
              cursor: 'pointer', mb: 2, display: 'flex', alignItems: 'stretch', p: 2, }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={12}>
                <Typography variant="h2" color={'black'} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', 
                }}>
                <FeedIcon style={{fontSize: 'inherit', marginRight: '30px'}} /> Blog
                </Typography>
              </Grid>
            </Grid>
            </Paper>
            </Link>
          </Grid> */}
          <Grid item xs={12} sm={6} sx={{padding: "6px"}}>
            {isCounter && unclaimedRewards > 0
            ?
            <Box className='littlescale'>
            <Badge color="error" sx={{display: "block", "& .MuiBadge-badge": { fontSize: 24, minWidth: 30, minHeight: 30 } }} badgeContent={unclaimedRewards}>
            <Link color={'inherit'} underline='none' href={`/rewards`} onClick={(e) => {e.preventDefault();navigate(`/rewards`);}}>
            <Paper className="card" elevation={8} sx={{
              background: 'linear-gradient(to right, #faf8f3, #eae4d9)', 
              cursor: 'pointer', mb: 2, display: 'flex', alignItems: 'stretch', p: 2, }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={12}>
                <Typography variant="h2" color={'black'} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', 
                }}>
                <StarsIcon style={{fontSize: 'inherit', marginRight: '5%'}} /> Rewards
                </Typography>
              </Grid>
            </Grid>
            </Paper>
            </Link>
            </Badge>
            </Box>
            :
            <Link color={'inherit'} underline='none' href={isCounter ? `/rewards` : undefined} onClick={isCounter ? (e) => {e.preventDefault();navigate(`/rewards`);} : handleRegisterModalOpen}>
            <Paper className="littlescale card" elevation={8} sx={{
              background: 'linear-gradient(to right, #faf8f3, #eae4d9)', 
              cursor: 'pointer', mb: 2, display: 'flex', alignItems: 'stretch', p: 2, }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={12}>
                <Typography variant="h2" color={'black'} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', 
                }}>
                <StarsIcon style={{fontSize: 'inherit', marginRight: '5%'}} /> Rewards
                </Typography>
              </Grid>
            </Grid>
            </Paper>
            </Link>
          }
          </Grid>
          {/* <Grid item xs={12} sm={6}>
          <Link color={'inherit'} underline='none' href={`/servers`} onClick={(e) => {e.preventDefault();navigate(`/servers`);}}>
            <Paper className="littlescale card" elevation={8} sx={{
              background: 'linear-gradient(to right, #faf8f3, #eae4d9)', 
              cursor: 'pointer', mb: 2, display: 'flex', alignItems: 'stretch', p: 2, }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={12}>
                <Typography variant="h2" color={'black'} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', 
                }}>
                <ChatIcon style={{fontSize: 'inherit', marginRight: '30px'}} /> Servers
                </Typography>
              </Grid>
            </Grid>
            </Paper>
            </Link>
          </Grid> */}
          {/* <Grid item xs={12} sm={6}>
          <Link color={'inherit'} underline='none' href={`/blogs`} onClick={(e) => {e.preventDefault();navigate(`/blogs`);}}>
            <Paper className="littlescale card" elevation={8} sx={{
              background: 'linear-gradient(to right, #faf8f3, #eae4d9)', 
              cursor: 'pointer', mb: 2, display: 'flex', alignItems: 'stretch', p: 2, }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={12}>
                <Typography variant="h2" color={'black'} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', 
                }}>
                <ChatIcon style={{fontSize: 'inherit', marginRight: '30px'}} /> Blogs
                </Typography>
              </Grid>
            </Grid>
            </Paper>
            </Link>
          </Grid> */}
          </Grid>
</Grid>

</Grid>

<Modal
        open={registerModalOpen}
        onClose={handleRegisterModalClose}
        aria-labelledby="register-modal"
        aria-describedby="register-to-counting.gg"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            border: '2px solid #000',
            boxShadow: 24,
            p: 4,
            maxHeight: '500px',
            width: '70vw',
            overflowY: 'scroll',
          }}
        >
          <h2 id="modal-title">Join counting.gg</h2>
          <p id="modal-description">
            <>This is only available to logged in users, join now!</>
            </p>
          <Button onClick={() => {handleRegisterModalClose()}}>Close</Button>
        </Box>
      </Modal> 
         
        {/* </Grid> */}

<Grid container>
  <Grid item xs={12} lg={6} sx={{p: 2}}>
  {dailyLeaderboard && <DailyHOCTable mini={true} dailyHOC={dailyLeaderboard} name={'Sitewide Daily Leaders'} countName={'Counts'}></DailyHOCTable>}
  </Grid>
  <Grid item xs={12} lg={6} sx={{p: 2}}>
    {/* Top Threads Today */}
    {threadLeaderboards && <TopThreadsTable mini={true} sums={sums} name={'Top Threads Today'} countName={'Counts'}></TopThreadsTable>}
  </Grid>
</Grid>

<Box sx={{justifyContent: 'center', width: '100%', display: 'flex'}}>
<iframe src="https://discord.com/widget?id=1074858682141126676&theme=dark" width="350" height="300" allowTransparency={true} frameBorder="0" sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"></iframe>
</Box>

        <Typography variant="body2" component={'div'} sx={{ textAlign: 'center', m: 1 }}>
          since February 27, 2023 — &nbsp;
          <Link sx={{cursor: 'pointer', color: 'inherit'}} underline={'hover'} onClick={(e) => {e.preventDefault();catify()}}>Cat</Link> — &nbsp;
          <Link sx={{cursor: 'pointer', color: 'inherit'}} underline={'hover'} href={`/about`} onClick={(e) => {e.preventDefault();navigate(`/about`);}}>About</Link> — &nbsp;
          <Link sx={{cursor: 'pointer', color: 'inherit'}} underline={'hover'} href={`/privacy-policy`} onClick={(e) => {e.preventDefault();navigate(`/privacy-policy`);}}>Privacy Policy</Link> — &nbsp;
          <Link sx={{cursor: 'pointer', color: 'inherit'}} underline={'hover'} href={`/contact-us`} onClick={(e) => {e.preventDefault();navigate(`/contact-us`);}}>Contact Us</Link> — &nbsp;
          <Link sx={{cursor: 'pointer', color: 'inherit'}} underline={'hover'} href={`/`} onClick={(e) => {e.preventDefault();navigate(`/`);}}>counting.gg</Link>
        </Typography>
      </Box>      
      </>
    )
        } else {
          return <Loading />
        }
};