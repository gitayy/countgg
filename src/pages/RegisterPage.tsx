import { areArraysEqual } from "@mui/base";
import { Alert, Box, Button, FormControl, InputLabel, MenuItem, Paper, Select, Snackbar, Step, StepLabel, Stepper, TextField, Typography } from "@mui/material";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loading } from "../components/Loading";
import { registerCounter } from "../utils/api";
import { CounterContext } from "../utils/contexts/CounterContext";
import { isValidHexColor, pronouns } from "../utils/helpers"
import { HexColorPicker } from "react-colorful";
import { RulesPage } from "./RulesPage";


export const RegisterPage = () => {
    const navigate = useNavigate();
    const { counter, loading } = useContext(CounterContext); 
    const [step, setStep] = useState(0);
    const [name, setName] = useState(counter?.name || '')
    const [color, setColor] = useState(counter?.color || '#006b99')
    const [counter_pronouns, setPronouns] = useState<number>(areArraysEqual((counter?.pronouns || []), pronouns[0]) && 0 || areArraysEqual((counter?.pronouns || []), pronouns[1]) && 1 || areArraysEqual((counter?.pronouns || []), pronouns[2]) && 2 || !(counter?.pronouns[0]) && 2 || 0);

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
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
        if(name.replace(/[\p{Letter}\p{Mark}\s_\d-]+/gu, '').length != 0) {
            setSnackbarOpen(true)
            setSnackbarMessage('Error: Illegal characters in name.')
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
        else if(name.trim().length < 1) {
            setSnackbarOpen(true)
            setSnackbarMessage('Error: Name has no length')
        }
        else if(name.trim().length > 25) {
            setSnackbarOpen(true)
            setSnackbarMessage('Error: Name over 25 characters')
        } else if(!counter_pronouns && counter_pronouns != 0) {
            setSnackbarOpen(true)
            setSnackbarMessage('Error: No pronouns selected')
        } else if(counter_pronouns > 2 || counter_pronouns < 0) {
            setSnackbarOpen(true)
            setSnackbarMessage('Error: Unknown pronouns :dang:')
        } else {
            setStep(1);
            const updateInfo = {
                name: name.trim(), 
                color: color.trim(),
                pronouns: counter_pronouns, 
            }
            try {
                const res = await registerCounter(updateInfo);
                if(res.status == 201) {
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

    if(counter) {
        return (<>
        <Snackbar
    open={snackbarOpen}
    autoHideDuration={6000}
    onClose={handleClose}
    >
        <Alert severity="error" onClose={handleClose}>
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
                <TextField sx={{m: 2}} id="name" onInput={e => setName((e.target as HTMLInputElement).value)} label="Name" defaultValue={name}></TextField>
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
                    return (<MenuItem value={posindex}>{`${pos[0]}, ${pos[1]}, ${pos[2]}, ${pos[3]}`}</MenuItem>)
                    })}
                </Select>
                </FormControl>
                <HexColorPicker color={color} onChange={setColor} />
                <TextField sx={{m: 2}} id="color" onInput={e => setColor((e.target as HTMLInputElement).value)} label="Color" InputLabelProps={{ shrink: true }} value={color}></TextField>                
                <Typography variant="h5">Name Preview:</Typography>
                <Typography variant="body1" sx={{color: color}}>{name}</Typography>
                <Typography sx={{mt: 1}} variant="body1">Try enabling/disabling Dark Mode in the top right corner to see how it looks on both light and dark mode!</Typography>
                <Box component="div">
                    <Button sx={{m: 2}} variant="contained" onClick={() => {namesNext()}}>Save</Button>
                </Box>
            </Paper>
            <Typography variant="h6" sx={{mt: 2}}>Your name may not be hurtful or derogatory as judged by our moderators. Names are manually approved. Should we have an issue with your name, we will contact you and allow you to change it.</Typography>
            <Typography variant="h6" sx={{mt: 2}}>Names must be fewer than 26 characters in length.</Typography>
            <Typography variant="h6" sx={{mt: 2}}>Sorry we only got these 3 pronouns, hopefully they work lol.</Typography>
            <Typography variant="h6" sx={{mt: 2}}>We recommend you do not use any self-identifying information like your IRL name when creating your profile.</Typography>
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