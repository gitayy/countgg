import React, { useContext, useEffect, useState } from 'react'
import { Box, Typography, Avatar, Card, Container, Grid, CardContent, Button, Pagination, PaginationItem, Link } from '@mui/material'
import { Link as routerLink, useLocation, useNavigate, useParams } from 'react-router-dom'
import { UserContext } from '../utils/contexts/UserContext'
import { SocketContext } from '../utils/contexts/SocketContext'
import { useIsMounted } from '../utils/hooks/useIsMounted'
import { getBlogs } from '../utils/api'
import { Blog } from '../utils/types'

const ServersPage = () => {
  const params = useParams()

  const [blogs, setBlogs] = useState<Blog[]>([])
  const [blogsLoading, setBlogsLoading] = useState<boolean>(true)

  const [page, setPage] = useState<number | undefined>()
  const [count, setCount] = useState(0)
  const [urlCheck, setUrlCheck] = useState(false)
  const isMounted = useIsMounted()

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const currentPage = parseInt(searchParams.get('page') || '1')
    if (!isNaN(currentPage)) {
      setUrlCheck(true)
      setPage(currentPage)
    } else {
      setUrlCheck(true)
      setPage(1)
    }
  }, [])

  useEffect(() => {
    async function fetchData() {
      if (page) {
        setBlogsLoading(true)
        getBlogs(page)
          .then(({ data }) => {
            if (isMounted.current) {
              setBlogs(data.blogs)
              setCount(data.pageCount)
              setBlogsLoading(false)
            }
          })
          .catch((err) => {
            console.log(err)
          })
      }
    }
    if (urlCheck && page) {
      fetchData()
    }
  }, [urlCheck, page])

  function handleChangePage(event, value) {
    setPage(value)
  }

  const { user, counter, loading, setCounter } = useContext(UserContext)
  const socket = useContext(SocketContext)

  let title, author, date, body, avatarImage

  const location = useLocation()
  useEffect(() => {
    if (title) {
      document.title = `Blogs | Counting!`
    }
    return () => {
      document.title = 'Counting!'
    }
  }, [location.pathname, title])

  // Create a list of blogs and paginate based off of url params

  const navigate = useNavigate()

  return (
    <Box sx={{ bgcolor: 'primary.light', flexGrow: 1, p: 2 }}>
      <Box display="flex" flexDirection="column" alignItems="center" mt={4}>
        {/* <Box width={isDesktop ? "75%" : "100%"}> */}

        {/* Create button that navigates to /blog/create */}

        <Link
          onClick={(e) => {
            e.preventDefault()
            navigate(`/blog/create`)
          }}
          underline="always"
          color={'text.secondary'}
          href={`/blog/create`}
        >
          Create
        </Link>

        <Box mb={2} sx={{ width: '100%' }} justifyContent="center">
          <Pagination
            count={Math.ceil(count / 50)}
            page={page}
            onChange={handleChangePage}
            color="primary"
            boundaryCount={2}
            renderItem={(item) => <PaginationItem component={routerLink} to={`/blogs?page=${item.page}`} {...item} />}
            siblingCount={2}
            showFirstButton
            showLastButton
            shape="rounded"
            variant="outlined"
            size="large"
            sx={{
              '& ul': { display: 'flex', justifyContent: 'center' },
              '& ul li button': { fontSize: 18 },
            }}
          />

          <Grid container>
            {/* Now actually list the blogs. Show relevant details for each */}
            {blogs.map((blog) => {
              const href = `/blog/${blog.uuid}`
              return (
                <Grid item xs={12} md={6} lg={4}>
                  <Link
                    href={href}
                    sx={{ maxWidth: '100%' }}
                    onClick={(e) => {
                      e.preventDefault()
                      navigate(href)
                    }}
                  >
                    <Card sx={{ m: 2, p: 2, bgcolor: 'background.paper', minWidth: 300 }}>
                      <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ width: 50, height: 50, mr: 2 }} alt={blog.author.name} src={blog.author.avatar} />
                        <Typography variant="h6" sx={{ mr: 1 }}>
                          {blog.title}
                        </Typography>
                      </CardContent>
                      <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {blog.author.name}
                        </Typography>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {blog.timestamp}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Link>
                </Grid>
              )
            })}
          </Grid>
          <Pagination
            count={Math.ceil(count / 50)}
            page={page}
            onChange={handleChangePage}
            color="primary"
            boundaryCount={2}
            renderItem={(item) => <PaginationItem component={routerLink} to={`/blogs?page=${item.page}`} {...item} />}
            siblingCount={2}
            showFirstButton
            showLastButton
            shape="rounded"
            variant="outlined"
            size="large"
            sx={{
              '& ul': { display: 'flex', justifyContent: 'center' },
              '& ul li button': { fontSize: 18 },
            }}
          />
        </Box>
      </Box>
    </Box>
  )
}

export default ServersPage
