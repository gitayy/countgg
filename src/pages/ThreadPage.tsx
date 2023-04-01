import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { UserContext } from '../utils/contexts/UserContext';
import { Fragment, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AlertColor, alpha, Badge, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, Link, Snackbar, Tab, Theme, Typography, useMediaQuery, useTheme } from '@mui/material';
import { Loading } from '../components/Loading';
import { addCounterToCache, cachedCounters } from '../utils/helpers';
import { useFetchRecentCounts } from '../utils/hooks/useFetchRecentCounts';
import { useFetchThread } from '../utils/hooks/useFetchThread';
import { SocketContext } from '../utils/contexts/SocketContext';
import { Counter, PostType, User } from '../utils/types';
import { useIsMounted } from '../utils/hooks/useIsMounted';
import CountList from '../components/CountList';
import queryString from 'query-string';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { useFetchRecentChats } from '../utils/hooks/useFetchRecentChats';
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';
import { adminToggleThreadLock } from '../utils/api';
import { DailyHOCTable } from '../components/DailyHOCTable';
import { SplitsTable } from '../components/SplitsTable';
import { useFavicon } from '../utils/hooks/useFavicon';
import Timer from '../components/Timer';
import { ContestPage } from './ContestPage';
import { InfoOutlined } from '@mui/icons-material';
import { April2023SignupPage } from './April2023SignupPage';
import moment from 'moment-timezone';
import { TerminalController } from '../components/TerminalController';
import { DailyRobTable } from '../components/DailyRobTable';

