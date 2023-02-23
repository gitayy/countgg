import { useContext, useState } from 'react';
import { CounterContext } from '../utils/contexts/CounterContext';
import { useIsMounted } from '../utils/hooks/useIsMounted';
import { Alert, Box, Button, Container, FormControl, FormControlLabel, FormGroup, InputLabel, MenuItem, Select, Snackbar, Switch, Typography, AlertColor, Tooltip } from '@mui/material';
import { UserContext } from '../utils/contexts/UserContext';
import { card_backgrounds, card_borders, titles } from '../utils/helpers';
import { updateCounterPrefs } from '../utils/api';
import { CounterCard } from '../components/CounterCard';
import { Loading } from '../components/Loading';

  export const PrefsPage = () => {
    const { user, userLoading } = useContext(UserContext);
    const { counter, loading } = useContext(CounterContext);
    const isMounted = useIsMounted();

    const [tabValue, setTabValue] = useState('1');

    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
      setTabValue(newValue);
    };

    //Boolean prefs have to be false by default
    const [prefOnline, setPrefOnline] = useState<boolean>(user?.pref_online || false)
    const [prefDiscordPings, setPrefDiscordPings] = useState<boolean>(user?.pref_discord_pings || false);
    const [prefLoadFromBottom, setPrefLoadFromBottom] = useState<boolean>(user?.pref_load_from_bottom || false);
    const [cardStyle, setCardStyle] = useState(counter?.cardStyle || 'card_default');
    const [cardBorderStyle, setCardBorderStyle] = useState(counter?.cardBorderStyle || 'no_border_square');
    const [title, setTitle] = useState(counter?.title || 'COUNTER');

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('error');
    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
          return;
        }    
        setSnackbarOpen(false);
      };

    const savePrefs = async () => {
      if(user && counter) {
          user.pref_discord_pings = prefDiscordPings; 
          user.pref_online = prefOnline;
          user.pref_load_from_bottom = prefLoadFromBottom;
          counter.cardStyle = cardStyle;
          counter.cardBorderStyle = cardBorderStyle;
          counter.title = title;
          try {const res = await updateCounterPrefs(user, counter);
          if(res.status == 201) {
            setSnackbarSeverity('success');
            setSnackbarOpen(true)
            setSnackbarMessage('Changes made successfully')
          } }
          catch(err) {
            setSnackbarSeverity('error');
            setSnackbarOpen(true)
            setSnackbarMessage('Error: Submission rejected. If this comes as a surprise, please reach out to discord mods via DM!')
          }
        }
      }

    if(user && counter) {

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
        <Container maxWidth="xl" sx={{ bgcolor: 'primary.light', flexGrow: 1, p: 2}}>
          <Typography variant="h4">Preferences</Typography>
          <Box sx={{mt: 2, p: 1, borderRadius: '10px', bgcolor: 'background.paper', color: 'text.primary'}}>
            <Typography variant="h6">Counter Preferences</Typography>
            <FormControl sx={{m: 2}}>
                <InputLabel id="card-style-label">Card Style</InputLabel>
                <Select
                    labelId="card-style"
                    id="card-style"
                    value={cardStyle}
                    defaultValue={cardStyle}
                    label="Card Style"
                    onChange={e => setCardStyle((e.target as HTMLInputElement).value)}
                    sx={{width: 200}}
                >
                  {Object.keys(card_backgrounds).map((card) => {
                    if(user.card_backgrounds.includes(card_backgrounds[card].value)) {
                      return (<MenuItem value={card}>{card}</MenuItem>)
                    }
                  })}
                </Select>
            </FormControl>
            <FormControl sx={{m: 2}}>
                <InputLabel id="card-border-style-label">Card Border Style</InputLabel>
                <Select
                    labelId="card-border-style-label"
                    id="card-border-style"
                    value={cardBorderStyle}
                    defaultValue={cardBorderStyle}
                    label="Card Border Style"
                    onChange={e => setCardBorderStyle((e.target as HTMLInputElement).value)}
                    sx={{width: 200}}
                >
                  {Object.keys(card_borders).map((card) => {
                    if(user.card_borders.includes(card_borders[card].value)) {
                      return (<MenuItem value={card}>{card}</MenuItem>)
                    }
                  })}
                </Select>
            </FormControl>
            <FormControl sx={{m: 2}}>
                <InputLabel id="title-label">Title</InputLabel>
                <Select
                    labelId="title-label"
                    id="title"
                    value={title}
                    defaultValue={title}
                    label="Title"
                    onChange={e => setTitle((e.target as HTMLInputElement).value)}
                    sx={{width: 200}}
                >
                  {Object.keys(titles).map((card) => {
                    if(user.titles.includes(titles[card].value)) {
                      return (<MenuItem value={card}>{card}</MenuItem>)
                    }
                  })}
                </Select>
            </FormControl>
            <Box sx={{margin: '5px'}}>
              <CounterCard fullSize={false} maxHeight={32} maxWidth={32} boxPadding={2} counter={{...counter, cardStyle: cardStyle, cardBorderStyle: cardBorderStyle, title: title}}></CounterCard>
            </Box>
            <Box sx={{margin: '5px'}}>
              <CounterCard sx={{p: 1}} fullSize={true} maxHeight={100} maxWidth={100} boxPadding={2} counter={{...counter, cardStyle: cardStyle, cardBorderStyle: cardBorderStyle, title: title}}></CounterCard>
            </Box>
            </Box>
            <Box sx={{mt: 2, p: 1, borderRadius: '10px', bgcolor: 'background.paper', color: 'text.primary'}}>
            <Typography variant="h6">User Preferences</Typography>
            <FormGroup sx={{m: 2, userSelect: 'none'}}>
              <FormControlLabel control={<Switch
                  checked={prefOnline}
                  onChange={() => {setPrefOnline(!prefOnline)}}
                  inputProps={{ 'aria-label': 'pref-online' }}
                />} label={
                  <Tooltip title="When enabled, other users can see when you are online.">
                    <Typography variant="body1">Show my online status (not yet implemented)</Typography>
                  </Tooltip>
                } />
                <FormControlLabel control={<Switch
                checked={prefDiscordPings}
                onChange={() => {setPrefDiscordPings(!prefDiscordPings)}}
                inputProps={{ 'aria-label': 'pref-discord-pings' }}
              />} label="Ping me on Discord on mentions (not yet implemented)" />
              <FormControlLabel control={<Switch
                  checked={prefLoadFromBottom}
                  onChange={() => {setPrefLoadFromBottom(!prefLoadFromBottom)}}
                  inputProps={{ 'aria-label': 'pref-load-from-bottom' }}
                />} label={
                  <Tooltip title="When enabled, new posts appear on the bottom rather than on top. This causes more visual lag on each post (10+ ms).">
                    <Typography variant="body1">Load new posts on bottom (not recommended)</Typography>
                  </Tooltip>
                } />
            </FormGroup>
            
            <FormGroup>
                {/* More here */}
            </FormGroup> 
            <Button sx={{m: 2}} color="success" variant="contained" onClick={() => {savePrefs()}}>Save</Button>
            </Box>
        </Container>
        </>
        )
    } else {
      return (
        <Loading />
      );
      }
  };

