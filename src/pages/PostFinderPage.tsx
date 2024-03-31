import { useContext, useEffect, useState } from 'react'
import {
  Container,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Input,
  Alert,
  AlertColor,
  Snackbar,
  FormControlLabel,
  Checkbox,
  SelectChangeEvent,
  Typography,
  Stack,
  Link,
  useMediaQuery,
  Theme,
  Toolbar,
  Tooltip,
  Pagination,
} from '@mui/material'
import { useFetchAllThreads } from '../utils/hooks/useFetchAllThreads'
import { adminCreateThread, findPostByThreadAndComment, findPostByThreadAndNumber, findPostByThreadAndRawCount } from '../utils/api'
import { PostType, ThreadType } from '../utils/types'
import Count from '../components/Count'
import CountMobile from '../components/CountMobile'
import { addCounterToCache, cachedCounters, fakePost, fakeThread } from '../utils/helpers'
import { UserContext } from '../utils/contexts/UserContext'
import { useLocation, useNavigate } from 'react-router-dom'
import { UuidPage } from './UuidPage'

export const PostFinderPage = () => {
  const { user, counter } = useContext(UserContext)
  const { allThreads, allThreadsLoading } = useFetchAllThreads()
  const [selectedThread, setSelectedThread] = useState<ThreadType>()
  const [loadedThreads, setLoadedThreads] = useState<ThreadType[]>([])

  const [rawCount, setRawCount] = useState('') // "123" in main, "ZZ" in letters
  const [countNumber, setCountNumber] = useState<number | null>(null) // "123" in main, "676" in letters
  const [comment, setComment] = useState<string>()
  const [name, setName] = useState('all')
  const [uuid, setUuid] = useState('all')
  const [loadedPosts, setLoadedPosts] = useState<PostType[]>([])
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('error')
  const navigate = useNavigate()
  const [buttonDisable, setButtonDisable] = useState<boolean>(false)

  const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'))

  const location = useLocation()
  useEffect(() => {
    document.title = `Post Finder | Counting!`
    return () => {
      document.title = 'Counting!'
    }
  }, [location.pathname])

  useEffect(() => {
    if (!selectedThread) return
    setUuid(selectedThread.uuid)
    setName(selectedThread.name)
  }, [selectedThread])

  const [page, setPage] = useState(1)
  const handlePageChange = (event, value) => {
    setPage(value)
  }

  useEffect(() => {
    setLoadedPosts([])
  }, [uuid])

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return
    }
    setSnackbarOpen(false)
  }

  // const findPost = async () => {
  //   if(name) {
  //     try {
  //         if(countNumber !== null && countNumber > 0) {
  //           setButtonDisable(true);
  //             const res = await findPostByThreadAndNumber(uuid, countNumber.toString())
  //             .then(({ data }) => {
  //               for (const counter of data.counters) {
  //                 addCounterToCache(counter);
  //               }
  //               setLoadedPosts(data.posts);
  //               setButtonDisable(false);
  //             })
  //             .catch((err) => {
  //               console.log(err);
  //               setButtonDisable(false);
  //             })
  //         } else if(rawCount.length > 0) {
  //           setButtonDisable(true);
  //             const res = await findPostByThreadAndRawCount(uuid, rawCount).then(({ data }) => {
  //               for (const counter of data.counters) {
  //                 addCounterToCache(counter);
  //               }
  //               setLoadedPosts(data.posts);
  //               // console.log(data);
  //               setButtonDisable(false);
  //             })
  //             .catch((err) => {
  //               console.log(err);
  //               setButtonDisable(false);
  //             })
  //         }
  //     }
  //     catch(err) {
  //       setSnackbarSeverity('error');
  //       setSnackbarOpen(true)
  //       setSnackbarMessage('Error: Post not found, or server rejected your request.')
  //       setButtonDisable(false);
  //     }
  //   }
  // };

  const findCountNumber = async () => {
    if (countNumber !== undefined) {
      try {
        if (countNumber !== null && countNumber > 0) {
          setButtonDisable(true)
          const res = await findPostByThreadAndNumber(countNumber.toString(), selectedThread ? selectedThread.uuid : undefined)
            .then(({ data }) => {
              for (const counter of data.counters) {
                addCounterToCache(counter)
              }
              setLoadedPosts(data.posts)
              setButtonDisable(false)
              setLoadedThreads(data.threads)
            })
            .catch((err) => {
              console.log(err)
              setButtonDisable(false)
            })
        }
      } catch (err) {
        setSnackbarSeverity('error')
        setSnackbarOpen(true)
        setSnackbarMessage('Error: Post not found, or server rejected your request.')
        setButtonDisable(false)
      }
    }
  }

  const findRawCount = async () => {
    if (rawCount) {
      try {
        if (rawCount.length > 0) {
          setButtonDisable(true)
          const res = await findPostByThreadAndRawCount(rawCount, selectedThread ? selectedThread.uuid : undefined)
            .then(({ data }) => {
              for (const counter of data.counters) {
                addCounterToCache(counter)
              }
              setLoadedPosts(data.posts)
              setLoadedThreads(data.threads)
              // console.log(data);
              setButtonDisable(false)
            })
            .catch((err) => {
              console.log(err)
              setButtonDisable(false)
            })
        }
      } catch (err) {
        setSnackbarSeverity('error')
        setSnackbarOpen(true)
        setSnackbarMessage('Error: Post not found, or server rejected your request.')
        setButtonDisable(false)
      }
    }
  }

  const findComment = async () => {
    if (comment) {
      try {
        if (comment.length > 0) {
          setButtonDisable(true)
          const res = await findPostByThreadAndComment(comment, selectedThread ? selectedThread.uuid : undefined)
            .then(({ data }) => {
              for (const counter of data.counters) {
                addCounterToCache(counter)
              }
              setLoadedPosts(data.posts)
              setLoadedThreads(data.threads)
              // console.log(data);
              setButtonDisable(false)
            })
            .catch((err) => {
              console.log(err)
              setButtonDisable(false)
            })
        }
      } catch (err) {
        setSnackbarSeverity('error')
        setSnackbarOpen(true)
        setSnackbarMessage('Error: Post not found, or server rejected your request.')
        setButtonDisable(false)
      }
    }
  }

  const handleThreadSelection = (event: SelectChangeEvent<string>) => {
    const selectedThread = allThreads.find((thread) => thread.uuid === event.target.value)
    setSelectedThread(selectedThread)
  }

  if (counter && !allThreadsLoading && allThreads) {
    return (
      <>
        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleClose}>
          <Alert severity={snackbarSeverity} onClose={handleClose}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
        <Container maxWidth="xl" sx={{ bgcolor: 'primary.light', flexGrow: 1, p: 2 }}>
          <FormControl variant="standard" sx={{}}></FormControl>
          {uuid.length >= 0 && (
            <>
              <Box sx={{ bgcolor: 'background.paper', color: 'text.primary', p: 3 }}>
                <Select value={selectedThread ? selectedThread.uuid : 'all'} onChange={handleThreadSelection} sx={{ mr: 2 }}>
                  <MenuItem key={'all'} value={'all'}>
                    All Threads
                  </MenuItem>
                  {allThreads.map((thread) => (
                    <MenuItem key={thread.uuid} value={thread.uuid}>
                      {thread.title}
                    </MenuItem>
                  ))}
                </Select>
                <FormControl variant="standard" sx={{}}>
                  <Tooltip
                    title="Finds the nth count in a thread. In letters, 26th count would return Z, for example."
                    placement="top"
                  >
                    <InputLabel htmlFor="countNumber" shrink>
                      Count Number
                    </InputLabel>
                  </Tooltip>
                  <Input
                    onInput={(e) =>
                      setCountNumber(
                        isNaN(parseInt((e.target as HTMLInputElement).value)) ? null : parseInt((e.target as HTMLInputElement).value),
                      )
                    }
                    value={countNumber}
                    id="countNumber"
                    type="number"
                    // disabled={rawCount.length > 0}
                  />
                </FormControl>
                <Button variant="contained" disabled={buttonDisable} onClick={findCountNumber}>
                  Submit
                </Button>
                <FormControl variant="standard" sx={{ mr: 2 }}>
                  <Tooltip
                    title="Finds the raw count in a thread. In letters, you can search for ZZ here, for example."
                    placement="top"
                  >
                    <InputLabel htmlFor="rawCount" shrink>
                      Raw Count
                    </InputLabel>
                  </Tooltip>
                  <Input
                    onInput={(e) => setRawCount((e.target as HTMLInputElement).value)}
                    value={rawCount}
                    id="rawCount"
                    // disabled={countNumber !== null && countNumber > 0}
                  />
                </FormControl>
                <Button variant="contained" disabled={buttonDisable} onClick={findRawCount}>
                  Submit
                </Button>
                {/* <FormControl variant="standard" sx={{mr: 2}} >
              <Tooltip title="Finds post where the comment contains the following." placement='top'>
                <InputLabel htmlFor="comment" shrink>
                    Comment Contains...
                </InputLabel>
                </Tooltip>
                <Input
                  onInput={e => setComment((e.target as HTMLInputElement).value)}
                  value={comment}
                  id="cmment"
                  // disabled={countNumber !== null && countNumber > 0}
                />
              </FormControl>
                <Button variant='contained' disabled={buttonDisable} onClick={findComment}>Submit</Button> */}
              </Box>
              {loadedPosts && Array.isArray(loadedPosts) && (
                <Box sx={{ bgcolor: 'background.paper', display: 'flex', justifyContent: 'center', flexGrow: 1, p: 2 }}>
                  {isDesktop ? (
                    <>
                      <Stack direction="column" alignItems="center" sx={{ width: '50%' }}>
                        <Box sx={{ width: '100%', justifyContent: 'center', margin: { xs: 'auto', lg: 'initial' } }}>
                          <Pagination count={Math.ceil(loadedPosts.length / 100)} page={page} onChange={handlePageChange} />
                          {loadedPosts.slice(page * 100 - 100, page * 100).map((count, countIndex) => {
                            const associatedThread =
                              (loadedThreads &&
                                loadedThreads.length > 0 &&
                                loadedThreads.filter((thread) => thread.uuid === count.thread)[0]) ||
                              fakeThread()
                            return (
                              <>
                                <Typography sx={{ mb: 2 }} variant="h6" color={'text.secondary'}>
                                  <Link
                                    onClick={(e) => {
                                      e.preventDefault()
                                      navigate(`/thread/${associatedThread.name}`)
                                    }}
                                    underline="always"
                                    color={'text.secondary'}
                                    href={`/thread/${associatedThread.name}`}
                                  >
                                    {associatedThread.title}
                                  </Link>
                                </Typography>
                                <Typography sx={{ mb: 2 }} variant="h6" color={'text.secondary'}>
                                  <Link
                                    onClick={(e) => {
                                      e.preventDefault()
                                      navigate(`/thread/${associatedThread}?context=${count.uuid}`)
                                    }}
                                    underline="always"
                                    color={'text.secondary'}
                                    href={`/thread/${associatedThread.name}?context=${count.uuid}`}
                                  >
                                    Context
                                  </Link>
                                </Typography>
                                <Count
                                  key={count.uuid}
                                  post={count}
                                  thread={associatedThread}
                                  renderedCounter={cachedCounters[count.authorUUID]}
                                  maxWidth={'32px'}
                                  maxHeight={'32px'}
                                />
                              </>
                            )
                          })}
                          <Pagination count={Math.ceil(loadedPosts.length / 100)} page={page} onChange={handlePageChange} />
                        </Box>
                      </Stack>
                    </>
                  ) : (
                    <>
                      <Stack direction="column" alignItems="center" sx={{ width: '100%' }}>
                        <Box sx={{ width: '100%', justifyContent: 'center', margin: { xs: 'auto', lg: 'initial' } }}>
                          <Pagination count={Math.ceil(loadedPosts.length / 100)} page={page} onChange={handlePageChange} />
                          {loadedPosts.slice(page * 100 - 100, page * 100).map((count, countIndex) => {
                            const associatedThread =
                              (loadedThreads &&
                                loadedThreads.length > 0 &&
                                loadedThreads.filter((thread) => thread.uuid === count.thread)[0]) ||
                              fakeThread()
                            return (
                              <>
                                <Typography sx={{ mb: 2 }} variant="h6" color={'text.secondary'}>
                                  <Link
                                    onClick={(e) => {
                                      e.preventDefault()
                                      navigate(`/thread/${associatedThread.name}`)
                                    }}
                                    underline="always"
                                    color={'text.secondary'}
                                    href={`/thread/${associatedThread.name}`}
                                  >
                                    {associatedThread.title}
                                  </Link>
                                </Typography>
                                <Typography sx={{ mb: 2 }} variant="h6" color={'text.secondary'}>
                                  <Link
                                    onClick={(e) => {
                                      e.preventDefault()
                                      navigate(`/thread/${associatedThread}?context=${count.uuid}`)
                                    }}
                                    underline="always"
                                    color={'text.secondary'}
                                    href={`/thread/${associatedThread.name}?context=${count.uuid}`}
                                  >
                                    Context
                                  </Link>
                                </Typography>
                                <CountMobile
                                  key={count.uuid}
                                  post={count}
                                  thread={associatedThread}
                                  renderedCounter={cachedCounters[count.authorUUID]}
                                  maxWidth={'32px'}
                                  maxHeight={'32px'}
                                />
                              </>
                            )
                          })}
                          <Pagination count={Math.ceil(loadedPosts.length / 100)} page={page} onChange={handlePageChange} />
                        </Box>
                      </Stack>
                    </>
                  )}
                </Box>
              )}
            </>
          )}
          <UuidPage />
        </Container>
      </>
    )
  } else {
    return <div>Page Not Found</div>
  }
}
