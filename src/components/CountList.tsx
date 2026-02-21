import {
  Box,
  TextField,
  Button,
  Zoom,
  Fab,
  useTheme,
  useMediaQuery,
  Typography,
  IconButton,
  alpha,
  Theme,
  Tooltip,
  Input,
  InputLabel,
} from '@mui/material'
import { memo, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { cachedCounters, loginRedirect } from '../utils/helpers'
import Count from './count/Count'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
// import { Send as SendIcon, Keyboard as KeyboardIcon } from '@mui/icons-material';
import SendIcon from '@mui/icons-material/Send'
import KeyboardIcon from '@mui/icons-material/Keyboard'
import LoginIcon from '@mui/icons-material/Login'
import CountMobile from './count/CountMobile'
import AcUnitIcon from '@mui/icons-material/AcUnit'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import { HourBar } from './HourBar'
import { useNavigate } from 'react-router-dom'
import { UserContext } from '../utils/contexts/UserContext'
import { SocketContext } from '../utils/contexts/SocketContext'

const CountList = memo((props: any) => {
  const { user, counter, loading, preferences } = useContext(UserContext)
  const socket = useContext(SocketContext)
  const navigate = useNavigate()
  const boxRef = useRef<HTMLDivElement>(null)
  const theme = useTheme()
  const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg')) || props.isDesktop
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const contextRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const customInputRef = useRef<HTMLInputElement>(null)
  const noClearKeepInputRef = useRef<HTMLInputElement>(null)
  const noClearDeleteInputRef = useRef<HTMLInputElement>(null)
  const [firstLoad, setFirstLoad] = useState(true)
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(preferences && preferences.pref_load_from_bottom ? true : false)
  const [isScrolledToTop, setIsScrolledToTop] = useState(preferences && preferences.pref_load_from_bottom ? false : true)
  const [scrollThrottle, setScrollThrottle] = useState(false)
  const [isNewRecentCountAdded, setIsNewRecentCountAdded] = useState(false)
  const [keyboardType, setKeyboardType] = useState<
    'text' | 'search' | 'none' | 'email' | 'tel' | 'url' | 'numeric' | 'decimal' | undefined
  >('search')
  const [hasScrolledToContext, setHasScrolledToContext] = useState(false)
  const distanceFromBottom = useRef(0)
  const distanceFromTop = useRef(0)
  const submitRef = useRef<HTMLDivElement>(null)
  const endOfSubmitRef = useRef<HTMLDivElement>(null)
  const [forceRerenderSubmit, setForceRerenderSubmit] = useState('')
  const [submitColor, setSubmitColor] = useState<
    'primary' | 'default' | 'inherit' | 'error' | 'secondary' | 'info' | 'success' | 'warning' | undefined
  >('primary')
  const scrollDiagnostics = useRef(false)
  if (window.location.href.indexOf('scrollDiagnostics') > -1) {
    scrollDiagnostics.current = true
  }
  const throttleCount = useRef(0)
  const burstThrottleCount = useRef(0)
  const [gotNewerUUIDs, setGotNewerUUIDs] = useState<string[]>([])
  const [gotOlderUUIDs, setGotOlderUUIDs] = useState<string[]>([])
  const throttle = useRef(performance.now())
  const isThrottled = useRef(false)

  //Add Ctrl+Enter submit shortcut
  useEffect(() => {
    function handleKeyDown(event) {
      //Prevent Ctrl+0-9 from switching tabs (including numpad numbers)
      if (
        (event.ctrlKey || event.metaKey) &&
        ((event.keyCode >= 48 && event.keyCode <= 57) || (event.keyCode >= 96 && event.keyCode <= 105))
      ) {
        event.preventDefault()
      }
      if (inputRef.current && inputRef.current === document.activeElement && user && preferences && preferences.pref_submit_shortcut === 'Enter') {
        if (event.key === 'Enter' && !event.shiftKey && !event.altKey) {
          event.preventDefault()
          handlePosting()
        }
      } else if (user && preferences && preferences.pref_submit_shortcut === 'Off') {
        return
      } else if (inputRef.current && inputRef.current === document.activeElement) {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
          handlePosting()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [user, inputRef])

  //Scroll to bottom upon isDesktop change
  useEffect(() => {
    if (isScrolledToBottom && counter && user && preferences && preferences.pref_load_from_bottom) {
      scrollToBottomAuto()
      setTimeout(function () {
        scrollToBottomAuto()
      }, 100)
    }
  }, [isDesktop, counter])

  const changeScrolledToBottom = (isScrolled: boolean) => {
    setIsScrolledToBottom(isScrolled)
    if (props.isScrolledToNewest.current !== undefined && user && preferences && preferences.pref_load_from_bottom) {
      props.isScrolledToNewest.current = isScrolled
    }
    if (isScrolled) {
      setScrollThrottle(true)

      setTimeout(function () {
        setScrollThrottle(false)
      }, 1000)
    }
  }

  const changeScrolledToTop = (isScrolled: boolean) => {
    setIsScrolledToTop(isScrolled)
    if (props.isScrolledToNewest.current !== undefined && (!preferences || preferences.pref_load_from_bottom === false)) {
      props.isScrolledToNewest.current = isScrolled
    }
    if (isScrolled) {
      setScrollThrottle(true)

      setTimeout(function () {
        setScrollThrottle(false)
      }, 1000)
    }
  }

  const handleUnfreeze = () => {
    if (props.cachedCounts && props.cachedCounts.length > 0) {
      const seenUUIDs = new Set(
        (props.recentCounts.current || [])
          .map((count) => count?.uuid)
          .filter((uuid) => typeof uuid === 'string' && uuid.length > 0),
      )
      const uniqueCachedCounts = props.cachedCounts.filter((count) => {
        const uuid = count?.uuid
        if (typeof uuid !== 'string' || uuid.length === 0) return true
        if (seenUUIDs.has(uuid)) return false
        seenUUIDs.add(uuid)
        return true
      })

      if (user && preferences && preferences.pref_load_from_bottom) {
        !props.chatsOnly
          ? (props.recentCounts.current = (() => {
              const newCounts = [...props.recentCounts.current, ...uniqueCachedCounts]
              if (newCounts.length > 50) {
                return newCounts.slice(newCounts.length - 50)
              } else {
                return newCounts
              }
            })())
          : (props.recentCounts.current = (() => {
              const newChats = [...props.recentCounts.current, ...uniqueCachedCounts]
              if (newChats.length > 50) {
                return newChats.slice(newChats.length - 50)
              } else {
                return newChats
              }
            })())
      } else {
        !props.chatsOnly
          ? (props.recentCounts.current = (() => {
              const newCounts = [...uniqueCachedCounts, ...props.recentCounts.current]
              if (newCounts.length > 50) {
                return newCounts.slice(0, 50)
              } else {
                return newCounts
              }
            })())
          : (props.recentCounts.current = (() => {
              const newChats = [...uniqueCachedCounts, ...props.recentCounts.current]
              if (newChats.length > 50) {
                return newChats.slice(0, 50)
              } else {
                return newChats
              }
            })())
      }

      props.setCachedCounts([])
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'auto' })
      }
      props.loadedNewestRef.current = true
      props.setLoadedNewest(true)
      setForceRerenderSubmit(Date.now().toString())
    } else if (
      props.cachedCounts &&
      props.cachedCounts.length === 0 &&
      props.loadedNewestRef.current !== undefined &&
      props.loadedNewestRef.current === true
    ) {
      props.loadedNewestRef.current = false
      props.setLoadedNewest(false)
      setForceRerenderSubmit(Date.now().toString())
    } else if (
      props.cachedCounts &&
      props.cachedCounts.length === 0 &&
      props.loadedNewestRef.current !== undefined &&
      props.loadedNewestRef.current === false
    ) {
      props.loadedNewestRef.current = true
      props.setLoadedNewest(true)
      setForceRerenderSubmit(Date.now().toString())
    }
  }

  useEffect(() => {
    if (!loading && props.loadedNewestRef !== undefined) {
      props.loadedNewestRef.current = props.loadedNewest
      if (props.cachedCounts && props.cachedCounts.length > 0 && props.loadedNewestRef.current) {
        console.log("There should be a 'sticky' post or something messed up here.")
        console.log("So here's some infos.")
        console.log(props.cachedCounts)
        console.log(user)
        console.log([...props.recentCounts.current, ...props.cachedCounts])
        console.log(
          [...props.recentCounts.current, ...props.cachedCounts].slice(
            [...props.recentCounts.current, ...props.cachedCounts].length - 50,
          ),
        )
        console.log("Ok that's all! Thanks!")

        // handleUnfreeze();

        console.log(
          "Ok, let's probably do this. This may make contexts worse BUT overall worth. I can fix that later by checking for context i guess",
        )
        props.setCachedCounts([])
        // if(messagesEndRef.current) {
        //   messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        // }
        props.loadedNewestRef.current = true
        props.setLoadedNewest(true)
        setForceRerenderSubmit(Date.now().toString())
      }
    }
  }, [loading])

  useEffect(() => {
    setForceRerenderSubmit(Date.now().toString())
  }, [props.recentCountsLoading])

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      changeScrolledToBottom(true)
    }
  }

  const scrollToBottomAuto = () => {
    if (messagesEndRef.current && isScrolledToBottom === false && submitRef.current && isDesktop) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' })
      submitRef.current.scrollIntoView({ behavior: 'auto', block: 'start' })
      changeScrolledToBottom(true)
    } else {
      //console.log("Can't scroll to bottom, but something wants to. Probably already scrolled to bottom?");
    }
  }

  const scrollToTopAuto = () => {
    if (messagesEndRef.current && submitRef.current && isDesktop) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' })
      submitRef.current.scrollIntoView({ behavior: 'auto', block: 'nearest' })
      changeScrolledToTop(true)
    } else {
      //console.log("Can't scroll to top, but something wants to. Probably already scrolled to top?");
    }
  }

  const handleClear = async () => {
    if (inputRef.current) {
      if (!user || (user && preferences && preferences.pref_clear === 'Clear')) {
        inputRef.current.value = ''
      } else if (user && preferences && preferences.pref_clear === 'Clipboard') {
        inputRef.current.value = await navigator.clipboard.readText()
      } else if (user && preferences && preferences.pref_clear === 'Custom') {
        inputRef.current.value = customInputRef.current ? customInputRef.current.value : ''
      } else if (user && preferences && preferences.pref_clear === 'No Clear') {
        const currentValue = inputRef.current.value
        const keepRaw = noClearKeepInputRef.current ? parseInt(noClearKeepInputRef.current.value, 10) : NaN
        const deleteRaw = noClearDeleteInputRef.current ? parseInt(noClearDeleteInputRef.current.value, 10) : NaN
        const keepCount = Number.isFinite(keepRaw) ? Math.max(0, keepRaw) : currentValue.length
        const deleteCount = Number.isFinite(deleteRaw) ? Math.max(0, deleteRaw) : 0
        const keptValue = currentValue.substring(0, Math.min(keepCount, currentValue.length))

        const cursor = Math.max(0, Math.min(inputRef.current.selectionStart ?? keptValue.length, keptValue.length))
        const deleteStart = Math.max(0, cursor - deleteCount)
        const newValue = keptValue.substring(0, deleteStart) + keptValue.substring(cursor)

        inputRef.current.value = newValue
        inputRef.current.setSelectionRange(deleteStart, deleteStart)
      }
      // inputRef.current.value = inputRef.current.value.substring(0, ((noClearKeepInputRef.current !== undefined && parseInt(noClearKeepInputRef.current.value)) ?? inputRef.current.value.length) - (noClearDeleteInputRef.current !== undefined && parseInt(noClearDeleteInputRef.current.value)) ?? 0)
      // inputRef.current.value = noClearInputRef.current && !isNaN(parseInt(noClearInputRef.current.value)) ? inputRef.current.value.substring(0, inputRef.current.value.length - parseInt(noClearInputRef.current.value)) : inputRef.current.value;
    }
  }

  const handlePosting = async () => {
    const throttleCheck = performance.now() - throttle.current
    let throttled;
    if(props.thread && props.thread.validationType === 'bars') {
      throttled = throttleCheck < 1000
    } else if(props.thread && props.thread.validationType === 'tugofwar' && props.recentCounts.current &&
    new Set(
      props.recentCounts.current
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50)
      .filter(currentCount => currentCount.isValidCount)
      .map(validCount => validCount.rawCount)
    ).size <= 15
    ) {
      throttled = throttleCheck < 1000
    } else {
      throttled = throttleCheck < Math.min(500, Math.max(35, 35 + burstThrottleCount.current * 20))
    }
    if (throttled) {
      console.log(`You are being throttled. Start: ${throttle.current}, end: ${performance.now()} (${throttleCheck}ms difference)`)
      throttleCount.current += 1
      burstThrottleCount.current += 1
      isThrottled.current = true
      setSubmitColor('error')
      if (throttleCount.current > 100) {
        theRock()
      }
      return
    }
    if (inputRef.current && inputRef.current.value.trim().length > 0) {
      const post_hash = (Math.random() * 100000000000000000).toString(36)
      props.handleLatencyChange(Date.now(), post_hash)
      props.handleLatencyCheckChange(inputRef.current.value.trim())
      props.handleSubmit(inputRef.current.value, props.refScroll.current, props.postScroll.current, post_hash)
      throttle.current = performance.now()
      props.refScroll.current = []
      props.postScroll.current = [["Top", Date.now()]]
      if (isThrottled.current) {
        isThrottled.current = false
        setSubmitColor('primary')
      }
      handleClear()
      if (user && preferences && preferences.pref_load_from_bottom) {
        changeScrolledToBottom(true)
        if (isDesktop) {
          scrollToBottomAuto()
          setTimeout(function () {
            scrollToBottomAuto()
          }, 100)
        }
      } else if (isDesktop) {
        scrollToTopAuto()
        setTimeout(function () {
          scrollToTopAuto()
        }, 100)
        changeScrolledToTop(true)
      }
      inputRef.current.focus()
    }
  }

  const toggleKeyboard = () => {
    if (keyboardType === 'search') {
      setKeyboardType('numeric')
    } else {
      setKeyboardType('search')
    }
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  useEffect(() => {
    if (((!isScrolledToBottom && user && preferences && preferences.pref_load_from_bottom) || !isScrolledToTop) && !firstLoad) {
      setIsNewRecentCountAdded(true)
    }
  }, [props.newRecentPostLoaded])

  useEffect(() => {
    if (((isScrolledToBottom && user && preferences && preferences.pref_load_from_bottom) || isScrolledToTop) && !firstLoad) {
      setIsNewRecentCountAdded(false)
    }
  }, [isScrolledToBottom, isScrolledToTop, props.newRecentPostLoaded])

  useEffect(() => {
    if (messagesEndRef.current && props.recentCounts.current && props.isMounted && (submitRef.current || props.chatsOnly)) {
      if (firstLoad) {
        messagesEndRef.current.scrollIntoView({ behavior: 'auto' })
        setFirstLoad(false)
        props.isScrolledToNewest.current = true
      } else {
        if (isScrolledToBottom && user && preferences && preferences.pref_load_from_bottom) {
          if (!props.chatsOnly && isDesktop) {
            messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' })
            if (submitRef.current) {
              submitRef.current.scrollIntoView({ behavior: 'auto', block: 'end' })
            }
          }
        }

        if (contextRef.current && !hasScrolledToContext) {
          contextRef.current.scrollIntoView({ behavior: 'auto', block: 'center' })
          setHasScrolledToContext(true)
          changeScrolledToBottom(false)
        }
      }
    }
  }, [props.recentCounts.current, firstLoad])

  const loadPosts = (old: boolean) => {
    setScrollThrottle(true)

    setTimeout(function () {
      setScrollThrottle(false)
    }, 150)
    if (old) {
      if (props.chatsOnly) {
        if (user && preferences && preferences.pref_load_from_bottom && !gotOlderUUIDs.includes(props.recentCounts.current[0].uuid)) {
          setGotOlderUUIDs((old) => {
            return [...old, props.recentCounts.current[0].uuid]
          })
          socket.emit(`getOlderChats`, { thread_name: props.thread_name, uuid: props.recentCounts.current[0].uuid })
        } else if (!gotOlderUUIDs.includes(props.recentCounts.current[props.recentCounts.current.length - 1].uuid)) {
          setGotOlderUUIDs((old) => {
            return [...old, props.recentCounts.current[props.recentCounts.current.length - 1].uuid]
          })
          socket.emit(`getOlderChats`, {
            thread_name: props.thread_name,
            uuid: props.recentCounts.current[props.recentCounts.current.length - 1].uuid,
          })
        }
      } else {
        if (user && preferences && preferences.pref_load_from_bottom && !gotOlderUUIDs.includes(props.recentCounts.current[0].uuid)) {
          setGotOlderUUIDs((old) => {
            return [...old, props.recentCounts.current[0].uuid]
          })
          socket.emit(`getOlder`, { thread_name: props.thread_name, uuid: props.recentCounts.current[0].uuid })
        } else if (!gotOlderUUIDs.includes(props.recentCounts.current[props.recentCounts.current.length - 1].uuid)) {
          setGotOlderUUIDs((old) => {
            return [...old, props.recentCounts.current[props.recentCounts.current.length - 1].uuid]
          })
          socket.emit(`getOlder`, {
            thread_name: props.thread_name,
            uuid: props.recentCounts.current[props.recentCounts.current.length - 1].uuid,
          })
        }
      }
    } else {
      if (props.chatsOnly) {
        if (
          user &&
          preferences && preferences.pref_load_from_bottom &&
          !gotNewerUUIDs.includes(props.recentCounts.current[props.recentCounts.current.length - 1].uuid)
        ) {
          setGotNewerUUIDs((old) => {
            return [...old, props.recentCounts.current[props.recentCounts.current.length - 1].uuid]
          })
          socket.emit(`getNewerChats`, {
            thread_name: props.thread_name,
            uuid: props.recentCounts.current[props.recentCounts.current.length - 1].uuid,
          })
        } else if (!gotNewerUUIDs.includes(props.recentCounts.current[0].uuid)) {
          setGotNewerUUIDs((old) => {
            return [...old, props.recentCounts.current[0].uuid]
          })
          socket.emit(`getNewerChats`, { thread_name: props.thread_name, uuid: props.recentCounts.current[0].uuid })
        }
      } else {
        if (
          user &&
          preferences && preferences.pref_load_from_bottom &&
          !gotNewerUUIDs.includes(props.recentCounts.current[props.recentCounts.current.length - 1].uuid)
        ) {
          setGotNewerUUIDs((old) => {
            return [...old, props.recentCounts.current[props.recentCounts.current.length - 1].uuid]
          })
          socket.emit(`getNewer`, {
            thread_name: props.thread_name,
            uuid: props.recentCounts.current[props.recentCounts.current.length - 1].uuid,
          })
        } else if (!gotNewerUUIDs.includes(props.recentCounts.current[0].uuid)) {
          setGotNewerUUIDs((old) => {
            return [...old, props.recentCounts.current[0].uuid]
          })
          socket.emit(`getNewer`, { thread_name: props.thread_name, uuid: props.recentCounts.current[0].uuid })
        }
      }
    }
  }

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget
    if (scrollDiagnostics.current) {
      console.log(
        `Scrolling. scrollHeight: ${element.scrollHeight}, scrollTop: ${element.scrollTop}, clientHeight: ${element.clientHeight}, scrollThrottle: ${scrollThrottle}, isScrolledToTop: ${isScrolledToTop}, isScrolledToBottom: ${isScrolledToBottom}, chats: ${props.chatsOnly}`,
      )
    }
    // setHasScrolled(true);
    if (element.scrollHeight - element.scrollTop - 2 <= element.clientHeight) {
      changeScrolledToBottom(true)
    } else {
      changeScrolledToBottom(false)
    }
    if (element.scrollHeight - element.scrollTop - 2 <= element.clientHeight && !scrollThrottle) {
      changeScrolledToBottom(true)
      if (
        props.recentCounts.current &&
        props.recentCounts.current[0] &&
        props.loadedNewest === false &&
        user &&
        preferences && preferences.pref_load_from_bottom
      ) {
        const distance_From_Top = element.scrollHeight
        distanceFromTop.current = distance_From_Top
        loadPosts(false)
      } else if (
        props.recentCounts.current &&
        props.recentCounts.current[0] &&
        props.loadedOldest === false &&
        loading === false &&
        (!user || (user && preferences && !preferences.pref_load_from_bottom))
      ) {
        const distance_From_Top = element.scrollHeight
        distanceFromTop.current = distance_From_Top
        loadPosts(true)
      }
    }
    if (element.scrollTop === 0) {
      changeScrolledToTop(true)
    } else {
      changeScrolledToTop(false)
    }
    if (element.scrollTop === 0 && !scrollThrottle) {
      changeScrolledToTop(true)
      if (
        props.recentCounts.current &&
        props.recentCounts.current[0] &&
        props.loadedOldest === false &&
        user &&
        preferences && preferences.pref_load_from_bottom
      ) {
        const distance_From_Bottom = element.scrollHeight - element.scrollTop - element.clientHeight
        distanceFromBottom.current = distance_From_Bottom
        loadPosts(true)
      } else if (props.recentCounts.current && props.recentCounts.current[0] && props.loadedNewest === false) {
        const distance_From_Bottom = element.scrollHeight - element.scrollTop - element.clientHeight
        distanceFromBottom.current = distance_From_Bottom
        loadPosts(false)
      }
    } else {
      if (isScrolledToTop) {
        changeScrolledToTop(false)
      }
    }
  }

  const scrollToDistanceFromBottom = (distanceFromBottom) => {
    if (boxRef.current) {
      const element = boxRef.current
      const scrollHeight = element.scrollHeight
      const clientHeight = element.clientHeight
      const scrollTo = scrollHeight - clientHeight - distanceFromBottom
      element.scrollTop = scrollTo
    }
  }
  const scrollToDistanceFromTop = (distanceFromTop) => {
    if (boxRef.current) {
      const element = boxRef.current
      // const scrollTo = element.scrollTop + distanceFromTop;
      element.scrollTop = distanceFromTop - element.clientHeight
    }
  }
  useEffect(() => {
    if (user && preferences && preferences.pref_load_from_bottom) {
      if (distanceFromBottom.current) {
        scrollToDistanceFromBottom(distanceFromBottom.current)
        setTimeout(function () {
          scrollToDistanceFromBottom(distanceFromBottom.current)
        }, 100)
      }
    } else if (distanceFromTop.current) {
      scrollToDistanceFromTop(distanceFromTop.current)
      setTimeout(function () {
        scrollToDistanceFromTop(distanceFromTop.current)
      }, 100)
    } else {
      // console.log("No dfb/dft current (loading old posts)");
    }
  }, [props.loadedOldCount])

  useEffect(() => {
    if (user && preferences && preferences.pref_load_from_bottom) {
      if (distanceFromTop.current) {
        scrollToDistanceFromTop(distanceFromTop.current)
        setTimeout(function () {
          scrollToDistanceFromTop(distanceFromTop.current)
        }, 100)
      }
    } else if (distanceFromBottom.current) {
      scrollToDistanceFromBottom(distanceFromBottom.current)
      setTimeout(function () {
        scrollToDistanceFromBottom(distanceFromBottom.current)
      }, 100)
    } else {
      // console.log("No dft/dfb current (loading new posts)");
    }
  }, [props.loadedNewCount])

  useEffect(() => {
    setInterval(function () {
      throttleCount.current = 0
    }, 30000)
  }, [])

  useEffect(() => {
    setInterval(function () {
      burstThrottleCount.current = 0
    }, 3000)
  }, [])

  const theRock = () => {
    navigate(`/huh`)
  }

  const handleCustomInputChange = (event) => {
    if (inputRef.current) inputRef.current.value = event.target.value
  }

  const scrollDownMemo = useMemo(() => {
    return (
      <>
        {isNewRecentCountAdded &&
          !firstLoad &&
          ((user && preferences && preferences.pref_load_from_bottom && !isScrolledToBottom) ||
            !user ||
            (user && preferences && preferences.pref_load_from_bottom === false && !isScrolledToTop)) && (
            <>
              {isDesktop ? (
                <Box sx={{ position: 'fixed', bottom: '130px', right: '10%' }}>
                  <Zoom in={user && preferences && preferences.pref_load_from_bottom ? !isScrolledToBottom : !isScrolledToTop}>
                    <Box sx={{ display: 'flex', alignItems: 'center', borderRadius: '100px', bgcolor: 'primary.main' }}>
                      <Fab color="primary" variant="extended" size="medium" onClick={scrollToBottom}>
                        {user && preferences && preferences.pref_load_from_bottom ? <ArrowDownwardIcon /> : <ArrowUpwardIcon />}
                        New Posts
                      </Fab>
                    </Box>
                  </Zoom>
                </Box>
              ) : (
                <Box sx={{ position: 'fixed', bottom: '130px', right: '5%' }}>
                  <Zoom in={user && preferences && preferences.pref_load_from_bottom ? !isScrolledToBottom : !isScrolledToTop}>
                    <Fab color="primary" size="medium" onClick={scrollToBottom}>
                      {user && preferences && preferences.pref_load_from_bottom ? <ArrowDownwardIcon /> : <ArrowUpwardIcon />}
                    </Fab>
                  </Zoom>
                </Box>
              )}
            </>
          )}
      </>
    )
  }, [isNewRecentCountAdded, firstLoad, isScrolledToTop, isScrolledToBottom, props.recentCounts.current, user])

  const submitButtonMemo = useMemo(() => {
    if (counter && counter.roles.includes('banned')) {
      return (
        <Box
          ref={submitRef}
          sx={{
            maxWidth: '100%',
            height: '76px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            bgcolor: alpha(theme.palette.background.paper, 0.9),
          }}
        >
          <Typography color="text.primary" variant="body1">
            You are banned. You can't post until you've been unbanned.
          </Typography>
        </Box>
      )
    } else if (counter && props.thread && props.thread.postBans && props.thread.postBans.includes(counter.uuid)) {
      return (
        <Box
          ref={submitRef}
          sx={{
            maxWidth: '100%',
            height: '76px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            bgcolor: alpha(theme.palette.background.paper, 0.9),
          }}
        >
          <Typography color="text.primary" variant="body1">
            You are banned from this thread.
          </Typography>
        </Box>
      )
    } else if (isDesktop && counter && (counter.roles.includes('counter') || counter.roles.includes('bot')) && props.thread && [...props.thread.updatableBy, 'bot'].some(role => counter.roles.includes(role)) && props.thread.locked === false) {
      return (
        <Box
          ref={submitRef}
          sx={{
            maxWidth: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '0.5',
            background: alpha(theme.palette.background.paper, 0.9),
          }}
        >
          <Tooltip
            title={`${props.cachedCounts && props.cachedCounts.length} new`}
            placement="top"
            open={props.cachedCounts && props.cachedCounts.length > 0 ? true : false}
            arrow
          >
            <IconButton onClick={() => handleUnfreeze()}>
              <AcUnitIcon
                color={
                  props.loadedNewestRef !== undefined && props.loadedNewestRef.current === false && props.recentCountsLoading === false
                    ? 'primary'
                    : 'disabled'
                }
              />
            </IconButton>
          </Tooltip>
          <TextField
            variant="outlined"
            fullWidth
            multiline
            maxRows={4}
            style={{ borderRadius: '20px', padding: '10px', width: user && preferences && ['Custom', 'No Clear'].includes(preferences.pref_clear) ? '50%' : '70%' }}
            autoFocus
            inputRef={inputRef}
            inputProps={{ inputMode: keyboardType, spellCheck: 'false', autoCorrect: 'off' }}
          />
          {user && preferences && preferences.pref_clear === 'No Clear' && (
            <>
            <Tooltip title="How many characters to keep.">
              <TextField
                maxRows={1}
                variant='standard'
                type='number'
                sx={{ borderRadius: '20px', padding: '10px', width: '10%', mx: 0.5}}
                inputRef={noClearKeepInputRef}
                inputProps={{ inputMode: "numeric", spellCheck: 'false', autoCorrect: 'off' }}
                helperText="Keep"
              />
            </Tooltip>
            <Tooltip title="How many characters to delete.">
              <TextField
                maxRows={1}
                type='number'
                variant='standard'
                sx={{ borderRadius: '20px', padding: '10px', width: '10%', mx: 0.5 }}
                inputRef={noClearDeleteInputRef}
                inputProps={{ inputMode: "numeric", spellCheck: 'false', autoCorrect: 'off' }}
                helperText="Delete"
              />
            </Tooltip>
            </>
          )}
          {user && preferences && preferences.pref_clear === 'Custom' && (
            <TextField
              variant="standard"
              maxRows={1}
              style={{ borderRadius: '20px', padding: '10px', width: '20%' }}
              onInput={handleCustomInputChange}
              inputRef={customInputRef}
              inputProps={{ inputMode: keyboardType, spellCheck: 'false', autoCorrect: 'off' }}
              helperText="Auto-paste"
            />
          )}
          {/* <TextField
              variant="outlined"
              maxRows={1}
              style={{ borderRadius: '20px', padding: '10px', width: '20%' }}
              autoFocus
              inputRef={customInputRef}
              inputProps={{ inputMode: keyboardType, spellCheck: 'false', autoCorrect: "off" }}
          /> */}
          <Tooltip title="Throttled" open={submitColor === 'error' ? true : false} arrow>
            <IconButton color={submitColor} onClick={() => handlePosting()}>
              <SendIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    } else if (!isDesktop && counter && (counter.roles.includes('counter') || counter.roles.includes('bot')) && props.thread && [...props.thread.updatableBy, 'bot'].some(role => counter.roles.includes(role)) && props.thread.locked === false) {
      // } else {
      return (
        <>
          <Box
            ref={submitRef}
            sx={{
              maxWidth: '100%',
              height: '76px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '0.5',
              bgcolor: alpha(theme.palette.background.paper, 0.9),
            }}
          >
            <Tooltip
              title={`${props.cachedCounts && props.cachedCounts.length} new`}
              placement="top"
              open={props.cachedCounts && props.cachedCounts.length > 0 ? true : false}
              arrow
            >
              <IconButton onClick={() => handleUnfreeze()}>
                <AcUnitIcon
                  color={
                    props.loadedNewestRef !== undefined &&
                    props.loadedNewestRef.current === false &&
                    props.recentCountsLoading === false
                      ? 'primary'
                      : 'disabled'
                  }
                />
              </IconButton>
            </Tooltip>
            <IconButton onClick={() => toggleKeyboard()}>
              <KeyboardIcon />
            </IconButton>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              style={{ borderRadius: '20px', padding: '10px', width: user && preferences && ['Custom', 'No Clear'].includes(preferences.pref_clear) ? '40%' : '80%' }}
              autoFocus
              inputRef={inputRef}
              inputProps={{ inputMode: keyboardType, spellCheck: 'false', autoCorrect: 'off', enterKeyHint: 'send' }}
            />
            {user && preferences && preferences.pref_clear === 'No Clear' && (
            <>
            <Tooltip title="How many characters to keep.">
              <TextField
                maxRows={1}
                variant='standard'
                type='number'
                sx={{ borderRadius: '20px', padding: '10px', width: '15%', mx: 0.25}}
                inputRef={noClearKeepInputRef}
                inputProps={{ inputMode: "numeric", spellCheck: 'false', autoCorrect: 'off' }}
                helperText="Keep"
              />
            </Tooltip>
            <Tooltip title="How many characters to delete.">
              <TextField
                maxRows={1}
                type='number'
                variant='standard'
                sx={{ borderRadius: '20px', padding: '10px', width: '15%', mx: 0.25 }}
                inputRef={noClearDeleteInputRef}
                inputProps={{ inputMode: "numeric", spellCheck: 'false', autoCorrect: 'off' }}
                helperText="Delete"
              />
            </Tooltip>
            </>
          )}
            {user && preferences && preferences.pref_clear === 'Custom' && (
            <TextField
              variant="standard"
              maxRows={1}
              style={{ borderRadius: '20px', padding: '10px', width: '30%' }}
              onInput={handleCustomInputChange}
              inputRef={customInputRef}
              inputProps={{ inputMode: keyboardType, spellCheck: 'false', autoCorrect: 'off' }}
              helperText="Auto-paste"
            />
          )}
            <Tooltip title="Throttled" open={submitColor === 'error' ? true : false} arrow>
              <IconButton color={submitColor} onClick={() => handlePosting()}>
                <SendIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <Box ref={endOfSubmitRef}></Box>
        </>
      )
    } else if (counter && (counter.roles.includes('counter') || counter.roles.includes('bot')) && props.thread && ![...props.thread.updatableBy, 'bot'].some(role => counter.roles.includes(role))) {
      return (
        <Box
          ref={submitRef}
          sx={{
            maxWidth: '100%',
            height: '76px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            bgcolor: alpha(theme.palette.background.paper, 0.9),
          }}
        >
          <Typography color="text.primary" variant="body1">
            You don't have permissions to participate in this thread.
          </Typography>
        </Box>
      )
    } else if (props.thread && props.thread.locked) {
      return (
        <Box
          ref={submitRef}
          sx={{
            maxWidth: '100%',
            height: '76px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            bgcolor: alpha(theme.palette.background.paper, 0.9),
          }}
        >
          <Typography color="text.primary" variant="body1">
            This thread has been locked. This may be temporary, check the "About" page.
          </Typography>
        </Box>
      )
    } else if (counter && !counter.color) {
      return (
        <Box
          ref={submitRef}
          sx={{
            maxWidth: '100%',
            height: '76px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            bgcolor: alpha(theme.palette.background.paper, 0.9),
          }}
        >
          <Typography color="text.primary" variant="body1">
            Your registration is not yet complete. Click the "Complete Registration" button at the top to join in!
          </Typography>
        </Box>
      )
    } else if (counter) {
      return (
        <Box
          ref={submitRef}
          sx={{
            maxWidth: '100%',
            height: '76px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            bgcolor: alpha(theme.palette.background.paper, 0.9),
          }}
        >
          <Typography color="text.primary" variant="body1">
            Your registration is pending verification. No further action from you is required. To avoid abuse, we are manually
            verifying accounts at the moment. Our apologies. Check back shortly, you'll be able to count soon!
          </Typography>
        </Box>
      )
    } else if (!loading && !counter) {
      return (
        <Box
          ref={submitRef}
          sx={{
            maxWidth: '100%',
            height: '76px',
            maxHeight: '76px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            bottom: 0,
            left: 0,
            right: 0,
            p: 0,
            bgcolor: alpha(theme.palette.background.paper, 0.9),
          }}
        >
          <Typography color="text.primary" variant="h6">
            Sign up to count. &nbsp;
          </Typography>
          &nbsp;
          <Button href={loginRedirect} variant="contained" color="secondary" startIcon={<LoginIcon />}>
            Sign Up
          </Button>
        </Box>
      )
    }
  }, [
    submitColor,
    props.thread,
    loading,
    keyboardType,
    theme,
    isDesktop,
    counter,
    props.cachedCounts,
    props.loadedNewestRef,
    props.loadedNewest,
    forceRerenderSubmit,
    props.recentCountsLoading,
    preferences,
  ])

  const countsMemo = useMemo(() => {
    const countsByDayAndHour = {}
    const today = new Date()
    const yesterday = new Date(Date.now() - 86400000)
    let prevHour
    let prevKey
    const uniqueRecentCounts = (() => {
      const seenUUIDs = new Set<string>()
      const dedupedCounts: any[] = []
      for (const count of props.recentCounts.current || []) {
        const uuid = count?.uuid
        if (typeof uuid === 'string' && uuid.length > 0) {
          if (seenUUIDs.has(uuid)) continue
          seenUUIDs.add(uuid)
        }
        dedupedCounts.push(count)
      }
      return dedupedCounts
    })()
    const orderedRecentCounts = (() => {
      const sortedCounts = [...uniqueRecentCounts].sort((a, b) => Number(a.timestamp) - Number(b.timestamp))
      if (user && preferences && preferences.pref_load_from_bottom) {
        return sortedCounts
      }
      return sortedCounts.reverse()
    })()

    let highestValidCountNumber = 0
    orderedRecentCounts &&
      orderedRecentCounts.forEach((count, index) => {
        if (count.isValidCount && count.validCountNumber > highestValidCountNumber) {
          highestValidCountNumber = count.validCountNumber
        }
        const date = new Date(parseInt(count.timestamp))
        const hour = date.getHours()
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${hour}`

        if (!countsByDayAndHour[key]) {
          const dateWithoutMinutes = new Date(date.setMinutes(0))
          let day
          if (dateWithoutMinutes.toLocaleDateString() === today.toLocaleDateString()) {
            day = 'Today at ' + dateWithoutMinutes.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' })
          } else if (dateWithoutMinutes.toLocaleDateString() === yesterday.toLocaleDateString()) {
            day = 'Yesterday at ' + dateWithoutMinutes.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' })
          } else {
            day =
              dateWithoutMinutes.toLocaleDateString() +
              ' at ' +
              dateWithoutMinutes.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' })
          }
          countsByDayAndHour[key] = {
            day,
            hour,
            counts: [],
          }
        }

        if (
          prevKey !== key ||
          !prevKey ||
          (index === orderedRecentCounts.length - 1 && countsByDayAndHour[key].showHourBar !== false)
        ) {
          if (user && preferences && preferences.pref_load_from_bottom && index === 0) {
            countsByDayAndHour[key].showHourBar = false
          } else if ((!preferences || (preferences && !preferences.pref_load_from_bottom)) && index === orderedRecentCounts.length - 1) {
            countsByDayAndHour[key].showHourBar = false
          } else {
            countsByDayAndHour[key].showHourBar = true
          }
        }

        countsByDayAndHour[key].counts.push(count)

        prevHour = hour
        prevKey = key
      })

    return Object.keys(countsByDayAndHour).map((key, index) => {
      const { day, counts, showHourBar } = countsByDayAndHour[key]
      const shouldShowHourBar = showHourBar
      return (
        <div key={key}>
          {index === 0 && !props.loadedOldest && user && preferences && preferences.pref_load_from_bottom && (
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                disabled={scrollThrottle}
                onClick={() => {
                  loadPosts(true)
                }}
              >
                Load More
              </Button>
            </Box>
          )}
          {user && preferences && preferences.pref_load_from_bottom && shouldShowHourBar && <HourBar label={day} />}
          {counts.map((count, index) => {
            const contextMatch = props.context && props.context === count.uuid
            const ref = contextMatch ? contextRef : null
            if (isDesktop && !(count.stricken && !count.hasComment && user && preferences && preferences.pref_hide_stricken === 'Hide')) {
              return (
                <Count
                  mostRecentCount={count.validCountNumber === highestValidCountNumber}
                  user={user}
                  key={count.uuid}
                  thread={props.thread}
                  socket={socket}
                  post={count}
                  renderedCounter={cachedCounters[count.authorUUID]}
                  maxWidth={'32px'}
                  maxHeight={'32px'}
                  contextRef={ref}
                />
              )
            } else if (!(count.stricken && user && preferences && preferences.pref_hide_stricken === 'Hide')) {
              return (
                <CountMobile
                  mostRecentCount={count.validCountNumber === highestValidCountNumber}
                  user={user}
                  key={count.uuid}
                  thread={props.thread}
                  socket={socket}
                  post={count}
                  renderedCounter={cachedCounters[count.authorUUID]}
                  maxWidth={'32px'}
                  maxHeight={'32px'}
                  contextRef={ref}
                />
              )
            }
          })}
          {(!user || (user && preferences && !preferences.pref_load_from_bottom)) && shouldShowHourBar && <HourBar label={day} />}
          {index + 1 === Object.keys(countsByDayAndHour).length &&
            !props.loadedOldest &&
            (!user || (user && preferences && !preferences.pref_load_from_bottom)) && (
              <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  disabled={scrollThrottle}
                  onClick={() => {
                    loadPosts(true)
                  }}
                >
                  Load More
                </Button>
              </Box>
            )}
        </div>
      )
    })
  }, [props.recentCounts.current, cachedCounters, isDesktop, scrollThrottle, preferences])

  const [submitHeight, setSubmitHeight] = useState(76)

  // useEffect(() => {
  //   const submit = submitRef.current;

  //   if(!submit) return;

  //   console.log("Making new resize observerer");
  //   const resizeObserver = new ResizeObserver(() => {
  //     console.log("Resize observerer!");
  //     // The size of the textbox has changed.
  //     if(submitRef.current) {
  //       setSubmitHeight(Math.floor(submitRef.current.getBoundingClientRect().height));
  //     }
  //   });

  //   resizeObserver.observe(submit);

  //   return () => {
  //     resizeObserver.unobserve(submit);
  //   };
  // }, [submitRef.current]);

  if (user && preferences && preferences.pref_load_from_bottom) {
    return (
      <>
        <Box
          id="messages-box"
          ref={boxRef}
          onScroll={handleScroll}
          sx={{
            height: submitRef.current ? `calc(100% - ${submitHeight}px)` : props.chatsOnly ? '100%' : 'calc(100% - 76px)',
            flexGrow: 1,
            bgcolor: 'background.paper',
            overflow: 'auto',
            position: 'relative',
          }}
        >
          {countsMemo}
          <div id="messagesEnd" ref={messagesEndRef} />
        </Box>

        {scrollDownMemo}
        {!props.chatsOnly && submitButtonMemo}
      </>
    )
  } else {
    return (
      <>
        {!props.chatsOnly && submitButtonMemo}
        <Box
          ref={boxRef}
          onScroll={handleScroll}
          sx={{
            height: submitRef.current ? `calc(100% - ${submitHeight}px)` : props.chatsOnly ? '100%' : 'calc(100% - 76px)',
            flexGrow: 1,
            bgcolor: 'background.paper',
            overflow: 'auto',
            position: 'relative',
          }}
        >
          <div ref={messagesEndRef}></div>
          {countsMemo}
        </Box>
        {scrollDownMemo}
      </>
    )
  }
  // };
})

export default CountList
