import React, { useContext, useEffect, useState } from 'react';
import { Box, Typography, Avatar, Card, Container, Grid, CardContent, Button } from '@mui/material';
import { blogs } from '../utils/blogs';
import { Link, useLocation, useParams } from 'react-router-dom';
import { UserContext } from '../utils/contexts/UserContext';
import { SocketContext } from '../utils/contexts/SocketContext';


const BlogPage = () => {

    const params = useParams();
    const blog:number = parseInt(params.blog || "1") || 1;

    const { user, counter, loading, setCounter, allegiance } = useContext(UserContext); 
    const socket = useContext(SocketContext);

    let title, author, date, body, avatarImage;

    const [isNo, setIsNo] = useState(false);
    const [isYes, setIsYes] = useState(false);

    const handleYes = () => {
      socket.emit('requestBlogKey');
      setIsYes(true);
    }

    const location = useLocation();
        useEffect(() => {
          if(title) {
            document.title = `${title} | Blog | countGG`;
          }
            return (() => {
              document.title = 'countGG';
            })
          }, [location.pathname, title]);

    const blogPost = blogs.length >= blog ? blogs[blog - 1] : undefined;
    const prevBlog = blogs.length >= blog && blog >= 2 ? blogs[blog - 2] : undefined;
    const nextBlog = blogs.length > blog ? blogs[blog] : undefined;

    const BlogPreview = ({title, author, avatarImage, date}) => {
        return (
            <Card sx={{m: 2, p: 2, bgcolor: 'background.paper', minWidth: 300}}>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              sx={{ width: 50, height: 50, mr: 2 }}
              alt={author}
              src={avatarImage}
            />
              <Typography variant="h6" sx={{mr: 1}}>
                {title}
              </Typography>
            </CardContent>
            <Typography variant="subtitle2">
                {date}
            </Typography>
          </Card>
        );
      };



      if(blogPost) {
        title = blogPost.title;
        author = blogPost.author;
        date = blogPost.date;
        body = blogPost.body;
        avatarImage = blogPost.avatarImage;
        return (
            <Box sx={{ bgcolor: 'primary.light', flexGrow: 1, p: 2 }}>
                <Container sx={{maxWidth: 'xl'}}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar
                  sx={{ width: 50, height: 50, mr: 2 }}
                  alt={author}
                  src={avatarImage}
                />
                <Typography variant="subtitle1">Posted by <Typography fontWeight={'bold'}>{author}</Typography></Typography>
              </Box>
              <Typography variant="h4" sx={{ mt: 1 }}>
                {title}
              </Typography>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                {date}
              </Typography>
              <Box sx={{ mt: 2 }}>
              <Box sx={{display: 'flex', flexDirection: 'column'}}>
  <Box sx={{ bgcolor: 'primary.light', flexGrow: 1, p: 2 }}>
  {body}
  {blog == 4 && user && counter && allegiance && (!user.inventory || user.inventory.filter(item => item['name'] === 'Blog Key').length === 0) && <><Typography sx={{mb: 2}} component={'div'}>Wait... I just remembered, I found this key earlier. Does it look like it's yours?</Typography>
  {isNo ? <Typography sx={{mb: 2}} component={'div'}>Okay, I guess I'll keep it...</Typography> : isYes ? <>Ok, here you go. Don't ask me for another one... I'm out.</> : <><Button onClick={() => {handleYes()}} variant='contained'>Yes</Button> <Button variant='contained' onClick={() => {setIsNo(true)}}>No</Button></>}
  </>}
  {user && user.inventory && user.inventory.filter(item => item['name'] === 'Blog Key').length > 0 && <><Typography sx={{mb: 2}} component={'div'}>Hope you like your key!</Typography></>}
  </Box>
  <Grid container>
  {/* <Box sx={{display: 'flex', justifyContent: 'space-between'}}> */}
    <Grid xs={12} md={6}>
        {prevBlog && (
        <Link to={`/blog/${blog-1}`}>
        <BlogPreview
            title={prevBlog.title}
            author={prevBlog.author}
            avatarImage={prevBlog.avatarImage}
            date={prevBlog.date}
            /> 
            <Typography sx={{textAlign: 'center'}}>&lt; Previous Blog</Typography>
        </Link>
        )}
    </Grid>

    <Grid xs={12} md={6}>
    {nextBlog && (
        <Link to={`/blog/${blog+1}`}>
            <BlogPreview
            title={nextBlog.title}
            author={nextBlog.author}
            avatarImage={nextBlog.avatarImage}
            date={nextBlog.date}
            />
            <Typography sx={{textAlign: 'center'}}>Next Blog &gt;</Typography>
        </Link>
        )}
    </Grid>
    
  {/* </Box> */}
  </Grid>
</Box>
              </Box>
              </Container>
            </Box>
          );
      } else {
        return (
            <>
            <Box sx={{ bgcolor: 'primary.light', flexGrow: 1, p: 2}}>No blog found :(</Box>
            </>
          )
      }
  
};

export default BlogPage;