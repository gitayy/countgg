import { useContext, useEffect, useState } from 'react';
import { Container, Box, FormControl, InputLabel, Select, MenuItem, Button, Input, Alert, AlertColor, Snackbar, FormControlLabel, Checkbox, SelectChangeEvent, Typography } from '@mui/material';
import { useFetchAllThreads } from '../utils/hooks/useFetchAllThreads';
import { adminCreateThread } from '../utils/api';
import { ThreadType } from '../utils/types';
import { UserContext } from '../utils/contexts/UserContext';
  
  export const AdminThreadPage = () => {
    const { counter, loading } = useContext(UserContext);
    const { allThreads, allThreadsLoading } = useFetchAllThreads();
    const [selectedThread, setSelectedThread] = useState<ThreadType>();

    const [uuid, setUuid] = useState('');
    const [name, setName] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [color1, setColor1] = useState('');
    const [color2, setColor2] = useState('');
    const [category, setCategory] = useState('');
    const [rules, setRules] = useState('');
    const [firstValidCount, setFirstValidCount] = useState('');
    const [validationType, setValidationType] = useState('');
    const [visibleTo, setVisibleTo] = useState('all');
    const [updatableBy, setUpdatableBy] = useState('counter');
    const [locked, setLocked] = useState(false);
    const [autoValidated, setAutoValidated] = useState(false);
    const [moderators, setModerators] = useState('');
    const [verifiers, setVerifiers] = useState('');
    const [countBans, setCountBans] = useState('');
    const [postBans, setPostBans] = useState('');
    const [resetOnMistakes, setResetOnMistakes] = useState(false);
    const [allowDoublePosts, setAllowDoublePosts] = useState(false);
    const [countsPerSplit, setCountsPerSplit] = useState(100);
    const [splitsPerGet, setSplitsPerGet] = useState(10);
    const [splitOffset, setSplitOffset] = useState(0);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('error');

    useEffect(() => {
      if (!selectedThread) return;
      setUuid(selectedThread.uuid);
      setName(selectedThread.name);
      setTitle(selectedThread.title);
      setDescription(selectedThread.description);
      setRules(selectedThread.rules);
      setFirstValidCount(selectedThread.firstValidCount);
      setValidationType(selectedThread.validationType);
      setVisibleTo(selectedThread.visibleTo ? selectedThread.visibleTo.join(',') : '');
      setUpdatableBy(selectedThread.updatableBy ? selectedThread.updatableBy.join(',') : '');
      setLocked(selectedThread.locked);
      setAutoValidated(selectedThread.autoValidated);
      setResetOnMistakes(selectedThread.resetOnMistakes);
      setAllowDoublePosts(selectedThread.allowDoublePosts);
      setCountsPerSplit(selectedThread.countsPerSplit);
      setSplitsPerGet(selectedThread.splitsPerGet);
      setSplitOffset(selectedThread.splitOffset);
      setModerators(selectedThread.moderators ? selectedThread.moderators.join(',') : '');
      setVerifiers(selectedThread.verifiers ? selectedThread.verifiers.join(',') : '');
      setCountBans(selectedThread.countBans ? selectedThread.countBans.join(',') : '');
      setPostBans(selectedThread.postBans ? selectedThread.postBans.join(',') : '');
      setShortDescription(selectedThread.shortDescription);
      setColor1(selectedThread.color1);
      setColor2(selectedThread.color2);
      setCategory(selectedThread.category);
    }, [selectedThread]);

    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
          return;
        }    
        setSnackbarOpen(false);
      };

    const sendValues = async () => {
      if(name) {
        try {
        const res = await adminCreateThread(name, title, description, rules, firstValidCount, validationType, visibleTo, updatableBy, locked, autoValidated, resetOnMistakes, allowDoublePosts, moderators, verifiers, countBans, postBans, shortDescription, color1, color2, category, countsPerSplit, splitsPerGet, splitOffset, uuid);
          if(res.status == 201) {
            setSnackbarSeverity('success');
            setSnackbarOpen(true)
            setSnackbarMessage('Thread created successfully')
          }
        }
        catch(err) {
          setSnackbarSeverity('error');
          setSnackbarOpen(true)
          setSnackbarMessage('Error: Submission rejected. If this comes as a surprise, please reach out to discord mods via DM!')
        }
      }
    };

    const handleThreadSelection = (event: SelectChangeEvent<string>) => {
      const selectedThread = allThreads.find(thread => thread.uuid === event.target.value);
      setSelectedThread(selectedThread);
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
          <FormControl variant="standard" sx={{}}>
        <Select
          value={selectedThread ? selectedThread.uuid : ''}
          onChange={handleThreadSelection}
        >
          {allThreads.map(thread => (
            <MenuItem key={thread.uuid} value={thread.uuid}>{thread.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
            <Box sx={{bgcolor: 'white', color: 'black', p: 3}}> 
            {selectedThread && selectedThread.name && <Typography variant="h6">Selected Thread: {selectedThread.name}</Typography>} 
              <FormControl variant="standard" sx={{}} >
                <InputLabel htmlFor="name" shrink>
                  Name
                </InputLabel>
                <Input
                  onInput={e => setName((e.target as HTMLInputElement).value)}
                  defaultValue={name}
                  value={name}
                  id="name" 
                  disabled={uuid.length > 0}
                />
              </FormControl>
              <FormControl variant="standard" sx={{}} >
                <InputLabel htmlFor="title" shrink>
                  Title
                </InputLabel>
                <Input
                  onInput={e => setTitle((e.target as HTMLInputElement).value)}
                  defaultValue={title}
                  value={title}
                  id="title"
                />
              </FormControl>
              <FormControl variant="standard" sx={{}} >
                <InputLabel htmlFor="shortdescription" shrink>
                  Short Description
                </InputLabel>
                <Input
                  onInput={e => setShortDescription((e.target as HTMLInputElement).value)}
                  defaultValue={shortDescription}
                  value={shortDescription}
                  id="shortdescription"
                />
              </FormControl>
              <FormControl variant="standard" sx={{}} >
                <InputLabel htmlFor="color1" shrink>
                  Color 1
                </InputLabel>
                <Input
                  onInput={e => setColor1((e.target as HTMLInputElement).value)}
                  defaultValue={color1}
                  value={color1}
                  id="color1"
                />
              </FormControl>
              <FormControl variant="standard" sx={{}} >
                <InputLabel htmlFor="color2" shrink>
                  Color 2
                </InputLabel>
                <Input
                  onInput={e => setColor2((e.target as HTMLInputElement).value)}
                  defaultValue={color2}
                  value={color2}
                  id="color2"
                />
              </FormControl>
              <FormControl variant="standard" sx={{}} >
                <InputLabel htmlFor="category" shrink>
                  Category
                </InputLabel>
                <Input
                  onInput={e => setCategory((e.target as HTMLInputElement).value)}
                  defaultValue={category}
                  value={category}
                  id="category"
                />
              </FormControl>
              <FormControl variant="standard" sx={{}} >
                <InputLabel htmlFor="description" shrink>
                  Description
                </InputLabel>
                <Input
                  onInput={e => setDescription((e.target as HTMLInputElement).value)}
                  multiline
                  defaultValue={description}
                  value={description}
                  id="description"
                />
              </FormControl>
              <FormControl variant="standard" sx={{}} >
                <InputLabel htmlFor="rules" shrink>
                  Rules
                </InputLabel>
                <Input
                  onInput={e => setRules((e.target as HTMLInputElement).value)}
                  multiline
                  defaultValue={rules}
                  value={rules}
                  id="rules"
                />
              </FormControl>
              <FormControl variant="standard" sx={{}} >
                <InputLabel htmlFor="firstValidCount" shrink>
                  First Valid Count
                </InputLabel>
                <Input
                  onInput={e => setFirstValidCount((e.target as HTMLInputElement).value)}
                  defaultValue={firstValidCount}
                  value={firstValidCount}
                  id="firstValidCount"
                />
              </FormControl>
              <FormControl variant="standard" sx={{}} >
                <InputLabel htmlFor="countsPerSplit" shrink>
                Counts Per Split
                </InputLabel>
                <Input
                  onInput={e => setCountsPerSplit(parseInt((e.target as HTMLInputElement).value))}
                  defaultValue={countsPerSplit}
                  value={countsPerSplit}
                  id="countsPerSplit"
                />
              </FormControl>
              <FormControl variant="standard" sx={{}} >
                <InputLabel htmlFor="splitsPerGet" shrink>
                Splits Per Get
                </InputLabel>
                <Input
                  onInput={e => setSplitsPerGet(parseInt((e.target as HTMLInputElement).value))}
                  defaultValue={splitsPerGet}
                  value={splitsPerGet}
                  id="splitsPerGet"
                />
              </FormControl>
              <FormControl variant="standard" sx={{}} >
                <InputLabel htmlFor="splitOffset" shrink>
                Split Offset
                </InputLabel>
                <Input
                  onInput={e => setSplitOffset(parseInt((e.target as HTMLInputElement).value))}
                  defaultValue={splitOffset}
                  value={splitOffset}
                  id="splitOffset"
                />
              </FormControl>
              <FormControl variant="standard" sx={{}} >
                <InputLabel htmlFor="validationType" shrink>
                  Validation Type
                </InputLabel>
                <Input
                  onInput={e => setValidationType((e.target as HTMLInputElement).value)}
                  defaultValue={validationType}
                  value={validationType}
                  id="validationType"
                />
              </FormControl>
              <FormControl variant="standard" sx={{}}>
                <InputLabel htmlFor="visibleTo" shrink>
                  visibleTo
                </InputLabel>
                <Input
                  onInput={e => setVisibleTo((e.target as HTMLInputElement).value)}
                  defaultValue={visibleTo}
                  value={visibleTo}
                  id="visibleTo"
                />
              </FormControl>
              <FormControl variant="standard" sx={{}} >
                <InputLabel htmlFor="updatableBy" shrink>
                updatableBy
                </InputLabel>
                <Input
                  onInput={e => setUpdatableBy((e.target as HTMLInputElement).value)}
                  defaultValue={updatableBy}
                  value={updatableBy}
                  id="updatableBy"
                />
              </FormControl>
              <FormControl variant="standard" sx={{}} >
                <InputLabel htmlFor="moderators" shrink>
                Moderators
                </InputLabel>
                <Input
                  onInput={e => setModerators((e.target as HTMLInputElement).value)}
                  defaultValue={moderators}
                  value={moderators}
                  id="moderators"
                />
              </FormControl>
              <FormControl variant="standard" sx={{}} >
                <InputLabel htmlFor="verifiers" shrink>
                Verifiers
                </InputLabel>
                <Input
                  onInput={e => setVerifiers((e.target as HTMLInputElement).value)}
                  defaultValue={verifiers}
                  value={verifiers}
                  id="verifiers"
                />
              </FormControl>
              <FormControl variant="standard" sx={{}} >
                <InputLabel htmlFor="countBans" shrink>
                Count Bans
                </InputLabel>
                <Input
                  onInput={e => setCountBans((e.target as HTMLInputElement).value)}
                  defaultValue={countBans}
                  value={countBans}
                  id="countBans"
                />
              </FormControl>
              <FormControl variant="standard" sx={{}} >
                <InputLabel htmlFor="postBans" shrink>
                Post Bans
                </InputLabel>
                <Input
                  onInput={e => setPostBans((e.target as HTMLInputElement).value)}
                  defaultValue={postBans}
                  value={postBans}
                  id="postBans"
                />
              </FormControl>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={locked}
                    onChange={(e) => setLocked(e.target.checked)}
                  />
                }
                label="Locked"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={autoValidated}
                    onChange={(e) => setAutoValidated(e.target.checked)}
                  />
                }
                label="autoValidated"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={resetOnMistakes}
                    onChange={(e) => setResetOnMistakes(e.target.checked)}
                  />
                }
                label="Reset on Mistakes"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={allowDoublePosts}
                    onChange={(e) => setAllowDoublePosts(e.target.checked)}
                  />
                }
                label="Allow Double Posts"
              />
                <Button variant='contained' onClick={sendValues}>Submit</Button>
            </Box>
          </Container>
          </>);
      } else {
        return (<div>Page Not Found</div>
      )}
  };
  