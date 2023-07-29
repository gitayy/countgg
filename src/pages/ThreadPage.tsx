import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { UserContext } from '../utils/contexts/UserContext';
import { Fragment, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AlertColor, alpha, Badge, Box, Button, Chip, Collapse, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Drawer, Grid, IconButton, LinearProgress, Link, List, ListItemButton, ListItemIcon, ListItemText, Skeleton, Snackbar, Tab, Theme, Typography, useMediaQuery, useTheme } from '@mui/material';
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
import moment from 'moment-timezone';
import { TerminalController } from '../components/TerminalController';
import { DailyRobTable } from '../components/DailyRobTable';
import { ThreadsContext } from '../utils/contexts/ThreadsContext';
import TagIcon from '@mui/icons-material/Tag';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';



export const ThreadPage = memo(({ chats = false }: {chats?: boolean}) => {
    const location = useLocation();
    const params = useParams();
    const { context } = queryString.parse(window.location.search);
    const thread_name:string = params.thread_name || "main";
    const navigate = useNavigate();
    const setFaviconCount = useFavicon();

    const theme = useTheme();

    const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'));
    
    const socket = useContext(SocketContext);
    const [socketStatus, setSocketStatus] = useState("CONNECTING...");
    const [socketViewers, setSocketViewers] = useState(1);

    const { user, counter, loading } = useContext(UserContext);
    const { allThreads, allThreadsLoading } = useContext(ThreadsContext);
    const { thread, threadLoading, setThread } = useFetchThread(thread_name);
    const { recentCounts, recentCountsLoading, setRecentCounts, loadedOldest, setLoadedOldest, loadedNewest, setLoadedNewest, recentCountsRef } = useFetchRecentCounts(thread_name, context, socketStatus);
    const { recentChats, recentChatsLoading, setRecentChats, loadedOldestChats, setLoadedOldestChats, loadedNewestChats, setLoadedNewestChats, recentChatsRef } = useFetchRecentChats(thread_name, context, socketStatus);
    const loadedNewestRef = useRef(false);
    const loadedNewestChatRef = useRef(false);
    const [ cachedCounts, setCachedCounts ] = useState<PostType[]>([]);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [lastCount, setLastCount] = useState<{lastCount: PostType, lastCounter: Counter}>();
    const [dailyHOC, setDailyHOC] = useState<{[authorUUID: string]: {counter: Counter, counts: number}}>();
    const [dailyRobs, setDailyRobs] = useState<{ counterUUID: string, id: number, moneyRobbed: string, postUUID: string, timestamp: string }[]|undefined>();
    const [newRecentPostLoaded, setNewRecentPostLoaded] = useState('');
    const [splits, setSplits] = useState<any>([]);

    const [mobilePickerOpen, setMobilePickerOpen] = useState(false);
    const [desktopPickerOpen, setDesktopPickerOpen] = useState(true);

      const handleMobileDrawerToggle = () => {
        setMobilePickerOpen(!mobilePickerOpen);
      };
      const handleDesktopDrawerToggle = () => {
        setDesktopPickerOpen(!desktopPickerOpen);
      };

    useEffect(() => {
      if(thread) {
        document.title = `${thread.title} | countGG`;
      } else if(threadLoading) {
        document.title = `Loading...`;
      } else if(!thread && !threadLoading) {
        document.title = `No thread found`;
      }
      return (() => {
        document.title = 'countGG';
      })
    }, [thread]);
    
    const [bank, setBank] = useState(-1);
    const [robOpen, setRobOpen] = useState(false);

    const robConfirm = () => {
      socket.emit(`rob`);
      setRobOpen(false);
    };
  
    const robCancel = () => {
      setRobOpen(false);
    };
  
    const openRobConfirm = () => {
      setRobOpen(true);
    };

    const ConfirmDialog = ({ open, handleCancel, handleConfirm }) => {
      return (
        <Dialog open={open}>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              You may only rob once per day. Your ability to rob resets at midnight Eastern (US).
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
    const postTextRef = useRef('');
    const [renderTime, setRenderTime] = useState<number>();

    useEffect(() => {  
      if(renderLatencyEnabled.current) {
        requestAnimationFrame(() => {
          endRenderRef.current = Date.now();
          console.log(`Post took ${endRenderRef.current - startRenderRef.current} ms to render (${startRenderRef.current} to ${endRenderRef.current}): ${postTextRef.current} `);
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
    const tabValueRef = useRef('tab_1')

    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
      setTabValue(newValue);
      tabValueRef.current = newValue;
      if(newValue === 'tab_2') {setNewChatsLoadedState(Date.now().toString());}
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
          },[loading, thread_name]);

          useEffect(() => {

          if(isMounted.current && loading == false && socketStatus === "LIVE") {
            socket.emit('watch', thread_name)

            socket.on(`watcher_count`, function(data) {
              setSocketViewers(data);
            });
            socket.on(`lastCount`, function(data) {
              setLastCount(data);
              addCounterToCache(data.lastCounter);
            });
            socket.on(`dailyHOC`, function(data) {
              setDailyHOC(data);
            });
            socket.on(`dailyRobs`, function(data) {
              const {robs, counters} = data;
              setDailyRobs(robs);
              if(counters) {for(const counter of counters) {addCounterToCache(counter)};}
            });
            socket.on(`bank`, function(data) {
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
              setLatencyStateTest(`${data.uuid}_${Date.now()}`);
            });
            socket.on(`postBans`, function(data) {
              if(data.counters) {
                for(const counter of data.counters) {
                  addCounterToCache(counter);
                }
              }
              setLatencyStateTest(`${data.uuid}_${Date.now()}`);
            });
            socket.on(`post`, async function(data: {post: PostType, counter: Counter}) {
              if(renderLatencyEnabled.current) {
                startRenderRef.current = Date.now(); // Needed for render latency test 2
                postTextRef.current = data.post.rawText;
              }             
                if(latencyCheck.current == data.post.rawText && data.post.authorUUID == myUUIDCheck.current) {
                    data.post.latency = Date.now() - latency.current;
                }
                addCounterToCache(data.counter);
                cache_counts(data.post);
                if(loadedNewestRef.current) {
                  if(user && user.pref_load_from_bottom) {
                    recentCountsRef.current = (() => {
                      const newCounts = [...recentCountsRef.current, data.post];
                      if (isScrolledToNewest.current !== undefined && isScrolledToNewest.current) {
                        if (newCounts.length > 50) {
                          return newCounts.slice(newCounts.length - 50);
                        } else {
                          return newCounts;
                        }
                      } else {
                        return newCounts;
                      }
                    })();                    
                    if(data.post.hasComment) {
                      recentChatsRef.current = [
                        ...recentChatsRef.current,
                        data.post
                      ];
                    
                      if (chatsIsScrolledToNewest.current !== undefined && chatsIsScrolledToNewest.current) {
                        if (recentChatsRef.current.length > 50) {
                          recentChatsRef.current = recentChatsRef.current.slice(recentChatsRef.current.length - 50);
                        }
                      }
                    }
                  } else {
                    recentCountsRef.current = [data.post, ...recentCountsRef.current];

                    if (isScrolledToNewest.current !== undefined && isScrolledToNewest.current) {
                      if (recentCountsRef.current.length > 50) {
                        recentCountsRef.current = recentCountsRef.current.slice(0, 50);
                      }
                    }
                    if(data.post.hasComment) {
                      recentChatsRef.current = [
                        data.post,
                        ...recentChatsRef.current
                      ];
                    
                      if (chatsIsScrolledToNewest.current !== undefined && chatsIsScrolledToNewest.current) {
                        if (recentChatsRef.current.length > 50) {
                          recentChatsRef.current = recentChatsRef.current.slice(0, 50);
                        }
                      }
                    }
                  }
                }
                // setRenderLatencyCheck(true); //renderLatency test 1 requirement. 
                // setNewRecentPostLoaded(data.post.uuid); // Only do this here.
                setLatencyStateTest(`${data.post.uuid}_${Date.now()}`);
                if(data.post.hasComment && tabValueRef.current === "tab_2") {
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
                  recentCountsRef.current = user && user.pref_load_from_bottom
              ? [...data.recentCounts.filter(count => !recentCountsRef.current.some(prevCount => prevCount.uuid === count.uuid)).reverse(), ...recentCountsRef.current]
              : [...recentCountsRef.current, ...data.recentCounts.filter(count => !recentCountsRef.current.some(prevCount => prevCount.uuid === count.uuid))];
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
                recentCountsRef.current = user && user.pref_load_from_bottom
              ? [...recentCountsRef.current, ...data.recentCounts.filter(count => !recentCountsRef.current.some(prevCount => prevCount.uuid === count.uuid))]
              : [...data.recentCounts.filter(count => !recentCountsRef.current.some(prevCount => prevCount.uuid === count.uuid)).reverse(), ...recentCountsRef.current];
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
              recentChatsRef.current = user && user.pref_load_from_bottom
              ? [...data.recentCounts.filter(count => !recentChatsRef.current.some(prevCount => prevCount.uuid === count.uuid)).reverse(), ...recentChatsRef.current]
              : [...recentChatsRef.current, ...data.recentCounts.filter(count => !recentChatsRef.current.some(prevCount => prevCount.uuid === count.uuid))];
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
              recentChatsRef.current = user && user.pref_load_from_bottom
              ? [...recentChatsRef.current, ...data.recentCounts.filter(count => !recentChatsRef.current.some(prevCount => prevCount.uuid === count.uuid)).reverse()]
              : [...data.recentCounts.filter(count => !recentChatsRef.current.some(prevCount => prevCount.uuid === count.uuid)), ...recentChatsRef.current];
              if(data.recentCounts && data.recentCounts[0]) {
                setLoadedNewChat(Date.now()) // lol
                setNewChatsLoadedState(data.recentCounts[0].uuid);
              }
          });

          socket.on(`updateReaction`, function(data) {
            recentCountsRef.current = recentCountsRef.current.map(chat => {
              if (chat.uuid === data.post_uuid) {
                return {
                  ...chat,
                  reactions: data.reactions
                };
              }
              return chat;
            });
            recentChatsRef.current = recentChatsRef.current.map(chat => {
              if (chat.uuid === data.post_uuid) {
                return {
                  ...chat,
                  reactions: data.reactions
                };
              }
              return chat;
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
    },[loading, thread_name, socketStatus]);

    const deleteComment = useCallback((data) => {
      recentCountsRef.current = recentCountsRef.current.map((chat) => {
        if (chat.uuid === data.uuid) {
          return data;
        }
        return chat;
      });
      recentChatsRef.current = recentChatsRef.current.map((chat) => {
        if (chat.uuid === data.uuid) {
          return data;
        }
        return chat;
      });
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
          socket.emit('post', {thread_name: thread_name, text: submitText, refScroll: refScroll, latency: renderLatencyEnabled.current});
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
        return (<Box sx={{ml: 5, p: 0.5, display: 'flex', alignItems: 'center'}}>
        <Box sx={{bgcolor: `${color}.light`, width: 8, height: 8, borderRadius: '50%'}}></Box>
        &nbsp;<Typography color={"text.primary"} variant="body1">{socketStatus}</Typography> &nbsp; <Typography color={"text.secondary"} variant="body2">{socketViewers} {socketViewers === 1 ? 'viewer' : 'viewers'}</Typography>
          </Box>)
      }, [socketStatus, socketViewers]);

      const headerMemo = useMemo(() => {
        if(thread) {return (
          <Box sx={{ display: 'flex', flexGrow: 0, p: 0.5, bgcolor: alpha(theme.palette.background.paper, 0.9)}}>
            <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={() => isDesktop ? handleDesktopDrawerToggle() : handleMobileDrawerToggle()}
            sx={{ mr: 2, ml: 2, 
              // display: { lg: 'none' }
             }}
          >
            <TagIcon />
          </IconButton>
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
      }, [thread, socketStatus, socketViewers, theme, lastCount, mobilePickerOpen, desktopPickerOpen, isDesktop])

      function groupThreadsByCategory(threads) {
        const groupedThreads = {};
      
        threads.forEach((thread) => {
          const category = thread.category || 'Uncategorized'; // If category is undefined or blank, consider it as "Uncategorized"
      
          if (!groupedThreads[category]) {
            groupedThreads[category] = [];
          }
      
          groupedThreads[category].push(thread);
        });
      
        return groupedThreads;
      }

      const initialExpandedCategories = Object.keys(groupThreadsByCategory(allThreads));
      const [expandedCategories, setExpandedCategories] = useState(initialExpandedCategories);

      // Step 2: Update handleCategoryClick function to toggle the expanded state of each category
      const handleCategoryClick = (category) => {
        if (expandedCategories.includes(category)) {
          setExpandedCategories(expandedCategories.filter((cat) => cat !== category));
        } else {
          setExpandedCategories([...expandedCategories, category]);
        }
      };
      const threadPickerMemo = useMemo(() => {

        const groupedThreads = groupThreadsByCategory(allThreads);

        if(allThreads && allThreads.length > 0) {
          const picker = 
          <Box sx={{minHeight: 500, height: {xs: '100vh', lg: 'calc(100vh - 65px)'}, width: "auto", flexGrow: 1, display: 'flex', bgcolor: 'background.paper', color: 'text.primary', flexDirection: "column", overflowY: "scroll",}}>
          {Object.keys(groupedThreads).map((category) => (
        <div key={category}>
          <ListItemButton onClick={() => handleCategoryClick(category)}>
          <ListItemIcon sx={{ minWidth: 24, paddingRight: 1 }}>
              {expandedCategories.includes(category) ? (
                <KeyboardArrowDownIcon />
              ) : (
                <KeyboardArrowRightIcon />
              )}
            </ListItemIcon>
            <ListItemText primary={category} />
          </ListItemButton>
          <Collapse in={expandedCategories.includes(category)}>
            <List>
              {groupedThreads[category].map((thread, index) => (
                <Button
                  key={thread.id}
                  startIcon={<TagIcon />}
                  sx={{
                    width: '100%',
                    opacity: thread_name === thread.name ? 1 : 0.75,
                    textAlign: 'left',
                    '&:hover': { opacity: 1 },
                    bgcolor: thread_name === thread.name ? alpha(theme.palette.primary.main, 0.5) : 'background.paper',
                    color: thread_name === thread.name ? 'text.primary' : 'text.secondary',
                    justifyContent: 'flex-start',
                  }}
                  onClick={() => navigate(`/thread/${thread.name}`)}
                >
                  {thread.title}
                </Button>
              ))}
            </List>
          </Collapse>
        </div>
      ))}
          </Box>
          return (
            // picker
          //   <Box
          //   component="nav"
          //   sx={{ width: { lg: "100%" }, flexShrink: { lg: 0 } }}
          //   aria-label="Thread Picker"
          // >
          <>
            <Drawer
              variant="temporary"
              open={mobilePickerOpen}
              anchor='left'
              onClose={handleMobileDrawerToggle}
              ModalProps={{
                keepMounted: true,
              }}
              sx={{
                display: { xs: 'block', lg: 'none' },
                boxSizing: 'border-box'
                // '& .MuiDrawer-paper': { boxSizing: 'border-box', display: "contents" },
              }}
            >
              {picker}
            </Drawer>
            <Drawer
              variant="persistent"
              sx={{
                display: { xs: 'none', lg: 'block' },
                '& .MuiDrawer-paper': { boxSizing: 'border-box', display: "contents" },
              }}
              open={desktopPickerOpen}
            >
              {picker}
            </Drawer>
            </>
          // </Box>
          )
        } 
        else {
          return (
            <Box sx={{flexGrow: 1, display: 'flex', justifyContent: 'center', bgcolor: 'background.paper', minHeight: 500, height: 'calc(100vh - 65px)' }}><Skeleton animation='wave' sx={{width: '50%', justifyContent: 'center'}} /></Box>
          )
        }
      }, [allThreadsLoading, mobilePickerOpen, desktopPickerOpen, thread_name, expandedCategories])

      const robConfirmMemo = useMemo(() => {
        return <ConfirmDialog
        open={robOpen}
        handleCancel={() => robCancel()}
        handleConfirm={() => robConfirm()}
      />
      }, [robOpen])

      const countListMemo = useMemo(() => {
        return (        
        recentCountsLoading
        ? <Box sx={{flexGrow: 1, display: 'flex', justifyContent: 'center', bgcolor: 'background.paper', minHeight: 500, height: 'calc(100vh - 65px)' }}><Skeleton animation='wave' sx={{width: '50%', justifyContent: 'center'}} /></Box>
        : <CountList thread={thread} recentCountsLoading={recentCountsLoading} chatsOnly={false} setCachedCounts={setCachedCounts} loadedNewestRef={loadedNewestRef} refScroll={refScroll} newRecentPostLoaded={newRecentPostLoaded} loadedOldest={loadedOldest} cachedCounts={cachedCounts} loadedNewest={loadedNewest} loadedOldCount={loadedOldCount} loadedNewCount={loadedNewCount} isScrolledToTheBottom={isScrolledToTheBottom} isScrolledToTheTop={isScrolledToTheTop} thread_name={thread_name} isScrolledToNewest={isScrolledToNewest} cachedCounters={cachedCounters} isMounted={isMounted} context={context} recentCounts={recentCountsRef} handleLatencyCheckChange={handleLatencyCheckChange} handleLatencyChange={handleLatencyChange} handleSubmit={handleSubmit}></CountList>
        )
      }, [cachedCounts, thread, thread_name, loadedNewestRef, loadedNewestRef.current, recentCountsLoading, latencyStateTest, loadedNewCount, loadedOldCount, deleteComments, loadedOldest, loadedNewest, isScrolledToNewest, loading])

      const chatsMemo = useMemo(() => {
        return (   
          recentChatsLoading 
          ? <Box sx={{flexGrow: 1, display: 'flex', justifyContent: 'center', bgcolor: 'background.paper', minHeight: 500, height: 'calc(100vh - 65px)' }}><Skeleton animation='wave' sx={{width: '50%', justifyContent: 'center'}} /></Box> 
          : <CountList thread={thread} isDesktop={isDesktop} chatsOnly={true} newRecentPostLoaded={undefined} loadedOldest={loadedOldestChats} loadedNewest={loadedNewestChats} loadedOldCount={loadedOldChat} loadedNewCount={loadedNewChat} isScrolledToTheBottom={chatsIsScrolledToTheBottom} isScrolledToTheTop={chatsIsScrolledToTheTop} thread_name={thread_name} isScrolledToNewest={chatsIsScrolledToNewest} cachedCounters={cachedCounters} isMounted={isMounted} context={context} recentCounts={recentChatsRef} handleLatencyCheckChange={undefined} handleLatencyChange={undefined} handleSubmit={undefined}></CountList>
        )
      }, [recentChatsLoading, newChatsLoadedState, thread_name, loadedNewChat, loadedOldChat, deleteComments, loadedOldestChats, loadedNewestChats, chatsIsScrolledToNewest, loading])

      const sidebarMemo = useMemo(() => {
        return (
          <TabContext value={tabValue}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <TabList onChange={handleTabChange} variant={'scrollable'} allowScrollButtonsMobile aria-label="Counting Tabs">
          <Tab label="About" value="tab_1" />
          <Tab label="Chats" value="tab_2" />
          <Tab label="Splits" value="tab_3" />
          <Tab label="Stats" value="tab_4" />
        </TabList>
      </Box>
        <Box sx={{flexGrow: 1, display: 'flex', bgcolor: 'background.paper', color: 'text.primary', overflowY: 'scroll'}}>
        <TabPanel value="tab_1" sx={{flexGrow: 1, p: 4}}>
          {thread && counter && thread.countBans && thread.countBans.includes(counter.uuid) && 
          <Box display="flex" alignItems="center" sx={{p: 2, border: '1px solid', borderColor: 'warning.main'}}>
          <Box component={InfoOutlined} sx={{ fontSize: 24, color: 'info.main', mr: 1 }} />
          <Typography variant="body1">
            You can no longer count in this thread. You can still post, but any count attempts will be stricken.
          </Typography>
        </Box>}
        {thread && context && <Box display="flex" alignItems="center" sx={{p: 2, mb: 2, border: '1px solid', borderColor: 'warning.main'}}>
            <Box component={InfoOutlined} sx={{ fontSize: 24, color: 'info.main', mr: 1 }} />
            <Typography variant="body1">
              You're viewing the context of an old post. For live updates, click <Link href={`/thread/${thread.name}`}>here</Link>.
            </Typography>
          </Box>}
          <Typography variant="h5" sx={{mb: 1}}>About</Typography>
          <Typography variant="body1" sx={{whiteSpace: 'pre-wrap'}}><ReactMarkdown children={thread ? thread.description : "Loading..."} components={{p: 'span'}} remarkPlugins={[remarkGfm]} /></Typography>
          <Typography variant="h5" sx={{mt: 2, mb: 1}}>Rules</Typography>
          <Typography variant="body1" sx={{whiteSpace: 'pre-wrap'}}><ReactMarkdown children={thread ? thread.rules : "Loading..."} components={{p: 'span'}} remarkPlugins={[remarkGfm]} /></Typography>
          {counter && thread && counter.roles.includes('admin') && <Button variant='contained' onClick={lockThread}>{thread.locked ? "Unlock Thread" : "Lock Thread"}</Button>}
          {thread ? <><Box sx={{mt: 2}}>
            <Typography sx={{fontSize: 9}} variant='body2'>Auto validated: {thread.autoValidated.toString()}</Typography>
            <Typography sx={{fontSize: 9}} variant='body2'>Double counting: {thread.allowDoublePosts.toString()}</Typography>
            <Typography sx={{fontSize: 9}} variant='body2'>Reset on mistakes: {thread.resetOnMistakes.toString()}</Typography>
            <Typography sx={{fontSize: 9}} variant='body2'>UUID: {thread.uuid}</Typography>
          </Box></> : <>Loading...</>}
        </TabPanel>
        <TabPanel value="tab_2" sx={{flexGrow: 1, p: 0}}>
          {/* <Typography variant='h4'>Chats</Typography> */}
          {/* <Box sx={{height: '70vh'}}> */}
          {chatsMemo}
          {/* </Box> */}
        </TabPanel>
        <TabPanel value="tab_3" sx={{flexGrow: 1}}>
        {lastCount && tabValueRef.current === "tab_3" && <>
        <Typography sx={{p: 0.5}} variant="body1" color="text.secondary">Last count: {lastCount.lastCount.rawCount} by {lastCount.lastCounter.name}</Typography>
        {thread && lastCount.lastCount && lastCount.lastCount.rawCount && ['main', 'slow', 'bars', 'parity', 'yoco', 'roulette', 'tslc', 'randomhour', '1inx', 'countdown', 'tugofwar'].includes(thread.validationType) && <LinearProgress variant="determinate" color='primary' title={`${parseInt(lastCount.lastCount.rawCount) % 1000}`} value={(parseInt(lastCount.lastCount.rawCount) % 1000) / 10} sx={{borderRadius: '10px'}} />}</>}
          <SplitsTable splits={splits}></SplitsTable>
        </TabPanel>
        <TabPanel value="tab_4" sx={{flexGrow: 1}}>
          {thread_name === 'main' && bank > -1 && <>
          <Typography sx={{p: 0.5}} variant="body1" color="text.secondary">Bank: ${bank}</Typography>
          {counter && (!counter.lastRob || (counter.lastRob && ((parseFloat(counter.lastRob) < moment().tz('America/New_York').startOf('day').unix() * 1000)))) && <Button variant="contained" onClick={() => openRobConfirm()}>
            Rob
          </Button>}
          </>}
          {dailyHOC && <DailyHOCTable mini={false} dailyHOC={dailyHOC} name={'Daily Leaderboard'} countName={'Counts'}></DailyHOCTable>}
          {dailyRobs && thread_name === "main" && <DailyRobTable dailyRobs={dailyRobs}></DailyRobTable>}
        </TabPanel>
        </Box>
        </TabContext>
        )
      }, [tabValue, thread, newChatsLoadedState, lastCount, splits, dailyHOC, dailyRobs, bank, robOpen, loading, recentChatsLoading])
      

      if(!loading && !threadLoading && thread) {

        return (<>
        {/* Render latency test 2. This one uses requestAnimationFrame and is the most accurate as possible */}
         
         {renderLatencyEnabled.current && <Box sx={{position: 'fixed', background:'#999999', zIndex: 9, fontSize: 24, bottom: 0, right: 0}}>
            {renderTime}ms
            </Box>}
        
        {snackbarMemo}
        <Grid container> 
        {user && user.pref_post_position === "Right" ? <> 
        <Grid item xs={0} lg={2} sx={{height: 'auto', }}>
            <Box sx={{minHeight: 500, height: 'calc(100vh - 65px)'}}>
              {threadPickerMemo}
              </Box>    
        </Grid>       
        <Grid item xs={12} lg={4}>
            <Box sx={{display: 'flex', flexDirection: 'column', minHeight: 500, height: 'calc(100vh - 65px)', overflowY: 'auto', bgcolor: 'background.paper'}}>
            {headerMemo}
              {sidebarMemo}
              {robConfirmMemo}
              </Box>
              </Grid>
              <Grid item xs={12} lg={desktopPickerOpen ? 6 : 8} sx={{height: 'auto', }}>
            <Box sx={{minHeight: 500, height: 'calc(100vh - 65px)'}}>
              {countListMemo}
              </Box>
              </Grid></>
        
      : <>
      <Grid item xs={0} lg={2} sx={{ height: 'auto', display: !desktopPickerOpen && isDesktop ? "none" : "initial" }}>
            <Box sx={{minHeight: 500, height: 'calc(100vh - 65px)'}}>
              {threadPickerMemo}
              </Box>    
        </Grid>  
      <Grid item xs={12} lg={desktopPickerOpen ? 6 : 8} sx={{height: 'auto', }}>
            <Box sx={{minHeight: 500, height: 'calc(100vh - 65px)'}}>
              {countListMemo}
              </Box>
              </Grid>
            <Grid item xs={12} lg={4}>
            <Box sx={{display: 'flex', flexDirection: 'column', minHeight: 500, height: 'calc(100vh - 65px)', overflowY: 'auto', bgcolor: 'background.paper'}}>
            {headerMemo}
              {sidebarMemo}
              {robConfirmMemo}
              </Box>
              </Grid></>}
        </Grid>
        
        
        </>
        )
    } else {
        return(<Loading />);
    }

});
