import { useContext, useEffect, useState } from 'react';
import { useIsMounted } from '../utils/hooks/useIsMounted';
import { Alert, Box, Button, Container, FormControl, FormControlLabel, FormGroup, InputLabel, MenuItem, Select, Snackbar, Switch, Typography, AlertColor, Tooltip, TextField } from '@mui/material';
import { UserContext } from '../utils/contexts/UserContext';
import { card_backgrounds, card_borders, clearOptions, customStrickenOptions, hideStrickenOptions, isColorSuitableForBackground, isValidHexColor, nightModeColorOptions, nightModeOptions, postPositionOptions, postStyleOptions, soundOnStrickenOptions, standardizeFormatOptions, submitShortcutOptions, titles } from '../utils/helpers';
import { updateCounterPrefs } from '../utils/api';
import { CounterCard } from '../components/CounterCard';
import { Loading } from '../components/Loading';
import { HexColorPicker } from 'react-colorful';
import { useLocation } from 'react-router-dom';
import Count from '../components/Count';

  export const PrefsPage = () => {
    const { user, counter, items } = useContext(UserContext);
    const isMounted = useIsMounted();


    // console.log("AYO");
    // console.log(items);

    const location = useLocation();
    useEffect(() => {
        document.title = `Preferences | Counting!`;
        return (() => {
          document.title = 'Counting!';
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
    const [prefClear, setPrefClear] = useState(user?.pref_clear || 'Clear')
    const [prefTimeSinceLastCount, setPrefTimeSinceLastCount] = useState(user?.pref_time_since_last_count || false)
    const [prefCustomStricken, setPrefCustomStricken] = useState(user?.pref_custom_stricken || 'Disabled')  
    const [prefPostStyle, setPrefPostStyle] = useState(user?.pref_post_style || 'Default')  
    const [prefPostStyleMobile, setPrefPostStyleMobile] = useState(user?.pref_post_style_mobile || 'Default')  
    const [prefReplyTimeInterval, setPrefReplyTimeInterval] = useState(user?.pref_reply_time_interval || 100);
    const [prefNightModeColors, setPrefNightModeColors] = useState(user?.pref_night_mode_colors || 'Default')  
    const [prefPostPosition, setPrefPostPosition] = useState(user?.pref_post_position || 'Left')  
    const [prefHideStricken, setPrefHideStricken] = useState(user?.pref_hide_stricken || 'Disabled')  
    const [prefHighlightLastCount, setPrefHighlightLastCount] = useState(user?.pref_highlight_last_count || false)
    const [prefHighlightLastCountColor, setPrefHighlightLastCountColor] = useState(user?.pref_highlight_last_count_color || '#006b99')
    const [prefSoundOnStricken, setPrefSoundOnStricken] = useState(user?.pref_sound_on_stricken || 'Disabled')
    const [prefHideThreadPicker, setPrefHideThreadPicker] = useState(user?.pref_hide_thread_picker || false)
    const [prefStrickenCountOpacity, setPrefStrickenCountOpacity] = useState(user?.pref_stricken_count_opacity || 1)
    const [cardStyle, setCardStyle] = useState(counter?.cardStyle || 'card_default');
    const [cardBorderStyle, setCardBorderStyle] = useState(counter?.cardBorderStyle || 'no_border_square');
    const [displayName, setDisplayName] = useState(counter?.name || '');
    const [color, setColor] = useState(counter?.color || '#cccccc');
    const [title, setTitle] = useState(counter?.title || 'COUNTER');
    const [emoji, setEmoji] = useState(counter?.emoji || "None");

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

        const isSuitableForLightMode = isColorSuitableForBackground(color, '#ffffff', 1.25);
        const isSuitableForDarkMode = isColorSuitableForBackground(color, '#000000', 1.25);
        setSnackbarSeverity('error');


        if(displayName.replace(/[\p{Letter}\p{Mark}\s_\d-]+/gu, '').length != 0) {
            setSnackbarOpen(true)
            setSnackbarMessage('Error: Illegal characters in name.')
            return;
          }
          else if(color.trim().length != 7) {
              setSnackbarOpen(true)
              setSnackbarMessage('Error: Color must a # followed by a 6 character hex code. No transparency, try removing the final 2 characters if your hex code is 8 characters long?')
              return;
          }
          else if(!isValidHexColor(color.trim().slice(1))) {
              setSnackbarOpen(true)
              setSnackbarMessage('Error: Illegal characters in color')
              return;
          }
          else if(Array.from(color)[0] != '#') {
              setSnackbarOpen(true)
              setSnackbarMessage('Error: Color must start with #.')
              return;
          } else if (!isSuitableForLightMode) {
            setSnackbarOpen(true)
            setSnackbarMessage('Error: Color is too close to white, and is hard to read on light mode, please try a different color.')
            return;
          } else if (!isSuitableForDarkMode) {
            setSnackbarOpen(true)
            setSnackbarMessage('Error: Color is too close to black, and is hard to read on dark mode, please try a different color.')
            return;
          }
          else if(displayName.trim().length < 1) {
              setSnackbarOpen(true)
              setSnackbarMessage('Error: Name has no length')
              return;
          }
          else if(displayName.trim().length > 25) {
              setSnackbarOpen(true)
              setSnackbarMessage('Error: Name over 25 characters')
              return;
          }
          user.pref_discord_pings = prefDiscordPings; 
          user.pref_online = prefOnline;
          user.pref_load_from_bottom = prefLoadFromBottom;
          user.pref_time_since_last_count = prefTimeSinceLastCount;
          user.pref_standardize_format = prefStandardizeFormat;
          user.pref_nightMode = prefNightMode;
          user.pref_submit_shortcut = prefSubmitShortcut;
          user.pref_custom_stricken = prefCustomStricken;
          user.pref_strike_color = prefStrikeColor;
          user.pref_clear = prefClear;
          user.pref_post_style = prefPostStyle;
          user.pref_post_style_mobile = prefPostStyleMobile;
          user.pref_reply_time_interval = prefReplyTimeInterval;
          user.pref_night_mode_colors = prefNightModeColors;
          user.pref_post_position = prefPostPosition;
          user.pref_hide_stricken = prefHideStricken;
          user.pref_hide_thread_picker = prefHideThreadPicker;
          user.pref_sound_on_stricken = prefSoundOnStricken;
          user.pref_highlight_last_count = prefHighlightLastCount;
          user.pref_highlight_last_count_color = prefHighlightLastCountColor;
          user.pref_stricken_count_opacity = prefStrickenCountOpacity;
          counter.name = displayName;
          counter.color = color;
          counter.cardStyle = cardStyle;
          counter.cardBorderStyle = cardBorderStyle;
          counter.title = title;
          counter.emoji = emoji === "None" ? undefined : emoji;
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

      let [maybeU, setMaybeU] = useState("");
      useEffect(() => {
        if(Math.random() > 0.5) {
          setMaybeU('u');
        }
      }, [])

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
          <Typography variant="h4">Preferences <Button sx={{m: 2}} size='large' color="success" variant="contained" onClick={() => {savePrefs()}}>Save</Button></Typography>
          <Box sx={{mt: 2, p: 1, borderRadius: '10px', bgcolor: 'background.paper', color: 'text.primary'}}>
            <Typography variant="h6">Profile Preferences <Button sx={{m: 2}} size='large' color="success" variant="contained" onClick={() => {savePrefs()}}>Save</Button></Typography>
            <TextField sx={{m: 2}} id="DisplayName" onInput={e => setDisplayName((e.target as HTMLInputElement).value)} label={`Display Name`} InputLabelProps={{ shrink: true }} value={displayName}></TextField>
            <TextField sx={{m: 2}} id={`Colo${maybeU}r`} onInput={e => setColor((e.target as HTMLInputElement).value)} label={`Colo${maybeU}r`} InputLabelProps={{ shrink: true }} value={color}></TextField>
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
                  {items && items.map((item) => {
                    if(item.category === 'card') {
                      return (<MenuItem value={item.internal_name}>{item.name}</MenuItem>)
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
                  {items && items.map((item) => {
                    if(item.category === 'border') {
                      return (<MenuItem value={item.internal_name}>{item.name}</MenuItem>)
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
                  {items && items.map((item) => {
                    if(item.category === 'title') {
                      return (<MenuItem value={item.internal_name}>{item.name}</MenuItem>)
                    }
                  })}
                </Select>
            </FormControl>
            <FormControl sx={{m: 2}}>
                <InputLabel id="emoji-label">Emoji</InputLabel>
                <Select
                    labelId="emoji-label"
                    id="emoji"
                    value={emoji}
                    defaultValue={emoji}
                    label="Emoji"
                    onChange={e => setEmoji((e.target as HTMLInputElement).value)}
                    sx={{width: 200}}
                >
                  <MenuItem value={"None"}>None</MenuItem>
                  {items && items.map((item) => {
                    if(item.category === 'emoji') {
                      return (<MenuItem value={item.internal_name}>{item.name}</MenuItem>)
                    }
                  })}
                </Select>
            </FormControl>
            
            <Box sx={{margin: '5px'}}>
              <CounterCard fullSize={false} maxHeight={32} maxWidth={32} boxPadding={2} counter={{...counter, cardStyle: cardStyle, cardBorderStyle: cardBorderStyle, title: title, name: displayName, emoji: emoji === 'None' ? undefined : emoji}}></CounterCard>
            </Box>
            <Box sx={{margin: '5px'}}>
              <CounterCard sx={{p: 1}} fullSize={true} maxHeight={100} maxWidth={100} boxPadding={2} counter={{...counter, cardStyle: cardStyle, cardBorderStyle: cardBorderStyle, title: title, name: displayName, emoji: emoji === 'None' ? undefined : emoji}}></CounterCard>
            </Box>
            </Box>
            <Box sx={{mt: 2, p: 1, borderRadius: '10px', bgcolor: 'background.paper', color: 'text.primary'}}>
            <Typography variant="h6">Counting Preferences <Button sx={{m: 2}} size='large' color="success" variant="contained" onClick={() => {savePrefs()}}>Save</Button></Typography>
            {/* <Count user={user} myCounter={fakeCounter} key={`fakeCount_${Math.random()}`} thread={{}} socket={{}} post={fakePost(fakeCounter)} counter={fakeCounter} maxWidth={'32px'} maxHeight={'32px'} /> */}
            <FormGroup sx={{m: 2, userSelect: 'none', flexDirection: "row"}}>
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
              <Box sx={{width: "100%"}}>
              <FormControlLabel control={<Switch
                  checked={prefLoadFromBottom}
                  onChange={() => {setPrefLoadFromBottom(!prefLoadFromBottom)}}
                  inputProps={{ 'aria-label': 'pref-load-from-bottom' }}
                />} label={
                  <Tooltip title="When enabled, new posts appear on the bottom rather than on top.">
                    <Typography variant="body1">Load new posts on bottom</Typography>
                  </Tooltip>
                } />
                <FormControlLabel control={<Switch
                  checked={prefHighlightLastCount}
                  onChange={() => {setPrefHighlightLastCount(!prefHighlightLastCount)}}
                  inputProps={{ 'aria-label': 'pref-highlight-last-count' }}
                />} label={
                    <Typography variant="body1">Highlight last valid count</Typography>
                } />
                <FormControlLabel control={<Switch
                  checked={prefHideThreadPicker}
                  onChange={() => {setPrefHideThreadPicker(!prefHideThreadPicker)}}
                  inputProps={{ 'aria-label': 'pref-hide-thread-picker' }}
                />} label={
                    <Typography variant="body1">Hide thread picker by default (on desktop)</Typography>
                } />
                </Box>
                <FormControl sx={{m: 2}}>
                <InputLabel id="clear-label">Textbox Behavio{maybeU}r</InputLabel>
                <Select
                    labelId="clear-label"
                    id="clear"
                    value={prefClear}
                    defaultValue={prefClear}
                    label={`Textbox Behavio${maybeU}r`}
                    onChange={e => setPrefClear((e.target as HTMLInputElement).value)}
                    sx={{width: 200}}
                >
                  {clearOptions.map((card) => {
                    return (<MenuItem value={card}>{card}</MenuItem>)
                  })}
                </Select>
            </FormControl>
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
                <InputLabel id="post-style-label">Desktop Post Style</InputLabel>
                <Select
                    labelId="post-style-label"
                    id="post-style"
                    value={prefPostStyle}
                    defaultValue={prefPostStyle}
                    label="Desktop Post Style"
                    onChange={e => setPrefPostStyle((e.target as HTMLInputElement).value)}
                    sx={{width: 200}}
                >
                  {postStyleOptions.map((card) => {
                      return (<MenuItem value={card}>{card}</MenuItem>)
                  })}
                </Select>
            </FormControl>
            <FormControl sx={{m: 2}}>
                <InputLabel id="post-style-mobile-label">Mobile Post Style</InputLabel>
                <Select
                    labelId="post-style-mobile-label"
                    id="post-style-mobile"
                    value={prefPostStyleMobile}
                    defaultValue={prefPostStyleMobile}
                    label="Mobile Post Style"
                    onChange={e => setPrefPostStyleMobile((e.target as HTMLInputElement).value)}
                    sx={{width: 200}}
                >
                  {postStyleOptions.map((card) => {
                      return (<MenuItem value={card}>{card}</MenuItem>)
                  })}
                </Select>
            </FormControl>
            <FormControl sx={{m: 2}}>
                <InputLabel id="night-mode-colors-label">Night Mode Colo{maybeU}rs</InputLabel>
                <Select
                    labelId="night-mode-colors-label"
                    id="night-mode-colors"
                    value={prefNightModeColors}
                    defaultValue={prefNightModeColors}
                    label={`Night Mode Colo${maybeU}rs`}
                    onChange={e => setPrefNightModeColors((e.target as HTMLInputElement).value)}
                    sx={{width: 200}}
                >
                  {nightModeColorOptions.map((card) => {
                      return (<MenuItem value={card}>{card}</MenuItem>)
                  })}
                </Select>
            </FormControl>
            <FormControl sx={{m: 2}}>
                <InputLabel id="post-position-label">Post Position</InputLabel>
                <Select
                    labelId="post-position-label"
                    id="post-position"
                    value={prefPostPosition}
                    defaultValue={prefPostPosition}
                    label="Post Position"
                    onChange={e => setPrefPostPosition((e.target as HTMLInputElement).value)}
                    sx={{width: 200}}
                >
                  {postPositionOptions.map((card) => {
                      return (<MenuItem value={card}>{card}</MenuItem>)
                  })}
                </Select>
            </FormControl>
            <FormControl sx={{m: 2}}>
                <InputLabel id="hide-stricken-label">Hide Stricken</InputLabel>
                <Select
                    labelId="hide-stricken-label"
                    id="hide-stricken"
                    value={prefHideStricken}
                    defaultValue={prefHideStricken}
                    label="Hide Stricken"
                    onChange={e => setPrefHideStricken((e.target as HTMLInputElement).value)}
                    sx={{width: 200}}
                >
                  {hideStrickenOptions.map((card) => {
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
            <FormControl sx={{m: 2}}>
                <InputLabel id="sound-on-stricken-label">Play Sound on Stricken</InputLabel>
                <Select
                    labelId="sound-on-stricken-label"
                    id="sound-on-stricken"
                    value={prefSoundOnStricken}
                    label="Play Sound on Stricken"
                    onChange={e => setPrefSoundOnStricken((e.target as HTMLInputElement).value)}
                    sx={{width: 200}}
                >
                  {soundOnStrickenOptions.map((card) => {
                    return (<MenuItem value={card}>{card}</MenuItem>)
                  })}
                </Select>
            </FormControl>
          </FormGroup>
          <FormGroup sx={{m: 2, userSelect: 'none', flexDirection: "row"}}>
                {prefCustomStricken !== 'Disabled' && <>
                <TextField sx={{m: 2}} id="StrikeColor" onInput={e => setPrefStrikeColor((e.target as HTMLInputElement).value)} label={`Strike Colo${maybeU}r`} InputLabelProps={{ shrink: true }} value={prefStrikeColor}></TextField>
                <HexColorPicker color={prefStrikeColor} onChange={setPrefStrikeColor} />
                </>}
                {prefHighlightLastCount && <>
                <TextField sx={{m: 2}} id="HighlightLastCountColor" onInput={e => setPrefHighlightLastCountColor((e.target as HTMLInputElement).value)} label={`Highlight Last Count Colo${maybeU}r`} InputLabelProps={{ shrink: true }} value={prefHighlightLastCountColor}></TextField>
                <HexColorPicker color={prefHighlightLastCountColor} onChange={setPrefHighlightLastCountColor} />
                </>}

            </FormGroup>
            
            {/* <FormGroup> */}
            <TextField
              sx={{ m: 2, minWidth: 200}}
              id="ReplyTimeInterval"
              type="number"
              inputProps={{ min: "1", max: "10000", step: "1" }}
              onInput={(e) => {
                const value = parseInt((e.target as HTMLInputElement).value || "0", 10);
                if (value >= 1 && value <= 10000) {
                  setPrefReplyTimeInterval(value);
                }
              }}
              label="Reply Time Interval"
              InputLabelProps={{ shrink: true }}
              value={prefReplyTimeInterval}
            />
            <TextField
              sx={{ m: 2, minWidth: 200}}
              id="ReplyTimeOpacity"
              type="number"
              inputProps={{ min: "0", max: "1", step: 0.01 }}
              onInput={(e) => {
                const value = parseFloat((e.target as HTMLInputElement).value || "0");
                if (value >= 0 && value <= 1) {
                  setPrefStrickenCountOpacity(value);
                }
              }}
              label="Stricken Count Opacity"
              InputLabelProps={{ shrink: true }}
              value={prefStrickenCountOpacity}
            />
            {/* </FormGroup>  */}
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

