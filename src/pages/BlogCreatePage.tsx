import React, { useContext, useEffect, useRef, useState } from 'react';
import { Box, Typography, Avatar, Card, Container, Grid, CardContent, Button, TextField, Chip } from '@mui/material';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { UserContext } from '../utils/contexts/UserContext';
import { SocketContext } from '../utils/contexts/SocketContext';
import ReactMarkdown from 'react-markdown';
import { EmojiTest, formatDate, transformMarkdown } from '../utils/helpers';
import data from '@emoji-mart/data/sets/14/twitter.json'
import remarkGfm from 'remark-gfm';
import { BlogPost } from '../components/BlogPost';
import { Loading } from '../components/Loading';
import { SnackbarContext } from '../utils/contexts/SnackbarContext';
import { saveBlog } from '../utils/api';

const BlogCreatePage = () => {

    const params = useParams();

    const { user, counter, loading, setCounter } = useContext(UserContext); 
    const socket = useContext(SocketContext);

    const location = useLocation();
        useEffect(() => {
            document.title = `Create Blog | Counting!`;
            return (() => {
              document.title = 'Counting!';
            })
          }, [location.pathname]);

          const [title, setTitle] = useState('');
            // const [body, setBody] = useState('');
            const inputRef = useRef<HTMLInputElement>(null);
            const [date, setDate] = useState(formatDate(new Date().getTime()));
            const [randomTime, setRandomTime] = useState(Date.now());
            const navigate = useNavigate();
            useEffect(() => {
                const interval = setInterval(() => {
                    setRandomTime(Date.now());
                }, 250);
                return () => clearInterval(interval);
              }, []);

              const handlePosting = async () => {
                if (inputRef.current) {
                    try {const res = await saveBlog(title, inputRef.current.value, tags);
                        console.log(res);
                        if(res.status == 201) {
                            console.log("yes");
                            console.log(res.data);
                            navigate(`/blog/${res.data.uuid}`);
                        //   setSnack('Changes made successfully')
                        } 
                    }
                        catch(err) {
                            console.log("no");
                            // setSnack('Error: Submission rejected. If this comes as a surprise, please reach out to discord mods via DM!')
                        }
                }
            }

            const [tags, setTags] = useState<string[]>([]);
            const tagInputRef = useRef<HTMLInputElement>(null);

            const handleTagAdd = (event) => {
                if(tagInputRef.current) {
                    if (event.key === 'Enter') {
                        const newTag = tagInputRef.current.value.trim();
                
                        if (newTag && newTag.length < 21 && !tags.includes(newTag) && tags.length < 5) {
                        setTags([...tags, newTag]);
                        tagInputRef.current.value = '';
                        }
                    }
                }
            };

            const handleTagDelete = (tagToDelete) => {
                const updatedTags = tags.filter((tag) => tag !== tagToDelete);
                setTags(updatedTags);
            };
                            


          // Create a new blog post. Title, body.
          return (
            <Box sx={{ bgcolor: 'background.paper', flexGrow: 1, p: 2, color: 'text.primary'}}>
                {counter && !loading 
                ? <>
                
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Typography variant="h4" component="h1" align="center">
                        Create Blog
                     </Typography>
                    <TextField id="outlined-basic" inputProps={{ maxLength: 200}} label="Title" onInput={(e) => setTitle((e.target as HTMLInputElement).value)} variant="outlined" sx={{width: '100%', m: 1}} />
                    <TextField inputRef={inputRef} id="outlined-basic" inputProps={{ maxLength: 20000}} label="Body" variant="outlined" 
                    // onInput={(e) => setBody((e.target as HTMLInputElement).value)} 
                    multiline minRows={30} sx={{m: 1, width: '100%'}} />
                </Grid>
                <Grid item xs={12} md={6}>
                    <Typography variant="h4" component="h1" align="center">
                        Preview
                     </Typography>
                    <BlogPost 
                    title={title} 
                    body={inputRef.current ? inputRef.current.value : ''} 
                    author={counter}
                    timestamp={date}
                    update={randomTime}
                    />
                </Grid>
            </Grid>

            <Typography variant='body2'>{inputRef.current ? inputRef.current.value.length : 0} / {(20000).toLocaleString()}</Typography>
            <TextField
        label="Add a tag"
        variant="outlined"
        fullWidth
        inputRef={tagInputRef}
        onKeyDown={handleTagAdd}
      />
      <Box mt={2}>
        {tags.map((tag, index) => (
          <Chip
            key={index}
            label={tag}
            onDelete={() => handleTagDelete(tag)}
            style={{ margin: '4px' }}
          />
        ))}
      </Box>
            <Button variant="contained" onClick={handlePosting}>Save</Button></>

            : <Loading />
            }
            </Box>
          )
};

export default BlogCreatePage;