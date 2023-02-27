import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { UserContext } from '../utils/contexts/UserContext';
import { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CounterContext } from '../utils/contexts/CounterContext';
import { Alert, AlertColor, alpha, Box, Button, Grid, Snackbar, Tab, Theme, Typography, useMediaQuery, useTheme } from '@mui/material';
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

export const ThreadPage = memo(({ chats = false }: {chats?: boolean}) => {
    const location = useLocation();
    const params = useParams();
    const { context } = queryString.parse(window.location.search);
    const thread_name:string = params.thread_name || "main";
    const navigate = useNavigate();
    const theme = useTheme();
    useEffect(() => {
      document.title = `${thread_name} | countGG`;
      return (() => {
        document.title = 'countGG';
      })
    }, [location.pathname]);

    const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'));
    
    const socket = useContext(SocketContext);
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [socketStatus, setSocketStatus] = useState("CONNECTING...");
    const [socketViewers, setSocketViewers] = useState(1);

    const { user, userLoading } = useContext(UserContext);
    const { counter, loading } = useContext(CounterContext);
    const { thread, threadLoading, setThread } = useFetchThread(thread_name);
    const { recentCounts, recentCountsLoading, setRecentCounts, loadedOldest, setLoadedOldest, loadedNewest, setLoadedNewest } = useFetchRecentCounts(thread_name, context);
    const { recentChats, recentChatsLoading, setRecentChats, loadedOldestChats, setLoadedOldestChats, loadedNewestChats, setLoadedNewestChats } = useFetchRecentChats(thread_name, context);
    const loadedNewestRef = useRef(false);
    const loadedNewestChatRef = useRef(false);
    const [ cachedCounts, setCachedCounts ] = useState<PostType[]>([]);
    const [ modalOpen, setModalOpen ] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [lastCount, setLastCount] = useState<{lastCount: PostType, lastCounter: Counter}>();
    const [dailyHOC, setDailyHOC] = useState<{[authorUUID: string]: {counter: Counter, counts: number}}>();
    const [newRecentPostLoaded, setNewRecentPostLoaded] = useState('');
    const [splits, setSplits] = useState<any>([]);
    const isMounted = useIsMounted();

    const userAsRef = useRef<User>();
    const userLoadingAsRef = useRef<boolean>();

    const latency = useRef(0);
    const latencyCheck = useRef('');
    const myUUIDCheck = useRef('');
    // const [renderLatencyCheck, setRenderLatencyCheck] = useState(false); // Used for render latency test 1. 
    const [deleteComments, setDeleteComments] = useState("");
    const [latencyStateTest, setLatencyStateTest] = useState("");
    const [newChatsLoadedState, setNewChatsLoadedState] = useState("");

    const throttle = useRef<boolean>(false);

    const setThrottle = () => {
      throttle.current = true;
      if(thread_name === 'main') {
        setTimeout(function() {
          throttle.current = false;
        }, 15000);
      } else {
        setTimeout(function() {
          throttle.current = false;
        }, 150);
      }
    }


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
          console.log(`Count took ${endRenderRef.current - startRenderRef.current} ms to render`);
          setRenderTime(endRenderRef.current - startRenderRef.current);
        });
      }
      
    }, [latencyStateTest]);

    const [loadedOldCount, setLoadedOldCount] = useState(2);
    const [loadedNewCount, setLoadedNewCount] = useState(2);
    // const [postsLoaded, setPostsLoaded] = useState(0);
    const isScrolledToNewest = useRef(false);
    const isScrolledToTheTop = useRef(false);
    const isScrolledToTheBottom = useRef(false);

    const [loadedOldChat, setLoadedOldChat] = useState(2);
    const [loadedNewChat, setLoadedNewChat] = useState(2);
    const chatsIsScrolledToTheBottom = useRef(false);
    const chatsIsScrolledToTheTop = useRef(false);
    const chatsIsScrolledToNewest = useRef(false);

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

    console.log("ThreadPage render loaded newest: ", loadedNewestRef.current);

    const cache_counts = ((count) => {
      console.log("cache_counts loaded newest: ", loadedNewestRef.current);
      // console.log(loadedNewest);
      if(userAsRef.current && userAsRef.current.pref_load_from_bottom) {
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
        console.log("Changing loadedNewestRef.current to: ", loadedNewest);
      }
    }, [recentCountsLoading])

    useEffect(() => {
      if(userLoading == false) {
        userLoadingAsRef.current = false;//userLoading ?? true;
        userAsRef.current = user;
      }
    }, [userLoading])

    //Handle Socket data
    useEffect(() => {
          if(isMounted.current && userLoadingAsRef.current == false) {
            socket.on("connect", () => {
              console.log("Connected to socket!");
              setSocketStatus("LIVE");
            });
            console.log("Connected to socket (1)");              
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
          },[userLoadingAsRef.current]);

          useEffect(() => {

          if(isMounted.current && userLoadingAsRef.current == false && socketStatus == 'LIVE') {
            console.log('Starting socket functions. User should be done by now.');
            socket.emit('watch', thread_name)

            socket.on(`watcher_count`, function(data) {
              setSocketViewers(data);
            });
            socket.on(`lastCount`, function(data) {
              setLastCount(data);
              addCounterToCache(data.lastCounter);
            });
            socket.on(`dailyHOC`, function(data) {
              console.log("DAILY HOC DATA");
              console.log(data);
              setDailyHOC(data);
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
              console.log('Cached counters:');
              console.log(cachedCounters);
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
                console.log("Caching newly loaded post");
                cache_counts(data.post);
                if(loadedNewestRef.current) {
                  if(userAsRef.current && userAsRef.current.pref_load_from_bottom) {
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
                      console.log("Setting recent chats");
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
                }
              });

              socket.on(`loadOldCounts`, function(data) {
                if(userAsRef.current && userAsRef.current.pref_load_from_bottom) {
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
                  for (const counter of data.counters) {
                      addCounterToCache(counter);
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
                if(userAsRef.current && userAsRef.current.pref_load_from_bottom) {
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
                for (const counter of data.counters) {
                    addCounterToCache(counter);
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
              console.log("Loading old chats...");
              for (const counter of data.counters) {
                addCounterToCache(counter);
            }
            if(data.isNewest) {
              setLoadedNewestChats(true);
            }
            if(data.isOldest) {
              setLoadedOldestChats(true);
            }
              if(userAsRef.current && userAsRef.current.pref_load_from_bottom) {
                console.log("...from bottom");
                  setRecentChats(prevChats => {
                    const newChats = [...data.recentCounts.reverse(), ...prevChats];
                      return newChats;
                  });
                } else {
                  console.log("...from top");
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
              console.log("Loading new chats...");
              for (const counter of data.counters) {
                addCounterToCache(counter);
            }
            if(data.isNewest) {
              setLoadedNewestChats(true);
            }
            if(data.isOldest) {
              setLoadedOldestChats(true);
            }
              if(userAsRef.current && userAsRef.current.pref_load_from_bottom) {
                console.log("...from bottom");
                setRecentChats(prevChats => {
                  const newChats = [...prevChats, ...data.recentCounts,];
                  return newChats;
                });
              } else {
                console.log("...from top");
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
            console.log("Updated reaction received: ", data);
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
              console.log("Disabling socket functions. Something happened. You *probably* disconnected, but maybe not.");
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
    },[socketStatus]);

    const deleteComment = useCallback((data) => {
      console.log("Looking for a comment to delete...");
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
      console.log('Creating deleteComment useCallback');
      socket.on(`deleteComment`, deleteComment);
      return () => {
        socket.off(`deleteComment`, deleteComment);
      };
    }, [deleteComment]);


    const tableHeader = '| Number | Split |\n| ------ | ----- |';
    const tableRows = splits.map((split) => {console.log(split); return(`| ${split.number} | ${split.split}ms |`)}).join('\n');
    const table = `${tableHeader}\n${tableRows}`;

    const handleSubmit = (text: string) => {
        const submitText = text;
        console.log("Submitting text: ", submitText);
        if(thread_name && counter) {
            socket.emit('post', {thread_name: thread_name, text: submitText});
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
        console.log("Snackbar Memo Render");
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
        console.log("Socket Memo Render");
        let color: "success" | "info" | "warning" | "error" | "default" | "primary" | "secondary" | undefined = 'info';

        if (socketStatus == 'DISCONNECTED') {
          color = 'error';
        } else if (socketStatus == 'LIVE') {
          color = 'success';
        }
        return (<Box sx={{ml: 5, p: 0.5, display: 'flex', alignItems: 'center'}}>
        <Box sx={{bgcolor: `${color}.light`, width: 8, height: 8, borderRadius: '50%'}}></Box>
        &nbsp;<Typography color={"text.primary"} variant="body1">{socketStatus}</Typography> &nbsp; <Typography color={"text.secondary"} variant="body2">{socketViewers} {socketViewers === 1 ? 'viewer' : 'viewers'}</Typography></Box>)
      }, [socketStatus, socketViewers]);

      const headerMemo = useMemo(() => {
        console.log("Header Memo Render");
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
      }, [thread, socketStatus, socketViewers, theme, lastCount])

      const countListMemo = useMemo(() => {
        console.log("Countlist Memo Render");
        return (          
        <CountList thread={thread} recentCountsLoading={recentCountsLoading} throttle={throttle} setThrottle={setThrottle} chatsOnly={false} setCachedCounts={setCachedCounts} loadedNewestRef={loadedNewestRef} setRecentChats={setRecentChats} newRecentPostLoaded={newRecentPostLoaded} userLoading={userLoading} user={user} loadedOldest={loadedOldest} cachedCounts={cachedCounts} loadedNewest={loadedNewest} loadedOldCount={loadedOldCount} loadedNewCount={loadedNewCount} setRecentCounts={setRecentCounts} isScrolledToTheBottom={isScrolledToTheBottom} isScrolledToTheTop={isScrolledToTheTop} thread_name={thread_name} isScrolledToNewest={isScrolledToNewest} cachedCounters={cachedCounters} isMounted={isMounted} context={context} socket={socket} counter={counter} loading={loading} recentCounts={recentCounts} handleLatencyCheckChange={handleLatencyCheckChange} handleLatencyChange={handleLatencyChange} handleSubmit={handleSubmit}></CountList>
        )
      }, [cachedCounts, thread, loadedNewestRef, loadedNewestRef.current, recentCountsLoading, latencyStateTest, loadedNewCount, loadedOldCount, deleteComments, loadedOldest, loadedNewest, isScrolledToNewest, userLoading, loading])

      const chatsMemo = useMemo(() => {
        console.log("Chats Memo Render");
        return (      
        <CountList thread={thread} isDesktop={isDesktop} throttle={throttle} setThrottle={setThrottle} chatsOnly={true} newRecentPostLoaded={undefined} userLoading={userLoading} user={user} loadedOldest={loadedOldestChats} loadedNewest={loadedNewestChats} loadedOldCount={loadedOldChat} loadedNewCount={loadedNewChat} setRecentCounts={setRecentChats} isScrolledToTheBottom={chatsIsScrolledToTheBottom} isScrolledToTheTop={chatsIsScrolledToTheTop} thread_name={thread_name} isScrolledToNewest={chatsIsScrolledToNewest} cachedCounters={cachedCounters} isMounted={isMounted} context={context} socket={socket} counter={counter} loading={loading} recentCounts={recentChats} handleLatencyCheckChange={undefined} handleLatencyChange={undefined} handleSubmit={undefined}></CountList>
        )
      }, [recentChatsLoading, newChatsLoadedState, loadedNewChat, loadedOldChat, deleteComments, loadedOldestChats, loadedNewestChats, chatsIsScrolledToNewest, userLoading, loading])

      const sidebarMemo = useMemo(() => {
        console.log("Sidebar Memo Render");
        return (
          <TabContext value={tabValue}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <TabList onChange={handleTabChange} aria-label="Live Game Tabs">
          <Tab label="About" value="tab_1" />
          <Tab label="Chats" value="tab_2" />
          <Tab label="Splits" value="tab_3" />
          <Tab label="Stats" value="tab_4" />
        </TabList>
      </Box>
        <Box sx={{flexGrow: 1, p: 2, bgcolor: 'background.paper', color: 'text.primary'}}>
        <TabPanel value="tab_1" sx={{}}>
          <Typography variant="h5" sx={{mb: 1}}>About</Typography>
          <Typography variant="body1" sx={{whiteSpace: 'pre-wrap'}}><ReactMarkdown children={thread ? thread.description : "Loading..."} components={{p: 'span'}} remarkPlugins={[remarkGfm]} /></Typography>
          <Typography variant="h5" sx={{mt: 2, mb: 1}}>Rules</Typography>
          <Typography variant="body1" sx={{whiteSpace: 'pre-wrap'}}><ReactMarkdown children={thread ? thread.rules : "Loading..."} components={{p: 'span'}} remarkPlugins={[remarkGfm]} /></Typography>
          {counter && thread && counter.roles.includes('admin') && <Button variant='contained' onClick={lockThread}>{thread.locked ? "Unlock Thread" : "Lock Thread"}</Button>}
        </TabPanel>
        <TabPanel value="tab_2" sx={{}}>
          <Typography variant='h4'>Chats</Typography>
          <Box sx={{height: '70vh'}}>
          {chatsMemo}
          </Box>
        </TabPanel>
        <TabPanel value="tab_3" sx={{}}>
        {lastCount && <Typography sx={{p: 0.5}} variant="body1" color="text.secondary">Last count: {lastCount.lastCount.rawCount} by {lastCount.lastCounter.name}</Typography>}
          <SplitsTable splits={splits}></SplitsTable>
        </TabPanel>
        <TabPanel value="tab_4" sx={{}}>
          <DailyHOCTable dailyHOC={dailyHOC}></DailyHOCTable>
        </TabPanel>
        </Box>
        </TabContext>
        )
      }, [tabValue, thread, newChatsLoadedState, lastCount, splits, dailyHOC])
      

      if(!loading && !threadLoading && thread) {

        console.log("ThreadPage render");

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
            <Box sx={{minHeight: 500, height: 'calc(100vh - 65px)', overflowY: 'auto', bgcolor: 'background.paper'}}>
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
