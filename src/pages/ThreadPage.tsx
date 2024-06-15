import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { UserContext } from '../utils/contexts/UserContext'
import React, { Fragment, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  AlertColor,
  alpha,
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  Input,
  InputBase,
  InputLabel,
  Link,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Skeleton,
  Snackbar,
  Tab,
  Theme,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { Loading } from '../components/Loading'
import { addCounterToCache, cachedCounters } from '../utils/helpers'
import { useFetchRecentCounts } from '../utils/hooks/useFetchRecentCounts'
import { useFetchThread } from '../utils/hooks/useFetchThread'
import { SocketContext } from '../utils/contexts/SocketContext'
import { Category, Counter, PostType, ThreadType, User } from '../utils/types'
import { useIsMounted } from '../utils/hooks/useIsMounted'
import CountList from '../components/CountList'
import queryString from 'query-string'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import { useFetchRecentChats } from '../utils/hooks/useFetchRecentChats'
import remarkGfm from 'remark-gfm'
import ReactMarkdown from 'react-markdown'
import {
  findPostByThreadAndNumber,
  findPostByThreadAndRawCount,
  loadNewerCounts,
  modToggleSilentThreadLock,
  modToggleThreadLock,
} from '../utils/api'
import { DailyHOCTable } from '../components/DailyHOCTable'
import { SplitsTable } from '../components/SplitsTable'
import { useFavicon } from '../utils/hooks/useFavicon'
import InfoIcon from '@mui/icons-material/Info'
import moment from 'moment-timezone'
import { DailyRobTable } from '../components/DailyRobTable'
import { ThreadsContext } from '../utils/contexts/ThreadsContext'
import TagIcon from '@mui/icons-material/Tag'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import dingSfx from '../utils/sounds/ding.mp3'
import useSound from 'use-sound'
import { LinearProgressWithLabel } from '../utils/styles'
import { useThread } from '../utils/contexts/ThreadContext'

import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'

import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import { isEqual } from 'lodash'

let imsorryfortheglobalpull = 'DISABLED'
export const ThreadPage = memo(({ chats = false }: { chats?: boolean }) => {
  const location = useLocation()
  const params = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { context } = queryString.parse(window.location.search)
  const thread_name: string = params.thread_name || 'main'
  const { threadName, setThreadName, setFullThread } = useThread()
  const thread_ref = useRef(thread_name)
  useEffect(() => {
    thread_ref.current = thread_name
    if (setThreadName) {
      setThreadName(thread_name)
    }
    return () => {
      if (setThreadName) {
        setThreadName(undefined)
      }
      setLoadedOldest(false);
      setLoadedNewest(true);
      setLoadedOldestChats(false);
      setLoadedNewestChats(true);
    }
  }, [thread_name, setThreadName])
  const navigate = useNavigate()
  const setFaviconCount = useFavicon()

  const theme = useTheme()

  const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'))

  const socket = useContext(SocketContext)
  const [socketStatus, setSocketStatus] = useState('CONNECTING...')
  const [socketViewers, setSocketViewers] = useState(1)
  const [threadStreak, setThreadStreak] = useState<number | undefined>(undefined)

  const { user, counter, loading, challenges, setChallenges, miscSettings, setMiscSettings } = useContext(UserContext)
  const { allThreads, allThreadsLoading, setAllThreadsLoading } = useContext(ThreadsContext)
  const { thread, threadLoading, setThread } = useFetchThread(thread_name)
  const {
    recentCounts,
    recentCountsLoading,
    setRecentCounts,
    loadedOldest,
    setLoadedOldest,
    loadedNewest,
    setLoadedNewest,
    recentCountsRef,
  } = useFetchRecentCounts(thread_name, context, socketStatus, thread_ref)
  const {
    recentChats,
    recentChatsLoading,
    setRecentChats,
    loadedOldestChats,
    setLoadedOldestChats,
    loadedNewestChats,
    setLoadedNewestChats,
    recentChatsRef,
  } = useFetchRecentChats(thread_name, context, socketStatus, thread_ref)
  // const { recentCounts, recentCountsLoading, setRecentCounts, loadedOldest, setLoadedOldest, loadedNewest, setLoadedNewest, recentCountsRef } = useFetchRecentCounts(thread_name, context, socketStatus, thread_ref);
  // const { recentChats, recentChatsLoading, setRecentChats, loadedOldestChats, setLoadedOldestChats, loadedNewestChats, setLoadedNewestChats, recentChatsRef } = useFetchRecentChats(thread_name, context, socketStatus, thread_ref);
  //     const debouncedFetchThread = debounce(useFetchThread, 500); // Adjust the debounce delay (500ms in this example)
  // const debouncedFetchRecentCounts = debounce(useFetchRecentCounts, 500);
  // const debouncedFetchRecentChats = debounce(useFetchRecentChats, 500);

  // // Usage examples:
  // const { thread, threadLoading, setThread } = debouncedFetchThread(thread_name);
  // const { recentCounts, recentCountsLoading, setRecentCounts, loadedOldest, setLoadedOldest, loadedNewest, setLoadedNewest, recentCountsRef } = debouncedFetchRecentCounts(thread_name, context, socketStatus, thread_ref);
  // const { recentChats, recentChatsLoading, setRecentChats, loadedOldestChats, setLoadedOldestChats, loadedNewestChats, setLoadedNewestChats, recentChatsRef } = debouncedFetchRecentChats(thread_name, context, socketStatus, thread_ref);
  const loadedNewestRef = useRef(false)
  const loadedNewestChatRef = useRef(false)
  const [cachedCounts, setCachedCounts] = useState<PostType[]>([])
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [lastCount, setLastCount] = useState<{ lastCount: PostType; lastCounter: Counter }>()
  const [dailyHOC, setDailyHOC] = useState<{ [authorUUID: string]: { counter: Counter; counts: number } }>()
  const [dailyRobs, setDailyRobs] = useState<
    { counterUUID: string; id: number; moneyRobbed: string; postUUID: string; timestamp: string }[] | undefined
  >()
  const [newRecentPostLoaded, setNewRecentPostLoaded] = useState('')
  const [splits, setSplits] = useState<any>([])
  const [playDing, { stop: stopDing, sound: dingSound }] = useSound(dingSfx, { interrupt: false })

  const [mobilePickerOpen, setMobilePickerOpen] = useState(false)
  const [desktopPickerOpen, setDesktopPickerOpen] = useState(true)
  const [replayActive, setReplayActive] = useState(false)
  const [countNumber1, setCountNumber1] = useState<number | null>(null) // "123" in main, "676" in letters
  const [countNumber2, setCountNumber2] = useState<number | null>(null) // "123" in main, "676" in letters
  const [rawCount1, setRawCount1] = useState('') // "123" in main, "ZZ" in letters
  const [rawCount2, setRawCount2] = useState('') // "123" in main, "ZZ" in letters
  const [currentCount, setCurrentCount] = useState<PostType>()
  const [timerStr, setTimerStr] = useState('')
  const [activeTimer, setActiveTimer] = useState<ReturnType<typeof setInterval>>()
  const [clearCounts, setClearCounts] = useState(false)
  const [autoplay, setAutoplay] = useState(0)
  const findPost = async (countNumber, rawCount) => {
    let value
    try {
      if (thread === undefined) throw new Error()
      if (countNumber !== null && countNumber > 0) {
        const res = await findPostByThreadAndNumber(thread.uuid, countNumber.toString())
          .then(({ data }) => {
            for (const counter of data.counters) {
              addCounterToCache(counter)
            }
            value = data.posts[0]
          })
          .catch((err) => {
            console.log(err)
          })
      } else if (rawCount.length > 0) {
        const res = await findPostByThreadAndRawCount(thread.uuid, rawCount)
          .then(({ data }) => {
            for (const counter of data.counters) {
              addCounterToCache(counter)
            }
            value = data.posts[0]
          })
          .catch((err) => {
            console.log(err)
          })
      }
    } catch (err) {
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
      setSnackbarMessage('Error: Post not found, or server rejected your request.')
    }
    return value
  }
  const startReplay = async () => {
    let start
    let end
    try {
      start = countNumber1 !== null ? await findPostByThreadAndNumber(countNumber1.toString(), thread?.uuid) : await findPostByThreadAndRawCount(rawCount1, thread?.uuid)
      end = countNumber2 !== null ? await findPostByThreadAndNumber(countNumber2.toString(), thread?.uuid) : await findPostByThreadAndRawCount(rawCount2, thread?.uuid)
    } catch (err) {
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
      setSnackbarMessage('Error: Post not found, or server rejected your request.')
      return
    }
    start = start.data.posts[0]
    end = end.data.posts[0]
    if (start === undefined || end === undefined) return
    if (parseFloat(end.timestamp) <= parseFloat(start.timestamp)) return
    socket.emit('leave_threads')
    socket.off('connection_error')
    socket.off('post')
    socket.off('lastCount')
    socket.off('watcher_count')
    socket.off('deleteComment')
    socket.off('thread_update')
    socket.off('split')
    setSocketStatus('DISCONNECTED')
    let data = await loadNewerCounts(thread?.name, start.uuid, 1000, false)
    let loaded_counts = data.data.counts
    for (const counter of data.data.counters) {
      addCounterToCache(counter)
    }
    timer(parseFloat(start.timestamp), parseFloat(end.timestamp))
    const t_start = performance.now()
    setReplayActive(true)
    setClearCounts(true)
    imsorryfortheglobalpull = 'ENABLED'
    const wait = function (ms) {
      return new Promise((resolve) => {
        setTimeout(resolve, ms)
      })
    }
    setCurrentCount(start)
    let broken = false
    while (!broken) {
      const res = loadNewerCounts(thread?.name, loaded_counts[loaded_counts.length - 1].uuid, 1000, false).then((data2) => {
        data = data2
        for (const counter of data.data.counters) {
          addCounterToCache(counter)
        }
      })
      for (let i = 0; i < loaded_counts.length; i++) {
        let delay = parseFloat(loaded_counts[i].timestamp) - parseFloat(start.timestamp)
        if (imsorryfortheglobalpull !== 'ENABLED') {
          broken = true
          break
        }
        while (t_start + delay > performance.now()) {
          await wait(20)
          if (imsorryfortheglobalpull !== 'ENABLED') {
            broken = true
            break
          }
        }
        setCurrentCount(loaded_counts[i])
        if (loaded_counts[i].uuid === end.uuid) {
          broken = true
          break
        }
      }
      loaded_counts = data.data.counts
    }
  }
  const clearReplay = () => {
    if (activeTimer !== undefined) clearInterval(activeTimer)
    setTimerStr('')
    setReplayActive(false)
    imsorryfortheglobalpull = 'DISABLED'
    setSocketStatus('LIVE')
  }
  useEffect(() => {
    clearReplay()
  }, [threadName])

  async function timer(start, end) {
    // Update the count down every 1 second
    const diff = end - start
    end = performance.now() + diff
    const timer_active = setInterval(function () {
      // Find the distance between now and the count down date
      const distance = end - performance.now()
      // Time calculations for days, hours, minutes and seconds
      const days = Math.floor(distance / (1000 * 60 * 60 * 24))
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)
      // Display the result in the element with id="demo"
      setTimerStr('Time remaining: ' + days + 'd ' + hours + 'h ' + minutes + 'm ' + seconds + 's ')
      // If the count down is finished, write some text
      if (distance < 0) {
        clearInterval(timer_active)
        setTimerStr('Replay complete')
      }
    }, 501)
    setActiveTimer(timer_active)
  }
  useEffect(() => {
    if (replayActive && currentCount !== undefined) {
      cache_counts(currentCount)
      if (loadedNewestRef.current) {
        if (user && user.pref_load_from_bottom) {
          recentCountsRef.current = (() => {
            const newCounts = [...recentCountsRef.current, currentCount]
            if (isScrolledToNewest.current !== undefined && isScrolledToNewest.current) {
              if (newCounts.length > 50) {
                return newCounts.slice(newCounts.length - 50)
              } else {
                return newCounts
              }
            } else {
              return newCounts
            }
          })()
          if (currentCount.hasComment) {
            recentChatsRef.current = [...recentChatsRef.current, currentCount]

            if (chatsIsScrolledToNewest.current !== undefined && chatsIsScrolledToNewest.current) {
              if (recentChatsRef.current.length > 50) {
                recentChatsRef.current = recentChatsRef.current.slice(recentChatsRef.current.length - 50)
              }
            }
          }
        } else {
          recentCountsRef.current = [currentCount, ...recentCountsRef.current]

          if (isScrolledToNewest.current !== undefined && isScrolledToNewest.current) {
            if (recentCountsRef.current.length > 50) {
              recentCountsRef.current = recentCountsRef.current.slice(0, 50)
            }
          }
          if (currentCount.hasComment) {
            recentChatsRef.current = [currentCount, ...recentChatsRef.current]

            if (chatsIsScrolledToNewest.current !== undefined && chatsIsScrolledToNewest.current) {
              if (recentChatsRef.current.length > 50) {
                recentChatsRef.current = recentChatsRef.current.slice(0, 50)
              }
            }
          }
        }
      }
      setLatencyStateTest(`${currentCount.uuid}_${Date.now()}`)
      if (currentCount.hasComment && tabValueRef.current === 'tab_2') {
        setNewChatsLoadedState(currentCount.uuid)
      }
      if (currentCount.isValidCount) {
        setLastCount({ lastCount: currentCount, lastCounter: cachedCounters[currentCount.authorUUID] })
      }
      if (currentCount.stricken && user && user.pref_sound_on_stricken !== 'Disabled') {
        if (user.pref_sound_on_stricken === 'Only My Counts' && currentCount.authorUUID === user.uuid) {
          playDing()
        } else if (user.pref_sound_on_stricken === 'All Stricken') {
          playDing()
        }
      }
      if (document.hidden) {
        setFaviconCount()
      }
    }
  }, [replayActive, thread_name, dingSound, currentCount])

  useEffect(() => {
    if (autoplay === 0 && !loading) {
      const num1 = searchParams.get('startCountNumber')
      const num2 = searchParams.get('endCountNumber')
      const raw1 = searchParams.get('startCountRaw')
      const raw2 = searchParams.get('endCountRaw')
      setAutoplay(2)
      if (num1 !== null && num2 !== null) {
        setCountNumber1(isNaN(parseInt(num1)) ? null : parseInt(num1))
        setCountNumber2(isNaN(parseInt(num2)) ? null : parseInt(num2))
        setAutoplay(1)
      } else if (raw1 !== null && raw2 !== null) {
        setRawCount1(raw1)
        setRawCount2(raw2)
        setAutoplay(1)
      }
    } else if (autoplay === 1 && thread !== undefined) {
      setAutoplay(2)
      startReplay()
    }
  }, [searchParams, loading, countNumber1, countNumber2, rawCount1, rawCount2, autoplay, thread])

  // const recentCountsRef = useRef<PostType[]>([]);
  // const recentChatsRef = useRef<PostType[]>([]);
  // const [recentCountsLoading, setRecentCountsLoading] = useState<boolean>(true);
  // const [recentChatsLoading, setRecentChatsLoading] = useState<boolean>(true);
  // const [loadedOldest, setLoadedOldest] = useState(false);
  // const [loadedNewest, setLoadedNewest] = useState(true);
  // const [loadedOldestChats, setLoadedOldestChats] = useState(false);
  // const [loadedNewestChats, setLoadedNewestChats] = useState(true);

  useEffect(() => {
    if (!loading && user) {
      if (user.pref_hide_thread_picker) {
        setDesktopPickerOpen(false)
      }
    }
  }, [loading])

  const handleMobileDrawerToggle = () => {
    setMobilePickerOpen(!mobilePickerOpen)
  }
  const handleDesktopDrawerToggle = () => {
    setDesktopPickerOpen(!desktopPickerOpen)
  }

  useEffect(() => {
    if (thread) {
      document.title = `${thread.title} | Counting!`
    } else if (threadLoading) {
      document.title = `Loading...`
    } else if (!thread && !threadLoading) {
      document.title = `No thread found`
    }
    return () => {
      document.title = 'Counting!'
    }
  }, [thread])

  const [bank, setBank] = useState(-1)
  const [robOpen, setRobOpen] = useState(false)
  const [deleteCategoryOpen, setDeleteCategoryOpen] = useState(false)
  const [deletedCategory, setDeletedCategory] = useState<Category>();

  const deleteCategoryConfirm = () => {
    if(!deletedCategory) {return;}
    deleteCategory(deletedCategory.name);
    setDeleteCategoryOpen(false)
  }

  const robConfirm = () => {
    socket.emit(`rob`)
    setRobOpen(false)
  }

  const robCancel = () => {
    setRobOpen(false)
  }

  const openRobConfirm = () => {
    setRobOpen(true)
  }

  const ConfirmDialog = ({ open, text, handleCancel, handleConfirm, title = "Are you sure?" }) => {
    return (
      <Dialog open={open} onClose={handleCancel}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{text}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirm} color="primary" variant="contained" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  const isMounted = useIsMounted()

  const userAsRef = useRef<User>()

  const latency = useRef({})
  const latencyCheck = useRef('')
  const myUUIDCheck = useRef('')
  const [deleteComments, setDeleteComments] = useState('')
  const [latencyStateTest, setLatencyStateTest] = useState('')
  const [newChatsLoadedState, setNewChatsLoadedState] = useState('')

  const refScroll = useRef<any>([])
  const postScroll = useRef<any>([])
  useEffect(() => {
    const scrollCheck = (event) => {
      const { key: test } = event
      if (refScroll.current.at(-1) !== test) {
        refScroll.current = [...refScroll.current, test].slice(-5)
      }
      postScroll.current = [...postScroll.current, [test, Date.now()]].slice(-20);
    }
    document.addEventListener('keydown', scrollCheck)
    return () => {
      document.removeEventListener('keydown', scrollCheck)
    }
  }, [])

  // Render latency test 2. This one uses requestAnimationFrame and is the most accurate as possible!

  const renderLatencyEnabled = useRef(false)
  if (window.location.href.indexOf('latency') > -1) {
    renderLatencyEnabled.current = true
  }
  const startRenderRef = useRef(0)
  const endRenderRef = useRef(0)
  const postTextRef = useRef('')
  const [renderTime, setRenderTime] = useState<number>()

  const generateChallenges = () => {
    if (!challenges || challenges.length < 7) {
      console.log('Generating challenges')
      socket.emit('generate_challenge')
    }
  }

  useEffect(() => {
    if (renderLatencyEnabled.current) {
      requestAnimationFrame(() => {
        endRenderRef.current = Date.now()
        console.log(
          `Post took ${endRenderRef.current - startRenderRef.current} ms to render (${startRenderRef.current} to ${endRenderRef.current}): ${postTextRef.current} `,
        )
        setRenderTime(endRenderRef.current - startRenderRef.current)
      })
    }
  }, [latencyStateTest])

  const [loadedOldCount, setLoadedOldCount] = useState(2)
  const [loadedNewCount, setLoadedNewCount] = useState(2)
  const isScrolledToNewest = useRef(false)
  const isScrolledToTheTop = useRef(false)
  const isScrolledToTheBottom = useRef(false)

  const [loadedOldChat, setLoadedOldChat] = useState(2)
  const [loadedNewChat, setLoadedNewChat] = useState(2)
  const chatsIsScrolledToTheBottom = useRef(false)
  const chatsIsScrolledToTheTop = useRef(false)
  const chatsIsScrolledToNewest = useRef(true) // different default state

  // Needed to calculate server latency.
  const handleLatencyChange = (value: number, post_hash: string) => {
    latency.current[post_hash] = value
  }
  const handleLatencyCheckChange = (value) => {
    latencyCheck.current = value
  }

  const [tabValue, setTabValue] = useState('tab_0')
  const tabValueRef = useRef('tab_1')

  useEffect(() => {
    if (isDesktop && tabValue === 'tab_0') {
      setTabValue('tab_1')
      tabValueRef.current = 'tab_1'
    }
  }, [isDesktop])

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue)
    tabValueRef.current = newValue
    if (newValue === 'tab_2') {
      setNewChatsLoadedState(Date.now().toString())
    }
  }

  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('error')
  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return
    }
    setSnackbarOpen(false)
  }

  //update recent

  //turn myUUIDCheck into uuid on counter load
  useEffect(() => {
    if (counter) {
      myUUIDCheck.current = counter.uuid
    }
  }, [counter])

  const cache_counts = (count) => {
    if (user && user.pref_load_from_bottom) {
      if (loadedNewestRef.current == false) {
        setCachedCounts((prevCounts) => {
          const newCounts = [...prevCounts, count]
          return newCounts
        })
      }
    } else {
      if (loadedNewestRef.current == false) {
        setCachedCounts((prevCounts) => {
          const newCounts = [count, ...prevCounts]
          return newCounts
        })
      }
    }
  }
  

  // useEffect(() => {
  //   if(recentCountsLoading == false) {
  //     loadedNewestRef.current = loadedNewest;
  //   }
  // }, [recentCountsLoading])

  const [miscSettingsChanged, setMiscSettingsChanged] = useState<number>(Date.now())
  const [lastClick, setLastClick] = useState<number>(0);

  // useEffect(() => {
  //   const handleClick = (event) => {
  //     if(!miscSettingsChanged) return;
  //     console.log('Clicked');
  //     if(setAllThreadsLoading) {
  //       console.log("Toggling");
  //       setAllThreadsLoading(true);
  //       setAllThreadsLoading(false);
  //     }
  //     console.log("Removing event listener");
  //     document.removeEventListener('click', handleClick);      
  //   };
  //   // setLastClick(Date.now());


  //   // Add event listener for click on the entire document
  //   if(miscSettingsChanged && miscSettingsChanged > 0 && Date.now() > miscSettingsChanged) {
  //     document.addEventListener('click', handleClick);
  //   } else {
  //     console.log("Nope not valid");
  //   }

  //   // Clean up event listener on component unmount
  //   return () => {
  //     document.removeEventListener('click', handleClick);
  //   };
  // }, [miscSettingsChanged]);

  //Handle Socket data
  useEffect(() => {
    if (isMounted.current && loading == false) {
      socket.on('connect', () => {
        console.log('Connected to socket!')
        setSocketStatus('LIVE')
      })
      setSocketStatus('LIVE')

      socket.on('disconnect', () => {
        console.log('Disconnected from socket')
        setSocketStatus('DISCONNECTED')
        return
      })

      socket.on('reconnect', () => {
        console.log('Reconnected to socket.')
        setSocketStatus('LIVE')
      })
      socket.on('connect_error', (err) => {
        console.log(`connect_error due to ${err.message}`)
        setSocketStatus('DISCONNECTED')
      })
    }
  }, [loading, thread_name])

  useEffect(() => {
    if (isMounted.current && loading == false && socketStatus === 'LIVE' && dingSound !== null) {
      socket.emit('watch', thread_name)

      socket.on(`watcher_count`, function (data) {
        setSocketViewers(data)
      })
      // socket.on(`recentPosts`, function(data) {
      //   const {last50Posts, last50Chats, lastCount, loadedOldest, loadedNewest, loadedOldestChats, loadedNewestChats} = data;
      //   recentCountsRef.current = last50Posts;
      //   recentChatsRef.current = last50Chats;
      //   setLastCount(lastCount);
      //   setRecentCountsLoading(false);
      //   setRecentChatsLoading(false);
      //   setLoadedOldest(loadedOldest)
      //   setLoadedNewest(loadedNewest)
      //   setLoadedOldestChats(loadedOldestChats)
      //   setLoadedNewestChats(loadedNewestChats)
      //   // if(user && !loading && user.pref_load_from_bottom) {
      //   //   setRecentCounts(data.recentCounts.reverse())
      //   //   recentCountsRef.current = data.last50Posts;
      //   // } else {
      //   //   setRecentCounts(data.recentCounts)
      //   // }
      // });
      socket.on(`lastCount`, function (data) {
        setLastCount(data)
        addCounterToCache(data.lastCounter)
      })
      socket.on(`dailyHOC`, function (data) {
        setDailyHOC(data)
      })
      socket.on(`dailyRobs`, function (data) {
        const { robs, counters } = data
        setDailyRobs(robs)
        if (counters) {
          for (const counter of counters) {
            addCounterToCache(counter)
          }
        }
      })
      socket.on(`bank`, function (data) {
        setBank(data)
      })
      socket.on(`miscSettingsLastUpdated`, function (data) {
        if(setMiscSettings) {
          setMiscSettings((prevMiscSettings) => {
            return {
              ...prevMiscSettings,
              lastUpdated: data,
            }
            })
        }
      });
      socket.on(`updateMiscSettings`, function (data) {
        // I promised I tried this but it's so bad for performance. I know people are going to lose stuff by having
        // different tabs open etc. I will try to handle this server-side lol

        // if(setMiscSettings !== undefined && hasChangedRecently.current !== undefined && Date.now() - hasChangedRecently.current > 7000) {
        //   setMiscSettings(data)
        //   setMiscSettingsChanged(Date.now());
        // }
      })
      // socket.on(`deleteComment`, function(data) {
      //   setRecentCounts(prevCounts => {
      //     return prevCounts.map(post => {
      //       if (post.uuid === data.uuid) {
      //         return data;
      //       }
      //       return post;
      //     });
      //   });
      // });
      socket.on(`addCounterToCache`, function (data) {
        addCounterToCache(data)
        setLatencyStateTest(`${data.uuid}_${Date.now()}`)
      })
      socket.on(`postBans`, function (data) {
        if (data.counters) {
          for (const counter of data.counters) {
            addCounterToCache(counter)
          }
        }
        setLatencyStateTest(`${data.uuid}_${Date.now()}`)
      })
      socket.on(`post`, async function (data: { post: PostType; counter: Counter; thread_streak?: number }) {
        if (data.thread_streak !== undefined) {
          setThreadStreak(data.thread_streak)
        }
        if (renderLatencyEnabled.current) {
          startRenderRef.current = Date.now() // Needed for render latency test 2
          postTextRef.current = data.post.rawText
        }
        if (
          data.post.post_hash &&
          latency.current &&
          data.post.post_hash in latency.current &&
          data.post.authorUUID == myUUIDCheck.current
        ) {
          data.post.latency = Date.now() - latency.current[data.post.post_hash]
          delete latency.current[data.post.post_hash]
        }
        addCounterToCache(data.counter)
        cache_counts(data.post)
        if (loadedNewestRef.current) {
          if (user && user.pref_load_from_bottom) {
            recentCountsRef.current = (() => {
              const newCounts = [...recentCountsRef.current, data.post]
              if (isScrolledToNewest.current !== undefined && isScrolledToNewest.current) {
                if (newCounts.length > 50) {
                  return newCounts.slice(newCounts.length - 50)
                } else {
                  return newCounts
                }
              } else {
                return newCounts
              }
            })()
            if (data.post.hasComment) {
              recentChatsRef.current = [...recentChatsRef.current, data.post]

              if (chatsIsScrolledToNewest.current !== undefined && chatsIsScrolledToNewest.current) {
                if (recentChatsRef.current.length > 50) {
                  recentChatsRef.current = recentChatsRef.current.slice(recentChatsRef.current.length - 50)
                }
              }
            }
          } else {
            recentCountsRef.current = [data.post, ...recentCountsRef.current]

            if (isScrolledToNewest.current !== undefined && isScrolledToNewest.current) {
              if (recentCountsRef.current.length > 50) {
                recentCountsRef.current = recentCountsRef.current.slice(0, 50)
              }
            }
            if (data.post.hasComment) {
              recentChatsRef.current = [data.post, ...recentChatsRef.current]

              if (chatsIsScrolledToNewest.current !== undefined && chatsIsScrolledToNewest.current) {
                if (recentChatsRef.current.length > 50) {
                  recentChatsRef.current = recentChatsRef.current.slice(0, 50)
                }
              }
            }
          }
        }
        // setRenderLatencyCheck(true); //renderLatency test 1 requirement.
        // setNewRecentPostLoaded(data.post.uuid); // Only do this here.
        setLatencyStateTest(`${data.post.uuid}_${Date.now()}`)
        if (data.post.hasComment && tabValueRef.current === 'tab_2') {
          setNewChatsLoadedState(data.post.uuid)
        }
        if (data.post.isValidCount) {
          setLastCount({ lastCount: data.post, lastCounter: data.counter })
          setDailyHOC((prevDailyHOC) => {
            const updatedHOC = {
              ...prevDailyHOC,
              [data.counter.uuid]: {
                counter: data.counter,
                counts: prevDailyHOC !== undefined ? (prevDailyHOC[data.counter.uuid]?.counts || 0) + 1 : 1,
              },
            }
            return updatedHOC
          })
          if (thread_name === 'main') {
            setBank((prevBank) => {
              return prevBank + 1
            })
          }
        }
        if (data.post.stricken && user && user.pref_sound_on_stricken !== 'Disabled') {
          if (user.pref_sound_on_stricken === 'Only My Counts' && data.post.authorUUID === user.uuid) {
            playDing()
          } else if (user.pref_sound_on_stricken === 'All Stricken') {
            playDing()
          }
        }
        if (document.hidden) {
          setFaviconCount()
        }
      })

      socket.on(`loadOldCounts`, function (data) {
        for (const counter of data.counters) {
          addCounterToCache(counter)
        }
        recentCountsRef.current =
          user && user.pref_load_from_bottom
            ? [
                ...data.recentCounts
                  .filter((count) => !recentCountsRef.current.some((prevCount) => prevCount.uuid === count.uuid))
                  .reverse(),
                ...recentCountsRef.current,
              ]
            : [
                ...recentCountsRef.current,
                ...data.recentCounts.filter((count) => !recentCountsRef.current.some((prevCount) => prevCount.uuid === count.uuid)),
              ]
        if (data.recentCounts && data.recentCounts[0]) {
          setLoadedOldCount(Date.now())
        }
        if (data.isNewest && isScrolledToNewest.current) {
          setLoadedNewest(true)
          loadedNewestRef.current = true
        }
        if (data.isOldest) {
          setLoadedOldest(true)
        }
      })

      socket.on(`loadNewCounts`, function (data) {
        for (const counter of data.counters) {
          addCounterToCache(counter)
        }
        recentCountsRef.current =
          user && user.pref_load_from_bottom
            ? [
                ...recentCountsRef.current,
                ...data.recentCounts.filter((count) => !recentCountsRef.current.some((prevCount) => prevCount.uuid === count.uuid)),
              ]
            : [
                ...data.recentCounts
                  .filter((count) => !recentCountsRef.current.some((prevCount) => prevCount.uuid === count.uuid))
                  .reverse(),
                ...recentCountsRef.current,
              ]
        if (data.recentCounts && data.recentCounts[0]) {
          setLoadedNewCount(Date.now())
        }
        if (data.isNewest && isScrolledToNewest.current) {
          setLoadedNewest(true)
          loadedNewestRef.current = true
        }
        if (data.isOldest) {
          setLoadedOldest(true)
        }
      })

      socket.on(`loadOldChats`, function (data) {
        for (const counter of data.counters) {
          addCounterToCache(counter)
        }
        if (data.isNewest) {
          setLoadedNewestChats(true)
        }
        if (data.isOldest) {
          setLoadedOldestChats(true)
        }
        recentChatsRef.current =
          user && user.pref_load_from_bottom
            ? [
                ...data.recentCounts
                  .filter((count) => !recentChatsRef.current.some((prevCount) => prevCount.uuid === count.uuid))
                  .reverse(),
                ...recentChatsRef.current,
              ]
            : [
                ...recentChatsRef.current,
                ...data.recentCounts.filter((count) => !recentChatsRef.current.some((prevCount) => prevCount.uuid === count.uuid)),
              ]
        if (data.recentCounts && data.recentCounts[0]) {
          setLoadedOldChat(Date.now()) // lol
          setNewChatsLoadedState(data.recentCounts[0].uuid)
        }
      })

      socket.on(`loadNewChats`, function (data) {
        for (const counter of data.counters) {
          addCounterToCache(counter)
        }
        if (data.isNewest) {
          setLoadedNewestChats(true)
        }
        if (data.isOldest) {
          setLoadedOldestChats(true)
        }
        recentChatsRef.current =
          user && user.pref_load_from_bottom
            ? [
                ...recentChatsRef.current,
                ...data.recentCounts
                  .filter((count) => !recentChatsRef.current.some((prevCount) => prevCount.uuid === count.uuid))
                  .reverse(),
              ]
            : [
                ...data.recentCounts.filter((count) => !recentChatsRef.current.some((prevCount) => prevCount.uuid === count.uuid)),
                ...recentChatsRef.current,
              ]
        if (data.recentCounts && data.recentCounts[0]) {
          setLoadedNewChat(Date.now()) // lol
          setNewChatsLoadedState(data.recentCounts[0].uuid)
        }
      })

      socket.on(`updateReaction`, function (data) {
        recentCountsRef.current = recentCountsRef.current.map((chat) => {
          if (chat.uuid === data.post_uuid) {
            return {
              ...chat,
              reactions: data.reactions,
            }
          }
          return chat
        })
        recentChatsRef.current = recentChatsRef.current.map((chat) => {
          if (chat.uuid === data.post_uuid) {
            return {
              ...chat,
              reactions: data.reactions,
            }
          }
          return chat
        })
        setLatencyStateTest(`${data.post_uuid}-reax-${Date.now()}`)
        setNewChatsLoadedState(`${data.post_uuid}-reax-${Date.now()}`)
      })

      socket.on(`thread_update`, function (data) {
        setThread(data.threadInfo)
        setFullThread && setFullThread(data.threadInfo)
      })

      socket.on('split', function (data) {
        const { number, split } = data
        setSplits((prevSplits) => {
          const newSplits = [{ number, split }, ...prevSplits]
          if (newSplits.length > 55) {
            return newSplits.slice(0, 55)
          } else {
            return newSplits
          }
        })
      })

      return () => {
        console.log('Disabling socket functions until you reconnect / join another thread.')
        socket.emit('leave_threads')
        socket.off('connection_error')
        socket.off('post')
        socket.off('lastCount')
        socket.off('watcher_count')
        socket.off('deleteComment')
        socket.off('thread_update')
        socket.off('split')
        socket.off('updateMiscSettings')
        setSocketStatus('DISCONNECTED')
      }
    }
  }, [loading, thread_name, socketStatus, dingSound])

  const deleteComment = useCallback(
    (data) => {
      recentCountsRef.current = recentCountsRef.current.map((chat) => {
        if (chat.uuid === data.uuid) {
          return data
        }
        return chat
      })
      recentChatsRef.current = recentChatsRef.current.map((chat) => {
        if (chat.uuid === data.uuid) {
          return data
        }
        return chat
      })
      setLatencyStateTest(`${data.uuid}-delete`)
      setNewChatsLoadedState(`${data.uuid}-delete`)
    },
    [setRecentCounts],
  )

  useEffect(() => {
    socket.on(`deleteComment`, deleteComment)
    return () => {
      socket.off(`deleteComment`, deleteComment)
    }
  }, [deleteComment])

  const handleSubmit = (text: string, refScroll: any, postScroll: any, post_hash: string) => {
    const submitText = text
    if (thread_name && counter) {
      socket.emit('post', {
        thread_name: thread_name,
        text: submitText,
        post_hash: post_hash,
        refScroll: refScroll,
        postScroll: postScroll,
        latency: renderLatencyEnabled.current,
      })
    }
  }

  const lockThread = async () => {
    if (thread) {
      try {
        const res = await modToggleThreadLock(thread.uuid)
        if (res.status == 201) {
          setSnackbarSeverity('success')
          setSnackbarOpen(true)
          setSnackbarMessage('Thread lock toggled')
        }
      } catch (err) {
        setSnackbarSeverity('error')
        setSnackbarOpen(true)
        setSnackbarMessage('Error: Submission rejected. If this comes as a surprise, please reach out to discord mods via DM!')
      }
    } else {
      console.log('Thread not loaded yet.')
    }
  }

  const silentLock = async () => {
    if (thread) {
      try {
        const res = await modToggleSilentThreadLock(thread.uuid)
        if (res.status == 201) {
          setSnackbarSeverity('success')
          setSnackbarOpen(true)
          setSnackbarMessage('Thread lock (silent) toggled')
        }
      } catch (err) {
        setSnackbarSeverity('error')
        setSnackbarOpen(true)
        setSnackbarMessage('Error: Submission rejected. If this comes as a surprise, please reach out to discord mods via DM!')
      }
    } else {
      console.log('Thread not loaded yet.')
    }
  }

  const snackbarMemo = useMemo(() => {
    return (
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleClose}>
        <Alert severity={snackbarSeverity} onClose={handleClose}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    )
  }, [snackbarSeverity, snackbarMessage, snackbarOpen])

  const socketMemo = useMemo(() => {
    let color: 'success' | 'info' | 'warning' | 'error' | 'default' | 'primary' | 'secondary' | undefined = 'info'

    if (socketStatus == 'DISCONNECTED') {
      color = 'error'
    } else if (socketStatus == 'LIVE') {
      color = 'success'
    }
    return (
      <Box sx={{ p: 0.5, display: 'flex', alignItems: 'center' }}>
        <Chip
          size="small"
          sx={{ backgroundColor: 'transparent', border: '1px solid', borderColor: `${color}.light` }}
          label={socketStatus == 'LIVE' ? `${socketViewers} viewer${socketViewers === 1 ? `` : `s`}` : socketStatus}
        />
        {/* <Box sx={{bgcolor: `${color}.light`, width: 8, height: 8, borderRadius: '50%'}}></Box> */}
        {/* &nbsp;<Typography color={"text.primary"} variant="body1">{socketStatus}</Typography> &nbsp; <Typography color={"text.secondary"} variant="body2">{socketViewers} {socketViewers === 1 ? 'viewer' : 'viewers'}</Typography> */}
      </Box>
    )
  }, [socketStatus, socketViewers])

  const headerMemo = useMemo(() => {
    if (thread) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexGrow: 0,
            p: 0.5,
            bgcolor: alpha(theme.palette.background.paper, 0.9),
            // background: `linear-gradient(to bottom, ${thread.color1}, ${thread.color2})`
          }}
        >
          <Typography sx={{ p: 0.5 }} variant="h6" color="text.primary">
            {thread.title}
          </Typography>
          {socketMemo}
        </Box>
      )
    } else {
      return (
        <Box sx={{ display: 'flex', bgcolor: alpha(theme.palette.background.paper, 0.9), flexGrow: 1, p: 0.5 }}>
          <Typography sx={{ p: 0.5 }} variant="h4" color="text.primary">
            Loading...
          </Typography>
        </Box>
      )
    }
  }, [thread, socketStatus, socketViewers, theme, lastCount, mobilePickerOpen, desktopPickerOpen, isDesktop])

  function groupThreadsByCategory(threads) {
    const groupedThreads = {}

    threads.forEach((thread) => {
      const category = thread.category || 'Uncategorized' // If category is undefined or blank, consider it as "Uncategorized"

      if (!groupedThreads[category]) {
        groupedThreads[category] = []
      }

      groupedThreads[category].push(thread)
    })

    return groupedThreads
  }

  // Array of objects
  const [categorizedThreads, setCategorizedThreads] = useState<Category[]>([]);
  const [lastCategoryChange, setLastCategoryChange] = useState<number>()

  const defaultOtherThreadOverrides = ['test', 'test2', 'random_hour', 'tug_of_war_avoid_0', 'countdown', 'yoco', 'russian_roulette', '1inx', 'slow_tslc', 'wait_x', 'random_minute', 'no_counting', 'username', 'incremental_odds']
  const defaultFavorites = allThreads.filter((thread) => ['main', 'double_counting', 'bars', 'slow', 'no_mistakes'].includes(thread.name))
  const defaultTraditional = allThreads.filter((thread) => !defaultOtherThreadOverrides.includes(thread.name) && ![...defaultFavorites].includes(thread) && !thread.allowDoublePosts && !thread.resetOnMistakes)
  const defaultDouble = allThreads.filter((thread) => !defaultOtherThreadOverrides.includes(thread.name) && ![...defaultFavorites, ...defaultTraditional].includes(thread) && thread.allowDoublePosts && !thread.resetOnMistakes)
  const defaultNoMistakes = allThreads.filter((thread) => !defaultOtherThreadOverrides.includes(thread.name) && ![...defaultFavorites, ...defaultTraditional, ...defaultDouble].includes(thread) && thread.resetOnMistakes)
  const defaultOther = allThreads.filter((thread) => ![...defaultFavorites, ...defaultTraditional, ...defaultDouble, ...defaultNoMistakes].includes(thread))
  const defaultCategories = [
    { name: 'Favorites', threads: defaultFavorites, expanded: true },
    { name: 'Traditional', threads: defaultTraditional, expanded: true },
    { name: 'Double Counting', threads: defaultDouble, expanded: true },
    { name: 'No Mistakes', threads: defaultNoMistakes, expanded: true },
    { name: 'Other', threads: defaultOther, expanded: true },
  ]



  useEffect(() => {
    if(!loading && !allThreadsLoading && allThreads) {
    if(!miscSettings || miscSettings && !miscSettings.categories || miscSettings && miscSettings.categories.length === 0) {
      setCategorizedThreads(defaultCategories);
    } else {
      // Step 1: Map threads to categories
      const categorizedThreads = miscSettings.categories.map((category) => {
        const fullThreads = category.threadUUIDs.map(threadUUID => {
          return allThreads.find(thread => thread.uuid === threadUUID);
        }).filter(thread => thread !== undefined) as ThreadType[];

        return {
          ...category,
          threads: fullThreads,
        };
      });

      // Step 2: Gather threads not in any category
      const categoryNames = categorizedThreads.reduce((names: string[], category) => {
        return names.concat(category.name);
      }, []);
      if(!categoryNames.includes("Other")) {
        categorizedThreads.push({
          name: "Other",
          threads: [],
          threadUUIDs: [],
          expanded: true,
        });
      }
      const threadsInCategories = categorizedThreads.reduce((threads: ThreadType[], category) => {
        return threads.concat(category.threads);
      }, []);

      const threadsNotInCategories = allThreads.filter(thread => !threadsInCategories.includes(thread));

      setCategorizedThreads(
        categorizedThreads.map((category) => {
          if (category.name === 'Other') {
            return {
              ...category,
              threads: [
                ...category.threads,
                ...threadsNotInCategories,
              ],
            };
          }

          return category;
        })
      )
    }
    
  }
  }, [allThreads, allThreadsLoading, loading]);

  const handleCategoryClick = (category) => {
    setCategorizedThreads((prevCategorizedThreads) => {
      return prevCategorizedThreads.map((categoryObj) => {
        if (categoryObj.name === category) {
          return { ...categoryObj, expanded: !categoryObj.expanded }
        }
        return categoryObj
      })
    })
    setLastCategoryChange(Date.now());
  }

  useEffect(() => {
    function navigateThread(direction) {

      let currentCategoryIndex = -1;
      let currentThreadIndex = -1;

      // Find the current thread's category and index
      categorizedThreads.forEach((category, categoryIndex) => {
        const threadIndex = category.threads.findIndex(thread => thread.name === thread_name);
        if (threadIndex !== -1) {
          currentCategoryIndex = categoryIndex;
          currentThreadIndex = threadIndex;
        }
      });

      if (currentCategoryIndex === -1 || currentThreadIndex === -1) {
        return;
      }

      var newThread: ThreadType|undefined = undefined;

      if (direction === 'up') {
        if (currentThreadIndex > 0) {
          newThread = categorizedThreads[currentCategoryIndex].threads[currentThreadIndex - 1];
        } else if (currentCategoryIndex > 0) {
          const previousCategory = categorizedThreads[currentCategoryIndex - 1];
          if (previousCategory.threads.length > 0) {
            newThread = previousCategory.threads[previousCategory.threads.length - 1];
          }
        }
      } else if (direction === 'down') {
        if (currentThreadIndex < categorizedThreads[currentCategoryIndex].threads.length - 1) {
          newThread = categorizedThreads[currentCategoryIndex].threads[currentThreadIndex + 1];
        } else if (currentCategoryIndex < categorizedThreads.length - 1) {
          const nextCategory = categorizedThreads[currentCategoryIndex + 1];
          if (nextCategory.threads.length > 0) {
            newThread = nextCategory.threads[0];
          }
        }
      }

      if (newThread) {
        navigate(`/thread/${newThread.name}`);
      }
    }

    const handleKeyDown = (event) => {
      if (event.altKey) {
        switch (event.key) {
          case 'ArrowUp':
            navigateThread('up');
            break;
          case 'ArrowDown':
            navigateThread('down');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      // Remove the event listener when the component unmounts
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [thread_name, allThreadsLoading, categorizedThreads]);

  const onDragEnd = (result) => {
    const { source, destination, type } = result;

    // Do nothing if the thread is dropped outside any droppable
    if (!destination) return;

    // Reordering categories
  if (type === 'CATEGORY') {
    const newCategorizedThreads = Array.from(categorizedThreads);
    const [movedCategory] = newCategorizedThreads.splice(source.index, 1);
    newCategorizedThreads.splice(destination.index, 0, movedCategory);

    if (JSON.stringify(categorizedThreads) !== JSON.stringify(newCategorizedThreads)) {
      setCategorizedThreads(newCategorizedThreads);
      setLastCategoryChange(Date.now());
    }
    return;
  }

    // Do nothing if the thread is dropped into the same place
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

  setCategorizedThreads((prevCategorizedThreads) => {
    const newCategorizedThreads = Array.from(prevCategorizedThreads);
    
    // Get the source and destination categories
    const sourceCategoryIndex = newCategorizedThreads.findIndex(cat => cat.name === source.droppableId);
    const destinationCategoryIndex = newCategorizedThreads.findIndex(cat => cat.name === destination.droppableId);
    
    const sourceCategory = newCategorizedThreads[sourceCategoryIndex];
    const destinationCategory = newCategorizedThreads[destinationCategoryIndex];
    
    // Get the threads from the source category
    const sourceThreads = Array.from(sourceCategory.threads);
    const [movedThread] = sourceThreads.splice(source.index, 1);
    
    if (sourceCategoryIndex === destinationCategoryIndex) {
      // Insert the thread at the new position in the same category
      sourceThreads.splice(destination.index, 0, movedThread);
      newCategorizedThreads[sourceCategoryIndex].threads = sourceThreads;
    } else {
      // Get the threads from the destination category
      const destinationThreads = Array.from(destinationCategory.threads);
      // Insert the thread at the new position in the different category
      destinationThreads.splice(destination.index, 0, movedThread);
      newCategorizedThreads[sourceCategoryIndex].threads = sourceThreads;
      newCategorizedThreads[destinationCategoryIndex].threads = destinationThreads;
    }    
    return newCategorizedThreads;
  });
  setLastCategoryChange(Date.now());
};

function deleteCategory(categoryName) {
  setCategorizedThreads((prevCategorizedThreads) => {
      // Remove the specified category
      const updatedCategories = prevCategorizedThreads.filter(cat => cat.name !== categoryName);

      // Find the threads to move
      const categoryToDelete = prevCategorizedThreads.find(cat => cat.name === categoryName);
      const threadsToMove = categoryToDelete ? categoryToDelete.threads : [];

      // Check if "Other" category exists
      let otherCategory = updatedCategories.find(cat => cat.name === "Other");

      if (!otherCategory) {
          // If "Other" category doesn't exist, create it
          otherCategory = {
              name: "Other",
              threads: [],
              expanded: true
          };
          updatedCategories.push(otherCategory);
      }

      // Append threads to the "Other" category
      otherCategory.threads = [...otherCategory.threads, ...threadsToMove];

      // Update the state
      const newCategorizedThreads = updatedCategories.map(cat =>
          cat.name === "Other" ? otherCategory : cat
      );
      return newCategorizedThreads;
  });
  setLastCategoryChange(Date.now());
}

const [newCategoryName, setNewCategoryName] = useState('');
const categoryNameRef = useRef<HTMLInputElement>(null)

  const handleCheckClick = () => {
    if(newCategoryName.length > 0) {
        // Clear the input after adding the category
        setCategorizedThreads((prevCategorizedThreads) => [...prevCategorizedThreads, { name: newCategoryName, threads: [], expanded: true }]);
        setLastCategoryChange(Date.now());
        setNewCategoryName('');
        if(categoryNameRef.current) {
          categoryNameRef.current.value = '';
        }
      } else {
        console.log('Please enter a category name.');
      }
  };

  const hasChangedRecently = useRef<number>(0);

  useEffect(() => {
    if(categorizedThreads && !loading && categorizedThreads.length > 0 && lastCategoryChange && lastCategoryChange > 100) {
      const mappedThreads = categorizedThreads.map(category => ({
        ...category,
        threads: undefined,
        threadUUIDs: category.threads.map(thread => thread.uuid),
      }));
      if(miscSettings && JSON.stringify(miscSettings.categories) === JSON.stringify(mappedThreads)) {
        return;
      }
      if(JSON.stringify(defaultCategories) === JSON.stringify(mappedThreads)) {
        return;
      }
      hasChangedRecently.current = Date.now();
      socket.emit(`updateCategories`, {update: mappedThreads, miscSettingsChanged: miscSettings ? miscSettings.lastUpdated : 0})
      setLastCategoryChange(undefined);
    }
  }, [categorizedThreads, loading, lastCategoryChange]);

  const newCategoryBox = (<Paper
    square={true}
    sx={{ p: '2px 4px', 
      display: { xs: 'none', lg: `flex` },
      alignItems: 'center', height: '50px' }}
  >
    <InputBase
      sx={{ ml: 1, flex: 1 }}
      inputRef={categoryNameRef}
      placeholder="New category..."
      inputProps={{ 'aria-label': 'new category', maxLength: 200 }}
      onChange={(e) => {setNewCategoryName(e.target.value);}}
    />
    {newCategoryName.length > 0 && (
      <IconButton type="button" onClick={handleCheckClick} sx={{ p: '10px' }} aria-label="search">
        <CheckIcon />
      </IconButton>
    )}
  </Paper>)

  const threadPickerMemo = useMemo(() => {
    if (allThreads && allThreads.length > 0) {
      const picker = (
        <Box
          sx={{
            minHeight: 500,
            height: { xs: '100vh', lg: `calc(100vh - 65px - 50px)` },
            width: 'auto',
            ...(!isDesktop && { width: 'min-content' }),
            flexGrow: 1,
            display: { xs: 'none', lg: `flex` },
            bgcolor: 'background.paper',
            color: 'text.primary',
            flexDirection: 'column',
            overflowY: 'scroll',
          }}
        >
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="categories" type="CATEGORY" direction="vertical">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {categorizedThreads.map((category, categoryIndex) => (
                      <Draggable key={category.name} draggableId={category.name} index={categoryIndex}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                            <Droppable droppableId={category.name} type="THREAD">
                              {(provided) => (
                                <div ref={provided.innerRef} {...provided.droppableProps}>
                                  <ListItemButton
                                    onClick={() => handleCategoryClick(category.name)}
                                    sx={{ py: 0 }}
                                  >
                                    <ListItemIcon sx={{ minWidth: 24, paddingRight: 1 }}>
                                      {category.expanded ? (
                                        <KeyboardArrowDownIcon />
                                      ) : (
                                        <KeyboardArrowRightIcon />
                                      )}
                                    </ListItemIcon>
                                    <ListItemText primary={category.name} sx={{overflowX: 'hidden'}} />
                                    {category.name !== "Other" && <ListItemIcon className='deleteCategoryIcon' sx={{ minWidth: 8 }} onClick={() => {setDeletedCategory(category); setDeleteCategoryOpen(true)}}>
                                        <ClearIcon fontSize='inherit' />
                                    </ListItemIcon>}
                                  </ListItemButton>
                                  <Collapse in={category.expanded}>
                                    <List>
                                      {category.threads.map((thread, index) => (
                                        <Draggable key={thread.uuid} draggableId={thread.uuid} index={index}>
                                          {(provided) => (
                                            <div
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              {...provided.dragHandleProps}
                                            >
                                              <Button
                                                key={thread.uuid}
                                                startIcon={<TagIcon />}
                                                sx={{
                                                  width: '100%',
                                                  py: isDesktop ? 0 : 0.5,
                                                  opacity: thread_name === thread.name ? 1 : 0.75,
                                                  textAlign: 'left',
                                                  border: '1px solid transparent',
                                                  '&:hover': {
                                                    opacity: 1,
                                                    border: '1px solid',
                                                    borderColor: theme.palette.primary.main,
                                                  },
                                                  bgcolor: thread_name === thread.name ? alpha(theme.palette.primary.main, 0.5) : 'background.paper',
                                                  color: thread_name === thread.name ? 'text.primary' : 'text.secondary',
                                                  justifyContent: 'flex-start',
                                                }}
                                                onClick={() => navigate(`/thread/${thread.name}`)}
                                              >
                                                {thread.threadOfTheDay && (
                                                  <LocalFireDepartmentIcon sx={{ color: 'orangered', verticalAlign: 'bottom' }} />
                                                )}
                                                {thread.title}
                                              </Button>
                                            </div>
                                          )}
                                        </Draggable>
                                      ))}
                                      {provided.placeholder}
                                    </List>
                                  </Collapse>
                                </div>
                              )}
                            </Droppable>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
        </Box>
      )
      return (
        <>
          <Drawer
            variant="temporary"
            open={mobilePickerOpen}
            anchor="left"
            onClose={handleMobileDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: 'block', lg: 'none' },
              boxSizing: 'border-box',
              // '& .MuiDrawer-paper': { boxSizing: 'border-box', display: "contents" },
            }}
          >
            {picker}
          </Drawer>
          <Drawer
            variant="persistent"
            sx={{
              display: { xs: 'none', lg: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', display: 'contents' },
            }}
            open={desktopPickerOpen}
          >
            {picker}
          </Drawer>
        </>
        // </Box>
      )
    } else {
      return (
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            justifyContent: 'center',
            bgcolor: 'background.paper',
            minHeight: 500,
            height: 'calc(100vh - 65px)',
          }}
        >
          <Skeleton animation="wave" sx={{ width: '50%', justifyContent: 'center' }} />
        </Box>
      )
    }
  }, [allThreadsLoading, mobilePickerOpen, desktopPickerOpen, thread_name, isDesktop, allThreads, categorizedThreads])

  const robConfirmMemo = useMemo(() => {
    return <ConfirmDialog open={robOpen} text={`You may only rob once per day. Your ability to rob resets at midnight Eastern (US).`} handleCancel={() => robCancel()} handleConfirm={() => robConfirm()} />
  }, [robOpen])

  const deleteCategoryConfirmMemo = useMemo(() => {
    if(!deletedCategory) {return;}
    return <ConfirmDialog open={deleteCategoryOpen} text={`You are deleting the ${deletedCategory.name} category (${deletedCategory.threads.length} thread${deletedCategory.threads.length === 1 ? `` : `s`}). \n\nDeleting a category will move all its threads to the "Other" category.`} handleCancel={() => {setDeleteCategoryOpen(false); setDeletedCategory(undefined);}} handleConfirm={() => (deleteCategoryConfirm())} />
  }, [deletedCategory, deleteCategoryOpen])

  const countListMemo = useMemo(() => {
    return recentCountsLoading ? (
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          justifyContent: 'center',
          bgcolor: 'background.paper',
          minHeight: 500,
          height: 'calc(100vh - 65px)',
        }}
      >
        <Skeleton animation="wave" sx={{ width: '50%', justifyContent: 'center' }} />
      </Box>
    ) : (
      <CountList
        thread={thread}
        recentCountsLoading={recentCountsLoading}
        chatsOnly={false}
        setCachedCounts={setCachedCounts}
        loadedNewestRef={loadedNewestRef}
        refScroll={refScroll}
        postScroll={postScroll}
        newRecentPostLoaded={newRecentPostLoaded}
        loadedOldest={loadedOldest}
        cachedCounts={cachedCounts}
        loadedNewest={loadedNewest}
        setLoadedNewest={setLoadedNewest}
        loadedOldCount={loadedOldCount}
        loadedNewCount={loadedNewCount}
        isScrolledToTheBottom={isScrolledToTheBottom}
        isScrolledToTheTop={isScrolledToTheTop}
        thread_name={thread_name}
        isScrolledToNewest={isScrolledToNewest}
        cachedCounters={cachedCounters}
        isMounted={isMounted}
        context={context}
        blud={JSON.stringify(recentCountsRef.current)}
        recentCounts={recentCountsRef}
        handleLatencyCheckChange={handleLatencyCheckChange}
        handleLatencyChange={handleLatencyChange}
        handleSubmit={handleSubmit}
      ></CountList>
    )
  }, [
    cachedCounts,
    thread,
    thread_name,
    loadedNewestRef,
    loadedNewestRef.current,
    recentCountsLoading,
    latencyStateTest,
    loadedNewCount,
    loadedOldCount,
    deleteComments,
    loadedOldest,
    loadedNewest,
    isScrolledToNewest,
    loading,
  ])

  const chatsMemo = useMemo(() => {
    return recentChatsLoading ? (
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          justifyContent: 'center',
          bgcolor: 'background.paper',
          minHeight: 500,
          height: 'calc(100vh - 65px)',
        }}
      >
        <Skeleton animation="wave" sx={{ width: '50%', justifyContent: 'center' }} />
      </Box>
    ) : (
      <CountList
        thread={thread}
        isDesktop={isDesktop}
        chatsOnly={true}
        newRecentPostLoaded={undefined}
        loadedOldest={loadedOldestChats}
        loadedNewest={loadedNewestChats}
        setLoadedNewest={setLoadedNewestChats}
        loadedOldCount={loadedOldChat}
        loadedNewCount={loadedNewChat}
        isScrolledToTheBottom={chatsIsScrolledToTheBottom}
        isScrolledToTheTop={chatsIsScrolledToTheTop}
        thread_name={thread_name}
        isScrolledToNewest={chatsIsScrolledToNewest}
        cachedCounters={cachedCounters}
        isMounted={isMounted}
        context={context}
        blud={JSON.stringify(recentChatsRef.current)}
        recentCounts={recentChatsRef}
        handleLatencyCheckChange={undefined}
        handleLatencyChange={undefined}
        handleSubmit={undefined}
      ></CountList>
    )
  }, [
    recentChatsLoading,
    newChatsLoadedState,
    thread_name,
    loadedNewChat,
    loadedOldChat,
    deleteComments,
    loadedOldestChats,
    loadedNewestChats,
    chatsIsScrolledToNewest,
    loading,
  ])

  const sidebarMemo = useMemo(() => {
    if (clearCounts) {
      recentCountsRef.current = []
      recentChatsRef.current = []
      setClearCounts(false)
    }
    return (
      <TabContext value={tabValue}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <TabList onChange={handleTabChange} variant={'scrollable'} allowScrollButtonsMobile scrollButtons aria-label="Counting Tabs">
            {!isDesktop && <Tab label="Posts" value="tab_0" />}
            <Tab label="About" value="tab_1" />
            <Tab label="Chats" value="tab_2" />
            <Tab label="Splits" value="tab_3" />
            <Tab label="Stats" value="tab_4" />
            <Tab label="Replay" value="tab_5" />
          </TabList>
        </Box>
        <Box sx={{ flexGrow: 1, display: 'flex', bgcolor: 'background.paper', color: 'text.primary', overflowY: 'scroll' }}>
          {!isDesktop && (
            <TabPanel value="tab_0" sx={{ flexGrow: 1, p: 0 }}>
              {countListMemo}
            </TabPanel>
          )}
          <TabPanel value="tab_1" sx={{ flexGrow: 1, p: 4 }}>
            {thread && counter && thread.countBans && thread.countBans.includes(counter.uuid) && (
              <Box display="flex" alignItems="center" sx={{ p: 2, border: '1px solid', borderColor: 'warning.main' }}>
                <Box component={InfoIcon} sx={{ fontSize: 24, color: 'info.main', mr: 1 }} />
                <Typography variant="body1">
                  You can no longer count in this thread. You can still post, but any count attempts will be stricken.
                </Typography>
              </Box>
            )}
            {thread && context && (
              <Box display="flex" alignItems="center" sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'warning.main' }}>
                <Box component={InfoIcon} sx={{ fontSize: 24, color: 'info.main', mr: 1 }} />
                <Typography variant="body1">
                  You're viewing the context of an old post. For live updates, click <Link href={`/thread/${thread.name}`}>here</Link>.
                </Typography>
              </Box>
            )}
            {thread && thread.threadOfTheDay && (
              <>
                <Typography variant="h5" sx={{ mb: 1 }}>
                  <LocalFireDepartmentIcon sx={{ color: 'orangered', verticalAlign: 'middle', fontSize: '2rem' }} /> Thread of the Day
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                  Normal counts will be worth twice as much XP in this thread today. Counting will improve your odds in the daily
                  lottery for this thread. Good luck!
                </Typography>
              </>
            )}
            {/* {counter && <>
          <Typography variant="h5" sx={{mb: 1}}>Challenges</Typography>
          <Typography variant="body1" sx={{whiteSpace: 'pre-wrap', mb: 2}}>
            Daily challenges will be here soon, suggest daily challenges in #feature-request on Discord!
            <Typography variant='body2'>
                <Chip size='small' variant='filled' 
                 sx={{
                  backgroundColor: '#CD7F32', 
                  color: 'black',
                  mr: 1,
                }}
                 label='100XP' />Suggest a challenge</Typography>
              <LinearProgressWithLabel color='primary' progress={0} max={1} dontUseComplete={true} />
            <Typography variant='body2'>Daily Counts: Bronze</Typography>
            <LinearProgressWithLabel color='primary' progress={1} max={1} dontUseComplete={true} />
          </Typography>
          <Box sx={{mt: 2, mb: 2}}>
            <Spoiler title="Completed Challenges">
              <Typography variant='body2'>
                <Chip size='small' variant='filled' 
                 sx={{
                  backgroundColor: '#CD7F32', 
                  color: 'black',
                  mr: 1,
                }}
                 label='100XP' />Daily Participation</Typography>
              <LinearProgressWithLabel color='primary' progress={1} max={1} dontUseComplete={true} />
            </Spoiler>
          </Box>
          </>} */}
            {/* {user && counter && !counter.roles.includes("banned") && (!challenges || challenges.length <= 7) &&
          <Box onClick={() => generateChallenges()}><Lever /></Box>} */}
            <Typography variant="h5" sx={{ mb: 1 }}>
              About
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              <ReactMarkdown
                children={thread ? thread.description : 'Loading...'}
                components={{ p: 'span' }}
                remarkPlugins={[remarkGfm]}
              />
            </Typography>
            <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
              Rules
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              <ReactMarkdown children={thread ? thread.rules : 'Loading...'} components={{ p: 'span' }} remarkPlugins={[remarkGfm]} />
            </Typography>
            {counter && thread && counter.roles.includes('mod') && (
              <Button variant="contained" onClick={lockThread}>
                {thread.locked ? 'Unlock Thread' : 'Lock Thread'}
              </Button>
            )}
            {counter && thread && counter.roles.includes('mod') && (
              <Button variant="contained" onClick={silentLock}>
                Silent Lock Toggle
              </Button>
            )}
            {thread ? (
              <>
                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ fontSize: 9 }} variant="body2">
                    Auto validated: {thread.autoValidated.toString()}
                  </Typography>
                  <Typography sx={{ fontSize: 9 }} variant="body2">
                    Double counting: {thread.allowDoublePosts.toString()}
                  </Typography>
                  <Typography sx={{ fontSize: 9 }} variant="body2">
                    Reset on mistakes: {thread.resetOnMistakes.toString()}
                  </Typography>
                  <Typography sx={{ fontSize: 9 }} variant="body2">
                    Validation type: {thread.validationType}
                  </Typography>
                  <Typography sx={{ fontSize: 9 }} variant="body2">
                    First count: {thread.firstValidCount}
                  </Typography>
                  <Typography sx={{ fontSize: 9 }} variant="body2">
                    UUID: {thread.uuid}
                  </Typography>
                </Box>
              </>
            ) : (
              <>Loading...</>
            )}
            {/* <AudioRecorder />/ */}
          </TabPanel>
          <TabPanel value="tab_2" sx={{ flexGrow: 1, p: 0 }}>
            {/* <Typography variant='h4'>Chats</Typography> */}
            {/* <Box sx={{height: '70vh'}}> */}
            {chatsMemo}
            {/* </Box> */}
          </TabPanel>
          <TabPanel value="tab_3" sx={{ flexGrow: 1 }}>
            {lastCount && tabValueRef.current === 'tab_3' && (
              <>
                <Typography sx={{ p: 0.5 }} variant="body1" color="text.secondary">
                  Last count: {lastCount.lastCount.rawCount} by {lastCount.lastCounter.name}
                </Typography>
                Split{' '}
                {thread &&
                  lastCount.lastCount &&
                  lastCount.lastCount.validCountNumber !== undefined &&
                  thread.countsPerSplit !== undefined &&
                  thread.splitOffset !== undefined && (
                    <LinearProgressWithLabel
                      variant="determinate"
                      color="secondary"
                      title={`${lastCount.lastCount.validCountNumber % thread.countsPerSplit}`}
                      progress={(lastCount.lastCount.validCountNumber - thread.splitOffset) % thread.countsPerSplit}
                      max={thread.countsPerSplit}
                      sx={{ borderRadius: '10px', mb: 2 }}
                    />
                  )}
                Get{' '}
                {thread &&
                  lastCount.lastCount &&
                  lastCount.lastCount.validCountNumber !== undefined &&
                  thread.countsPerSplit !== undefined &&
                  thread.splitsPerGet !== undefined &&
                  thread.splitOffset !== undefined && (
                    <LinearProgressWithLabel
                      variant="determinate"
                      color="primary"
                      progress={
                        (lastCount.lastCount.validCountNumber - thread.splitOffset) % (thread.countsPerSplit * thread.splitsPerGet)
                      }
                      max={thread.countsPerSplit * thread.splitsPerGet}
                      value={(lastCount.lastCount.validCountNumber % (thread.countsPerSplit * thread.splitsPerGet)) / 10}
                      sx={{ borderRadius: '10px', mb: 2 }}
                    />
                  )}
                Streak{' '}
                {thread && lastCount.lastCount && threadStreak !== undefined && (
                  <LinearProgressWithLabel
                    dontUseComplete
                    variant="determinate"
                    color="primary"
                    progress={threadStreak}
                    max={thread.countsPerSplit * thread.splitsPerGet}
                    value={threadStreak}
                    sx={{ borderRadius: '10px', mb: 2 }}
                  />
                )}
                {/* {thread && lastCount.lastCount && lastCount.lastCount.rawCount && ['main', 'slow', 'bars', 'parity', 'yoco', 'roulette', 'tslc', 'randomhour', 'randomminute', 'waitx', '1inx', 'countdown', 'tugofwar'].includes(thread.validationType) && <LinearProgress variant="determinate" color='primary' title={`${parseInt(lastCount.lastCount.rawCount) % 1000}`} value={(parseInt(lastCount.lastCount.rawCount) % 1000) / 10} sx={{borderRadius: '10px'}} />} */}
              </>
            )}
            <SplitsTable splits={splits}></SplitsTable>
          </TabPanel>
          <TabPanel value="tab_4" sx={{ flexGrow: 1 }}>
            {lastCount && (
              <Typography sx={{ p: 0.5 }} variant="body1" color="text.secondary">
                {lastCount.lastCount.validCountNumber.toLocaleString()} total counts
              </Typography>
            )}
            {thread_name === 'main' && bank > -1 && (
              <>
                <Typography sx={{ p: 0.5 }} variant="body1" color="text.secondary">
                  Bank: ${bank}
                </Typography>
                {counter &&
                  !counter.roles.includes('banned') &&
                  (!counter.lastRob ||
                    (counter.lastRob &&
                      parseFloat(counter.lastRob) < moment().tz('America/New_York').startOf('day').unix() * 1000)) && (
                    <Button variant="contained" onClick={() => openRobConfirm()}>
                      Rob
                    </Button>
                  )}
              </>
            )}
            {dailyHOC && (
              <DailyHOCTable mini={false} dailyHOC={dailyHOC} name={'Daily Leaderboard'} countName={'Counts'}></DailyHOCTable>
            )}
            {dailyRobs && thread_name === 'main' && <DailyRobTable dailyRobs={dailyRobs}></DailyRobTable>}
          </TabPanel>
          <TabPanel value="tab_5" sx={{ flexGrow: 1 }}>
            <FormControl variant="standard" sx={{}}>
              <Tooltip title="Finds the nth count in a thread. In letters, 26th count would return Z, for example." placement="top">
                <InputLabel htmlFor="countNumber1" shrink>
                  Start Number (Count #)
                </InputLabel>
              </Tooltip>
              <Input
                onInput={(e) =>
                  setCountNumber1(
                    isNaN(parseInt((e.target as HTMLInputElement).value)) ? null : parseInt((e.target as HTMLInputElement).value),
                  )
                }
                value={countNumber1}
                id="countNumber1"
                type="number"
                disabled={rawCount1.length > 0}
              />
            </FormControl>
            <FormControl variant="standard" sx={{ mr: 2 }}>
              <Tooltip title="Finds the raw count in a thread. In letters, you can search for ZZ here, for example." placement="top">
                <InputLabel htmlFor="rawCount1" shrink>
                  Start Number (Raw Count)
                </InputLabel>
              </Tooltip>
              <Input
                onInput={(e) => setRawCount1((e.target as HTMLInputElement).value)}
                value={rawCount1}
                id="rawCount1"
                disabled={countNumber1 !== null && countNumber1 > 0}
              />
            </FormControl>
            <br></br>
            <FormControl variant="standard" sx={{}}>
              <Tooltip title="Finds the nth count in a thread. In letters, 26th count would return Z, for example." placement="top">
                <InputLabel htmlFor="countNumber2" shrink>
                  End Number (Count #)
                </InputLabel>
              </Tooltip>
              <Input
                onInput={(e) =>
                  setCountNumber2(
                    isNaN(parseInt((e.target as HTMLInputElement).value)) ? null : parseInt((e.target as HTMLInputElement).value),
                  )
                }
                value={countNumber2}
                id="countNumber2"
                type="number"
                disabled={rawCount2.length > 0}
              />
            </FormControl>
            <FormControl variant="standard" sx={{ mr: 2 }}>
              <Tooltip title="Finds the raw count in a thread. In letters, you can search for ZZ here, for example." placement="top">
                <InputLabel htmlFor="rawCount2" shrink>
                  End Number (Raw Count)
                </InputLabel>
              </Tooltip>
              <Input
                onInput={(e) => setRawCount2((e.target as HTMLInputElement).value)}
                value={rawCount2}
                id="rawCount2"
                disabled={countNumber2 !== null && countNumber2 > 0}
              />
            </FormControl>
            {(!replayActive && (
              <Button
                variant="contained"
                onClick={() => {
                  startReplay()
                }}
              >
                Replay{' '}
              </Button>
            )) ||
              (replayActive && (
                <Button
                  variant="contained"
                  onClick={() => {
                    clearReplay()
                  }}
                >
                  Cancel{' '}
                </Button>
              ))}
            {replayActive && <Typography>{timerStr}</Typography>}
          </TabPanel>
        </Box>
      </TabContext>
    )
  }, [
    tabValue,
    thread,
    isDesktop,
    newChatsLoadedState,
    lastCount,
    splits,
    dailyHOC,
    dailyRobs,
    bank,
    robOpen,
    deleteCategoryOpen,
    loading,
    recentChatsLoading,
    cachedCounts,
    thread,
    thread_name,
    loadedNewestRef,
    loadedNewestRef.current,
    recentCountsLoading,
    latencyStateTest,
    loadedNewCount,
    loadedOldCount,
    deleteComments,
    loadedOldest,
    loadedNewest,
    isScrolledToNewest,
    loading,
    replayActive,
    countNumber1,
    countNumber2,
    rawCount1,
    rawCount2,
    timerStr,
    activeTimer,
    clearCounts,
  ])

  if (!loading && !threadLoading && thread) {
    return (
      <>
        {/* Render latency test 2. This one uses requestAnimationFrame and is the most accurate as possible */}

        {renderLatencyEnabled.current && (
          <Box sx={{ position: 'fixed', background: '#999999', zIndex: 9, fontSize: 24, bottom: 0, right: 0 }}>{renderTime}ms</Box>
        )}

        {snackbarMemo}
        <Grid container>
          {user && user.pref_post_position === 'Right' ? (
            <>
              <Grid item xs={0} lg={2} sx={{ height: 'auto' }}>
                <Box sx={{  }}>{threadPickerMemo}</Box>
                {newCategoryBox}
              </Grid>
              <Grid item xs={12} lg={4}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 500,
                    height: 'calc(100vh - 65px)',
                    overflowY: 'auto',
                    bgcolor: 'background.paper',
                  }}
                >
                  {headerMemo}
                  {sidebarMemo}
                  {robConfirmMemo}
                  {deleteCategoryConfirmMemo}
                </Box>
              </Grid>
              {isDesktop && (
                <Grid item xs={12} lg={desktopPickerOpen ? 6 : 8} sx={{ height: 'auto' }}>
                  <Box sx={{ minHeight: 500, height: 'calc(100vh - 65px)' }}>{countListMemo}</Box>
                </Grid>
              )}
            </>
          ) : (
            <>
              <Grid item xs={0} lg={2} sx={{ display: !desktopPickerOpen && isDesktop ? 'none' : 'flex', flexDirection: 'column' }}>
                <Box sx={{  }}>{threadPickerMemo}</Box>
                {newCategoryBox}
              </Grid>
              {isDesktop && (
                <Grid item xs={12} lg={desktopPickerOpen ? 6 : 8} sx={{ height: 'auto' }}>
                  <Box sx={{ minHeight: 500, height: 'calc(100vh - 65px)' }}>{countListMemo}</Box>
                </Grid>
              )}
              <Grid item xs={12} lg={4}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 500,
                    height: 'calc(100vh - 65px)',
                    overflowY: 'auto',
                    bgcolor: 'background.paper',
                  }}
                >
                  {headerMemo}
                  {sidebarMemo}
                  {robConfirmMemo}
                  {deleteCategoryConfirmMemo}
                </Box>
              </Grid>
            </>
          )}
        </Grid>
      </>
    )
  } else {
    return <Loading />
  }
})