export const ThreadPage = memo(({ chats = false }: {chats?: boolean}) => {
    const location = useLocation();
    const params = useParams();
    const { context } = queryString.parse(window.location.search);
    const thread_name:string = params.thread_name || "main";
    const navigate = useNavigate();
    const setFaviconCount = useFavicon();

    const theme = useTheme();
    useEffect(() => {
      document.title = `${thread_name} | countGG`;
      return (() => {
        document.title = 'countGG';
      })
    }, [location.pathname]);

    const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'));
    
    const socket = useContext(SocketContext);
    const [socketStatus, setSocketStatus] = useState("CONNECTING...");
    const [socketViewers, setSocketViewers] = useState(1);

    const { user, counter, loading, allegiance } = useContext(UserContext);
    const { thread, threadLoading, setThread } = useFetchThread(thread_name);
    const { recentCounts, recentCountsLoading, setRecentCounts, loadedOldest, setLoadedOldest, loadedNewest, setLoadedNewest } = useFetchRecentCounts(thread_name, context);
    const { recentChats, recentChatsLoading, setRecentChats, loadedOldestChats, setLoadedOldestChats, loadedNewestChats, setLoadedNewestChats } = useFetchRecentChats(thread_name, context);
    const loadedNewestRef = useRef(false);
    const loadedNewestChatRef = useRef(false);
    const [ cachedCounts, setCachedCounts ] = useState<PostType[]>([]);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [lastCount, setLastCount] = useState<{lastCount: PostType, lastCounter: Counter}>();
    const [dailyHOC, setDailyHOC] = useState<{[authorUUID: string]: {counter: Counter, counts: number}}>();
    const [dailyRobs, setDailyRobs] = useState<{[authorUUID: string]: {counter: Counter, counts: number}}>();
    const [newRecentPostLoaded, setNewRecentPostLoaded] = useState('');
    const [splits, setSplits] = useState<any>([]);
    
    const [bank, setBank] = useState(-1);
    const [robOpen, setRobOpen] = useState(false);

    const robConfirm = () => {
      // console.log('Ok');
      socket.emit(`rob`);
      setRobOpen(false);
    };
  
    const robCancel = () => {
      setRobOpen(false);
    };
  
    const openRobConfirm = () => {
      setRobOpen(true);
    };

    const [despacito, setDespacito] = useState(1);
    const [konamiCodeEntered, setKonamiCodeEntered] = useState(false);
    const [konamiCodeSequence, setKonamiCodeSequence] = useState<string[]>([]);

    const handleDespacito = () => {
      setDespacito(prevDespacito => {return prevDespacito + 1})
    }

    useEffect(() => {
      if (despacito === 2) {
        const konamiCode = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "KeyB", "KeyA"];
        const checkCode = (event) => {
          const key = event.code;
          setKonamiCodeSequence((prev) => [...prev.slice(-9), key]);
        };
  
        window.addEventListener("keydown", checkCode);
  
        if (konamiCodeSequence.length === konamiCode.length) {
          const sequenceMatches = konamiCode.every((code, index) => konamiCodeSequence[index] === code);
          if (sequenceMatches) {
            setKonamiCodeEntered(true);
          }
          setKonamiCodeSequence([]);
        }
  
        return () => window.removeEventListener("keydown", checkCode);
      }
    }, [despacito, konamiCodeSequence]);

    useEffect(() => {
      if (konamiCodeEntered) {
        socket.emit('requestKonamiKey');
      }
    }, [konamiCodeEntered]);

    const ConfirmDialog = ({ open, handleCancel, handleConfirm }) => {
      return (
        <Dialog open={open}>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              You may only rob once per day. Your ability to rob resets at midnight Eastern.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancel} color="primary">
              Cancel
            </Button>
            <Button onClick={handleConfirm} color="primary" variant='contained' autoFocus>
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      );
    };

    const isMounted = useIsMounted();

    const userAsRef = useRef<User>();

    const latency = useRef(0);
    const latencyCheck = useRef('');
    const myUUIDCheck = useRef('');
    const [deleteComments, setDeleteComments] = useState("");
    const [latencyStateTest, setLatencyStateTest] = useState("");
    const [newChatsLoadedState, setNewChatsLoadedState] = useState("");

    const throttle = useRef<boolean>(false);

    const setThrottle = () => {
      throttle.current = true;
        setTimeout(function() {
          throttle.current = false;
        }, 150);
    }

    const refScroll = useRef<any>([]);
    useEffect(() => {
      const scrollCheck = (event) => {
        const { key: test } = event;
            if (refScroll.current.at(-1) !== test) {
              refScroll.current = [...refScroll.current, test].slice(-5);
            }
      };
      document.addEventListener('keydown', scrollCheck);  
      return () => {
        document.removeEventListener('keydown', scrollCheck);
      };
    }, []);

    // Render latency test 2. This one uses requestAnimationFrame and is the most accurate as possible!

    const renderLatencyEnabled = useRef(false);
    if (window.location.href.indexOf("latency") > -1) {
      renderLatencyEnabled.current = true;
    }
    const startRenderRef = useRef(0);
    const endRenderRef = useRef(0);
    const [renderTime, setRenderTime] = useState<number>();

    useEffect(() => {  
      if(renderLatencyEnabled.current) {
        requestAnimationFrame(() => {
          endRenderRef.current = performance.now();
          console.log(`Count took ${endRenderRef.current - startRenderRef.current} ms to render (${endRenderRef.current}, ${startRenderRef.current}) `);
          setRenderTime(endRenderRef.current - startRenderRef.current);
        });
      }
      
    }, [latencyStateTest]);

    const [loadedOldCount, setLoadedOldCount] = useState(2);
    const [loadedNewCount, setLoadedNewCount] = useState(2);
    const isScrolledToNewest = useRef(false);
    const isScrolledToTheTop = useRef(false);
    const isScrolledToTheBottom = useRef(false);

    const [loadedOldChat, setLoadedOldChat] = useState(2);
    const [loadedNewChat, setLoadedNewChat] = useState(2);
    const chatsIsScrolledToTheBottom = useRef(false);
    const chatsIsScrolledToTheTop = useRef(false);
    const chatsIsScrolledToNewest = useRef(true); // different default state

    // Needed to calculate server latency.
    const handleLatencyChange = (value) => {
        latency.current = value;
    }
    const handleLatencyCheckChange = (value) => {
        latencyCheck.current = value;
    }

    const [tabValue, setTabValue] = useState('tab_1');

    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
      setTabValue(newValue);
    };

    const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('error');
    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }    
        setSnackbarOpen(false);
    };

    //update recent

    //turn myUUIDCheck into uuid on counter load
    useEffect(() => {
      if(counter) {
        myUUIDCheck.current = counter.uuid
      }
    }, [counter]);

    const cache_counts = ((count) => {
      if(user && user.pref_load_from_bottom) {
        if(loadedNewestRef.current == false) {
          setCachedCounts(prevCounts => {
            const newCounts = [...prevCounts, count];
            return newCounts;
          });
        }
      } else {
        if(loadedNewestRef.current == false) {
          setCachedCounts(prevCounts => {
            const newCounts = [count, ...prevCounts];
            return newCounts;
          });
        }
      }
    })

    useEffect(() => {
      if(recentCountsLoading == false) {
        loadedNewestRef.current = loadedNewest;
      }
    }, [recentCountsLoading])

    //Handle Socket data
    useEffect(() => {
          if(isMounted.current && loading == false) {
            socket.on("connect", () => {
              console.log("Connected to socket!");
              setSocketStatus("LIVE");
            });
            // console.log("Connected to socket!");
            setSocketStatus("LIVE");
            
            
            socket.on("disconnect", () => {
              console.log("Disconnected from socket"); 
              setSocketStatus("DISCONNECTED");
              return;
            });

            socket.on("reconnect", () => {
              console.log("Reconnected to socket."); 
              setSocketStatus("LIVE");
            });
            socket.on("connect_error", (err) => {
              console.log(`connect_error due to ${err.message}`);
              setSocketStatus("DISCONNECTED");
            });
          }
          },[loading]);

          useEffect(() => {

          if(isMounted.current && loading == false && socketStatus == 'LIVE') {
            socket.emit('watch', thread_name)

            socket.on(`watcher_count`, function(data) {
              setSocketViewers(data);
            });
            socket.on(`lastCount`, function(data) {
              setLastCount(data);
              addCounterToCache(data.lastCounter);
            });
            socket.on(`dailyHOC`, function(data) {
              // console.log("DAILY HOC");
              // console.log(data);
              setDailyHOC(data);
            });
            socket.on(`dailyRobs`, function(data) {
              // console.log("DAILY ROBS");
              // console.log(data);
              setDailyRobs(data);
            });
            socket.on(`bank`, function(data) {
              // console.log("Bank:", data);
              setBank(data);
            });
            socket.on(`deleteComment`, function(data) {
              setRecentCounts(prevCounts => {
                return prevCounts.map(post => {
                  if (post.uuid === data.uuid) {
                    return data;
                  }
                  return post;
                });
              });
            });
            socket.on(`addCounterToCache`, function(data) {
              addCounterToCache(data);
              setLatencyStateTest(data.uuid);
            });
            socket.on(`post`, function(data: {post: PostType, counter: Counter}) {
              if(renderLatencyEnabled.current) {
                startRenderRef.current = performance.now(); // Needed for render latency test 2
              }              
                if(latencyCheck.current == data.post.rawText && data.post.authorUUID == myUUIDCheck.current) {
                    data.post.latency = Date.now() - latency.current;
                }
                addCounterToCache(data.counter);
                cache_counts(data.post);
                if(loadedNewestRef.current) {
                  if(user && user.pref_load_from_bottom) {
                    setRecentCounts(prevCounts => {
                      const newCounts = [...prevCounts, data.post];
                      if(isScrolledToNewest.current !== undefined && isScrolledToNewest.current) {
                        if (newCounts.length > 50) {
                          return newCounts.slice(newCounts.length - 50);
                        } else {
                          return newCounts;
                        }
                      } else {
                        return newCounts;
                      }
                    });
                    if(data.post.hasComment) {
                      setRecentChats(prevChats => {
                        const newChats = [...prevChats, data.post];
                        if(chatsIsScrolledToNewest.current !== undefined && chatsIsScrolledToNewest.current) {
                          if (newChats.length > 50) {
                            return newChats.slice(newChats.length - 50);
                          } else {
                            return newChats;
                          }
                        } else {
                          return newChats;
                        }
                      });
                    }
                  } else {
                    setRecentCounts(prevCounts => {
                      const newCounts = [data.post, ...prevCounts];
                      if(isScrolledToNewest.current !== undefined && isScrolledToNewest.current) {
                        if (newCounts.length > 50) {
                          return newCounts.slice(0, 50);
                        } else {
                          return newCounts;
                        }
                      } else {
                        return newCounts;
                      }
                    });
                    if(data.post.hasComment) {
                      setRecentChats(prevChats => {
                        const newChats = [data.post, ...prevChats];
                        if(chatsIsScrolledToNewest.current !== undefined && chatsIsScrolledToNewest.current) {
                          if (newChats.length > 50) {
                            return newChats.slice(0, 50);
                          } else {
                            return newChats;
                          }
                        } else {
                          return newChats;
                        }
                      });
                    }
                  }
                }
                // setRenderLatencyCheck(true); //renderLatency test 1 requirement. 
                setNewRecentPostLoaded(data.post.uuid); // Only do this here.
                setLatencyStateTest(data.post.uuid);
                if(data.post.hasComment) {
                  setNewChatsLoadedState(data.post.uuid);
                }
                if(data.post.isValidCount) {
                  setLastCount({lastCount: data.post, lastCounter: data.counter});
                  setDailyHOC(prevDailyHOC => {
                      const updatedHOC = {
                        ...prevDailyHOC,
                        [data.counter.uuid]: {
                          counter: data.counter,
                          counts: prevDailyHOC !== undefined ? ((prevDailyHOC[data.counter.uuid]?.counts || 0) + 1) : 1,
                        }
                      };
                      return updatedHOC;
                  });
                  if(thread_name === 'main') {
                    setBank(prevBank => {return prevBank + 1;})
                  }
                }
                if (document.hidden) {
                  setFaviconCount();
                }
              });

              socket.on(`loadOldCounts`, function(data) {
                for (const counter of data.counters) {
                  addCounterToCache(counter);
                }
                if(user && user.pref_load_from_bottom) {
                    setRecentCounts(prevCounts => {
                      const newCounts = [...data.recentCounts.reverse(), ...prevCounts];
                        return newCounts;
                    });
                  } else {
                    setRecentCounts(prevCounts => {
                      const newCounts = [...prevCounts, ...data.recentCounts];
                        return newCounts;
                    });
                  }
                  if(data.recentCounts && data.recentCounts[0]) {
                    setLoadedOldCount(Date.now())
                  }
                  if(data.isNewest && isScrolledToNewest.current) {
                    setLoadedNewest(true);
                    loadedNewestRef.current = true;
                  }
                  if(data.isOldest) {
                    setLoadedOldest(true);
                  }
              });

              socket.on(`loadNewCounts`, function(data) {
                for (const counter of data.counters) {
                  addCounterToCache(counter);
                }
                if(user && user.pref_load_from_bottom) {
                  setRecentCounts(prevCounts => {
                    const newCounts = [...prevCounts, ...data.recentCounts,];
                    return newCounts;
                  });
                } else {
                  setRecentCounts(prevCounts => {
                    const newCounts = [...data.recentCounts.reverse(), ...prevCounts];
                    return newCounts;
                  });
                }
                if(data.recentCounts && data.recentCounts[0]) {
                  setLoadedNewCount(Date.now())
                }
                if(data.isNewest && isScrolledToNewest.current) {
                  setLoadedNewest(true);
                  loadedNewestRef.current = true;
                }
                if(data.isOldest) {
                  setLoadedOldest(true);
                }
            });

            socket.on(`loadOldChats`, function(data) {
              for (const counter of data.counters) {
                addCounterToCache(counter);
              }
              if(data.isNewest) {
                setLoadedNewestChats(true);
              }
              if(data.isOldest) {
                setLoadedOldestChats(true);
              }
              if(user && user.pref_load_from_bottom) {
                  setRecentChats(prevChats => {
                    const newChats = [...data.recentCounts.reverse(), ...prevChats];
                      return newChats;
                  });
                } else {
                  setRecentChats(prevChats => {
                    const newChats = [...prevChats, ...data.recentCounts];
                      return newChats;
                  });
                }
                if(data.recentCounts && data.recentCounts[0]) {
                  setLoadedOldChat(Date.now()) // lol
                  setNewChatsLoadedState(data.recentCounts[0].uuid);
                }
            });

            socket.on(`loadNewChats`, function(data) {
              for (const counter of data.counters) {
                addCounterToCache(counter);
              }
              if(data.isNewest) {
                setLoadedNewestChats(true);
              }
              if(data.isOldest) {
                setLoadedOldestChats(true);
              }
              if(user && user.pref_load_from_bottom) {
                setRecentChats(prevChats => {
                  const newChats = [...prevChats, ...data.recentCounts,];
                  return newChats;
                });
              } else {
                setRecentChats(prevChats => {
                  const newChats = [...data.recentCounts.reverse(), ...prevChats];
                  return newChats;
                });
              }
              if(data.recentCounts && data.recentCounts[0]) {
                setLoadedNewChat(Date.now()) // lol
                setNewChatsLoadedState(data.recentCounts[0].uuid);
              }
          });

          socket.on(`updateReaction`, function(data) {
            setRecentCounts(prevCounts => {
              const newCounts = prevCounts.map(post => {
                if (post.uuid === data.post_uuid) {
                  return {
                    ...post,
                    reactions: data.reactions
                  };
                }
                return post;
              });
              return newCounts;
            });
            setRecentChats(prevChats => {
              const updatedChats = prevChats.map(chat => {
                if (chat.uuid === data.post_uuid) {
                  return {
                    ...chat,
                    reactions: data.reactions
                  };
                }
                return chat;
              });
              return updatedChats;
            });
            setLatencyStateTest(`${data.post_uuid}-reax-${Date.now()}`);
            setNewChatsLoadedState(`${data.post_uuid}-reax-${Date.now()}`);
          });

          socket.on(`thread_update`, function(data) {
            setThread(data.threadInfo);
          });

          socket.on('split', function(data) {
            const { number, split } = data;
            setSplits(prevSplits => {
              const newSplits = [{ number, split }, ...prevSplits];
                if (newSplits.length > 55) {
                  return newSplits.slice(0, 55);
                } else {
                  return newSplits;
                }
            });
          });

            return () => {
              console.log("Disabling socket functions until you reconnect / join another thread.");
                socket.emit('leave_threads');
                socket.off('connection_error');
                socket.off('post');
                socket.off('lastCount');
                socket.off('watcher_count');
                socket.off('deleteComment');
                socket.off('thread_update');
                socket.off('split');
                setSocketStatus("DISCONNECTED");
            }
        }
    },[socketStatus, loading]);

    const deleteComment = useCallback((data) => {
      setRecentCounts((counts) =>
        counts.map((count) => {
          if (count.uuid === data.uuid) {
            return data;
          }
          return count;
        })
      );
      setRecentChats((chats) =>
        chats.map((chat) => {
          if (chat.uuid === data.uuid) {
            return data;
          }
          return chat;
        })
      );
      setLatencyStateTest(`${data.uuid}-delete`);
      setNewChatsLoadedState(`${data.uuid}-delete`);
    }, [setRecentCounts]);
  
    useEffect(() => {
      socket.on(`deleteComment`, deleteComment);
      return () => {
        socket.off(`deleteComment`, deleteComment);
      };
    }, [deleteComment]);

    const handleSubmit = (text: string, refScroll: any) => {
        const submitText = text;
        if(thread_name && counter) {
          socket.emit('post', {thread_name: thread_name, text: submitText, refScroll: refScroll});
        }
      };

      const lockThread = async () => {
        if(thread) {
          try {
          const res = await adminToggleThreadLock(thread.uuid);
            if(res.status == 201) {
              setSnackbarSeverity('success');
              setSnackbarOpen(true)
              setSnackbarMessage('Thread lock toggled')
            }
          }
          catch(err) {
            setSnackbarSeverity('error');
            setSnackbarOpen(true)
            setSnackbarMessage('Error: Submission rejected. If this comes as a surprise, please reach out to discord mods via DM!')
          }
        } else {
          console.log("Thread not loaded yet.");
        }
      };


      const snackbarMemo = useMemo(() => {
        return (<Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleClose}
          >
              <Alert severity={snackbarSeverity} onClose={handleClose}>
                  {snackbarMessage}
              </Alert>
          </Snackbar>)
      }, [snackbarSeverity, snackbarMessage, snackbarOpen]);

      const socketMemo = useMemo(() => {
        let color: "success" | "info" | "warning" | "error" | "default" | "primary" | "secondary" | undefined = 'info';

        if (socketStatus == 'DISCONNECTED') {
          color = 'error';
        } else if (socketStatus == 'LIVE') {
          color = 'success';
        }
        return (<Box onClick={() => {handleDespacito()}} sx={{ml: 5, p: 0.5, display: 'flex', alignItems: 'center'}}>
        {despacito === 1 ? <>
        <Box sx={{bgcolor: `${color}.light`, width: 8, height: 8, borderRadius: '50%'}}></Box>
        &nbsp;<Typography color={"text.primary"} variant="body1">{socketStatus}</Typography> &nbsp; <Typography color={"text.secondary"} variant="body2">{socketViewers} {socketViewers === 1 ? 'viewer' : 'viewers'}</Typography></>
          : despacito === 2 ? <><Box sx={{bgcolor: `error.light`, width: 8, height: 8, borderRadius: '50%'}}></Box>
          &nbsp;<Typography color={"text.primary"} variant="body1">DEAD</Typography> &nbsp; <Typography color={"text.secondary"} variant="body2">69 viewers</Typography></>
          : <><Box sx={{bgcolor: `grey.400`, width: 8, height: 8, borderRadius: '50%'}}></Box>
          &nbsp;<Typography color={"text.primary"} variant="body1">CLOSED</Typography> &nbsp; <Typography color={"text.secondary"} variant="body2">0 viewers</Typography></>
        }
          </Box>)
      }, [socketStatus, socketViewers, despacito]);

      const headerMemo = useMemo(() => {
        if(thread) {return (
          <Box sx={{ display: 'flex', flexGrow: 0, p: 0.5, bgcolor: alpha(theme.palette.background.paper, 0.9)}}>
            <Typography sx={{p: 0.5}} variant="h6" color="text.primary">{thread.title}</Typography>
            {socketMemo}
          </Box>)
        } 
        else {
          return (
            <Box sx={{ display: 'flex', bgcolor: alpha(theme.palette.background.paper, 0.9), flexGrow: 1, p: 0.5}}>
              <Typography sx={{p: 0.5}} variant="h4" color="text.primary">Loading...</Typography>
            </Box>
          )
        }
      }, [thread, socketStatus, socketViewers, theme, lastCount, despacito])

      const countListMemo = useMemo(() => {
        return (          
        <CountList thread={thread} recentCountsLoading={recentCountsLoading} throttle={throttle} setThrottle={setThrottle} chatsOnly={false} setCachedCounts={setCachedCounts} loadedNewestRef={loadedNewestRef} refScroll={refScroll} setRecentChats={setRecentChats} newRecentPostLoaded={newRecentPostLoaded} user={user} loadedOldest={loadedOldest} cachedCounts={cachedCounts} loadedNewest={loadedNewest} loadedOldCount={loadedOldCount} loadedNewCount={loadedNewCount} setRecentCounts={setRecentCounts} isScrolledToTheBottom={isScrolledToTheBottom} isScrolledToTheTop={isScrolledToTheTop} thread_name={thread_name} isScrolledToNewest={isScrolledToNewest} cachedCounters={cachedCounters} isMounted={isMounted} context={context} socket={socket} counter={counter} loading={loading} recentCounts={recentCounts} handleLatencyCheckChange={handleLatencyCheckChange} handleLatencyChange={handleLatencyChange} handleSubmit={handleSubmit}></CountList>
        )
      }, [cachedCounts, thread, loadedNewestRef, loadedNewestRef.current, recentCountsLoading, latencyStateTest, loadedNewCount, loadedOldCount, deleteComments, loadedOldest, loadedNewest, isScrolledToNewest, loading])

      const chatsMemo = useMemo(() => {
        return (      
        <CountList thread={thread} isDesktop={isDesktop} throttle={throttle} setThrottle={setThrottle} chatsOnly={true} newRecentPostLoaded={undefined} user={user} loadedOldest={loadedOldestChats} loadedNewest={loadedNewestChats} loadedOldCount={loadedOldChat} loadedNewCount={loadedNewChat} setRecentCounts={setRecentChats} isScrolledToTheBottom={chatsIsScrolledToTheBottom} isScrolledToTheTop={chatsIsScrolledToTheTop} thread_name={thread_name} isScrolledToNewest={chatsIsScrolledToNewest} cachedCounters={cachedCounters} isMounted={isMounted} context={context} socket={socket} counter={counter} loading={loading} recentCounts={recentChats} handleLatencyCheckChange={undefined} handleLatencyChange={undefined} handleSubmit={undefined}></CountList>
        )
      }, [recentChatsLoading, newChatsLoadedState, loadedNewChat, loadedOldChat, deleteComments, loadedOldestChats, loadedNewestChats, chatsIsScrolledToNewest, loading])

      const sidebarMemo = useMemo(() => {
        return (
          <TabContext value={tabValue}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <TabList onChange={handleTabChange} variant={'scrollable'} allowScrollButtonsMobile aria-label="Counting Tabs">
          <Tab label="About" value="tab_1" />
          <Tab label="Chats" value="tab_2" />

          {(!loading && !counter || (counter && !counter.roles.includes('contestant'))) &&
          <Tab
            label={counter && counter.roles.includes('contestant') ? <span style={{display: 'block'}}><Typography component={'span'} sx={{ fontSize: 18, color: '#fff', textShadow: '0px 0px 3px black' }}>🔑</Typography>&nbsp;Teams</span> : <Badge badgeContent={1} color="error"><span style={{display: 'block'}}><Typography component={'span'} sx={{ fontSize: 18, color: '#fff', textShadow: '0px 0px 3px black' }}>🔑</Typography>&nbsp;Teams</span></Badge>}
            value="tab_teams"
            sx={{
              bgcolor: '#8a8a8a80',
              color: 'text.primary',
              boxShadow: '0px 1px 5px rgba(0, 0, 0, 0.2)',
              '&.Mui-selected': {
                bgcolor: '#8a8a8a',
                color: '#fff!important',
                boxShadow: '0px 1px 5px rgba(0, 0, 0, 0.5)',
                textShadow: '0px 0px 3px black'
              },
            }}
          />
          }
          {counter && counter.roles.includes('blaze') &&
          <Tab
            label={<span style={{display: 'block'}}><Typography component={'span'} sx={{ fontSize: 18, color: '#fff', textShadow: '0px 0px 3px black',}}>🔥</Typography>&nbsp;Blaze</span>}
            value="tab_blaze"
            sx={{
              bgcolor: '#ff000080',
              color: 'text.primary',
              boxShadow: '0px 1px 5px rgba(0, 0, 0, 0.2)',
              '&.Mui-selected': {
                bgcolor: '#ff0000',
                color: '#fff!important',
                boxShadow: '0px 1px 5px rgba(0, 153, 255, 0.5)',
                textShadow: '0px 0px 3px black'
              },
            }}
          />
          }
          {counter && counter.roles.includes('radiant') &&
          <Tab
            label={<span style={{display: 'block'}}><Typography component={'span'} sx={{ fontSize: 18, color: '#fff', textShadow: '0px 0px 3px black',}}>⭐</Typography>&nbsp;Radiant</span>}
            value="tab_radiant"
            sx={{
              bgcolor: '#FFC10780',
              color: 'text.primary',
              boxShadow: '0px 1px 5px rgba(0, 0, 0, 0.2)',
              '&.Mui-selected': {
                bgcolor: '#FFC107',
                color: '#fff!important',
                boxShadow: '0px 1px 5px rgba(0, 153, 255, 0.5)',
                textShadow: '0px 0px 3px black'
              },
            }}
          />
          }
          {counter && counter.roles.includes('wave') &&
          <Tab
            label={<span style={{display: 'block'}}><Typography component={'span'} sx={{ fontSize: 18, color: '#fff', textShadow: '0px 0px 3px black',}}>🌊</Typography>&nbsp;Wave</span>}
            value="tab_wave"
            sx={{
              bgcolor: '#0099ff80',
              color: 'text.primary',
              boxShadow: '0px 1px 5px rgba(0, 0, 0, 0.2)',
              '&.Mui-selected': {
                bgcolor: '#0099ff',
                color: '#fff!important',
                boxShadow: '0px 1px 5px rgba(0, 153, 255, 0.5)',
                textShadow: '0px 0px 3px black'
              },
            }}
          />
          }
          <Tab label="Splits" value="tab_3" />
          <Tab label="Stats" value="tab_4" />
        </TabList>
      </Box>
        <Box sx={{flexGrow: 1, display: 'flex', bgcolor: 'background.paper', color: 'text.primary', overflowY: 'scroll'}}>
        <TabPanel value="tab_1" sx={{flexGrow: 1, p: 4}}>
          <Typography variant="h5" sx={{mb: 1}}>About</Typography>
          <Typography variant="body1" sx={{whiteSpace: 'pre-wrap'}}><ReactMarkdown children={thread ? thread.description : "Loading..."} components={{p: 'span'}} remarkPlugins={[remarkGfm]} /></Typography>
          <Timer></Timer>
          <Typography variant="h5" sx={{mt: 2, mb: 1}}>Rules</Typography>
          <Typography variant="body1" sx={{whiteSpace: 'pre-wrap'}}><ReactMarkdown children={thread ? thread.rules : "Loading..."} components={{p: 'span'}} remarkPlugins={[remarkGfm]} /></Typography>
          {counter && thread && counter.roles.includes('admin') && <Button variant='contained' onClick={lockThread}>{thread.locked ? "Unlock Thread" : "Lock Thread"}</Button>}
        </TabPanel>
        <TabPanel value="tab_2" sx={{flexGrow: 1, p: 4}}>
          <Typography variant='h4'>Chats</Typography>
          <Box sx={{height: '70vh'}}>
          {chatsMemo}
          </Box>
        </TabPanel>
        {(!counter || (counter && !counter.roles.includes('contestant'))) &&
        <TabPanel value="tab_teams" sx={{flexGrow: 1}}>
          <Typography variant='h4'>Teams</Typography>
          {(!counter || (counter && !counter.roles.includes('counter'))) && <Badge badgeContent={1} color="error">
          <Box display="flex" alignItems="center" sx={{p: 2, border: '1px solid', borderColor: 'warning.main'}}>
            <Box component={InfoOutlined} sx={{ fontSize: 24, color: 'info.main', mr: 1 }} />
            <Typography variant="body1">
              {!counter && <>It looks you aren't signed up to countGG. Sign in using the login link above to join a team.</>}
              {counter && !counter.roles.includes('counter') && <>Your registration is not complete. Once you finish registration, you'll be able to join a team.</>}
            </Typography>
          </Box></Badge>}
          {counter && !counter.roles.includes('contestant') &&
          <Badge badgeContent={1} color="error">
          <Box display="flex" alignItems="center" sx={{p: 2, border: '1px solid', borderColor: 'warning.main'}}>
            <Box component={InfoOutlined} sx={{ fontSize: 24, color: 'info.main', mr: 1 }} />
            <Typography variant="body1">
              To join a team, you need to agree to the rules of the Count Allegiance.{' '}
              <Link href="/contest" underline="always">
                Click here
              </Link>{' '}
              to join.
            </Typography>
          </Box></Badge>
          }
          {/* <April2023SignupPage></April2023SignupPage> */}
        </TabPanel>}
        <TabPanel value="tab_blaze" sx={{height: 'fill-available', p: 0}}>
        <Box sx={{display: 'flex', flexDirection: 'column', width: '100%', height: '100%'}}>
            <April2023SignupPage fullPage={false}></April2023SignupPage>
            <TerminalController></TerminalController>
          </Box>
        </TabPanel>
        <TabPanel value="tab_radiant" sx={{height: 'fill-available', p: 0}}>
          <Box sx={{display: 'flex', flexDirection: 'column', width: '100%', height: '100%'}}>
            <April2023SignupPage fullPage={false}></April2023SignupPage>
            <TerminalController></TerminalController>
          </Box>
        </TabPanel>
        <TabPanel value="tab_wave" sx={{height: 'fill-available', p: 0}}>
        <Box sx={{display: 'flex', flexDirection: 'column', width: '100%', height: '100%'}}>
            <April2023SignupPage fullPage={false}></April2023SignupPage>
            <TerminalController></TerminalController>
          </Box>
        </TabPanel>
        <TabPanel value="tab_3" sx={{flexGrow: 1}}>
        {lastCount && <Typography sx={{p: 0.5}} variant="body1" color="text.secondary">Last count: {lastCount.lastCount.rawCount} by {lastCount.lastCounter.name}</Typography>}
          <SplitsTable splits={splits}></SplitsTable>
        </TabPanel>
        <TabPanel value="tab_4" sx={{flexGrow: 1}}>
          {thread_name === 'main' && bank > -1 && counter && (!counter.lastRob || (counter.lastRob && ((parseFloat(counter.lastRob) < moment().tz('America/New_York').startOf('day').unix() * 1000)))) && <>
          <Typography sx={{p: 0.5}} variant="body1" color="text.secondary">Bank: ${bank}</Typography>
          <Button variant="contained" onClick={() => openRobConfirm()}>
            Rob
          </Button>
          <ConfirmDialog
            open={robOpen}
            handleCancel={() => robCancel()}
            handleConfirm={() => robConfirm()}
          />
          </>}
          {dailyHOC && <DailyHOCTable dailyHOC={dailyHOC} name={'Daily Leaderboard'} countName={'Counts'}></DailyHOCTable>}
          {/* {dailyRobs && <DailyRobTable ></DailyRobTable>} */}
        </TabPanel>
        </Box>
        </TabContext>
        )
      }, [tabValue, thread, newChatsLoadedState, lastCount, splits, dailyHOC, dailyRobs, bank, robOpen, loading])
      

      if(!loading && !threadLoading && thread) {

        return (<>
        {/* Render latency test 2. This one uses requestAnimationFrame and is the most accurate as possible */}
         
         {renderLatencyEnabled.current && <Box sx={{position: 'fixed', background:'#999999', zIndex: 9, fontSize: 24, bottom: 0, right: 0}}>
            {renderTime}ms
            </Box>}
        
        {snackbarMemo}
        <Grid container> 
            <Grid item xs={12} lg={6} sx={{height: 'auto', }}>
            <Box sx={{minHeight: 500, height: 'calc(100vh - 65px)'}}>
              {countListMemo}
              </Box>
              </Grid>
            <Grid item xs={12} lg={6}>
            <Box sx={{display: 'flex', flexDirection: 'column', minHeight: 500, height: 'calc(100vh - 65px)', overflowY: 'auto', bgcolor: 'background.paper'}}>
            {headerMemo}
              {sidebarMemo}
              </Box>
              </Grid>
        </Grid>
        
        
        </>
        )
    } else {
        return(<Loading />);
    }

});
