import { useContext, useEffect, useState } from 'react';
import { Container, Box, FormControl, InputLabel, Select, MenuItem, Button, Input, Alert, AlertColor, Snackbar, FormControlLabel, Checkbox, SelectChangeEvent, Typography, Stack, Link, useMediaQuery, Theme, Toolbar, Tooltip } from '@mui/material';
import { useFetchAllThreads } from '../utils/hooks/useFetchAllThreads';
import { adminCreateThread, findPostByThreadAndNumber, findPostByThreadAndRawCount } from '../utils/api';
import { PostType, ThreadType } from '../utils/types';
import Count from '../components/Count';
import CountMobile from '../components/CountMobile';
import { addCounterToCache, cachedCounters } from '../utils/helpers';
import { UserContext } from '../utils/contexts/UserContext';
import { useLocation, useNavigate } from 'react-router-dom';
  
  export const PostFinderPage = () => {
    const { user, counter } = useContext(UserContext);
    const { allThreads, allThreadsLoading } = useFetchAllThreads();
    const [selectedThread, setSelectedThread] = useState<ThreadType>();

    const [rawCount, setRawCount] = useState(''); // "123" in main, "ZZ" in letters
    const [countNumber, setCountNumber] = useState<number|null>(null); // "123" in main, "676" in letters
    const [name, setName] = useState('');
    const [uuid, setUuid] = useState('');
    const [loadedPosts, setLoadedPosts] = useState<PostType[]>([]);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('error');
    const navigate = useNavigate();
    const [buttonDisable, setButtonDisable] = useState<boolean>(false);

    const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'));

    const location = useLocation();
    useEffect(() => {
        document.title = `Post Finder | countGG`;
        return (() => {
          document.title = 'countGG';
        })
      }, [location.pathname]);

    useEffect(() => {
      if (!selectedThread) return;
      setUuid(selectedThread.uuid);
      setName(selectedThread.name);
    }, [selectedThread]);

    useEffect(() => {
      setLoadedPosts([]);
    }, [uuid]);

    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
          return;
        }    
        setSnackbarOpen(false);
      };

    const findPost = async () => {
      if(name) {
        try {
            if(countNumber !== null && countNumber > 0) {
              setButtonDisable(true);
                const res = await findPostByThreadAndNumber(uuid, countNumber.toString())
                .then(({ data }) => {
                  for (const counter of data.counters) {
                    addCounterToCache(counter);
                  }
                  setLoadedPosts(data.posts);
                  setButtonDisable(false);
                })
                .catch((err) => {
                  console.log(err);
                  setButtonDisable(false);
                })
            } else if(rawCount.length > 0) {
              setButtonDisable(true);
                const res = await findPostByThreadAndRawCount(uuid, rawCount).then(({ data }) => {
                  for (const counter of data.counters) {
                    addCounterToCache(counter);
                  }
                  setLoadedPosts(data.posts);
                  // console.log(data);
                  setButtonDisable(false);
                })
                .catch((err) => {
                  console.log(err);
                  setButtonDisable(false);
                })
            } 
        }
        catch(err) {
          setSnackbarSeverity('error');
          setSnackbarOpen(true)
          setSnackbarMessage('Error: Post not found, or server rejected your request.')
          setButtonDisable(false);
        }
      }
    };

    const handleThreadSelection = (event: SelectChangeEvent<string>) => {
      const selectedThread = allThreads.find(thread => thread.uuid === event.target.value);
      setSelectedThread(selectedThread);
    };
   
    if(counter && !allThreadsLoading && allThreads) {

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
          <FormControl variant="standard" sx={{}}>
            {uuid.length == 0 && <Typography>Please select a thread.</Typography>}
        <Select
          value={selectedThread ? selectedThread.uuid : ''}
          onChange={handleThreadSelection}
        >
          {allThreads.map(thread => (
            <MenuItem key={thread.uuid} value={thread.uuid}>{thread.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
        {uuid.length > 0 && <>
            <Box sx={{bgcolor: 'background.paper', color: 'text.primary', p: 3}}> 
            {selectedThread && selectedThread.name && <Typography variant="h6">Selected Thread: {selectedThread.name}</Typography>} 
              <FormControl variant="standard" sx={{}} >
                <InputLabel htmlFor="name" shrink>
                  Thread Name
                </InputLabel>
                <Input
                  onInput={e => setName((e.target as HTMLInputElement).value)}
                  value={name}
                  id="name" 
                  disabled={uuid.length > 0}
                />
              </FormControl>
              <FormControl variant="standard" sx={{}} >
                <Tooltip title="Finds the nth count in a thread. In letters, 676th count would return ZZ, for example." placement='top'>
                <InputLabel htmlFor="countNumber" shrink>
                  Count Number
                </InputLabel>
                </Tooltip>
                <Input
                  onInput={e => setCountNumber(isNaN(parseInt((e.target as HTMLInputElement).value)) ? null : parseInt((e.target as HTMLInputElement).value))}
                  value={countNumber}
                  id="countNumber"
                  type='number'
                  disabled={rawCount.length > 0}
                />
              </FormControl>
              <FormControl variant="standard" sx={{}} >
              <Tooltip title="Finds the raw count in a thread. In letters, you can search for ZZ here, for example." placement='top'>
                <InputLabel htmlFor="rawCount" shrink>
                    Raw Count
                </InputLabel>
                </Tooltip>
                <Input
                  onInput={e => setRawCount((e.target as HTMLInputElement).value)}
                  value={rawCount}
                  id="rawCount"
                  disabled={countNumber !== null && countNumber > 0}
                />
              </FormControl>
                <Button variant='contained' disabled={buttonDisable} onClick={findPost}>Submit</Button>
            </Box>
            {loadedPosts && Array.isArray(loadedPosts) && 
            <Box sx={{ bgcolor: 'background.paper', display: 'flex', justifyContent: 'center', flexGrow: 1, p: 2 }}>
              {isDesktop ? (
                <>
                <Stack direction="column" alignItems="center" sx={{width: '50%'}}>
                    <Box sx={{ width: '100%', justifyContent: 'center', margin: { xs: 'auto', lg: 'initial' } }}>
                    {loadedPosts.map((count, countIndex) => (<>
                      <Typography sx={{mb: 2}} variant="h6" color={"text.secondary"}><Link onClick={(e) => {e.preventDefault();navigate(`/thread/${name}?context=${count.uuid}`);}} underline='always' color={"text.secondary"} href={`/thread/${name}?context=${count.uuid}`}>Context</Link></Typography>
                        <Count user={user} key={count.uuid} post={count} thread={selectedThread} counter={cachedCounters[count.authorUUID]} maxWidth={'32px'} maxHeight={'32px'} />
                        </>
                    ))}
                    </Box>
                </Stack>
                </>
              ) : (
                <>
                <Stack direction="column" alignItems="center" sx={{width: '100%'}}>
                    <Box sx={{ width: '100%', justifyContent: 'center', margin: { xs: 'auto', lg: 'initial' } }}>
                    {loadedPosts.map((count, countIndex) => (<>
                      <Typography sx={{mb: 2}} variant="h6" color={"text.secondary"}><Link onClick={(e) => {e.preventDefault();navigate(`/thread/${name}?context=${count.uuid}`);}} underline='always' color={"text.secondary"} href={`/thread/${name}?context=${count.uuid}`}>Context</Link></Typography>
                        <CountMobile user={user} key={count.uuid} post={count} thread={selectedThread} counter={cachedCounters[count.authorUUID]} maxWidth={'32px'} maxHeight={'32px'} />
                        </>
                    ))}
                    </Box>
                </Stack>
                </>
              )}
            </Box>}
            </>}

          </Container>
          </>);
      } else {
        return (<div>Page Not Found</div>
      )}
  };
  