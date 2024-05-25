import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, Link, TextField, Typography } from '@mui/material'
import { convertToTimestamp, formatDate, formatDateExact, formatTimeDiff, uuidParseNano, uuidv1ToMs } from '../utils/helpers'
import { useLocation, useNavigate } from 'react-router-dom'
// import Snoowrap from 'snoowrap';
import { UserContext } from '../utils/contexts/UserContext'
import axios from 'axios'
import { SocketContext, socket } from '../utils/contexts/SocketContext'
import { LCPost } from '../components/LCPost'
import { HourBar } from '../components/HourBar'
import { RedditPost } from '../utils/types'
import queryString from 'query-string'
import { useIsMounted } from '../utils/hooks/useIsMounted'
import { Loading } from '../components/Loading'

export const LCPage = () => {
  const location = useLocation()
  const { user, counter, loading, setUser } = useContext(UserContext)
  const [redditLoading, setRedditLoading] = useState(true)
  const replyTimeRef = useRef(0)
  useEffect(() => {
    document.title = `/r/livecounting | Counting!`
    return () => {
      document.title = 'Counting!'
    }
  }, [location.pathname])

  const [webSocketUrl, setWebSocketUrl] = useState('')
  const [threadDetails, setThreadDetails] = useState()

  const threadId = 'ta535s1hq2je'
  useEffect(() => {
    const threadId = 'ta535s1hq2je'
    const aboutUrl = `https://www.reddit.com/live/${threadId}/about.json`

    axios.get(aboutUrl).then((response) => {
      // console.log("OKKK");
      // console.log(response);
      const initialWebSocketUrl = response.data.data.websocket_url
      setWebSocketUrl(initialWebSocketUrl)
      setThreadDetails(response.data.data)
    })
  }, [])

  const socket = useContext(SocketContext)
  const isMounted = useIsMounted()

  //Handle Socket data
  useEffect(() => {
    if (isMounted) {
      console.log('Watching thread.')
      socket.emit('reddit_watch', threadId)

      socket.on('connect_error', (err) => {
        console.log(`connect_error due to ${err.message}`)
      })
      socket.on(`reddit_post`, function (data) {
        // console.log(data);
        const fakeRedditPost: RedditPost = {
          id: data.id,
          author: data.username,
          body: data.message,
          body_html: data.message,
          created: data.timestamp / 1000,
          created_utc: data.timestamp / 1000,
          embeds: [],
          mobile_embeds: [],
          stricken: false,
          name: '',
          // timestamp: Number(uuidParseNano(data.id)) / 1000,
          timestamp: data.timestamp,
          real_timestamp: data.real_timestamp,
          fakePost: true,
          counter: data.counter,
          replyTime: replyTimeRef.current > 0 ? data.timestamp - replyTimeRef.current : undefined,
        }
        replyTimeRef.current = data.timestamp
        // console.log("Cgg post");
        // console.log(fakeRedditPost);
        // setCggMessages(prevMessages => [fakeRedditPost, ...prevMessages].slice(0,50))
        // cggMessages.current = [fakeRedditPost, ...cggMessages.current].slice(0,50);
        // redditMessages.current = [fakeRedditPost, ...cggMessages.current].sort((a,b) => a.timestamp - b.timestamp).slice(0,50);
        // redditMessages.current = [fakeRedditPost, ...redditMessages.current].sort((a,b) => b.timestamp - a.timestamp)
        setRedditMessages((prevMessages) => [fakeRedditPost, ...prevMessages].sort((a, b) => b.timestamp - a.timestamp))
        setCggMessages([Date.now()])
        // console.log("Ayo :)");
        // console.log(redditMessages.current);

        // .slice(0,25);

        // setSpecificCount(prevCounts => {
        //   return prevCounts.map(post => {
        //     if (post.uuid === data.uuid) {
        //       return data;
        //     }
        //     return post;
        //   });
        // });
      })

      return () => {
        socket.emit('leave_reddit')
      }
    }
  }, [])

  //   console.log(threadDetails);

  //   useEffect(() => {
  //     if(webSocketUrl) {
  //         console.log("Connecting to WebSocket server ", webSocketUrl);
  //         const socket = io(webSocketUrl);

  //         // Event listeners for WebSocket events
  //         socket.on('connect', () => {
  //           console.log('Connected to WebSocket server');
  //         });

  //         socket.on('update', (data) => {
  //           console.log('Received message:', data);
  //         });

  //         return () => {
  //           socket.disconnect(); // Clean up on unmount
  //         };
  //     }
  //   }, [webSocketUrl]);

  const headers = {
    Authorization: `Bearer ${user && user.redditAccess}`,
  }

  const redditMessages = useRef<any>([])
  const [redditMessagesState, setRedditMessages] = useState<RedditPost[]>([])
  const [cggMessagesState, setCggMessages] = useState<any[]>([])
  const cggMessages = useRef<any>([])
  const [messages, setMessages] = useState<RedditPost[]>([])
  const [render, setRender] = useState(`a`)

  useEffect(() => {
    if (user && user.redditAccess) {
      const threadId = 'ta535s1hq2je'
      const aboutUrl = `https://oauth.reddit.com/live/${threadId}`

      try {
        axios
          .get(`${aboutUrl}?limit=25`, { headers: headers })
          .then((response) => {
            for (const post of response.data.data.children) {
              if (redditMessages.current && !redditMessages.current.some((message) => message.id === post.data.id)) {
                redditMessages.current.push(post.data)
                setRender(`${Date.now()}`)
              }
            }
            setRedditMessages(redditMessages.current)
            setRedditLoading(false)
          })
          .catch((err) => {
            if (user && setUser) {
              setUser((prevUser) => {
                return {
                  ...prevUser,
                  reddit: undefined,
                  redditAccess: undefined,
                  redditRefresh: undefined,
                }
              })
            }
          })
      } catch (err) {
        console.log(err)
      }
    }
  }, [loading])

  useEffect(() => {
    if (webSocketUrl) {
      console.log('Connecting to WebSocket server ', webSocketUrl)
      const socket = new WebSocket(webSocketUrl)

      // Event listeners for WebSocket events
      socket.addEventListener('open', () => {
        console.log('Connected to WebSocket server')
      })

      socket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data)
        // console.log('Received message:', data);
        if (
          data.type === 'update' &&
          redditMessages.current &&
          !redditMessages.current.some((message) => message.id === data.payload.data.id)
        ) {
          // redditMessages.current.unshift(data.payload.data);
          // redditMessages.current = [data.payload.data, ...redditMessages.current];
          data.payload.data['timestamp'] = uuidv1ToMs(data.payload.data.id)
          data.payload.data['fakePost'] = false
          redditMessages.current = [data.payload.data, ...redditMessages.current].sort((a, b) => b.timestamp - a.timestamp)
          setRedditMessages((prevMessages) =>
            // [data.payload.data, ...prevMessages].sort((a,b) => b.timestamp - a.timestamp)
            {
              const indexToRemove = prevMessages.findIndex((post) => post.fakePost && post.body === data.payload.data.body)

              if (indexToRemove !== -1) {
                // If a matching post was found, remove it using filter
                const removedPost = prevMessages[indexToRemove]
                // console.log("Removed post:");
                // console.log(removedPost);
                const timestampDiff = removedPost.real_timestamp ? data.payload.data.timestamp - removedPost.real_timestamp : undefined
                // console.log(timestampDiff);
                if (timestampDiff) {
                  // console.log("Does this happen twice...?");
                  // console.log(lags.current);
                  lags.current.push(timestampDiff)
                  // console.log(lags.current);
                }

                data.payload.data['timestamp_prediction_error'] = data.payload.data.timestamp - removedPost.timestamp
                data.payload.data['counter'] = removedPost.counter
                data.payload.data['replyTime'] = removedPost.replyTime

                const oldPosts = prevMessages.filter((_, index) => index !== indexToRemove)
                return [data.payload.data, ...oldPosts].sort((a, b) => b.timestamp - a.timestamp).slice(0, 25)
              }

              // If no matching post was found, simply add the new data
              return [data.payload.data, ...prevMessages].sort((a, b) => b.timestamp - a.timestamp).slice(0, 25)
            },
          )
          // console.log("Ayo  2 :)");
          // console.log(redditMessages.current);
          // .slice(0,25);
          // if (redditMessages.current.length > 25) {
          //   redditMessages.current = redditMessages.current.slice(0, 25);
          // }
          // setRedditMessages(prevMessages => [data.payload.data, ...prevMessages].slice(0,50))
          // setRedditMessages(prevMessages => [data.payload.data, ...prevMessages].sort((a,b) => b.timestamp - a.timestamp))
          // console.log(redditMessages.current);
          setRender(`${Date.now()}`)
        }

        if (data.type === 'strike' && redditMessages.current) {
          const strikenMessage = redditMessages.current.filter((message) => message.name === data.payload)
          if (strikenMessage) {
            strikenMessage[0].stricken = true
            setRedditMessages((prevMessages) =>
              prevMessages.map((message) => (message.name === data.payload ? { ...message, stricken: true } : message)),
            )
            setRender(`${Date.now()}`)
          }
        }

        if (data.type === 'delete' && redditMessages.current) {
          const deletedMessage = redditMessages.current.filter((message) => message.name === data.payload)
          if (deletedMessage) {
            redditMessages.current = redditMessages.current.filter((message) => message.name !== data.payload)
            setRedditMessages((prevMessages) => prevMessages.filter((message) => message.name !== data.payload))
            setRender(`${Date.now()}`)
          }
        }
      })

      return () => {
        if (socket) {
          socket.close() // Clean up on unmount
        }
      }
    }
  }, [webSocketUrl])

  const inputRef = useRef<HTMLInputElement>(null)
  const customInputRef = useRef<HTMLInputElement>(null)
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
      if (inputRef.current && inputRef.current === document.activeElement && user) {
        if (event.key === 'Enter' && !event.shiftKey && !event.altKey) {
          event.preventDefault()
          handlePosting()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [loading, inputRef])
  const throttle = useRef(performance.now())
  const isThrottled = useRef(false)
  const [throttled, setThrottled] = useState(false)
  const throttleCount = useRef(0)
  const navigate = useNavigate()
  const theRock = () => {
    navigate(`/huh`)
  }

  const handleClear = async () => {
    if (inputRef.current) {
      if (!user || (user && user.pref_clear === 'Clear')) {
        inputRef.current.value = ''
      } else if (user && user.pref_clear === 'Clipboard') {
        inputRef.current.value = await navigator.clipboard.readText()
      } else if (user && user.pref_clear === 'Custom') {
        inputRef.current.value = customInputRef.current ? customInputRef.current.value : ''
      }
    }
  }

  const thread = 'ta535s1hq2je'
  const apiUrl = `https://oauth.reddit.com/api/live/${thread}/update`
  const latency = useRef({})
  const latencyReddit1 = useRef({})
  const lags = useRef<number[]>([])

  //   const querystring = require('querystring');

  const handleSubmit = (text: string) => {
    const submitText = text
    // console.log("hamle submit");
    const post_hash = (Math.random() * 100000000000000000).toString(36)
    // console.log(post_hash);
    latency.current[post_hash] = performance.now()
    if (user && counter && user.redditAccess) {
      // console.log("Submitting post", submitText);
      // socket.emit('lc_post', {thread: '', text: submitText, post_hash: post_hash});
      socket.emit('reddit_submit', { thread_id: threadId, message: submitText, post_hash: post_hash, prevLag: lags.current })
      // console.log(lags.current);
      lags.current = []

      const requestData = {
        // api_type: 'json',
        body: submitText,
        // X_Modhash: '',
        // thing_id: `t5_${thread}`,
        // thing_id: '',
        // id: '#new-update-form',
        // uh: user.redditRefresh,
        // renderstyle: "html"
        id: post_hash,
      }

      axios
        .post(apiUrl, queryString.stringify(requestData), { headers: headers })
        .then((response) => {
          //     console.log(response);
          //   console.log('Post successful:', response.data);
          //   console.log(response.data.jquery[0]);
          //   console.log(response.data.jquery[0][3]);
          //   console.log(`Post hash: ${response.data.jquery[0][3][0]}`);
          try {
            const post_hash = response.data.jquery[0][3][0]
            if (latency.current[post_hash]) {
              const postLatencyReddit = performance.now() - latency.current[post_hash]
              latencyReddit1.current[post_hash] = postLatencyReddit
              delete latency.current[post_hash]
            }
          } catch (err) {
            console.log(err)
          }
          // Handle the response as needed
        })
        .catch((error) => {
          console.error('Error posting:', error)
          // Handle the error as needed
        })
    }
  }

  const handlePosting = async () => {
    const throttleCheck = performance.now() - throttle.current
    if (throttleCheck < 333) {
      console.log(`You are being throttled. Start: ${throttle.current}, end: ${performance.now()} (${throttleCheck}ms difference)`)
      throttleCount.current += 1
      isThrottled.current = true
      setThrottled(true)
      //   setSubmitColor("error")
      //   if(throttleCount.current > 100) {
      //     theRock();
      //   }
      return
    }
    if (inputRef.current && inputRef.current.value.trim().length > 0) {
      //   props.handleLatencyChange(Date.now());
      //   props.handleLatencyCheckChange(inputRef.current.value.trim());
      // console.log("Ahoy");
      handleSubmit(inputRef.current.value)
      throttle.current = performance.now()
      if (isThrottled.current) {
        isThrottled.current = false
        setThrottled(false)
        // setSubmitColor("primary");
      }
      handleClear()
      inputRef.current.focus()
    }
  }

  const postsMemo = useMemo(() => {
    // console.log("PostsMemo triggered.");
    if (redditLoading === false) {
      // return redditMessages.current.map((post, index) => (
      //     <LCPost post={post} details={{ thread: thread }} key={post.id} />
      //   ));

      const countsByDayAndHour = {}
      const today = new Date()
      const yesterday = new Date(Date.now() - 86400000)
      let prevHour
      let prevKey

      redditMessagesState &&
        redditMessagesState.forEach((count, index) => {
          // console.log("Wee");
          // console.log(count);
          // const date = new Date(uuidv1ToMs(count.id));
          const date = count.timestamp ? new Date(count.timestamp) : new Date()
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
            (index === redditMessages.current.length - 1 && countsByDayAndHour[key].showHourBar !== false)
          ) {
            if (user && user.pref_load_from_bottom && index === 0) {
              countsByDayAndHour[key].showHourBar = false
            } else if ((!user || (user && !user.pref_load_from_bottom)) && index === redditMessages.current.length - 1) {
              countsByDayAndHour[key].showHourBar = false
            } else {
              countsByDayAndHour[key].showHourBar = true
            }
          }

          countsByDayAndHour[key].counts.push(count)

          prevHour = hour
          prevKey = key
        })

      // cggMessagesState && cggMessagesState.forEach((count, index) => {
      //   const date = new Date();
      //   const hour = date.getHours();
      //   const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${hour}`;

      //   if (!countsByDayAndHour[key]) {
      //     const dateWithoutMinutes = new Date(date.setMinutes(0));
      //     let day;
      //     if (dateWithoutMinutes.toLocaleDateString() === today.toLocaleDateString()) {
      //       day = 'Today at ' + dateWithoutMinutes.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' });
      //     } else if (dateWithoutMinutes.toLocaleDateString() === yesterday.toLocaleDateString()) {
      //       day = 'Yesterday at ' + dateWithoutMinutes.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' });
      //     } else {
      //       day = dateWithoutMinutes.toLocaleDateString() + ' at ' + dateWithoutMinutes.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' });
      //     }
      //     countsByDayAndHour[key] = {
      //       day,
      //       hour,
      //       counts: [],
      //     };
      //   }

      //   if (prevKey !== key || !prevKey || ((index === cggMessages.current.length - 1) && countsByDayAndHour[key].showHourBar !== false)) {
      //     if(user && user.pref_load_from_bottom && index === 0) {
      //       countsByDayAndHour[key].showHourBar = false;
      //     } else if(((!user || (user && !user.pref_load_from_bottom))) && index === cggMessages.current.length - 1) {
      //       countsByDayAndHour[key].showHourBar = false;
      //     } else {
      //       countsByDayAndHour[key].showHourBar = true;
      //     }
      //   }

      //   countsByDayAndHour[key].counts.push(count);

      //   prevHour = hour;
      //   prevKey = key;
      // });
      // console.log("BLUDDDD");
      // console.log(countsByDayAndHour);

      return Object.keys(countsByDayAndHour).map((key, index) => {
        const { day, counts, showHourBar } = countsByDayAndHour[key]
        const shouldShowHourBar = showHourBar
        return (
          <div key={key}>
            {/* {user && user.pref_load_from_bottom && shouldShowHourBar && (
                  <HourBar label={day} />
                )} */}
            {counts.map((count, index) => {
              // console.log(count);
              return <LCPost postString={JSON.stringify(count)} thread={thread} key={count.id} />
            })}
            {shouldShowHourBar && <HourBar label={day} />}
            {/* {(!user || (user && !user.pref_load_from_bottom)) && shouldShowHourBar && (
                  <HourBar label={day} />
                )} */}
            {/* {index + 1 === Object.keys(countsByDayAndHour).length && !props.loadedOldest && (!user || (user && !user.pref_load_from_bottom)) && <Box sx={{width: '100%', display: 'flex', justifyContent: 'center'}}><Button variant="contained" disabled={scrollThrottle} onClick={() => {loadPosts(true)}}>Load More</Button></Box>} */}
          </div>
        )
      })
    }
  }, [redditMessagesState, redditLoading, cggMessagesState])

  const loginRedirect = process.env.REACT_APP_API_HOST + '/api/auth/reddit_login'
  const logoutRedirect = process.env.REACT_APP_API_HOST + '/api/auth/reddit_logout'

  if (user && !loading && user.reddit && counter && !counter.roles.includes('banned') && !counter.roles.includes('muted')) {
    return (
      <Box sx={{ bgcolor: 'background.paper', flexGrow: 1, p: 2, color: 'text.primary' }}>
        <Typography variant="h4" component="h1" align="center">
          {threadDetails ? threadDetails['title'] : `Loading...`}{' '}
          {user && !user.reddit ? (
            <Button variant="contained" href={loginRedirect}>
              Login
            </Button>
          ) : (
            <Button variant="contained" href={logoutRedirect}>
              Logout
            </Button>
          )}
        </Typography>
        <Link variant="body2" href="https://www.counting.acorn.ignorelist.com/project/joinlivecounting/authorize?thread=ta535s1hq2je">
          Join
        </Link>

        <TextField multiline rows={3} sx={{ width: '100%' }} autoFocus inputRef={inputRef}></TextField>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography sx={{ color: 'red' }}> {throttled ? `You rate limtied bozo` : ``} </Typography>
          <Button onClick={handlePosting} variant="contained">
            Submit
          </Button>
        </Box>
        {postsMemo}

        {/* <Button variant="contained">Play</Button> */}
      </Box>
    )
  } else if (loading) {
    return <Loading />
  } else if (user && !user.reddit) {
    return (
      <Box sx={{ bgcolor: 'background.paper', flexGrow: 1, p: 2, color: 'text.primary' }}>
        You need to link your reddit account to use this. It is scuffed. Be warned.
        <Button variant="contained" href={loginRedirect}>
          Login
        </Button>
      </Box>
    )
  } else if (counter && (counter.roles.includes('banned') || counter.roles.includes('muted'))) {
    return <>No</>
  } else {
    return <>You need to be logged in to use this.</>
  }
}
