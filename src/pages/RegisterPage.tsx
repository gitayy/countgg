import { areArraysEqual } from "@mui/base";
import { Alert, AlertColor, Box, Button, FormControl, InputLabel, MenuItem, Paper, Select, Snackbar, Step, StepLabel, Stepper, TextField, ThemeProvider, Typography, createTheme } from "@mui/material";
import { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loading } from "../components/Loading";
import { registerCounter } from "../utils/api";
import { fakePost, isColorSuitableForBackground, isValidHexColor, pronouns } from "../utils/helpers"
import { HexColorPicker } from "react-colorful";
import { RulesPage } from "./RulesPage";
import { UserContext } from "../utils/contexts/UserContext";
import Count from "../components/Count";


export const RegisterPage = () => {
    const navigate = useNavigate();
    const { user, counter } = useContext(UserContext); 
    const [step, setStep] = useState(counter && counter.name && counter.name.length > 0 ? 1 : 0);
    const [name, setName] = useState(counter?.name || '')
    const [username, setUsername] = useState(counter?.username || '')
    const [color, setColor] = useState(counter?.color || '#006b99')
    const [counter_pronouns, setPronouns] = useState<number>(areArraysEqual((counter?.pronouns || []), pronouns[0]) && 0 || areArraysEqual((counter?.pronouns || []), pronouns[1]) && 1 || areArraysEqual((counter?.pronouns || []), pronouns[2]) && 2 || !(counter?.pronouns[0]) && 2 || 0);

    const [stateTest, setStateTest] = useState(Date.now());

    const updateColor = (color: string) => {
        setColor(color);
        counter ? counter.color = color : console.log("Bruh no counter");
        // setStateTest(Date.now());
    }

    const location = useLocation();
    useEffect(() => {
        document.title = `Register | Counting!`;
        return (() => {
          document.title = 'Counting!';
        })
      }, [location.pathname]);

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('error');
    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
          return;
        }    
        setSnackbarOpen(false);
      };

    const rulesNext = () => {
        setStep(1);
    }

    const namesNext = async () => {

        const isSuitableForLightMode = isColorSuitableForBackground(color, '#ffffff', 1.25);
        const isSuitableForDarkMode = isColorSuitableForBackground(color, '#000000', 1.25);
        setSnackbarSeverity('error');
        
        if(name.replace(/[\p{Letter}\p{Mark}\s_\d-]+/gu, '').length != 0) {
            setSnackbarOpen(true)
            setSnackbarMessage('Error: Illegal characters in name.')
        }
        else if((/[^a-zA-Z0-9\-_]/gu).test(username)) {
            setSnackbarOpen(true)
            setSnackbarMessage('Error: Username only allows a-z, 0-9, hyphens (-), and underscores (_).')
        }
        else if(color.trim().length != 7) {
            setSnackbarOpen(true)
            setSnackbarMessage('Error: Color must a # followed by a 6 character hex code. No transparency, try removing the final 2 characters if your hex code is 8 characters long?')
        }
        else if(!isValidHexColor(color.trim().slice(1))) {
            setSnackbarOpen(true)
            setSnackbarMessage('Error: Illegal characters in color')
        }
        else if(Array.from(color)[0] != '#') {
            setSnackbarOpen(true)
            setSnackbarMessage('Error: Color must start with #.')
        }
        // else if (!isSuitableForLightMode) {
        //     setSnackbarOpen(true)
        //     setSnackbarMessage('Error: Color is too close to white, and is hard to read on light mode, please try a different color.')
        //     return;
        //   } else if (!isSuitableForDarkMode) {
        //     setSnackbarOpen(true)
        //     setSnackbarMessage('Error: Color is too close to black, and is hard to read on dark mode, please try a different color.')
        //     return;
        //   }
        else if(name.trim().length < 1) {
            setSnackbarOpen(true)
            setSnackbarMessage('Error: Name has no length')
        }
        else if(name.trim().length > 25) {
            setSnackbarOpen(true)
            setSnackbarMessage('Error: Name over 25 characters')
        } else if(username.trim().length < 1) {
            setSnackbarOpen(true)
            setSnackbarMessage('Error: Username has no length')
        }
        else if(username.trim().length > 25) {
            setSnackbarOpen(true)
            setSnackbarMessage('Error: Username over 25 characters')
        }else if(!counter_pronouns && counter_pronouns != 0) {
            setSnackbarOpen(true)
            setSnackbarMessage('Error: No pronouns selected')
        } else if(counter_pronouns > 2 || counter_pronouns < 0) {
            setSnackbarOpen(true)
            setSnackbarMessage('Error: Unknown pronouns :dang:')
        } else {
            setStep(1);
            const updateInfo = {
                name: name.trim(), 
                username: username.trim(),
                color: color.trim(),
                pronouns: counter_pronouns, 
            }
            try {
                const res = await registerCounter(updateInfo);
                if(res.status == 201) {
                setSnackbarSeverity('success');
                    navigate(`/#registration`);
                    window.location.reload();
                }
            }
            catch(err) {
                setSnackbarOpen(true)
                setSnackbarMessage('Error: Submission rejected by server. If this comes as a surprise, please reach out to discord mods via DM!')
            }
        }
    }

      let lightTheme = createTheme({
        palette: {
          mode: 'light',
        },
      });

      let darkTheme = createTheme({
        palette: {
          mode: 'dark',
        },
      });

    const countMemo = useMemo(() => {
        if(counter) {
            return <>
            <ThemeProvider theme={lightTheme}>
                <Box sx={{bgcolor: 'background.paper'}}>
                    <Count renderedCounter={counter} key={`fakeCount_${Math.random()}`} thread={{}} socket={{}} post={fakePost({...counter, name: name, username: username, color: color})} counter={counter} maxWidth={'32px'} maxHeight={'32px'} />
                </Box>
            </ThemeProvider>
            <ThemeProvider theme={darkTheme}>
                <Box sx={{bgcolor: 'background.paper'}}>
                    <Count renderedCounter={counter} key={`fakeCount_${Math.random()}`} thread={{}} socket={{}} post={fakePost({...counter, name: name, username: username, color: color})} counter={counter} maxWidth={'32px'} maxHeight={'32px'} />
                </Box>
            </ThemeProvider>
            </>
        } else {
            return <></>
        }
    }, [color, name, username])

    if(counter) {
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
        <Stepper activeStep={step} alternativeLabel>
            <Step key={'Rules'}>
                <StepLabel>{'Rules'}</StepLabel>
            </Step>
            <Step key={'Name and Color'}>
                <StepLabel>{'Name and Color'}</StepLabel>
            </Step>
            <Step key={'Final Steps'}>
                <StepLabel>{'Final Steps'}</StepLabel>
            </Step>
        </Stepper>
        {step == 0 && <>
        <Typography variant="h3">Rules</Typography>
        <RulesPage isRegistering={true} onceDone={rulesNext}></RulesPage>
        </>}
        {step == 1 && <>
            <Typography variant="h3">Name and Color</Typography>
            <Paper sx={{p: 2}}>
                <Typography>Your display name can contain spaces and some special characters.</Typography>
                <Typography>Your username may only contain A-Z, 0-9, hyphens (-), and underscores (-).</Typography>
                <Typography>Your name may not be hurtful or derogatory as judged by our moderators.</Typography>
                <Typography>Both display names and usernames must be 1-25 characters.</Typography>
                <Typography>We recommend you do not use any self-identifying information like your IRL name when creating your profile.</Typography>
                <TextField sx={{m: 2}} id="name" onInput={e => {setName((e.target as HTMLInputElement).value); counter.name = (e.target as HTMLInputElement).value}} label="Display Name" defaultValue={name}></TextField>
                <TextField sx={{m: 2}} id="username" onInput={e => {setUsername((e.target as HTMLInputElement).value); counter.username = (e.target as HTMLInputElement).value}} label="Username" defaultValue={username}></TextField>
                <FormControl sx={{m: 2}}>
                <InputLabel id="pronouns-label">Counter Pronouns</InputLabel>
                <Select
                    labelId="pronouns-label"
                    id="pronouns"
                    value={counter_pronouns}
                    defaultValue={counter_pronouns}
                    label="Counter Pronouns"
                    onChange={e => setPronouns(Number((e.target as HTMLInputElement).value))}
                    sx={{width: 200}}
                >
                    {pronouns.map((pos, posindex) => {
                    return (<MenuItem key={`pronoun_${posindex}`} value={posindex}>{`${pos[0]}, ${pos[1]}, ${pos[2]}, ${pos[3]}`}</MenuItem>)
                    })}
                </Select>
                </FormControl>
                <HexColorPicker color={color} onChange={updateColor} />
                <TextField sx={{m: 2}} id="color" onInput={e => {setColor((e.target as HTMLInputElement).value); counter.color = (e.target as HTMLInputElement).value}} label="Color" InputLabelProps={{ shrink: true }} value={color}></TextField>                
                <Typography variant="h5">Preview:</Typography>
                
                {countMemo}
                {/* <Typography variant="body1" sx={{color: color}}>{name}</Typography> */}
                {/* <Typography sx={{mt: 1}} variant="body1">Try enabling/disabling Dark Mode in the top right corner to see how it looks on both light and dark mode!</Typography> */}
                <Box component="div">
                    <Button sx={{m: 2}} variant="contained" onClick={() => {namesNext()}}>Save</Button>
                </Box>
            </Paper>
        </>}
        </Box>
        
        </>
        )
    } else {
        return (
            <Loading />
        )
    }
}