import { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserContext } from '../utils/contexts/UserContext';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import { Avatar, Badge, Button, CardMedia, Divider, Drawer, Link, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Modal, Skeleton, Step, StepLabel, Stepper, Tooltip, useTheme } from '@mui/material';
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
import { ColorModeContext } from '../utils/contexts/ColorModeContext';
import { useIsMounted } from '../utils/hooks/useIsMounted';
import CountggLogo from '../assets/countgg-128.png'
import GavelIcon from '@mui/icons-material/Gavel';
import SearchIcon from '@mui/icons-material/Search';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { calculateLevel, site_version } from '../utils/helpers';
import VerifiedIcon from '@mui/icons-material/Verified';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import { SocketContext } from '../utils/contexts/SocketContext';
import LinearProgress from '@mui/material/LinearProgress';

export const Sidebar = () => {
  const navigate = useNavigate();
  const { hash } = useLocation();

  const loginRedirect = process.env.REACT_APP_API_HOST + '/api/auth/login'

  const { loading, loadedSiteVer, setLoadedSiteVer, counter, setCounter } = useContext(UserContext);
  const socket = useContext(SocketContext);

  const [xp, setXP] = useState<any>(0);


  useEffect(() => {

    socket.on(`site_version`, function(data) {
      if(setLoadedSiteVer) {setLoadedSiteVer(data)}
    });
  
    socket.on(`xp`, function(data) {
      // console.log(`XP: ${data}`);
      if(counter) {setXP(prevXP => {return parseInt(prevXP) + parseInt(data)})}
      // if(counter && setCounter) {setCounter(prevCounter => {prevCounter.xp = parseInt(prevCounter.xp) + parseInt(data); return prevCounter});console.log(counter.xp);console.log(typeof(data));console.log(typeof(counter.xp));}
    });

    return (() => {
      socket.off(`site_version`);
      socket.off('xp');
    });
  }, [loading])

  useEffect(() => {
    if(counter) {setXP(counter.xp)}
  }, [loading])
  

  

  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState<boolean>(((counter && !counter.color) && true) || false);
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
      {/* <Toolbar /> */}
      <Typography variant='body2' sx={{m: 2, display: 'flex', alignItems: 'end'}}>countGG {site_version}&nbsp;{loadedSiteVer ? (site_version === loadedSiteVer ? <Tooltip title="Up to date"><VerifiedIcon color='success' /></Tooltip> : <Tooltip placement='right' title="Not up to date. Try to refresh, or clear your cache."><ErrorIcon color='error' /></Tooltip>) : <PendingIcon color="disabled" />}</Typography>
      <Divider />
      <List>
        <Link color={'inherit'} underline='none' href={`/`} onClick={(e) => {e.preventDefault();navigate(`/`);}}>
        <ListItem onClick={handleDrawerToggle} key={'home'}  disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <HomeIcon></HomeIcon>
            </ListItemIcon>
            <ListItemText primary={'Home'} />          
          </ListItemButton>          
        </ListItem></Link>
        <Link color={'inherit'} underline='none' href={`/threads`} onClick={(e) => {e.preventDefault();navigate(`/threads`);}}>
        <ListItem onClick={handleDrawerToggle} key={'threads'} disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <StadiumIcon></StadiumIcon>
            </ListItemIcon>
            <ListItemText primary={'Threads'} />
          </ListItemButton>
        </ListItem></Link>
        <Link color={'inherit'} underline='none' href={`/rules`} onClick={(e) => {e.preventDefault();navigate(`/rules`);}}>
        <ListItem onClick={handleDrawerToggle} key={'rules'} disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <GavelIcon></GavelIcon>
            </ListItemIcon>
            <ListItemText primary={'Rules'} />
          </ListItemButton>
        </ListItem></Link>
      </List>
      <Divider />
      <List>
      <Link color={'inherit'} underline='none' href={`/stats`} onClick={(e) => {e.preventDefault();navigate(`/stats`);}}>
        <ListItem onClick={handleDrawerToggle} key={'stats'} disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <QueryStatsIcon></QueryStatsIcon>
            </ListItemIcon>
            <ListItemText primary={'Stats'} />
          </ListItemButton>
        </ListItem></Link>
        {counter && counter.roles.includes("counter") && <Link color={'inherit'} underline='none' href={`/counter/${counter.uuid}`} onClick={(e) => {e.preventDefault();navigate(`/counter/${counter.uuid}`);}}><ListItem onClick={handleDrawerToggle} key={'my_profile'} disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <PersonIcon></PersonIcon>
            </ListItemIcon>
            <ListItemText primary={'My Profile'} />
          </ListItemButton>
        </ListItem></Link>}
        <Link color={'inherit'} underline='none' href={`/counters`} onClick={(e) => {e.preventDefault();navigate(`/counters`);}}>
        <ListItem onClick={handleDrawerToggle} key={'counters'} disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <GroupsIcon></GroupsIcon>
            </ListItemIcon>
            <ListItemText primary={'Counters'} />
          </ListItemButton>
        </ListItem></Link>
        <Link color={'inherit'} underline='none' href={`/achievements`} onClick={(e) => {e.preventDefault();navigate(`/achievements`);}}>
        <ListItem onClick={handleDrawerToggle} key={'achievements'} disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <EmojiEventsIcon></EmojiEventsIcon>
            </ListItemIcon>
            <ListItemText primary={'Achievements'} />
          </ListItemButton>
        </ListItem></Link>
        <Link color={'inherit'} underline='none' href={`/uuid`} onClick={(e) => {e.preventDefault();navigate(`/uuid`);}}>
        <ListItem onClick={handleDrawerToggle} key={'uuid'} disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <CalculateIcon></CalculateIcon>
            </ListItemIcon>
            <ListItemText primary={'UUID to Time'} />
          </ListItemButton>
        </ListItem></Link>
        <Link color={'inherit'} underline='none' href={`/post-finder`} onClick={(e) => {e.preventDefault();navigate(`/post-finder`);}}>
        <ListItem onClick={handleDrawerToggle} key={'post-finder'} disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <SearchIcon></SearchIcon>
            </ListItemIcon>
            <ListItemText primary={'Post Finder'} />
          </ListItemButton>
        </ListItem></Link>
      </List>
      <Divider />
      {counter && counter.roles.includes("admin") && <><List><Link color={'inherit'} underline='none' href={`/admin`} onClick={(e) => {e.preventDefault();navigate(`/admin`);}}><ListItem onClick={handleDrawerToggle} key={'admin'} disablePadding>
          <ListItemButton onClick={() => navigate(`/admin`)}>
            <ListItemIcon>
              <PersonIcon></PersonIcon>
            </ListItemIcon>
            <ListItemText primary={'Admin'} />
          </ListItemButton>
        </ListItem></Link></List><Divider /></>}
        <List>
        <Link color={'inherit'} underline='none' href={`/about`} onClick={(e) => {e.preventDefault();navigate(`/about`);}}>
          <ListItem onClick={handleDrawerToggle} key={'about'} disablePadding>
            <ListItemButton>
              <ListItemIcon>
                <InfoIcon></InfoIcon>
              </ListItemIcon>
              <ListItemText primary={'About'} />
            </ListItemButton>
          </ListItem></Link>
          <Link color={'inherit'} underline='none' href={`/privacy-policy`} onClick={(e) => {e.preventDefault();navigate(`/privacy-policy`);}}>
          <ListItem onClick={handleDrawerToggle} key={'privacy-policy'} disablePadding>
            <ListItemButton>
              <ListItemIcon>
                <PrivacyTipIcon></PrivacyTipIcon>
              </ListItemIcon>
              <ListItemText primary={'Privacy Policy'} />
            </ListItemButton>
          </ListItem></Link>
          <Link color={'inherit'} underline='none' href={`/contact-us`} onClick={(e) => {e.preventDefault();navigate(`/contact-us`);}}>
          <ListItem onClick={handleDrawerToggle} key={'contact-us'} disablePadding>
            <ListItemButton>
              <ListItemIcon>
                <AlternateEmailIcon></AlternateEmailIcon>
              </ListItemIcon>
              <ListItemText primary={'Contact'} />
            </ListItemButton>
          </ListItem></Link>
        </List>
    </div>
  );

  return (
    <Box sx={{ flexGrow: 1, minHeight: 65, maxHeight: 65 }}>
      {/* {loaded_site_version && site_version !== loaded_site_version && <Box><Typography variant='body2' sx={{m: 2, bgcolor: 'red', display: 'flex', alignItems: 'end'}}>Not updated</Typography></Box>} */}
      <AppBar position="static" color={'primary'} sx={{bgcolor: loadedSiteVer && site_version !== loadedSiteVer ? 'red' : '', borderBottom: '1px solid', borderColor: 'rgba(194, 224, 255, 0.30)' }}>
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
              {counter.roles.includes('manual_verification_needed') && !counter.color && <>
              <Typography id="modal-modal-title" variant="h6" component="h2" sx={{mt: 2}}>
                Manual verification needed :(
              </Typography>
              <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                Unfortunately your account requires manual verification. If you're a new counter, please reach out to the Discord moderators for help! 
              </Typography>
              <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                This measure is taken to prevent users from joining with alternate accounts. Sorry! Please  
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
                Your name may not contain derogatory or hateful language.
              </Typography>
              <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                Some users may need to be manually approved.
              </Typography>
              <Button variant='contained' onClick={() => {navigate(`/register`); setModalOpen(false)}} sx={{mt: 1}}>Continue</Button>
              </>}
              {counter.roles.includes('discord_verified') && counter.roles.includes('manual_verification_needed') && counter.color && <>
              <Typography id="modal-modal-title" variant="h6" component="h2" sx={{mt: 2}}>
                You're almost there!
              </Typography>
              <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                Your registration is under review. No further action is needed from you at this time.  
              </Typography>
              <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                Moderators will review your profile submission and hopefully approve it soon. Should they find a need for you to change your name, they will reach out on Discord!   
              </Typography>
              <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                Your changes are not final. If you want to make any further changes to your profile, you may do so using the link below:    
              </Typography>
              <Button variant='contained' onClick={() => {navigate(`/register`); setModalOpen(false)}} sx={{mt: 1, mr: 1}}>Edit Registration</Button> <Button onClick={() => {setModalOpen(false)}} sx={{mt: 1}}>Close</Button>
              </>}
            </Box>
          </Modal></>}
          {!counter && loading == false && (
            <div>
              <Button href={loginRedirect} variant="contained" color="secondary" startIcon={<LoginIcon />}>
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
                sx={{borderRadius: '0'}}
              >
                <Avatar alt={`${counter.name}`} src={`${counter.avatar.length > 5 && `https://cdn.discordapp.com/avatars/${counter.discordId}/${counter.avatar}` || `https://cdn.discordapp.com/embed/avatars/0.png`}`}></Avatar>
                <Box style={{ marginLeft: '8px', width: '100px' }}>
                  <Typography variant="body1">LVL {calculateLevel(xp).level}</Typography>
                  <LinearProgress variant="determinate" color='secondary' title={`${xp.toString()} / ${calculateLevel(xp).xpRequired}`} value={((xp - calculateLevel(xp).minXP) / (calculateLevel(xp).xpRequired - calculateLevel(xp).minXP)) * 100} sx={{borderRadius: '10px'}} />
                  <Typography sx={{fontSize: '9px', mt: 0.5}}>{`${parseInt(xp).toLocaleString()} / ${calculateLevel(xp).xpRequired.toLocaleString()}`}</Typography>
                </Box>
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
                <Link color={'inherit'} underline='none' href={`/counter/${counter.uuid}`} onClick={(e) => {e.preventDefault();navigate(`/counter/${counter.uuid}`);handleClose()}}><MenuItem>Profile</MenuItem></Link>
                <Link color={'inherit'} underline='none' href={`/prefs`} onClick={(e) => {e.preventDefault();navigate(`/prefs`);handleClose()}}><MenuItem>Preferences</MenuItem></Link>
                <Link onClick={handleClose} target={'_blank'} color='inherit' underline='none' href='https://discord.gg/bfS9RQht6M'><MenuItem>Discord Server</MenuItem></Link>
                <MenuItem onClick={() => {colorMode.toggleColorMode()}}>Theme: {theme.palette.mode.charAt(0).toUpperCase() + theme.palette.mode.slice(1)}</MenuItem>
                <MenuItem onClick={() => {logoutFunc(); handleClose()}}>Log Out</MenuItem>
              </Menu>
            </div>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
};
