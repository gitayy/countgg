import { useContext, useEffect, useState } from 'react'
import { useIsMounted } from '../utils/hooks/useIsMounted'
import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Switch,
  Typography,
  AlertColor,
  Tooltip,
  TextField,
} from '@mui/material'
import { UserContext } from '../utils/contexts/UserContext'
import {
  clearOptions,
  customStrickenOptions,
  hideStrickenOptions,
  isColorSuitableForBackground,
  isValidHexColor,
  nightModeColorOptions,
  nightModeOptions,
  postPositionOptions,
  postStyleOptions,
  soundOnStrickenOptions,
  standardizeFormatOptions,
  submitShortcutOptions,
} from '../utils/helpers'
import { updateCounterPrefs } from '../utils/api'
import { CounterCard } from '../components/CounterCard'
import { Loading } from '../components/Loading'
import { HexColorPicker } from 'react-colorful'
import { useLocation } from 'react-router-dom'
import Count from '../components/count/Count'
import { Preferences } from '../components/Preferences'

export const PrefsPage = () => {
  const { user, counter, items } = useContext(UserContext)
  const isMounted = useIsMounted()

  // console.log("AYO");
  // console.log(items);

  const location = useLocation()
  useEffect(() => {
    document.title = `Preferences | Counting!`
    return () => {
      document.title = 'Counting!'
    }
  }, [location.pathname])

  const [tabValue, setTabValue] = useState('1')

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue)
  }

  //Boolean prefs have to be false by default
  const [prefOnline, setPrefOnline] = useState<boolean>(user?.pref_online || false)
  const [prefDiscordPings, setPrefDiscordPings] = useState<boolean>(user?.pref_discord_pings || false)
  const [prefLoadFromBottom, setPrefLoadFromBottom] = useState<boolean>(user?.pref_load_from_bottom || false)
  const [prefStrikeColor, setPrefStrikeColor] = useState(user?.pref_strike_color || '#cccccc')
  const [prefStandardizeFormat, setPrefStandardizeFormat] = useState(user?.pref_standardize_format || 'Disabled')
  const [prefNightMode, setPrefNightMode] = useState(user?.pref_nightMode || 'System')
  const [prefSubmitShortcut, setPrefSubmitShortcut] = useState(user?.pref_submit_shortcut || 'CtrlEnter')
  const [prefClear, setPrefClear] = useState(user?.pref_clear || 'Clear')
  const [prefTimeSinceLastCount, setPrefTimeSinceLastCount] = useState(user?.pref_time_since_last_count || false)
  const [prefCustomStricken, setPrefCustomStricken] = useState(user?.pref_custom_stricken || 'Disabled')
  const [prefPostStyle, setPrefPostStyle] = useState(user?.pref_post_style || 'Default')
  const [prefPostStyleMobile, setPrefPostStyleMobile] = useState(user?.pref_post_style_mobile || 'Default')
  const [prefReplyTimeInterval, setPrefReplyTimeInterval] = useState(user?.pref_reply_time_interval || 100)
  const [prefNightModeColors, setPrefNightModeColors] = useState(user?.pref_night_mode_colors || 'Default')
  const [prefPostPosition, setPrefPostPosition] = useState(user?.pref_post_position || 'Left')
  const [prefHideStricken, setPrefHideStricken] = useState(user?.pref_hide_stricken || 'Disabled')
  const [prefHighlightLastCount, setPrefHighlightLastCount] = useState(user?.pref_highlight_last_count || false)
  const [prefHighlightLastCountColor, setPrefHighlightLastCountColor] = useState(user?.pref_highlight_last_count_color || '#006b99')
  const [prefSoundOnStricken, setPrefSoundOnStricken] = useState(user?.pref_sound_on_stricken || 'Disabled')
  const [prefHideThreadPicker, setPrefHideThreadPicker] = useState(user?.pref_hide_thread_picker || false)
  const [prefStrickenCountOpacity, setPrefStrickenCountOpacity] = useState(user?.pref_stricken_count_opacity || 1)
  const [rainbowNumber, setRainbowNumber] = useState(counter?.rainbow || 1)
  const [cardStyle, setCardStyle] = useState(counter?.cardStyle || 'card_default')
  const [cardBorderStyle, setCardBorderStyle] = useState(counter?.cardBorderStyle || 'no_border_square')
  const [displayName, setDisplayName] = useState(counter?.name || '')
  const [color, setColor] = useState(counter?.color || '#cccccc')
  const [title, setTitle] = useState(counter?.title || 'COUNTER')
  const [emoji, setEmoji] = useState(counter?.emoji || 'None')

  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('error')
  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return
    }
    setSnackbarOpen(false)
  }

  const savePrefs = async () => {
    if (user && counter) {
      const isSuitableForLightMode = isColorSuitableForBackground(color, '#ffffff', 1.25)
      const isSuitableForDarkMode = isColorSuitableForBackground(color, '#000000', 1.25)
      setSnackbarSeverity('error')

      if (displayName.replace(/[\p{Letter}\p{Mark}\s_\d-]+/gu, '').length != 0) {
        setSnackbarOpen(true)
        setSnackbarMessage('Error: Illegal characters in name.')
        return
      } else if (color.trim().length != 7) {
        setSnackbarOpen(true)
        setSnackbarMessage(
          'Error: Color must a # followed by a 6 character hex code. No transparency, try removing the final 2 characters if your hex code is 8 characters long?',
        )
        return
      } else if (!isValidHexColor(color.trim().slice(1))) {
        setSnackbarOpen(true)
        setSnackbarMessage('Error: Illegal characters in color')
        return
      } else if (Array.from(color)[0] != '#') {
        setSnackbarOpen(true)
        setSnackbarMessage('Error: Color must start with #.')
        return
        // } else if (!isSuitableForLightMode) {
        //   setSnackbarOpen(true)
        //   setSnackbarMessage('Error: Color is too close to white, and is hard to read on light mode, please try a different color.')
        //   return;
        // } else if (!isSuitableForDarkMode) {
        //   setSnackbarOpen(true)
        //   setSnackbarMessage('Error: Color is too close to black, and is hard to read on dark mode, please try a different color.')
        //   return;
      } else if (displayName.trim().length < 1) {
        setSnackbarOpen(true)
        setSnackbarMessage('Error: Name has no length')
        return
      } else if (displayName.trim().length > 25) {
        setSnackbarOpen(true)
        setSnackbarMessage('Error: Name over 25 characters')
        return
      }
      user.pref_discord_pings = prefDiscordPings
      user.pref_online = prefOnline
      user.pref_load_from_bottom = prefLoadFromBottom
      user.pref_time_since_last_count = prefTimeSinceLastCount
      user.pref_standardize_format = prefStandardizeFormat
      user.pref_nightMode = prefNightMode
      user.pref_submit_shortcut = prefSubmitShortcut
      user.pref_custom_stricken = prefCustomStricken
      user.pref_strike_color = prefStrikeColor
      user.pref_clear = prefClear
      user.pref_post_style = prefPostStyle
      user.pref_post_style_mobile = prefPostStyleMobile
      user.pref_reply_time_interval = prefReplyTimeInterval
      user.pref_night_mode_colors = prefNightModeColors
      user.pref_post_position = prefPostPosition
      user.pref_hide_stricken = prefHideStricken
      user.pref_hide_thread_picker = prefHideThreadPicker
      user.pref_sound_on_stricken = prefSoundOnStricken
      user.pref_highlight_last_count = prefHighlightLastCount
      user.pref_highlight_last_count_color = prefHighlightLastCountColor
      user.pref_stricken_count_opacity = prefStrickenCountOpacity
      counter.name = displayName
      counter.color = color
      counter.rainbow = rainbowNumber
      counter.cardStyle = cardStyle
      counter.cardBorderStyle = cardBorderStyle
      counter.title = title
      counter.emoji = emoji === 'None' ? undefined : emoji
      try {
        const res = await updateCounterPrefs(user, counter)
        if (res.status == 201) {
          setSnackbarSeverity('success')
          setSnackbarOpen(true)
          setSnackbarMessage('Changes made successfully')
        }
      } catch (err) {
        setSnackbarSeverity('error')
        setSnackbarOpen(true)
        setSnackbarMessage('Error: Submission rejected. If this comes as a surprise, please reach out to discord mods via DM!')
      }
    }
  }

  let [maybeU, setMaybeU] = useState('')
  useEffect(() => {
    if (Math.random() > 0.5) {
      setMaybeU('u')
    }
  }, [])

  if (user && counter) {
    return (
      <>
        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleClose}>
          <Alert severity={snackbarSeverity} onClose={handleClose}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
        <Container maxWidth="xl" sx={{ bgcolor: 'primary.light', flexGrow: 1, p: 2 }}>
          <Typography variant="h4">
            Preferences{' '}
            <Button
              sx={{ m: 2 }}
              size="large"
              color="success"
              variant="contained"
              onClick={() => {
                savePrefs()
              }}
            >
              Save
            </Button>
          </Typography>
          <Box sx={{ mt: 2, p: 1, borderRadius: '10px', bgcolor: 'background.paper', color: 'text.primary' }}>
            <Typography variant="h6">
              Profile Preferences{' '}
              <Button
                sx={{ m: 2 }}
                size="large"
                color="success"
                variant="contained"
                onClick={() => {
                  savePrefs()
                }}
              >
                Save
              </Button>
            </Typography>
            <TextField
              sx={{ m: 2 }}
              id="DisplayName"
              onInput={(e) => setDisplayName((e.target as HTMLInputElement).value)}
              label={`Display Name`}
              InputLabelProps={{ shrink: true }}
              value={displayName}
            ></TextField>
            <TextField
              sx={{ m: 2 }}
              id={`Colo${maybeU}r`}
              onInput={(e) => setColor((e.target as HTMLInputElement).value)}
              label={`Colo${maybeU}r`}
              InputLabelProps={{ shrink: true }}
              value={color}
            ></TextField>
            <TextField
              sx={{ m: 2, minWidth: 200 }}
              id="RainbowNumber"
              type="number"
              inputProps={{ min: '1', max: '100000', step: '1' }}
              onInput={(e) => {
                const value = parseInt((e.target as HTMLInputElement).value || '1', 10)
                if (value >= 1 && value <= 100_000) {
                  setRainbowNumber(value)
                }
              }}
              label="Rainbow Number"
              InputLabelProps={{ shrink: true }}
              value={rainbowNumber}
            />
            <FormControl sx={{ m: 2 }}>
              <InputLabel id="card-style-label">Card Style</InputLabel>
              <Select
                labelId="card-style"
                id="card-style"
                value={cardStyle}
                defaultValue={cardStyle}
                label="Card Style"
                onChange={(e) => setCardStyle((e.target as HTMLInputElement).value)}
                sx={{ width: 200 }}
              >
                {items &&
                  items.map((item) => {
                    if (item.category === 'card') {
                      return <MenuItem value={item.internal_name}>{item.name}</MenuItem>
                    }
                  })}
              </Select>
            </FormControl>
            <FormControl sx={{ m: 2 }}>
              <InputLabel id="card-border-style-label">Card Border Style</InputLabel>
              <Select
                labelId="card-border-style-label"
                id="card-border-style"
                value={cardBorderStyle}
                defaultValue={cardBorderStyle}
                label="Card Border Style"
                onChange={(e) => setCardBorderStyle((e.target as HTMLInputElement).value)}
                sx={{ width: 200 }}
              >
                {items &&
                  items.map((item) => {
                    if (item.category === 'border') {
                      return <MenuItem value={item.internal_name}>{item.name}</MenuItem>
                    }
                  })}
              </Select>
            </FormControl>
            <FormControl sx={{ m: 2 }}>
              <InputLabel id="title-label">Title</InputLabel>
              <Select
                labelId="title-label"
                id="title"
                value={title}
                defaultValue={title}
                label="Title"
                onChange={(e) => setTitle((e.target as HTMLInputElement).value)}
                sx={{ width: 200 }}
              >
                {items &&
                  items.map((item) => {
                    if (item.category === 'title') {
                      return <MenuItem value={item.internal_name}>{item.name}</MenuItem>
                    }
                  })}
              </Select>
            </FormControl>
            <FormControl sx={{ m: 2 }}>
              <InputLabel id="emoji-label">Emoji</InputLabel>
              <Select
                labelId="emoji-label"
                id="emoji"
                value={emoji}
                defaultValue={emoji}
                label="Emoji"
                onChange={(e) => setEmoji((e.target as HTMLInputElement).value)}
                sx={{ width: 200 }}
              >
                <MenuItem value={'None'}>None</MenuItem>
                {items &&
                  items.map((item) => {
                    if (item.category === 'emoji') {
                      return <MenuItem value={item.internal_name}>{item.name}</MenuItem>
                    }
                  })}
              </Select>
            </FormControl>

            <Box sx={{ margin: '5px' }}>
              <CounterCard
                fullSize={false}
                maxHeight={32}
                maxWidth={32}
                boxPadding={2}
                counter={{
                  ...counter,
                  cardStyle: cardStyle,
                  cardBorderStyle: cardBorderStyle,
                  title: title,
                  name: displayName,
                  emoji: emoji === 'None' ? undefined : emoji,
                }}
              ></CounterCard>
            </Box>
            <Box sx={{ margin: '5px' }}>
              <CounterCard
                sx={{ p: 1 }}
                fullSize={true}
                maxHeight={100}
                maxWidth={100}
                boxPadding={2}
                counter={{
                  ...counter,
                  cardStyle: cardStyle,
                  cardBorderStyle: cardBorderStyle,
                  title: title,
                  name: displayName,
                  emoji: emoji === 'None' ? undefined : emoji,
                }}
              ></CounterCard>
            </Box>
          </Box>
          <Preferences
            savePrefs={savePrefs} maybeU={maybeU} title={`Counting Preferences`}
            prefOnline={prefOnline} setPrefOnline={setPrefOnline}
            prefDiscordPings={prefDiscordPings} setPrefDiscordPings={setPrefDiscordPings}
            prefLoadFromBottom={prefLoadFromBottom} setPrefLoadFromBottom={setPrefLoadFromBottom}
            prefStrikeColor={prefStrikeColor} setPrefStrikeColor={setPrefStrikeColor}
            prefStandardizeFormat={prefStandardizeFormat} setPrefStandardizeFormat={setPrefStandardizeFormat}
            prefNightMode={prefNightMode} setPrefNightMode={setPrefNightMode}
            prefSubmitShortcut={prefSubmitShortcut} setPrefSubmitShortcut={setPrefSubmitShortcut}
            prefClear={prefClear} setPrefClear={setPrefClear}
            prefTimeSinceLastCount={prefTimeSinceLastCount} setPrefTimeSinceLastCount={setPrefTimeSinceLastCount}
            prefCustomStricken={prefCustomStricken} setPrefCustomStricken={setPrefCustomStricken}
            prefPostStyle={prefPostStyle} setPrefPostStyle={setPrefPostStyle}
            prefPostStyleMobile={prefPostStyleMobile} setPrefPostStyleMobile={setPrefPostStyleMobile}
            prefReplyTimeInterval={prefReplyTimeInterval} setPrefReplyTimeInterval={setPrefReplyTimeInterval}
            prefNightModeColors={prefNightModeColors} setPrefNightModeColors={setPrefNightModeColors}
            prefPostPosition={prefPostPosition} setPrefPostPosition={setPrefPostPosition}
            prefHideStricken={prefHideStricken} setPrefHideStricken={setPrefHideStricken}
            prefHighlightLastCount={prefHighlightLastCount} setPrefHighlightLastCount={setPrefHighlightLastCount}
            prefHighlightLastCountColor={prefHighlightLastCountColor} setPrefHighlightLastCountColor={setPrefHighlightLastCountColor}
            prefSoundOnStricken={prefSoundOnStricken} setPrefSoundOnStricken={setPrefSoundOnStricken}
            prefHideThreadPicker={prefHideThreadPicker} setPrefHideThreadPicker={setPrefHideThreadPicker}
            prefStrickenCountOpacity={prefStrickenCountOpacity} setPrefStrickenCountOpacity={setPrefStrickenCountOpacity}
          />
        </Container>
      </>
    )
  } else {
    return <Loading />
  }
}
