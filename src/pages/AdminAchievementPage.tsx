import { useContext, useEffect, useState } from 'react';
import { Container, Box, FormControl, InputLabel, Select, MenuItem, Button, Input, Alert, AlertColor, Snackbar, FormControlLabel, Checkbox, SelectChangeEvent, Typography } from '@mui/material';
import { useFetchAllThreads } from '../utils/hooks/useFetchAllThreads';
import { adminAwardAchievement, adminCreateThread } from '../utils/api';
import { ThreadType } from '../utils/types';
import { UserContext } from '../utils/contexts/UserContext';
  
  export const AdminAchievementPage = () => {
    const { counter, loading } = useContext(UserContext);
    const { allThreads, allThreadsLoading } = useFetchAllThreads();
    const [selectedThread, setSelectedThread] = useState<ThreadType>();

    const [counter_uuid, setCounterUUID] = useState('');
    const [achievement_id, setAchievementID] = useState('');
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('error');

    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
          return;
        }    
        setSnackbarOpen(false);
      };

    const sendValues = async () => {
      if(counter_uuid && achievement_id && parseInt(achievement_id)) {
        try {
        const res = await adminAwardAchievement(counter_uuid, parseInt(achievement_id));
          if(res.status == 201) {
            setSnackbarSeverity('success');
            setSnackbarOpen(true)
            setSnackbarMessage('Achievement created successfully')
          }
        }
        catch(err) {
          setSnackbarSeverity('error');
          setSnackbarOpen(true)
          setSnackbarMessage('Error: Submission rejected. If this comes as a surprise, please reach out to discord mods via DM!')
        }
      }
    };
   
    if(counter && counter.roles.includes('admin') && !allThreadsLoading && allThreads) {

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
            <Box sx={{bgcolor: 'white', color: 'black', p: 3}}> 
              <FormControl variant="standard" sx={{}} >
                <InputLabel htmlFor="counter_uuid" shrink>
                counter_uuid
                </InputLabel>
                <Input
                  onInput={e => setCounterUUID((e.target as HTMLInputElement).value)}
                  defaultValue={counter_uuid}
                  value={counter_uuid}
                  id="counter_uuid"
                />
              </FormControl>
              <FormControl variant="standard" sx={{}} >
                <InputLabel htmlFor="achievement_id" shrink>
                achievement_id
                </InputLabel>
                <Input
                  onInput={e => setAchievementID((e.target as HTMLInputElement).value)}
                  defaultValue={achievement_id}
                  value={achievement_id}
                  id="achievement_id"
                />
              </FormControl>
                <Button variant='contained' onClick={sendValues}>Submit</Button>
            </Box>
          </Container>
          </>);
      } else {
        return (<div>Page Not Found</div>
      )}
  };
  