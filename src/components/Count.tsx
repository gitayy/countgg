import { Box, CardMedia, CardContent, Typography, Grid,  IconButton, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Link, Popover, useTheme } from "@mui/material";
import { memo, useRef, useState } from "react";
import CountggLogo from '../assets/countgg-128.png'
import { defaultCounter, EmojiTest, formatDate, getReplyColorName } from "../utils/helpers";
import { Counter } from "../utils/types";
import DeleteIcon from '@mui/icons-material/Delete';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import { SentimentVerySatisfied } from '@mui/icons-material';
import { useLocation } from "react-router-dom";
import Picker from '@emoji-mart/react'; // works in @latest
import { custom_emojis } from "../utils/custom_emojis";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'
import data from '@emoji-mart/data/sets/14/twitter.json'




const Count = memo((props: any) => {


  // const isLgScreen = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'));
  const theme = useTheme();
  const { counter } = props;
  const location = useLocation();
  // check if pathname ends with the post UUID
  const isSameUuid = location.pathname.endsWith(props.post.uuid);

  // build the URL
  const url = isSameUuid
    ? location.pathname
    : `${location.pathname.replace(/\/+$/, '')}/${props.post.uuid}`;
  
  const uncachedCounter: Counter = defaultCounter(props.post.authorUUID);
  
  const renderedCounter = counter || uncachedCounter;

  const hoursSinceLastCount = Math.floor(props.post.timeSinceLastCount / 3600000);
  const minutesSinceLastCount = Math.floor(props.post.timeSinceLastCount / 60000) % 60;
  const secondsSinceLastCount = Math.floor(props.post.timeSinceLastCount / 1000) % 60;
  const msSinceLastCount = Math.round(props.post.timeSinceLastCount) % 1000;
  const paddedMsSinceLastCount = msSinceLastCount.toString().padStart(3, '0');

  const hoursSinceLastPost = Math.floor(props.post.timeSinceLastPost / 3600000);
  const minutesSinceLastPost = Math.floor(props.post.timeSinceLastPost / 60000) % 60;
  const secondsSinceLastPost = Math.floor(props.post.timeSinceLastPost / 1000) % 60;
  const msSinceLastPost = Math.round(props.post.timeSinceLastPost) % 1000;
  const paddedMsSinceLastPost = msSinceLastPost.toString().padStart(3, '0');

  const [action, setAction] = useState<string|null>(null);
  const [open, setOpen] = useState(false);
  const handleConfirm = () => {
    // Perform the action based on the button that was clicked
    if (action === 'delete') {
      console.log('Delete confirmed');
      handleDeleteComment();
      setOpen(false);
    } else if (action === 'strike') {
      console.log('Strike confirmed');
      setOpen(false);
    }
  };

  const replyTimeColor = getReplyColorName(props.post.timeSinceLastPost);

  let maybeSpace;

  if (props.post.countContent && props.post.rawText.includes(props.post.countContent)) {
    const index = props.post.rawText.indexOf(props.post.countContent) + props.post.countContent.length;
    if (props.post.rawText[index] === ' ') {
      maybeSpace = ' ';
    }
  }

  function handleDeleteComment() {
    props.socket.emit('deleteComment', {uuid: props.post.uuid})
  }

  const [pickerOpen, setPickerOpen] = useState(false);
  function handleEmojiSelect(emoji) {
    console.log(emoji);
    props.socket.emit(`updateReactions`, {id: emoji.id, post_uuid: props.post.uuid})
    setPickerOpen(false);
  }
  
  const anchorRef = useRef(null);
  
  const components = {
    p: ('span' as any),
    code: ({ children }) => { return (Object.keys(data.emojis).includes((children[0] as string).toLowerCase()) ? EmojiTest({id: (children[0] as string).toLowerCase(), size: 24, set: 'twitter'}) : <code>{children}</code>)}
  }

  console.log("Desktop Count Render");

    return (
          <Box ref={props.contextRef} className={`count countDesktop ${props.contextRef && "highlighted"}`} sx={{pl: 2, pr: 2, boxSizing: 'border-box', border: '1px solid transparent', wordWrap: 'break-word' }}>
            <Box>
                <Grid container>
                    <Grid item xs={4}>
                      <Grid container sx={{display: 'flex'}}>
                        <Grid item xs={2} sx={{margin: 'auto', justifyContent: 'center', display: 'grid', marginTop: 0}}>
                        <Box sx={{p: props.boxPadding}}>
                          <Link href={`/counter/${props.post.authorUUID}`}>
                          <CardMedia
                              component="img"
                              sx={{ width: '100%', maxWidth: '64px', maxHeight: '64px'}}
                              image={`${renderedCounter.avatar.length > 5 && `https://cdn.discordapp.com/avatars/${renderedCounter.discordId}/${renderedCounter.avatar}` || CountggLogo}`}
                              alt={renderedCounter.name}
                            />
                            </Link>
                        </Box>
                        {props.post.latency && <Box sx={{display: 'flex', justifyContent: 'center', width: '100%', textAlign: 'center'}}><Typography fontSize={9} sx={{width: 'fit-content', color: 'text.secondary'}} title="Time it took, from sending, for this post to be received from the server." style={{ borderBottom: '1px dotted grey', borderRadius: '1px', cursor: 'help', position: 'relative' }}>{props.post.latency}ms</Typography></Box>}
                        </Grid>
                        <Grid item xs={10}>
                          <Grid container sx={{width: '95%'}}>
                            <Grid item xs={12} sx={{color: 'text.primary', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <Box sx={{ textAlign: 'left', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', ...(hoursSinceLastPost > 9 && {scale: '0.75'})}}>
                              {props.post.timeSinceLastCount != props.post.timeSinceLastPost && <>
                            {hoursSinceLastCount > 0 ? (<Typography component="span" fontSize={12}>{hoursSinceLastCount}<Typography component="span" fontSize={9} variant="subtitle2">h</Typography></Typography>) : null}
                            {minutesSinceLastCount > 0 || hoursSinceLastCount > 0 ? (<Typography component="span" fontSize={12}>{minutesSinceLastCount}<Typography component="span" fontSize={9} variant="subtitle2">m</Typography></Typography>) : null}
                            {secondsSinceLastCount > 0 || minutesSinceLastCount > 0 || hoursSinceLastCount > 0 ? (<Typography component="span" fontSize={12}>{secondsSinceLastCount}<Typography component="span" fontSize={9} variant="subtitle2">s</Typography></Typography>) : null}
                            <Typography component="span" fontSize={12}>{props.post.timeSinceLastCount > 999 ? paddedMsSinceLastCount : msSinceLastCount}<Typography component="span" fontSize={9} variant="subtitle2">ms</Typography></Typography>
                              {/* &nbsp;| */}&nbsp;</>}
                              </Box>
                              <Box sx={{ textAlign: 'right', bgcolor: `${replyTimeColor}.${theme.palette.mode}` }}>
                              {hoursSinceLastPost > 0 ? (<Typography component="span" variant="h5">{hoursSinceLastPost}<Typography component="span" variant="subtitle2">h</Typography></Typography>) : null}
                              {minutesSinceLastPost > 0 || hoursSinceLastPost > 0 ? (<Typography component="span" variant="h5">{minutesSinceLastPost}<Typography component="span" variant="subtitle2">m</Typography></Typography>) : null}
                              {secondsSinceLastPost > 0 || minutesSinceLastPost > 0 || hoursSinceLastPost > 0 ? (<Typography component="span" variant="h5">{secondsSinceLastPost}<Typography component="span" variant="subtitle2">s</Typography></Typography>) : null}
                              <Typography component="span" variant="h5">{props.post.timeSinceLastPost > 999 ? paddedMsSinceLastPost : msSinceLastPost}<Typography component="span" variant="subtitle2">ms</Typography></Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                              <Box sx={{textAlign: 'left'}}></Box>
                              <Link href={url} underline={'hover'} sx={{ textAlign: 'right'}} variant="caption" color="textSecondary">{formatDate(parseInt(props.post.timestamp))}</Link>
                            </Grid>
                          </Grid>
                        </Grid>
                      </Grid>
                    </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                <CardContent sx={{ maxWidth: 'fit-content', flex: '1 0 auto', p: 0, pb: 0, overflowWrap: 'anywhere', '&:last-child': {pb: '2px'} }}>
                        <Typography component="div" variant="body1" color={"text.primary"} sx={{whiteSpace: 'pre-wrap'}}><span style={{textDecoration: props.post.stricken ? "line-through" : "none"}}>{props.post.countContent}</span>{maybeSpace}{props.post.comment && <ReactMarkdown children={props.post.comment} components={components} remarkPlugins={[remarkGfm]} />}{props.post.isCommentDeleted && <Typography component={'span'} sx={{width: 'fit-content', p: 0.5, bgcolor: 'lightgray', color: 'black'}}>[deleted]</Typography> }
                        </Typography>
                    <Typography variant="subtitle1" component="div">
                        <Link underline="hover" sx={{textDecoration: renderedCounter.roles.includes('banned') ? 'line-through' : 'none', fontStyle: renderedCounter.roles.includes('muted') ? 'italic' : 'normal'}} color={renderedCounter.color} href={`/counter/${props.post.authorUUID}`}>{renderedCounter.name}</Link>&nbsp;
                      </Typography>
                      <Box sx={{display: 'inline-flex', flexWrap: 'wrap'}}>
                      {props.post.reactions && Object.entries(props.post.reactions).map((reaction: [string, unknown]) => {
                        if(props.myCounter && reaction[1] && (reaction[1] as string[]).includes(props.myCounter.uuid)) {
                          return (
                            <Box key={reaction[0]} onClick={() => {props.socket.emit(`updateReactions`, {id: reaction[0], post_uuid: props.post.uuid})}} component={'div'} sx={{background: '#6ab3ff82', cursor: 'pointer', paddingTop: '6px', marginRight: '5px', paddingLeft: '5px', paddingRight: '5px', gap: '8px', alignItems: 'center', height: '30px', display: 'inline-flex', border: '1px solid #3c3cff82', borderRadius: '10px'}}>{EmojiTest({id: reaction[0], size: 24, set: 'twitter'})} {(reaction[1] as string[]).length}</Box>
                          )
                        } else {
                          return (
                            <Box key={reaction[0]} onClick={() => {props.socket.emit(`updateReactions`, {id: reaction[0], post_uuid: props.post.uuid})}} component={'div'} sx={{background: '#afafaf21', cursor: 'pointer', paddingTop: '6px', marginRight: '5px', paddingLeft: '5px', paddingRight: '5px', gap: '8px', alignItems: 'center', height: '30px', display: 'inline-flex', border: '1px solid #3c3cff82', borderRadius: '10px'}}>{EmojiTest({id: reaction[0], size: 24, set: 'twitter'})} {(reaction[1] as string[]).length}</Box>
                          )
                        }
                        })}
                      </Box>
                </CardContent>
              </Box>
              </Grid>
              <Grid item xs={2} lg={2}>
              <Box ref={anchorRef}></Box>
              {props.myCounter && 
              <Box className="countActionsDesktop" sx={{ display: 'none', justifyContent: 'end' }}>
                <IconButton
                  // ref={anchorRef}
                  aria-label="Reaction"
                  onClick={() => {setPickerOpen(!pickerOpen)}}
                >
                  <SentimentVerySatisfied />
                </IconButton>
              {props.post.isCount && props.thread && props.thread.autoValidated === false && ((props.myCounter && props.myCounter.uuid == props.post.authorUUID) || (props.myCounter && props.myCounter.roles.includes("admin"))) && <IconButton
                aria-label="Strike"
                onClick={() => {setAction('strike'); setOpen(true)}}
              >
                <StrikethroughSIcon />
              </IconButton>}
              {props.post.hasComment && ((props.myCounter && props.myCounter.uuid == props.post.authorUUID) || (props.myCounter && props.myCounter.roles.includes("admin"))) && <IconButton
                aria-label="Delete"
                onClick={() => {setAction('delete'); setOpen(true)}}
              >
                <DeleteIcon />
              </IconButton>}

              {pickerOpen && <Popover open={pickerOpen} anchorEl={anchorRef.current} anchorOrigin={{ vertical: 'top', horizontal: -250, }} onClose={() => setPickerOpen(false)}><Picker set={'twitter'} custom={custom_emojis} onEmojiSelect={handleEmojiSelect} /></Popover>}
              {/* {pickerOpen && <Popover open={pickerOpen} anchorEl={anchorRef.current} onClose={() => setPickerOpen(false)}><NimblePicker set="twitter" data={data} onSelect={handleEmojiSelect} /></Popover>} */}

              <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>Confirm action</DialogTitle>
                <DialogContent>
                  <DialogContentText>
                    {action === 'delete' ? `Are you sure you want to delete this post's text? The count itself will remain. This can't be undone.` : 'Are you sure you want to toggle strike on this post? This can be undone.'}
                  </DialogContentText>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setOpen(false)}>Cancel</Button>
                  <Button sx={{fontWeight: "bold"}} autoFocus onClick={handleConfirm}>Confirm</Button>
                </DialogActions>
              </Dialog>
              </Box>
              }
              </Grid>
              </Grid>
              </Box>
              </Box>
            
    )
    });

    export default Count;