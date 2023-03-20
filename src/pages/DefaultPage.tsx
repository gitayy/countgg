import { useNavigate } from 'react-router-dom';
import { UserContext } from '../utils/contexts/UserContext';
import { useContext, useEffect, useState } from 'react';
import { CounterContext } from '../utils/contexts/CounterContext';
import { Alert, AlertColor, Box, Button, CardMedia, Grid, Link, Modal, Paper, Snackbar, Typography } from '@mui/material';
import { Loading } from '../components/Loading';
import SwingBg from '../assets/swing2.png';
import { modalStyle } from '../utils/helpers';

export const DefaultPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const { counter, loading } = useContext(CounterContext);
  const [ modalOpen, setModalOpen ] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('error');
  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
      if (reason === 'clickaway') {
        return;
      }    
      setSnackbarOpen(false);
  };
  const loginRedirect = process.env.REACT_APP_API_HOST + '/api/auth/login'

  const [count, setCount] = useState(1);

  useEffect(() => {
    var testTimeout;
    const updateCount = () => {
      testTimeout = setTimeout(function() {

      if(count < 5) {
        setCount(prevCount => {
          return ((prevCount + 1) % 10 == 0 ? prevCount + 1 : prevCount + 1)
        });
      }

    }, 400);
    };

    updateCount();
    return () => {
      clearTimeout(testTimeout);
    };
  }, [count]);

  if(!loading) {

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
      <Box sx={{ bgcolor: 'primary.light', flexGrow: 1, p: 2}}>
      <Typography variant="h1" sx={{ textAlign: 'center', m: 1 }}>
        Over <Typography variant='h1' component={'span'} sx={{ textAlign: 'center', background: 'linear-gradient(to right, #FF8C00, #FFA500)', }}>&nbsp;{(count/10).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}M&nbsp;</Typography> Counts
      </Typography>
      <Typography variant="body1" component={'div'} sx={{ textAlign: 'center', m: 1 }}>
      on countGG.com
      </Typography>
        {!counter && <Paper elevation={8} sx={{mb: 2, display: 'flex', alignItems: 'stretch', background: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)),url(${SwingBg})`, minHeight: '33vh', p: 2, backgroundSize: 'cover', backgroundPosition: 'top right'}}>
          <Grid container direction={'row'}>
            <Grid item xs={12}>
              <Typography color="white" variant='h4' sx={{textShadow: '1px 1px black'}}>Welcome to countGG!</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography color="white" variant='body1' sx={{m: 2, textShadow: '1px 1px black'}}>countGG is the largest website solely dedicated to counting, where users can count in real-time. With a simple and intuitive interface, users can participate in one of the biggest collaborations on the Internet. Whether it's for fun or competition, countGG provides a unique and engaging experience for counting enthusiasts of all levels.</Typography>
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

          <Link color={'inherit'} underline='none' href={`/thread/main`} onClick={(e) => {e.preventDefault();navigate(`/thread/main`);}}>
        <Paper elevation={8} sx={{cursor: 'pointer', mb: 2, display: 'flex', alignItems: 'stretch', minHeight: '33vh', p: 2, }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <CardMedia
              component="img"
              sx={{  width: '100%', maxHeight: '300px', borderRadius: '16px', objectFit: 'contain', p: 1 }}
              image={'https://placekitten.com/600/400'}
              alt={"Kitten"}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Link variant="h3" underline={'hover'} color={'text.primary'} sx={{ mb: 2 }}>
              Main Thread
            </Link>
            <Typography variant="body1" component={'div'}>
            &nbsp;
            </Typography>
            <Typography variant="body1" component={'div'}>
            The main thread is the heart of countGG, being the largest thread on the site. 
            </Typography>
            <Typography variant="body1" component={'div'}>
            &nbsp;
            </Typography>
            <Typography variant="body1" component={'div'}>
            Count up by 1... it's that simple!
            </Typography>
            <Button variant='contained' sx={{mt: 4}}>
            View Main Thread 
            </Button>
          </Grid>
        </Grid>
        </Paper></Link>
        <Link color={'inherit'} underline='none' href={`/threads`} onClick={(e) => {e.preventDefault();navigate(`/threads`);}}>
        <Paper elevation={8} sx={{cursor: 'pointer', mb: 2, display: 'flex', alignItems: 'stretch', minHeight: '33vh', p: 2, }}>
          <Grid container direction={'row-reverse'} spacing={2}>
        <Grid item xs={12} md={6}>
          <CardMedia
              component="img"
              sx={{  width: '100%', maxHeight: '300px', borderRadius: '16px', objectFit: 'contain', p: 1 }}
              image={'https://placekitten.com/800/300'}
              alt={"Kitten"}
            />
        </Grid>
        <Grid item xs={12} md={6}>
          <Link variant="h3" underline={'hover'} color={'text.primary'} sx={{ mb: 2 }}>
            Side Threads
          </Link>
          <Typography variant="body1" component={'div'}>
            &nbsp;
          </Typography>
          <Typography variant="body1">
            countGG is not just about the main thread, but also offers a variety of side threads for users to participate in. These threads have unique rules, ranging from counting by letters, to "restart on mistakes", to being the first to post each hour. These threads provide a fun way for users to interact with each other and compete in a variety of ways beyond just counting by 1.
          </Typography>
          <Typography variant="body1" component={'div'}>
            &nbsp;
          </Typography>
          <Button variant='contained' sx={{mt: 4}}>
            View All Threads 
          </Button>
        </Grid>
        </Grid>
        </Paper></Link>
        <Typography variant="body2" component={'div'} sx={{ textAlign: 'center', m: 1 }}>
          since February 27, 2023 — &nbsp;
          <Link sx={{cursor: 'pointer', color: 'inherit'}} underline={'hover'} component={'span'} href={`/about`} onClick={(e) => {e.preventDefault();navigate(`/about`);}}>About</Link> — &nbsp;
          <Link sx={{cursor: 'pointer', color: 'inherit'}} underline={'hover'} component={'span'} href={`/privacy-policy`} onClick={(e) => {e.preventDefault();navigate(`/privacy-policy`);}}>Privacy Policy</Link> — &nbsp;
          <Link sx={{cursor: 'pointer', color: 'inherit'}} underline={'hover'} component={'span'} href={`/contact-us`} onClick={(e) => {e.preventDefault();navigate(`/contact-us`);}}>Contact Us</Link> — &nbsp;
          <Link sx={{cursor: 'pointer', color: 'inherit'}} underline={'hover'} component={'span'} href={`/`} onClick={(e) => {e.preventDefault();navigate(`/`);}}>countGG.com</Link>
        </Typography>
      </Box>      
      </>
    )
  } else {
    return(<Loading />);
  }

};
