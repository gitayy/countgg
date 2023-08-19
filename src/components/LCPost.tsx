import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Link, Typography } from '@mui/material';
import { memo, useContext, useState } from 'react';
import { UserContext } from '../utils/contexts/UserContext';
import axios from 'axios';
import { formatDate, formatDateWithMilliseconds, uuidv1ToMs } from '../utils/helpers';
import { RedditPost } from '../utils/types';
import queryString from 'query-string';

interface LCPostProps {
    // post: RedditPost;
    postString: string;
    // stricken: boolean;
    thread: string;
  }

//   function areEqual(prevProps: LCPostProps, nextProps: LCPostProps) {
//     // Compare the props here
//     const prevPost = prevProps.post;
//     const nextPost = nextProps.post;
//     console.log(prevPost, nextPost);
  
//     // Implement your comparison logic
//     // For example, compare individual properties of the post object
//     const idEqual = prevPost.id === nextPost.id;
//     const strickenEqual = prevPost.stricken === nextPost.stricken;
  
//     // Compare other props if needed
//     const detailsEqual = JSON.stringify(prevProps.thread) === JSON.stringify(nextProps.thread);
  
//     console.log(`LCPost areEqual (${prevPost.body}, ${prevPost.author}, ${prevPost.stricken}): ${idEqual}, ${strickenEqual}, ${detailsEqual}`);
//     // Return true if all props are equal, or false if not
//     return idEqual && strickenEqual && detailsEqual;
//   }

// export const LCPost = memo(({ post, details }: LCPostProps ) => {
export const LCPost = memo(({ postString, thread }: LCPostProps ) => {
// export const LCPost = ({ post, thread }: LCPostProps ) => {
    const post = JSON.parse(postString) as RedditPost;
    const {user, counter, loading} = useContext(UserContext);
    console.log(`LCPost rendered (${post.body}, ${post.author}, ${post.stricken})`);
    
    const apiUrl = `https://oauth.reddit.com/api/live/${thread}`;
    const headers = {
        'Authorization': `Bearer ${user && user.redditAccess}`,
    };

    const [action, setAction] = useState<string|null>(null);
    const [open, setOpen] = useState(false);
    const handleConfirm = () => {
        // Perform the action based on the button that was clicked
        if (action === 'delete') {
          handleDelete();
          setOpen(false);
        } else if (action === 'strike') {
          handleStrike();
          setOpen(false);
        }
      };

      function handleDelete() {
        console.log("hamle delete");
        if(user && counter && user.redditAccess) {
            console.log("Deleting post", post.body);
            const requestData = {
                id: post.name,
            };
            
            axios.post(`${apiUrl}/delete_update`, queryString.stringify(requestData), { headers: headers })
            .then(response => {
                console.log(response);
                console.log('Delete successful:', response.data);
            })
            .catch(error => {
                console.error('Error deleting:', error);
            });
        }
      }

      function handleStrike() {
        console.log("hamle strike");
        if(user && counter && user.redditAccess) {
            console.log("Striking post", post.body);
            const requestData = {
                id: post.name,
            };
    
            
            axios.post(`${apiUrl}/strike_update`, queryString.stringify(requestData), { headers: headers })
            .then(response => {
                console.log(response);
                console.log('Strike successful:', response.data);
            })
            .catch(error => {
                console.error('Error striking:', error);
            });
        }
      }

        const today = new Date();
        const yesterday = new Date(Date.now() - 86400000);
        const date = new Date(uuidv1ToMs(post.id));
        const hour = date.getHours();
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${hour}`;
        const dateWithoutMinutes = new Date(date.setMinutes(0));
        let day;
        if (dateWithoutMinutes.toLocaleDateString() === today.toLocaleDateString()) {
        day = 'Today at ' + dateWithoutMinutes.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' });
        } else if (dateWithoutMinutes.toLocaleDateString() === yesterday.toLocaleDateString()) {
        day = 'Yesterday at ' + dateWithoutMinutes.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' });
        } else {
        day = dateWithoutMinutes.toLocaleDateString() + ' at ' + dateWithoutMinutes.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' });
        }

    return (<>
      <Box className={`redditPost`} sx={{ p: 1, display: 'flex', alignItems: 'left', my: 1, flexDirection: 'column', fontFamily: 'Verdana!important' }}>
        <Typography className={`redditPostBody`} variant="body1" sx={{ fontSize: 14, fontFamily: 'Verdana', mx: 1, color: 'text.primary', ...(post.stricken ? {textDecoration: 'line-through'} : {}) }}>
          {post.body}
        </Typography>
        <Box sx={{fontSize: 13, color: 'text.secondary', display: 'flex', mx: 1, alignItems: 'left', flexDirection: 'row' }}>
            <Link variant="body2" underline='hover' href={`https://reddit.com/user/${post.author}`} sx={{ fontSize: 13, fontFamily: 'Verdana', color: 'text.secondary' }}>
                /u/{post.author}
            </Link>
            <Typography variant="body2" sx={{ fontFamily: 'Verdana', color: 'text.secondary', userSelect: 'none' }}>
                &nbsp;|&nbsp;
            </Typography>
            <Link variant="body2" underline='hover' href={`https://reddit.com/live/${thread}/updates/${post.id}`} sx={{ fontSize: 13, fontFamily: 'Verdana', color: 'text.secondary' }}>
                {formatDateWithMilliseconds(uuidv1ToMs(post.id))}
            </Link>
            {user && user.reddit === post.author && !post.stricken && <> 
            <Typography variant="body2" sx={{ fontFamily: 'Verdana', color: 'text.secondary', userSelect: 'none' }}>
                &nbsp;|&nbsp;
            </Typography>
            <Typography variant="body2" onClick={() => {setAction('strike'); setOpen(true)}} sx={{ fontSize: 13, fontFamily: 'Verdana', color: 'text.secondary', cursor: 'pointer', '&:hover': {textDecoration: 'underline'} }}>
                strike
            </Typography></>}
            {user && user.reddit === post.author && <> 
            <Typography variant="body2" sx={{ fontFamily: 'Verdana', color: 'text.secondary', userSelect: 'none' }}>
                &nbsp;|&nbsp;
            </Typography>
            <Typography variant="body2" onClick={() => {setAction('delete'); setOpen(true)}} sx={{ fontSize: 13, fontFamily: 'Verdana', color: 'text.secondary', cursor: 'pointer', '&:hover': {textDecoration: 'underline'} }}>
                delete
            </Typography></>}
        </Box>
      </Box>
      <Dialog open={open} onClose={() => setOpen(false)}>
      <DialogTitle>Confirm {action}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {action === 'delete' ? `Are you sure you want to delete this post? This can't be undone.` : `Are you sure you want to strike this post? This can't be undone.`}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button sx={{fontWeight: "bold"}} autoFocus onClick={handleConfirm}>Confirm</Button>
      </DialogActions>
    </Dialog>
      </>
    );
//   }, areEqual);
            });
// }