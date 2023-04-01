import { useContext, useEffect, useState } from 'react';
import { useIsMounted } from '../utils/hooks/useIsMounted';
import { Alert, Box, Button, Container, FormControl, FormControlLabel, FormGroup, InputLabel, MenuItem, Select, Snackbar, Switch, Typography, AlertColor, Tooltip, TextField } from '@mui/material';
import { UserContext } from '../utils/contexts/UserContext';
import { card_backgrounds, card_borders, customStrickenOptions, nightModeOptions, postStyleOptions, standardizeFormatOptions, submitShortcutOptions, titles } from '../utils/helpers';
import { updateCounterPrefs } from '../utils/api';
import { CounterCard } from '../components/CounterCard';
import { Loading } from '../components/Loading';
import { HexColorPicker } from 'react-colorful';
import { useLocation } from 'react-router-dom';

  export const PrefsPage = () => {
    const { user, counter } = useContext(UserContext);
    const isMounted = useIsMounted();

    const location = useLocation();
    useEffect(() => {
        document.title = `Preferences | countGG`;
        return (() => {
          document.title = 'countGG';
        })
      }, [location.pathname]);
    

    const [tabValue, setTabValue] = useState('1');

    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
      setTabValue(newValue);
    };

    //Boolean prefs have to be false by default
    const [prefOnline, setPrefOnline] = useState<boolean>(user?.pref_online || false)
    const [prefDiscordPings, setPrefDiscordPings] = useState<boolean>(user?.pref_discord_pings || false);
    const [prefLoadFromBottom, setPrefLoadFromBottom] = useState<boolean>(user?.pref_load_from_bottom || false);
    const [prefStrikeColor, setPrefStrikeColor] = useState(user?.pref_strike_color || '#cccccc')
    const [prefStandardizeFormat, setPrefStandardizeFormat] = useState(user?.pref_standardize_format || 'Disabled')
    const [prefNightMode, setPrefNightMode] = useState(user?.pref_nightMode || 'System')
    const [prefSubmitShortcut, setPrefSubmitShortcut] = useState(user?.pref_submit_shortcut || 'CtrlEnter')
    const [prefNoClear, setPrefNoClear] = useState(user?.pref_noClear || false)
    const [prefTimeSinceLastCount, setPrefTimeSinceLastCount] = useState(user?.pref_time_since_last_count || false)
    const [prefCustomStricken, setPrefCustomStricken] = useState(user?.pref_custom_stricken || 'Disabled')  
    const [prefPostStyle, setPrefPostStyle] = useState(user?.pref_post_style || 'Default')  
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
          user.pref_time_since_last_count = prefTimeSinceLastCount;
          user.pref_standardize_format = prefStandardizeFormat;
          user.pref_nightMode = prefNightMode;
          user.pref_submit_shortcut = prefSubmitShortcut;
          user.pref_custom_stricken = prefCustomStricken;
          user.pref_strike_color = prefStrikeColor;
          user.pref_noClear = prefNoClear;
          user.pref_post_style = prefPostStyle;
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
              {/* Uncomment these once complete */}
              {/* <FormControlLabel control={<Switch
                  checked={prefOnline}
                  onChange={() => {setPrefOnline(!prefOnline)}}
                  inputProps={{ 'aria-label': 'pref-online' }}
                />} label={
                  <Tooltip title="When enabled, other users can see when you are online.">
                    <Typography variant="body1">Show my online status (not yet implemented)</Typography>
                  </Tooltip>
                } /> */}
                {/* <FormControlLabel control={<Switch
                checked={prefDiscordPings}
                onChange={() => {setPrefDiscordPings(!prefDiscordPings)}}
                inputProps={{ 'aria-label': 'pref-discord-pings' }}
              />} label="Ping me on Discord on mentions (not yet implemented)" /> */}
              <FormControlLabel control={<Switch
                  checked={prefLoadFromBottom}
                  onChange={() => {setPrefLoadFromBottom(!prefLoadFromBottom)}}
                  inputProps={{ 'aria-label': 'pref-load-from-bottom' }}
                />} label={
                  <Tooltip title="When enabled, new posts appear on the bottom rather than on top. This causes more visual lag on each post (10+ ms).">
                    <Typography variant="body1">Load new posts on bottom (not recommended)</Typography>
                  </Tooltip>
                } />
                <FormControlLabel control={<Switch
                  checked={prefNoClear}
                  onChange={() => {setPrefNoClear(!prefNoClear)}}
                  inputProps={{ 'aria-label': 'pref-no-clear' }}
                />} label={
                  <Tooltip title="When enabled, the textbox does not automatically clear upon submitting a post.">
                    <Typography variant="body1">Don't clear the textbox when submitting a post</Typography>
                  </Tooltip>
                } />
                <FormControlLabel control={<Switch
                  checked={prefTimeSinceLastCount}
                  onChange={() => {setPrefTimeSinceLastCount(!prefTimeSinceLastCount)}}
                  inputProps={{ 'aria-label': 'pref-time-since-last-count' }}
                />} label={
                    <Typography variant="body1">Show time since last valid count</Typography>
                } />
                <FormControl sx={{m: 2}}>
                <InputLabel id="standardize-format-label">Standardize Format</InputLabel>
                <Select
                    labelId="standardize-format-label"
                    id="standardize-format"
                    value={prefStandardizeFormat}
                    defaultValue={prefStandardizeFormat}
                    label="Standardize Format"
                    onChange={e => setPrefStandardizeFormat((e.target as HTMLInputElement).value)}
                    sx={{width: 200}}
                >
                  {standardizeFormatOptions.map((card) => {
                    return (<MenuItem value={card}>{card}</MenuItem>)
                  })}
                </Select>
            </FormControl>
            <FormControl sx={{m: 2}}>
                <InputLabel id="night-mode-label">Night Mode</InputLabel>
                <Select
                    labelId="night-mode-label"
                    id="night-mode"
                    value={prefNightMode}
                    defaultValue={prefNightMode}
                    label="Night Mode"
                    onChange={e => setPrefNightMode((e.target as HTMLInputElement).value)}
                    sx={{width: 200}}
                >
                  {nightModeOptions.map((card) => {
                    return (<MenuItem value={card}>{card}</MenuItem>)
                  })}
                </Select>
            </FormControl>
            <FormControl sx={{m: 2}}>
                <InputLabel id="submit-shortcut-label">Submit Shortcut</InputLabel>
                <Select
                    labelId="submit-shortcut-label"
                    id="submit-shortcut"
                    value={prefSubmitShortcut}
                    defaultValue={prefSubmitShortcut}
                    label="Submit Shortcut"
                    onChange={e => setPrefSubmitShortcut((e.target as HTMLInputElement).value)}
                    sx={{width: 200}}
                >
                  {submitShortcutOptions.map((card) => {
                      return (<MenuItem value={card}>{card}</MenuItem>)
                  })}
                </Select>
            </FormControl>
            <FormControl sx={{m: 2}}>
                <InputLabel id="post-style-label">Post Style</InputLabel>
                <Select
                    labelId="post-style-label"
                    id="post-style"
                    value={prefPostStyle}
                    defaultValue={prefPostStyle}
                    label="Post Style"
                    onChange={e => setPrefPostStyle((e.target as HTMLInputElement).value)}
                    sx={{width: 200}}
                >
                  {postStyleOptions.map((card) => {
                      return (<MenuItem value={card}>{card}</MenuItem>)
                  })}
                </Select>
            </FormControl>
            <FormControl sx={{m: 2}}>
                <InputLabel id="custom-stricken-label">Custom Stricken</InputLabel>
                <Select
                    labelId="custom-stricken-label"
                    id="custom-stricken"
                    value={prefCustomStricken}
                    label="Custom Stricken"
                    onChange={e => setPrefCustomStricken((e.target as HTMLInputElement).value)}
                    sx={{width: 200}}
                >
                  {customStrickenOptions.map((card) => {
                    return (<MenuItem value={card}>{card}</MenuItem>)
                  })}
                </Select>
            </FormControl>
                {prefCustomStricken !== 'Disabled' && <>
                <HexColorPicker color={prefStrikeColor} onChange={setPrefStrikeColor} />
                <TextField sx={{m: 2}} id="StrikeColor" onInput={e => setPrefStrikeColor((e.target as HTMLInputElement).value)} label="Strike Color" InputLabelProps={{ shrink: true }} value={prefStrikeColor}></TextField>
                </>}

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

