import { Box, Button, FormControl, FormControlLabel, FormGroup, InputLabel, MenuItem, Select, Switch, TextField, Tooltip, Typography } from "@mui/material";
import { HexColorPicker } from "react-colorful";
import { clearOptions, standardizeFormatOptions, nightModeOptions, submitShortcutOptions, postStyleOptions, nightModeColorOptions, postPositionOptions, hideStrickenOptions, customStrickenOptions, soundOnStrickenOptions } from "../utils/helpers";

export const Preferences = (props) => {

    const {
        savePrefs,
        maybeU,
        title,
        prefOnline, setPrefOnline,
        prefDiscordPings, setPrefDiscordPings,
        prefLoadFromBottom, setPrefLoadFromBottom,
        prefStrikeColor, setPrefStrikeColor,
        prefStandardizeFormat, setPrefStandardizeFormat,
        prefNightMode, setPrefNightMode,
        prefSubmitShortcut, setPrefSubmitShortcut,
        prefClear, setPrefClear,
        prefTimeSinceLastCount, setPrefTimeSinceLastCount,
        prefCustomStricken, setPrefCustomStricken,
        prefPostStyle, setPrefPostStyle,
        prefPostStyleMobile, setPrefPostStyleMobile,
        prefReplyTimeInterval, setPrefReplyTimeInterval,
        prefNightModeColors, setPrefNightModeColors,
        prefPostPosition, setPrefPostPosition,
        prefHideStricken, setPrefHideStricken,
        prefHighlightLastCount, setPrefHighlightLastCount,
        prefHighlightLastCountColor, setPrefHighlightLastCountColor,
        prefSoundOnStricken, setPrefSoundOnStricken,
        prefHideThreadPicker, setPrefHideThreadPicker,
        prefStrickenCountOpacity, setPrefStrickenCountOpacity,
        enabled, setEnabled,
      } = props;

    return (
        <Box sx={{ mt: 2, p: 1, borderRadius: '10px', bgcolor: 'background.paper', color: 'text.primary' }}>
            <Typography variant="h6">
              {title}
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
            {/* <Count user={user} myCounter={fakeCounter} key={`fakeCount_${Math.random()}`} thread={{}} socket={{}} post={fakePost(fakeCounter)} counter={fakeCounter} maxWidth={'32px'} maxHeight={'32px'} /> */}
            <FormGroup sx={{ m: 2, userSelect: 'none', flexDirection: 'row' }}>
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
              <Box sx={{ width: '100%' }}>
              {enabled !== undefined && <FormControlLabel
                    sx={
                        !enabled
                        ? {
                                background: '#ff000066',
                            }
                        : {}
                    }
                  control={
                    <Switch
                      checked={enabled}
                      onChange={() => {
                        setEnabled(!enabled)
                      }}
                      inputProps={{ 'aria-label': 'enabled' }}
                    />
                  }
                  label={
                    // <Tooltip title="Enable prefs for this thread.">
                      <Typography variant="body1">Enable prefs for this thread.</Typography>
                    // </Tooltip>
                  }
                />}
                <FormControlLabel
                  control={
                    <Switch
                      checked={prefLoadFromBottom}
                      onChange={() => {
                        setPrefLoadFromBottom(!prefLoadFromBottom)
                      }}
                      inputProps={{ 'aria-label': 'pref-load-from-bottom' }}
                    />
                  }
                  label={
                    <Tooltip title="When enabled, new posts appear on the bottom rather than on top.">
                      <Typography variant="body1">Load new posts on bottom</Typography>
                    </Tooltip>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={prefHighlightLastCount}
                      onChange={() => {
                        setPrefHighlightLastCount(!prefHighlightLastCount)
                      }}
                      inputProps={{ 'aria-label': 'pref-highlight-last-count' }}
                    />
                  }
                  label={<Typography variant="body1">Highlight last valid count</Typography>}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={prefHideThreadPicker}
                      onChange={() => {
                        setPrefHideThreadPicker(!prefHideThreadPicker)
                      }}
                      inputProps={{ 'aria-label': 'pref-hide-thread-picker' }}
                    />
                  }
                  label={<Typography variant="body1">Hide thread picker by default (on desktop)</Typography>}
                />
              </Box>
              <FormControl sx={{ m: 2 }}>
                <InputLabel id="clear-label">Textbox Behavio{maybeU}r</InputLabel>
                <Select
                  labelId="clear-label"
                  id="clear"
                  value={prefClear}
                  defaultValue={prefClear}
                  label={`Textbox Behavio${maybeU}r`}
                  onChange={(e) => setPrefClear((e.target as HTMLInputElement).value)}
                  sx={{ width: 200 }}
                >
                  {clearOptions.map((card) => {
                    return <MenuItem value={card}>{card}</MenuItem>
                  })}
                </Select>
              </FormControl>
              <FormControl sx={{ m: 2 }}>
                <InputLabel id="standardize-format-label">Standardize Format</InputLabel>
                <Select
                  labelId="standardize-format-label"
                  id="standardize-format"
                  value={prefStandardizeFormat}
                  defaultValue={prefStandardizeFormat}
                  label="Standardize Format"
                  onChange={(e) => setPrefStandardizeFormat((e.target as HTMLInputElement).value)}
                  sx={{ width: 200 }}
                >
                  {standardizeFormatOptions.map((card) => {
                    return <MenuItem value={card}>{card}</MenuItem>
                  })}
                </Select>
              </FormControl>
              <FormControl sx={{ m: 2 }}>
                <InputLabel id="night-mode-label">Night Mode</InputLabel>
                <Select
                  labelId="night-mode-label"
                  id="night-mode"
                  value={prefNightMode}
                  defaultValue={prefNightMode}
                  label="Night Mode"
                  onChange={(e) => setPrefNightMode((e.target as HTMLInputElement).value)}
                  sx={{ width: 200 }}
                >
                  {nightModeOptions.map((card) => {
                    return <MenuItem value={card}>{card}</MenuItem>
                  })}
                </Select>
              </FormControl>
              <FormControl sx={{ m: 2 }}>
                <InputLabel id="submit-shortcut-label">Submit Shortcut</InputLabel>
                <Select
                  labelId="submit-shortcut-label"
                  id="submit-shortcut"
                  value={prefSubmitShortcut}
                  defaultValue={prefSubmitShortcut}
                  label="Submit Shortcut"
                  onChange={(e) => setPrefSubmitShortcut((e.target as HTMLInputElement).value)}
                  sx={{ width: 200 }}
                >
                  {submitShortcutOptions.map((card) => {
                    return <MenuItem value={card}>{card}</MenuItem>
                  })}
                </Select>
              </FormControl>
              <FormControl sx={{ m: 2 }}>
                <InputLabel id="post-style-label">Desktop Post Style</InputLabel>
                <Select
                  labelId="post-style-label"
                  id="post-style"
                  value={prefPostStyle}
                  defaultValue={prefPostStyle}
                  label="Desktop Post Style"
                  onChange={(e) => setPrefPostStyle((e.target as HTMLInputElement).value)}
                  sx={{ width: 200 }}
                >
                  {postStyleOptions.map((card) => {
                    return <MenuItem value={card}>{card}</MenuItem>
                  })}
                </Select>
              </FormControl>
              <FormControl sx={{ m: 2 }}>
                <InputLabel id="post-style-mobile-label">Mobile Post Style</InputLabel>
                <Select
                  labelId="post-style-mobile-label"
                  id="post-style-mobile"
                  value={prefPostStyleMobile}
                  defaultValue={prefPostStyleMobile}
                  label="Mobile Post Style"
                  onChange={(e) => setPrefPostStyleMobile((e.target as HTMLInputElement).value)}
                  sx={{ width: 200 }}
                >
                  {postStyleOptions.map((card) => {
                    return <MenuItem value={card}>{card}</MenuItem>
                  })}
                </Select>
              </FormControl>
              <FormControl sx={{ m: 2 }}>
                <InputLabel id="night-mode-colors-label">Night Mode Colo{maybeU}rs</InputLabel>
                <Select
                  labelId="night-mode-colors-label"
                  id="night-mode-colors"
                  value={prefNightModeColors}
                  defaultValue={prefNightModeColors}
                  label={`Night Mode Colo${maybeU}rs`}
                  onChange={(e) => setPrefNightModeColors((e.target as HTMLInputElement).value)}
                  sx={{ width: 200 }}
                >
                  {nightModeColorOptions.map((card) => {
                    return <MenuItem value={card}>{card}</MenuItem>
                  })}
                </Select>
              </FormControl>
              <FormControl sx={{ m: 2 }}>
                <InputLabel id="post-position-label">Post Position</InputLabel>
                <Select
                  labelId="post-position-label"
                  id="post-position"
                  value={prefPostPosition}
                  defaultValue={prefPostPosition}
                  label="Post Position"
                  onChange={(e) => setPrefPostPosition((e.target as HTMLInputElement).value)}
                  sx={{ width: 200 }}
                >
                  {postPositionOptions.map((card) => {
                    return <MenuItem value={card}>{card}</MenuItem>
                  })}
                </Select>
              </FormControl>
              <FormControl sx={{ m: 2 }}>
                <InputLabel id="hide-stricken-label">Hide Stricken</InputLabel>
                <Select
                  labelId="hide-stricken-label"
                  id="hide-stricken"
                  value={prefHideStricken}
                  defaultValue={prefHideStricken}
                  label="Hide Stricken"
                  onChange={(e) => setPrefHideStricken((e.target as HTMLInputElement).value)}
                  sx={{ width: 200 }}
                >
                  {hideStrickenOptions.map((card) => {
                    return <MenuItem value={card}>{card}</MenuItem>
                  })}
                </Select>
              </FormControl>
              <FormControl sx={{ m: 2 }}>
                <InputLabel id="custom-stricken-label">Custom Stricken</InputLabel>
                <Select
                  labelId="custom-stricken-label"
                  id="custom-stricken"
                  value={prefCustomStricken}
                  label="Custom Stricken"
                  onChange={(e) => setPrefCustomStricken((e.target as HTMLInputElement).value)}
                  sx={{ width: 200 }}
                >
                  {customStrickenOptions.map((card) => {
                    return <MenuItem value={card}>{card}</MenuItem>
                  })}
                </Select>
              </FormControl>
              <FormControl sx={{ m: 2 }}>
                <InputLabel id="sound-on-stricken-label">Play Sound on Stricken</InputLabel>
                <Select
                  labelId="sound-on-stricken-label"
                  id="sound-on-stricken"
                  value={prefSoundOnStricken}
                  label="Play Sound on Stricken"
                  onChange={(e) => setPrefSoundOnStricken((e.target as HTMLInputElement).value)}
                  sx={{ width: 200 }}
                >
                  {soundOnStrickenOptions.map((card) => {
                    return <MenuItem value={card}>{card}</MenuItem>
                  })}
                </Select>
              </FormControl>
            </FormGroup>
            <FormGroup sx={{ m: 2, userSelect: 'none', flexDirection: 'row' }}>
              {prefCustomStricken !== 'Disabled' && (
                <>
                  <TextField
                    sx={{ m: 2 }}
                    id="StrikeColor"
                    onInput={(e) => setPrefStrikeColor((e.target as HTMLInputElement).value)}
                    label={`Strike Colo${maybeU}r`}
                    InputLabelProps={{ shrink: true }}
                    value={prefStrikeColor}
                  ></TextField>
                  <HexColorPicker color={prefStrikeColor} onChange={setPrefStrikeColor} />
                </>
              )}
              {prefHighlightLastCount && (
                <>
                  <TextField
                    sx={{ m: 2 }}
                    id="HighlightLastCountColor"
                    onInput={(e) => setPrefHighlightLastCountColor((e.target as HTMLInputElement).value)}
                    label={`Highlight Last Count Colo${maybeU}r`}
                    InputLabelProps={{ shrink: true }}
                    value={prefHighlightLastCountColor}
                  ></TextField>
                  <HexColorPicker color={prefHighlightLastCountColor} onChange={setPrefHighlightLastCountColor} />
                </>
              )}
            </FormGroup>

            {/* <FormGroup> */}
            <TextField
              sx={{ m: 2, minWidth: 200 }}
              id="ReplyTimeInterval"
              type="number"
              inputProps={{ min: '1', max: '10000', step: '1' }}
              onInput={(e) => {
                const value = parseInt((e.target as HTMLInputElement).value || '0', 10)
                if (value >= 1 && value <= 10000) {
                  setPrefReplyTimeInterval(value)
                }
              }}
              label="Reply Time Interval"
              InputLabelProps={{ shrink: true }}
              value={prefReplyTimeInterval}
            />
            <TextField
              sx={{ m: 2, minWidth: 200 }}
              id="ReplyTimeOpacity"
              type="number"
              inputProps={{ min: '0', max: '1', step: 0.01 }}
              onInput={(e) => {
                const value = parseFloat((e.target as HTMLInputElement).value || '0')
                if (value >= 0 && value <= 1) {
                  setPrefStrickenCountOpacity(value)
                }
              }}
              label="Stricken Count Opacity"
              InputLabelProps={{ shrink: true }}
              value={prefStrickenCountOpacity}
            />
            {/* </FormGroup>  */}
          </Box>
    )
}