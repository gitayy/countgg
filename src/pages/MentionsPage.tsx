import { useContext, useEffect, useState } from 'react';
import { Container, Box, FormControl, InputLabel, Select, MenuItem, Button, Input, Alert, AlertColor, Snackbar, FormControlLabel, Checkbox, SelectChangeEvent, Typography, Stack, Link, useMediaQuery, Theme, Toolbar, Tooltip, useTheme } from '@mui/material';
import { useFetchAllThreads } from '../utils/hooks/useFetchAllThreads';
import { adminCreateThread, findPostByThreadAndNumber, findPostByThreadAndRawCount } from '../utils/api';
import { PostType, ThreadType } from '../utils/types';
import Count from '../components/Count';
import CountMobile from '../components/CountMobile';
import { addCounterToCache, cachedCounters } from '../utils/helpers';
import { UserContext } from '../utils/contexts/UserContext';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useFetchMentions } from '../utils/hooks/useFetchMentions';
  
  export const MentionsPage = () => {
    const { user, counter, loading } = useContext(UserContext);

    const [rawCount, setRawCount] = useState('');
    const [countNumber, setCountNumber] = useState<number|null>(null);
    const [name, setName] = useState('');
    const [uuid, setUuid] = useState('');
    const params = useParams();
    const from = parseInt(params.from || "0");
    const {loadedMentions, loadedMentionsLoading} = useFetchMentions(from);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('error');
    const navigate = useNavigate();
    const [buttonDisable, setButtonDisable] = useState<boolean>(false);

    const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'));

    const location = useLocation();
    useEffect(() => {
        document.title = `Mentions | countGG`;
        return (() => {
          document.title = 'countGG';
        })
      }, [location.pathname]);


    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
          return;
        }    
        setSnackbarOpen(false);
      };

      const theme = useTheme();

   

      console.log(loadedMentions);
   
    if(counter && !loading) {

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
          <FormControl variant="standard" sx={{}}>
      </FormControl>
            {loadedMentions && Array.isArray(loadedMentions.posts) && 
            <Box sx={{ bgcolor: 'background.paper', display: 'flex', justifyContent: 'center', flexGrow: 1, p: 2 }}>
              {isDesktop ? (
                <>
                <Stack direction="column" alignItems="center" sx={{width: '100%'}}>
                    <Box sx={{ width: '100%', justifyContent: 'center', margin: { xs: 'auto', lg: 'initial' } }}>
                    {loadedMentions.posts.map((mention) => {
                    const correspondingMention = loadedMentions.mentions.filter(mentiony => {return mention.uuid === mentiony['postUUID']})
                    return <Box sx={{ justifyContent: "center", display: "flex", m: 2, pt: 2, pb: 2, border: `2px solid ${correspondingMention && correspondingMention[0] && correspondingMention[0]["readStatus"] === false ? theme.palette.info.main : theme.palette.background.paper}`, bgcolor: `${correspondingMention && correspondingMention[0] && correspondingMention[0]["readStatus"] === false ? theme.palette.info.main : theme.palette.background.paper}30`}}>
                      <Box sx={{width: "50%"}}>
                      <Typography sx={{mb: 2}} variant="h6" color={"text.secondary"}><Link onClick={(e) => {e.preventDefault();navigate(`/thread/${name}?context=${mention.uuid}`);}} underline='always' color={"text.secondary"} href={`/thread/${name}?context=${mention.uuid}`}>Context</Link></Typography>
                        <Count key={mention.uuid} post={mention} thread={mention.thread} renderedCounter={cachedCounters[mention.authorUUID]} maxWidth={'32px'} maxHeight={'32px'} />
                        </Box>
                        </Box>
                    })}
                    </Box>
                </Stack>
                </>
              ) : (
                <>
                <Stack direction="column" alignItems="center" sx={{width: '100%'}}>
                    <Box sx={{ width: '100%', justifyContent: 'center', margin: { xs: 'auto', lg: 'initial' } }}>
                    {loadedMentions.posts.map((count, countIndex) => (<>
                      <Typography sx={{mb: 2}} variant="h6" color={"text.secondary"}><Link onClick={(e) => {e.preventDefault();navigate(`/thread/${name}?context=${count.uuid}`);}} underline='always' color={"text.secondary"} href={`/thread/${name}?context=${count.uuid}`}>Context</Link></Typography>
                        <CountMobile user={user} key={count.uuid} post={count} thread={count.thread} counter={cachedCounters[count.authorUUID]} maxWidth={'32px'} maxHeight={'32px'} />
                        </>
                    ))}
                    </Box>
                </Stack>
                </>
              )}
            </Box>}
          </Box>
          </>);
      } else {
        return (<div>Page Not Found</div>
      )}
  };
  