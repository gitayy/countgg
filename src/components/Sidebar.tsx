import { useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserContext } from '../utils/contexts/UserContext';
import { CounterContext } from '../utils/contexts/CounterContext';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import { Avatar, Badge, Button, CardMedia, Divider, Drawer, Link, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Modal, Skeleton, Step, StepLabel, Stepper, useTheme } from '@mui/material';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import HomeIcon from '@mui/icons-material/Home';
import StadiumIcon from '@mui/icons-material/Stadium';
import PersonIcon from '@mui/icons-material/Person';
import GroupsIcon from '@mui/icons-material/Groups';
import LoginIcon from '@mui/icons-material/Login';
import CalculateIcon from '@mui/icons-material/Calculate';
import InfoIcon from '@mui/icons-material/Info';
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import { logout } from '../utils/api';
import useAnalyticsEventTracker from '../utils/helpers';
import { ColorModeContext } from '../utils/contexts/ColorModeContext';
import { useIsMounted } from '../utils/hooks/useIsMounted';
import CountggLogo from '../assets/countgg-128.png'
import GavelIcon from '@mui/icons-material/Gavel';


export const Sidebar = () => {
  const navigate = useNavigate();
  const gaEventTracker = useAnalyticsEventTracker('Login');
  const { hash } = useLocation();

  const loginRedirect = process.env.REACT_APP_API_HOST + '/api/auth/login'

  const { user, userLoading } = useContext(UserContext);
  const { counter, loading } = useContext(CounterContext);

  

  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState<boolean>(((counter && !counter.color) && true) || false);
  const isMounted = useIsMounted();
  const [registrationToggle, setRegistrationToggle] = useState(true);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const logoutFunc = async () => {
    const res = await logout();
    if(res.status == 201) {window.location.reload();}
  }

  if ((hash.includes('registration') || (counter && !counter.color)) && modalOpen == false && registrationToggle && !window.location.href.includes('register')) {
    // setTimeout(function() {setModalOpen(true);}, 100);
    setModalOpen(true);
    setRegistrationToggle(false);
  }

  const modalStyle = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '75%',
    bgcolor: 'background.paper',
    color: 'text.primary',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    maxHeight: '75%', 
    overflowY: 'scroll',
  };

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        <ListItem key={'home'} disablePadding>
          <ListItemButton onClick={() => navigate('/')}>
            <ListItemIcon>
              <HomeIcon></HomeIcon>
            </ListItemIcon>
            <ListItemText primary={'Home'} />
          </ListItemButton>
        </ListItem>
        <ListItem key={'threads'} disablePadding>
          <ListItemButton onClick={() => navigate(`/threads`)}>
            <ListItemIcon>
              <StadiumIcon></StadiumIcon>
            </ListItemIcon>
            <ListItemText primary={'Threads'} />
          </ListItemButton>
        </ListItem>
        <ListItem key={'rules'} disablePadding>
          <ListItemButton onClick={() => navigate(`/rules`)}>
            <ListItemIcon>
              <GavelIcon></GavelIcon>
            </ListItemIcon>
            <ListItemText primary={'Rules'} />
          </ListItemButton>
        </ListItem>
      </List>
      <Divider />
      <List>
        <ListItem key={'stats'} disablePadding>
          <ListItemButton onClick={() => navigate(`/stats`)}>
            <ListItemIcon>
              <QueryStatsIcon></QueryStatsIcon>
            </ListItemIcon>
            <ListItemText primary={'Stats'} />
          </ListItemButton>
        </ListItem>
        {counter && counter.roles.includes("counter") && <ListItem key={'my_profile'} disablePadding>
          <ListItemButton onClick={() => navigate(`/counter/${counter.uuid}`)}>
            <ListItemIcon>
              <PersonIcon></PersonIcon>
            </ListItemIcon>
            <ListItemText primary={'My Profile'} />
          </ListItemButton>
        </ListItem>}
        <ListItem key={'counters'} disablePadding>
          <ListItemButton onClick={() => navigate(`/counters`)}>
            <ListItemIcon>
              <GroupsIcon></GroupsIcon>
            </ListItemIcon>
            <ListItemText primary={'Counters'} />
          </ListItemButton>
        </ListItem>
        <ListItem key={'uuid'} disablePadding>
          <ListItemButton onClick={() => navigate(`/uuid`)}>
            <ListItemIcon>
              <CalculateIcon></CalculateIcon>
            </ListItemIcon>
            <ListItemText primary={'UUID to Time'} />
          </ListItemButton>
        </ListItem>
      </List>
      <Divider />
      {counter && counter.roles.includes("gm") && <><List>
        <ListItem key={'roster'} disablePadding>
          <ListItemButton onClick={() => navigate(`/roster`)}>
            <ListItemIcon>
              <PersonIcon></PersonIcon>
            </ListItemIcon>
            <ListItemText primary={'My Roster'} />
          </ListItemButton>
        </ListItem>
        <ListItem key={'free-agents'} disablePadding>
          <ListItemButton onClick={() => navigate(`/free-agents`)}>
            <ListItemIcon>
              <PersonIcon></PersonIcon>
            </ListItemIcon>
            <ListItemText primary={'Free Agents'} />
          </ListItemButton>
        </ListItem>
        </List><Divider /></>}
      {counter && counter.roles.includes("admin") && <><List><ListItem key={'admin'} disablePadding>
          <ListItemButton onClick={() => navigate(`/admin`)}>
            <ListItemIcon>
              <PersonIcon></PersonIcon>
            </ListItemIcon>
            <ListItemText primary={'Admin'} />
          </ListItemButton>
        </ListItem></List><Divider /></>}
        <List>
          <ListItem key={'about'} disablePadding>
            <ListItemButton onClick={() => navigate(`/about`)}>
              <ListItemIcon>
                <InfoIcon></InfoIcon>
              </ListItemIcon>
              <ListItemText primary={'About'} />
            </ListItemButton>
          </ListItem>
          <ListItem key={'privacy-policy'} disablePadding>
            <ListItemButton onClick={() => navigate(`/privacy-policy`)}>
              <ListItemIcon>
                <PrivacyTipIcon></PrivacyTipIcon>
              </ListItemIcon>
              <ListItemText primary={'Privacy Policy'} />
            </ListItemButton>
          </ListItem>
          <ListItem key={'contact-us'} disablePadding>
            <ListItemButton onClick={() => navigate(`/contact-us`)}>
              <ListItemIcon>
                <AlternateEmailIcon></AlternateEmailIcon>
              </ListItemIcon>
              <ListItemText primary={'Contact'} />
            </ListItemButton>
          </ListItem>
        </List>
    </div>
  );

  return (
    <Box sx={{ flexGrow: 1, minHeight: 65, maxHeight: 65 }}>
      <AppBar position="static" color="primary" sx={{ borderBottom: '1px solid', borderColor: 'rgba(194, 224, 255, 0.30)' }}>
        <Toolbar sx={{ minHeight: 65, maxHeight: 65 }}>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={handleDrawerToggle}
          >
            <MenuIcon />
          </IconButton>
          <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={handleDrawerToggle}
          variant="temporary"
          ModalProps={{
            keepMounted: true,
          }}
        >
          {drawer}
        </Drawer>
          <Typography variant="h6" component="div" sx={{ display: 'flex', justifyContent: 'center', flexGrow: 1 }}>
            {/* insert text here */}
            {/* <CountggLogo></CountggLogo> */}
            <Link href={`/`} onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}>
            <CardMedia
                  component="img"
                  className={`countgg-logo`}
                  sx={{ maxHeight: '48px', width: 'auto'}}
                  image={CountggLogo}
                  alt={`logo`}
                />
              </Link>
          </Typography>
          {counter && (counter.roles.includes('unverified') || counter.roles.includes('manual_verification_needed') || counter.roles.includes('discord_verified')) && <>
          {counter && !counter.color && <Badge color="error" badgeContent="1"><Button variant='contained' color='secondary' onClick={() => {setModalOpen(!modalOpen)}}>Complete Registration</Button></Badge>}
          {counter && counter.color && <Button variant='contained' color='secondary' onClick={() => {setModalOpen(!modalOpen)}}>Edit Registration</Button>}
          <Modal
            open={modalOpen}
            onClose={() => {setModalOpen(false)}}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
          >
            <Box sx={modalStyle}>
            <Stepper activeStep={parseInt(`${(counter.roles.includes('unverified') && 0 || counter.roles.includes('manual_verification_needed') && 0 || counter.roles.includes('discord_verified') && 1)}`) || 0} alternativeLabel>
                <Step key={'Verify on Discord'}>
                  <StepLabel>{'Verify on Discord'}</StepLabel>
                </Step>
                <Step key={'Create Profile'}>
                  <StepLabel>{'Create Profile'}</StepLabel>
                </Step>
                <Step key={'Post First Count'}>
                  <StepLabel>{'Post First Count'}</StepLabel>
                </Step>
              </Stepper>
              {counter.roles.includes('unverified') && <>
              <Typography id="modal-modal-title" variant="h6" component="h2" sx={{mt: 2}}>
                Join the Discord to continue!
              </Typography>
              <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                Welcome to countGG, we hope you have a great time! You'll need to join our Discord server using the link below to complete your profile registration.
              </Typography>
              <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                Follow the instructions in the server to connect your discord account, and refresh this page when you're complete! 
              </Typography>
              <Button variant='contained' target={'_blank'} href={'https://discord.gg/bfS9RQht6M'} sx={{mt: 1}}>Join Discord</Button>
              </>}
              {counter.roles.includes('manual_verification_needed') && <>
              <Typography id="modal-modal-title" variant="h6" component="h2" sx={{mt: 2}}>
                Manual verification needed :(
              </Typography>
              <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                Unfortunately your Discord account is under 90 days old. If you're a new counter, please reach out to the Discord moderators with more information! 
              </Typography>
              <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                The account age limit is meant to deter abuse. Please send a direct message to the Discord mods and hopefully we can verify you. 
              </Typography>
              <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                If you needed to make a new account or transfer over an old account, reach out, we can help!
              </Typography>
              <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                If you've left the Discord server, you can join again here:   
              </Typography>
              <Button variant='contained' target={'_blank'} href={'https://discord.gg/bfS9RQht6M'} sx={{mt: 1}}>Join Discord</Button>
              </>}
              {counter.roles.includes('discord_verified') && !counter.color && <>
              <Typography id="modal-modal-title" variant="h6" component="h2" sx={{mt: 2}}>
                Create your profile
              </Typography>
              <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                Your name may not contain derogatory or hateful language. Profiles will be manually approved before becoming visible. If there is an issue with your chosen name, we will contact you via Discord. 
              </Typography>
              <Button variant='contained' onClick={() => {navigate(`/register`); setModalOpen(false)}} sx={{mt: 1}}>Continue</Button>
              </>}
              {counter.roles.includes('discord_verified') && counter.color && <>
              <Typography id="modal-modal-title" variant="h6" component="h2" sx={{mt: 2}}>
                You're almost there!
              </Typography>
              <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                Your registration is under review. No further action is needed from you at this time.  
              </Typography>
              <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                Moderators will review your counter submission and hopefully approve it soon. Should they find a need for you to change your name, they will reach out on Discord!   
              </Typography>
              <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                Your changes are not final. If you want to make any further changes to your profile, you may do so using the link below:    
              </Typography>
              <Button variant='contained' onClick={() => {navigate(`/register`); setModalOpen(false)}} sx={{mt: 1}}>Edit Registration</Button>
              </>}
            </Box>
          </Modal></>}
          {!counter && loading == false && (
            <div>
              <Button href={loginRedirect} onClick={()=>gaEventTracker('login')} variant="contained" color="secondary" startIcon={<LoginIcon />}>
                Login
              </Button>
            </div>
          )}
          {(loading === true) && (
            <Box sx={{padding: '12px'}}>
              <Skeleton variant="circular" width={40} height={40}></Skeleton>
            </Box>
          )}
          {counter && (
            <div>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar alt={`${counter.name}`} src={`${counter.avatar.length > 5 && `https://cdn.discordapp.com/avatars/${counter.discordId}/${counter.avatar}` || `https://cdn.discordapp.com/embed/avatars/0.png`}`}></Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={() => navigate(`/counter/${counter.uuid}`)}>Profile</MenuItem>
                <MenuItem onClick={() => navigate(`/prefs`)}>Preferences</MenuItem>
                <MenuItem><Link target={'_blank'} color='inherit' underline='none' href='https://discord.gg/bfS9RQht6M'>Discord Server</Link></MenuItem>
                <MenuItem onClick={colorMode.toggleColorMode}>Theme: {theme.palette.mode.charAt(0).toUpperCase() + theme.palette.mode.slice(1)}</MenuItem>
                <MenuItem onClick={() => logoutFunc()}>Log Out</MenuItem>
              </Menu>
            </div>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
};
