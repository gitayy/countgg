import React, { useContext, useEffect, useState } from 'react';
import { Box, Typography, Avatar, Card, Container, Grid, CardContent, Button } from '@mui/material';
import { Link, useLocation, useParams } from 'react-router-dom';
import { UserContext } from '../utils/contexts/UserContext';
import { SocketContext } from '../utils/contexts/SocketContext';


const BlogPage = () => {

    const params = useParams();
    const blog:number = parseInt(params.blog || "1") || 1;

    const { user, counter, loading, setCounter } = useContext(UserContext); 
    const socket = useContext(SocketContext);

    let title, author, date, body, avatarImage;

    const location = useLocation();
        useEffect(() => {
          if(title) {
            document.title = `${title} | Blog | Counting!`;
          }
            return (() => {
              document.title = 'Counting!';
            })
          }, [location.pathname, title]);

          return             <Box sx={{ bgcolor: 'background.paper', flexGrow: 1, p: 2, color: 'text.primary'}}>
            Yep
</Box>

//     const blogPost = blogs.length >= blog ? blogs[blog - 1] : undefined;
//     const prevBlog = blogs.length >= blog && blog >= 2 ? blogs[blog - 2] : undefined;
//     const nextBlog = blogs.length > blog ? blogs[blog] : undefined;

//     const BlogPreview = ({title, author, avatarImage, date}) => {
//         return (
//             <Card sx={{m: 2, p: 2, bgcolor: 'background.paper', minWidth: 300}}>
//             <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
//             <Avatar
//               sx={{ width: 50, height: 50, mr: 2 }}
//               alt={author}
//               src={avatarImage}
//             />
//               <Typography variant="h6" sx={{mr: 1}}>
//                 {title}
//               </Typography>
//             </CardContent>
//             <Typography variant="subtitle2">
//                 {date}
//             </Typography>
//           </Card>
//         );
//       };



//       if(blogPost) {
//         title = blogPost.title;
//         author = blogPost.author;
//         date = blogPost.date;
//         body = blogPost.body;
//         avatarImage = blogPost.avatarImage;
//         return (
//             <Box sx={{ bgcolor: 'primary.light', flexGrow: 1, p: 2 }}>
//                 <Container sx={{maxWidth: 'xl'}}>
//               <Box sx={{ display: 'flex', alignItems: 'center' }}>
//                 <Avatar
//                   sx={{ width: 50, height: 50, mr: 2 }}
//                   alt={author}
//                   src={avatarImage}
//                 />
//                 <Typography variant="subtitle1">Posted by <Typography fontWeight={'bold'}>{author}</Typography></Typography>
//               </Box>
//               <Typography variant="h4" sx={{ mt: 1 }}>
//                 {title}
//               </Typography>
//               <Typography variant="subtitle2" sx={{ mt: 1 }}>
//                 {date}
//               </Typography>
//               <Box sx={{ mt: 2 }}>
//               <Box sx={{display: 'flex', flexDirection: 'column'}}>
//   <Box sx={{ bgcolor: 'primary.light', flexGrow: 1, p: 2 }}>
//   {body}
//   </Box>
//   <Grid container>
//     <Grid xs={12} md={6}>
//         {prevBlog && (
//         <Link to={`/blog/${blog-1}`}>
//         <BlogPreview
//             title={prevBlog.title}
//             author={prevBlog.author}
//             avatarImage={prevBlog.avatarImage}
//             date={prevBlog.date}
//             /> 
//             <Typography sx={{textAlign: 'center'}}>&lt; Previous Blog</Typography>
//         </Link>
//         )}
//     </Grid>

//     <Grid xs={12} md={6}>
//     {nextBlog && (
//         <Link to={`/blog/${blog+1}`}>
//             <BlogPreview
//             title={nextBlog.title}
//             author={nextBlog.author}
//             avatarImage={nextBlog.avatarImage}
//             date={nextBlog.date}
//             />
//             <Typography sx={{textAlign: 'center'}}>Next Blog &gt;</Typography>
//         </Link>
//         )}
//     </Grid>
    
//   {/* </Box> */}
//   </Grid>
// </Box>
//               </Box>
//               </Container>
//             </Box>
//           );
//       } else {
//         return (
//             <>
//             <Box sx={{ bgcolor: 'primary.light', flexGrow: 1, p: 2}}>No blog found :(</Box>
//             </>
//           )
//       }
  
};

export default BlogPage;