import { Box, TextField, Button, Zoom, Fab, useTheme, useMediaQuery, Typography, IconButton, alpha, Theme, Tooltip } from "@mui/material";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { cachedCounters } from "../utils/helpers";
import Count  from "./Count";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { Send as SendIcon, Keyboard as KeyboardIcon } from '@mui/icons-material';
import LoginIcon from '@mui/icons-material/Login';
import CountMobile from "./CountMobile";
import AcUnitIcon from '@mui/icons-material/AcUnit';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { HourBar } from "./HourBar";

const CountList = memo((props: any) => {
    
    const boxRef = useRef<HTMLDivElement>(null);
    const theme = useTheme();
    const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg')) || props.isDesktop;
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const contextRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [firstLoad, setFirstLoad] = useState(true);
    const [isScrolledToBottom, setIsScrolledToBottom] = useState(props.user && props.user.pref_load_from_bottom ? true : false);
    const [isScrolledToTop, setIsScrolledToTop] = useState(props.user && props.user.pref_load_from_bottom ? false : true);
    const [scrollThrottle, setScrollThrottle] = useState(false);
    const [isNewRecentCountAdded, setIsNewRecentCountAdded] = useState(false);
    const [keyboardType, setKeyboardType] = useState<"text" | "search" | "none" | "email" | "tel" | "url" | "numeric" | "decimal" | undefined>('text')
    const [hasScrolledToContext, setHasScrolledToContext] = useState(false);
    const distanceFromBottom = useRef(0);
    const distanceFromTop = useRef(0);
    const submitRef = useRef<HTMLDivElement>(null);
    const endOfSubmitRef = useRef<HTMLDivElement>(null);
    const [forceRerenderSubmit, setForceRerenderSubmit] = useState('');
    const [submitColor, setSubmitColor] = useState<"primary" | "default" | "inherit" | "error" | "secondary" | "info" | "success" | "warning" | undefined>("primary")
    const scrollDiagnostics = useRef(false);
    if (window.location.href.indexOf("scrollDiagnostics") > -1) {
      scrollDiagnostics.current = true;
    }
    const loginRedirect = process.env.REACT_APP_API_HOST + '/api/auth/login'


    //Add Ctrl+Enter submit shortcut
    useEffect(() => {
        function handleKeyDown(event) {
          //Prevent Ctrl+0-9 from switching tabs (including numpad numbers)
          if ((event.ctrlKey || event.metaKey) && (event.keyCode >= 48 && event.keyCode <= 57 || event.keyCode >= 96 && event.keyCode <= 105)) {
            event.preventDefault();
          }
          if(props.user && props.user.pref_submit_shortcut == 'Enter') {
            if (event.key === 'Enter' && !event.shiftKey && !event.altKey) {
              event.preventDefault();
              handlePosting();
            }
          } else if(props.user && props.user.pref_submit_shortcut == 'Off') {
            return;
          } else {
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
              handlePosting();
            }
          }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => {
          window.removeEventListener('keydown', handleKeyDown);
        };
      }, [props.user]);

    //Scroll to bottom upon isDesktop change
    useEffect(() => {
      if(isScrolledToBottom && props.counter && props.user && props.user.pref_load_from_bottom) {
        scrollToBottomAuto();
        setTimeout(function () {scrollToBottomAuto()}, 100);
      }
    }, [isDesktop, props.counter]);

    const changeScrolledToBottom = (isScrolled: boolean) => {
      setIsScrolledToBottom(isScrolled);
      if(props.isScrolledToNewest.current !== undefined && props.user && props.user.pref_load_from_bottom) {
        props.isScrolledToNewest.current = isScrolled;
      }
      if(isScrolled) {
        setScrollThrottle(true);
        
        setTimeout(function() {
          setScrollThrottle(false)
        }, 1000);
      }
    }

    const changeScrolledToTop = (isScrolled: boolean) => {
      setIsScrolledToTop(isScrolled);
      if(props.isScrolledToNewest.current !== undefined && (!props.user || (props.user.pref_load_from_bottom === false))) {
        props.isScrolledToNewest.current = isScrolled;
      }
      if(isScrolled) {
        setScrollThrottle(true);
        
        setTimeout(function() {
          setScrollThrottle(false)
        }, 1000);
      }
    }

    const handleUnfreeze = () => {
      if(props.cachedCounts && props.cachedCounts.length > 0) {
        if(props.user && props.user.pref_load_from_bottom) {
          props.setRecentCounts(prevCounts => {
            const newCounts = [...prevCounts, ...props.cachedCounts];
              if (newCounts.length > 50) {
                return newCounts.slice(newCounts.length - 50);
              } else {
                return newCounts;
              }
          });
          props.setRecentChats(prevChats => {
            const newChats = [...prevChats,  ...props.cachedCounts.filter((count) => count.hasComment)];
              if (newChats.length > 50) {
                return newChats.slice(newChats.length - 50);
              } else {
                return newChats;
              }
          });
        } else {
          props.setRecentCounts(prevCounts => {
            const newCounts = [...props.cachedCounts, ...prevCounts];
              if (newCounts.length > 50) {
                return newCounts.slice(0, 50);
              } else {
                return newCounts;
              }
          });
          props.setRecentChats(prevChats => {
            const newChats = [ ...props.cachedCounts.filter((count) => count.hasComment), ...prevChats];
              if (newChats.length > 50) {
                return newChats.slice(0, 50);
              } else {
                return newChats;
              }
          });
        }
      
        props.setCachedCounts([]);
        if(messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        }
        props.loadedNewestRef.current = true;
        props.setLoadedNewest(true);
      } else if(props.cachedCounts && props.cachedCounts.length == 0 && props.loadedNewestRef.current !== undefined && props.loadedNewestRef.current === true) {
        props.loadedNewestRef.current = false; 
        setForceRerenderSubmit(Date.now().toString());
      } else if(props.cachedCounts && props.cachedCounts.length == 0 && props.loadedNewestRef.current !== undefined && props.loadedNewestRef.current === false) {
        props.loadedNewestRef.current = true; 
        setForceRerenderSubmit(Date.now().toString());
      }
    }

    useEffect(() => {
      setForceRerenderSubmit(Date.now().toString());
    }, [props.recentCountsLoading])
    
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            changeScrolledToBottom(true);
          }
    }

    const scrollToBottomAuto = () => {
        if (messagesEndRef.current && isScrolledToBottom == false && submitRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
            submitRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
            changeScrolledToBottom(true);
        } else {
          //console.log("Can't scroll to bottom, but something wants to. Probably already scrolled to bottom?");
        }
    }

    const scrollToTopAuto = () => {
      if (messagesEndRef.current && submitRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'auto', });
        submitRef.current.scrollIntoView({ behavior: 'auto', block: 'nearest' });
        changeScrolledToTop(true);
      } else {
        //console.log("Can't scroll to top, but something wants to. Probably already scrolled to top?");
      }
  }

    const handlePosting = () => {
      if(props.throttle.current) {
        console.log("You are being throttled.");
        setSubmitColor("error")
        return;
      }
        if(inputRef.current && inputRef.current.value.trim().length > 0) {
            props.handleLatencyChange(Date.now());
            props.handleLatencyCheckChange(inputRef.current.value.trim());
            props.handleSubmit(inputRef.current.value);
            props.setThrottle();
            setSubmitColor("primary")
            if(!props.user || (props.user && props.user.pref_noClear !== true)) {
              inputRef.current.value = '';
            } 
            if(props.counter && props.user.pref_load_from_bottom) {
              changeScrolledToBottom(true);
              if(isDesktop) {
                scrollToBottomAuto();
                setTimeout(function() {
                  scrollToBottomAuto();
                }, 100);
              }
            } else {
                scrollToTopAuto();
                setTimeout(function() {
                  scrollToTopAuto();
                }, 100);
                changeScrolledToTop(true);
            }
            inputRef.current.focus();            
        }
    }

    const toggleKeyboard = () => {
      if(keyboardType == 'text') {
        setKeyboardType('numeric')
      } else {
        setKeyboardType('text')
      }
      if(inputRef.current) {
        inputRef.current.focus();
      }
    }

    useEffect(() => {
        if (((!isScrolledToBottom && props.user && props.user.pref_load_from_bottom) || (!isScrolledToTop)) && !firstLoad) {
          setIsNewRecentCountAdded(true);
        }
      }, [props.newRecentPostLoaded]);

      useEffect(() => {
        if (((isScrolledToBottom && props.user && props.user.pref_load_from_bottom) || (isScrolledToTop)) && !firstLoad) {
          setIsNewRecentCountAdded(false);
        }
      }, [isScrolledToBottom, isScrolledToTop, props.newRecentPostLoaded]);

      useEffect(() => {
        if (messagesEndRef.current && props.recentCounts && props.isMounted && (submitRef.current || props.chatsOnly)) {
          if (firstLoad) {
            messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
            setFirstLoad(false);
            props.isScrolledToNewest.current = true;
          } else {
            if (isScrolledToBottom && props.user && props.user.pref_load_from_bottom) {
            if(!props.chatsOnly) {
              messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
              if(submitRef.current) {submitRef.current.scrollIntoView({ behavior: 'auto', block: 'end', });}
            }
            }
            
            if (contextRef.current && !hasScrolledToContext) {
              contextRef.current.scrollIntoView({ behavior: 'auto', block: 'center' });
              setHasScrolledToContext(true);
              changeScrolledToBottom(false);
            } 
          }
        }
      }, [props.recentCounts, firstLoad, ]);

      const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
        const element = event.currentTarget;
        if (scrollDiagnostics.current) {
          console.log(`Scrolling. scrollHeight: ${element.scrollHeight}, scrollTop: ${element.scrollTop}, clientHeight: ${element.clientHeight}, scrollThrottle: ${scrollThrottle}, isScrolledToTop: ${isScrolledToTop}, isScrolledToBottom: ${isScrolledToBottom}, chats: ${props.chatsOnly}`);
        }
        // setHasScrolled(true);
        if (element.scrollHeight - element.scrollTop - 2 <= element.clientHeight) {
          changeScrolledToBottom(true);
        } else {
          changeScrolledToBottom(false);
        }
        if ((element.scrollHeight - element.scrollTop - 2 <= element.clientHeight) && !scrollThrottle) {
          changeScrolledToBottom(true);
          if(props.recentCounts && props.recentCounts[0] && props.loadedNewest == false && props.user && props.user.pref_load_from_bottom) {
            const distance_From_Top = element.scrollHeight;
            distanceFromTop.current = distance_From_Top;
            if(props.chatsOnly) {
              props.socket.emit(`getNewerChats`, {thread_name: props.thread_name, uuid: props.recentCounts[props.recentCounts.length - 1].uuid})
            } else {
              props.socket.emit(`getNewer`, {thread_name: props.thread_name, uuid: props.recentCounts[props.recentCounts.length - 1].uuid})
            }
          } else if(props.recentCounts && props.recentCounts[0] && props.loadedOldest == false && props.userLoading == false && (!props.user || (props.user && !props.user.pref_load_from_bottom))) {
            const distance_From_Top = element.scrollHeight;
            distanceFromTop.current = distance_From_Top;
            if(props.chatsOnly) {
              props.socket.emit(`getOlderChats`, {thread_name: props.thread_name, uuid: props.recentCounts[props.recentCounts.length - 1].uuid})
            } else {
              props.socket.emit(`getOlder`, {thread_name: props.thread_name, uuid: props.recentCounts[props.recentCounts.length - 1].uuid})
            }
          }
        }
        if(element.scrollTop === 0) {
          changeScrolledToTop(true);
        } else {
          changeScrolledToTop(false);
        }
        if (element.scrollTop === 0 && !scrollThrottle) {
          changeScrolledToTop(true);
          if(props.recentCounts && props.recentCounts[0] && props.loadedOldest == false && props.user && props.user.pref_load_from_bottom) {
            const distance_From_Bottom = element.scrollHeight - element.scrollTop - element.clientHeight;
            distanceFromBottom.current = distance_From_Bottom;
            if(props.chatsOnly) {
              props.socket.emit(`getOlderChats`, {thread_name: props.thread_name, uuid: props.recentCounts[0].uuid})
            } else {
              props.socket.emit(`getOlder`, {thread_name: props.thread_name, uuid: props.recentCounts[0].uuid})
            }
          } else if(props.recentCounts && props.recentCounts[0] && props.loadedNewest == false) {
            const distance_From_Bottom = element.scrollHeight - element.scrollTop - element.clientHeight;
            distanceFromBottom.current = distance_From_Bottom;
            if(props.chatsOnly) {
              props.socket.emit(`getNewerChats`, {thread_name: props.thread_name, uuid: props.recentCounts[0].uuid})
            } else {
              props.socket.emit(`getNewer`, {thread_name: props.thread_name, uuid: props.recentCounts[0].uuid})
            }
          }
        } else {
          if(isScrolledToTop) {
            changeScrolledToTop(false);
          }
        }
        
      };

      const scrollToDistanceFromBottom = (distanceFromBottom) => {
        if (boxRef.current) {
          const element = boxRef.current;
          const scrollHeight = element.scrollHeight;
          const clientHeight = element.clientHeight;
          const scrollTo = scrollHeight - clientHeight - distanceFromBottom;
          element.scrollTop = scrollTo;
        }
      };
      const scrollToDistanceFromTop = (distanceFromTop) => {
        if (boxRef.current) {
          const element = boxRef.current;
          // const scrollTo = element.scrollTop + distanceFromTop;
          element.scrollTop = distanceFromTop - element.clientHeight;
        }
      };
      useEffect(() => {
        if(props.user && props.user.pref_load_from_bottom) {
        if(distanceFromBottom.current) {
          scrollToDistanceFromBottom(distanceFromBottom.current);
          setTimeout(function() {
            scrollToDistanceFromBottom(distanceFromBottom.current);
          }, 100)
        } 
      } else if(distanceFromTop.current) {
          scrollToDistanceFromTop(distanceFromTop.current);
          setTimeout(function() {
            scrollToDistanceFromTop(distanceFromTop.current);
          }, 100)
        } else {
          // console.log("No dfb/dft current (loading old posts)");
        }

      }, [props.loadedOldCount]);


      useEffect(() => {
        if(props.user && props.user.pref_load_from_bottom) {
          if(distanceFromTop.current) {
          scrollToDistanceFromTop(distanceFromTop.current);
          setTimeout(function() {
            scrollToDistanceFromTop(distanceFromTop.current);
          }, 100)
        }
       } else if(distanceFromBottom.current) {
          scrollToDistanceFromBottom(distanceFromBottom.current);
          setTimeout(function() {
            scrollToDistanceFromBottom(distanceFromBottom.current);
          }, 100)
        } else {
          // console.log("No dft/dfb current (loading new posts)");
        }

      }, [props.loadedNewCount]);

      const scrollDownMemo = useMemo(() => {
        return (<>{isNewRecentCountAdded && !firstLoad && ((props.user && props.user.pref_load_from_bottom && !isScrolledToBottom) || !props.user || (props.user && props.user.pref_load_from_bottom === false && !isScrolledToTop) ) && (<>
          {isDesktop ? (
              <Box sx={{ position: 'fixed', bottom: '130px', right: '10%' }}>
            <Zoom in={(props.user && props.user.pref_load_from_bottom) ? !isScrolledToBottom : !isScrolledToTop}>
              <Box sx={{ display: 'flex', alignItems: 'center', borderRadius: '100px', bgcolor: 'primary.main' }}>
                <Fab color="primary" variant="extended" size="medium" onClick={scrollToBottom}>
                  {props.user && props.user.pref_load_from_bottom ? <ArrowDownwardIcon /> : <ArrowUpwardIcon />}
                  New Posts
                </Fab>
              </Box>
            </Zoom>
            </Box>
          ) : (
              <Box sx={{ position: 'fixed', bottom: '130px', right: '5%' }}>
            <Zoom in={(props.user && props.user.pref_load_from_bottom) ? !isScrolledToBottom : !isScrolledToTop}>
              <Fab color="primary" size="medium" onClick={scrollToBottom}>
                {props.user && props.user.pref_load_from_bottom ? <ArrowDownwardIcon /> : <ArrowUpwardIcon />}
              </Fab>
            </Zoom>
            </Box>
          )}</>
        )}</>);
      }, [isNewRecentCountAdded, firstLoad, isScrolledToTop, isScrolledToBottom, props.recentCounts, props.user])

      const submitButtonMemo = useMemo(() => {
        if(props.counter && props.counter.roles.includes('banned')) {
          return (
            <Box ref={submitRef} sx={{maxWidth: '100%', height: '76px', display: 'flex', justifyContent: "center", alignItems: "center", bottom: 0, left: 0, right: 0, p: 2, bgcolor: alpha(theme.palette.background.paper, 0.9)}}>
                <Typography color="text.primary" variant="body1">You are banned. You can't post until you've been unbanned.</Typography>
            </Box>)
        } else if(isDesktop && props.counter && props.counter.roles.includes("counter") && props.thread && props.thread.locked === false) {
        return (
          <Box ref={submitRef} sx={{maxWidth: '100%', display: 'flex', justifyContent: "center", alignItems: "center", bottom: 0, left: 0, right: 0, padding: '0.5', background: alpha(theme.palette.background.paper, 0.9)}}>
          <Tooltip title={`${props.cachedCounts && props.cachedCounts.length} new`} placement="top" open={(props.cachedCounts && props.cachedCounts.length > 0) ? true : false} arrow >
          <IconButton onClick={() => handleUnfreeze()}>
            <AcUnitIcon color={(props.loadedNewestRef !== undefined && props.loadedNewestRef.current === false && props.recentCountsLoading === false) ?  'primary' : 'disabled'} />
          </IconButton>
            </Tooltip>
          <TextField
              variant="outlined"
              fullWidth
              multiline
              maxRows={4}
              style={{ borderRadius: '20px', padding: '10px', width: '70%' }}
              autoFocus
              inputRef={inputRef}
              inputProps={{ inputMode: keyboardType, spellCheck: 'false', autoCorrect: "off" }}
          />
          <Tooltip title="Throttled" open={submitColor == "error" ? true : false} arrow>
          <IconButton color={submitColor} onClick={() => handlePosting()}>
            <SendIcon />
          </IconButton>
          </Tooltip>
      </Box>)
        } else if(props.counter && props.counter.roles.includes("counter") && props.thread && props.thread.locked === false) {
        // } else {
          return (<>
            <Box ref={submitRef} sx={{maxWidth: '100%', height: '76px', display: 'flex', justifyContent: "center", alignItems: "center", bottom: 0, left: 0, right: 0, padding: '0.5', bgcolor: alpha(theme.palette.background.paper, 0.9)}}>
                <IconButton onClick={() => handleUnfreeze()}>
                  <AcUnitIcon color={(props.loadedNewestRef !== undefined && props.loadedNewestRef.current === false && props.recentCountsLoading === false) ?  'primary' : 'disabled'} />
                </IconButton>
                <TextField
                    variant="outlined"
                    fullWidth
                    multiline
                    maxRows={4}
                    style={{ borderRadius: '20px', padding: '10px', width: '70%' }}
                    autoFocus
                    inputRef={inputRef}
                    inputProps={{ inputMode: keyboardType, spellCheck: 'false', autoCorrect: "off" }}
                />
                <IconButton onClick={() => toggleKeyboard()}>
                  <KeyboardIcon />
                </IconButton>
                <Tooltip title="Throttled" open={submitColor == "error" ? true : false} arrow>
                <IconButton color={submitColor} onClick={() => handlePosting()}>
                  <SendIcon />
                </IconButton>
                </Tooltip>
            </Box>
            <Box ref={endOfSubmitRef}></Box></>)
        } else if(props.thread && props.thread.locked) {
          return (
            <Box ref={submitRef} sx={{maxWidth: '100%', height: '76px', display: 'flex', justifyContent: "center", alignItems: "center", bottom: 0, left: 0, right: 0, p: 2, bgcolor: alpha(theme.palette.background.paper, 0.9)}}>
                <Typography color="text.primary" variant="body1">This thread has been locked. This may be temporary, check the "About" page.</Typography>
            </Box>)
        } else if(props.counter && !props.counter.color) {
          return (
            <Box ref={submitRef} sx={{maxWidth: '100%', height: '76px', display: 'flex', justifyContent: "center", alignItems: "center", bottom: 0, left: 0, right: 0, p: 2, bgcolor: alpha(theme.palette.background.paper, 0.9)}}>
                <Typography color="text.primary" variant="body1">Your registration is not yet complete. Click the "Complete Registration" button at the top to join in!</Typography>
            </Box>)
        } else if(props.counter) {
          return (
            <Box ref={submitRef} sx={{maxWidth: '100%', height: '76px', display: 'flex', justifyContent: "center", alignItems: "center", bottom: 0, left: 0, right: 0, p: 2, bgcolor: alpha(theme.palette.background.paper, 0.9)}}>
                <Typography color="text.primary" variant="body1">Your registration is pending verification. No further action from you is required. To avoid abuse, we are manually verifying accounts at the moment. Our apologies. Check back shortly, you'll be able to count soon!</Typography>
            </Box>)
        } else if(!props.loading && !props.counter) {
          return (
            <Box ref={submitRef} sx={{maxWidth: '100%', height: '76px', maxHeight: '76px', display: 'flex', justifyContent: "center", alignItems: "center", bottom: 0, left: 0, right: 0, p: 0, bgcolor: alpha(theme.palette.background.paper, 0.9)}}>
                <Typography color="text.primary" variant="h6">Sign up to join. &nbsp;</Typography>
              &nbsp;<Button href={loginRedirect} variant="contained" color="secondary" startIcon={<LoginIcon />}>
                Sign Up
              </Button>
            </Box>)
        }
      }, [inputRef, props.thread, submitColor, keyboardType, theme, isDesktop, props.counter, props.cachedCounts, props.loadedNewestRef, props.loadedNewest, forceRerenderSubmit, props.recentCountsLoading])

      const countsMemo = useMemo(() => {
          const countsByDayAndHour = {};
          const today = new Date();
          const yesterday = new Date(Date.now() - 86400000);
          let prevHour;
          let prevKey;

          props.recentCounts.forEach((count, index) => {
            const date = new Date(parseInt(count.timestamp));
            const hour = date.getHours();
            const key = `${date.getFullYear()}-${date.getDate()}-${hour}`;

            if (!countsByDayAndHour[key]) {
              const dateWithoutMinutes = new Date(date.setMinutes(0));
              let day;
              if (dateWithoutMinutes.toLocaleDateString() === today.toLocaleDateString()) {
                day = 'Today at ' + dateWithoutMinutes.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' });
              } else if (dateWithoutMinutes.toLocaleDateString() === yesterday.toLocaleDateString()) {
                day = 'Yesterday at ' + dateWithoutMinutes.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' });
              } else {
                day = dateWithoutMinutes.toLocaleDateString() + ' at ' + dateWithoutMinutes.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' });
              }
              countsByDayAndHour[key] = {
                day,
                hour,
                counts: [],
              };
            }

            // if ((prevHour === hour || !prevHour) && index !== props.recentCounts.length - 1) {
            //   countsByDayAndHour[key].showHourBar = true;
            // } else {
            //   countsByDayAndHour[key].showHourBar = false;
            // }

            if ((prevKey !== key || !prevKey || index === props.recentCounts.length - 1) && countsByDayAndHour[key].showHourBar !== false) {
              if(props.user && props.user.pref_load_from_bottom && index === 0) {
                countsByDayAndHour[key].showHourBar = false;
              } else if((!props.user || (props.user && !props.user.pref_load_from_bottom)) && index === props.recentCounts.length - 1) {
                countsByDayAndHour[key].showHourBar = false;
              } else {
                countsByDayAndHour[key].showHourBar = true;
              }
            } 
            // else if(props.user && props.user.pref_load_from_bottom && index === 0) {
            //   console.log("Yepper");
            //   countsByDayAndHour[key].showHourBar = false;
            // }
            // else if(index === props.recentCounts.length - 1) {
            //   countsByDayAndHour[key].showHourBar = false;
            // }
        
            countsByDayAndHour[key].counts.push(count);
        
            prevHour = hour;
            prevKey = key;
          });
          return Object.keys(countsByDayAndHour).map((key, index) => {
            const { day, counts, showHourBar } = countsByDayAndHour[key];
            const shouldShowHourBar = showHourBar
            return (
              <div key={key}>
                {props.user && props.user.pref_load_from_bottom && shouldShowHourBar && (
                  <HourBar label={day} />
                )}
                {counts.map(count => {
                  const contextMatch = props.context && props.context === count.uuid;
                  const ref = contextMatch ? contextRef : null;
                  if(isDesktop) {
                  return (
                    <Count user={props.user} myCounter={props.counter} key={count.uuid} thread={props.thread} socket={props.socket} post={count} counter={cachedCounters[count.authorUUID]} maxWidth={'32px'} maxHeight={'32px'} contextRef={ref} />
                  );
                  } else {
                    return (
                      <CountMobile user={props.user} myCounter={props.counter} key={count.uuid} thread={props.thread} socket={props.socket} post={count} counter={cachedCounters[count.authorUUID]} maxWidth={'32px'} maxHeight={'32px'} contextRef={ref} />
                    );
                  }
                })}
                {/* {shouldShowHourBar && (
                  <HourBar label={`${day} at ${hour}:00`} hour={hour} />
                )} */}
                {/* {isToday && !shouldShowHourBar && (
                  <HourBar label="Today" hour={day} />
                )}
                {isYesterday && !shouldShowHourBar && (
                  <HourBar label="Yesterday" hour={day} />
                )}
                {!isToday && !isYesterday && !shouldShowHourBar && (
                  <HourBar label={day} hour={day} />
                )} */}
                {(!props.user || (props.user && !props.user.pref_load_from_bottom)) && shouldShowHourBar && (
                  <HourBar label={day} />
                )}
              </div>
            );
          });
      //     return (
      //       <Box sx={{maxWidth: '100%', margin: 'initial',}}>
      //         {/* {props.recentCounts.map(count => {
      //           const contextMatch = props.context && props.context === count.uuid;
      //           const ref = contextMatch ? contextRef : null;
      //           return (
      //             <Count user={props.user} myCounter={props.counter} key={count.uuid} thread={props.thread} socket={props.socket} post={count} counter={cachedCounters[count.authorUUID]} maxWidth={'32px'} maxHeight={'32px'} contextRef={ref} />
      //           );
      //         })} */}
      //       </Box>
      //     ); 
      // } else {
      //   return (<Box sx={{maxWidth: '100%', margin: 'auto'}}>{props.recentCounts.map(count => {
      //     const contextMatch = props.context && props.context === count.uuid;
      //     const ref = contextMatch ? contextRef : null;
      //     return (
      //       <CountMobile user={props.user} myCounter={props.counter} key={count.uuid} thread={props.thread} socket={props.socket} post={count} counter={cachedCounters[count.authorUUID]} maxWidth={'32px'} maxHeight={'32px'} contextRef={ref} />
      //     );
      //   })}</Box>); 
      // }
      }, [props.recentCounts, cachedCounters, isDesktop]);

      const [submitHeight, setSubmitHeight] = useState(76);

      useEffect(() => {
        const submit = submitRef.current;

        if(!submit) return;
    
        const resizeObserver = new ResizeObserver(() => {
          // The size of the textbox has changed. 
          if(submitRef.current) {
            setSubmitHeight(submitRef.current.getBoundingClientRect().height);
          } 
        });
    
        resizeObserver.observe(submit);
    
        return () => {
          resizeObserver.unobserve(submit);
        };
      }, [submitRef.current]);

      if(props.user && props.user.pref_load_from_bottom) {
        return (<>
          <Box ref={boxRef} onScroll={handleScroll} sx={{ height: submitRef.current ? `calc(100% - ${submitHeight}px)` : 'calc(100% - 76px)', flexGrow: 1, bgcolor: 'background.paper', overflow: 'auto', position: 'relative' }}>
      
                  {countsMemo}
                  <div ref={messagesEndRef} />
              </Box>
      
              {scrollDownMemo}
              {!props.chatsOnly && submitButtonMemo}
              </>
          )
      } else {
        return (<>
          {!props.chatsOnly && submitButtonMemo}
            <Box ref={boxRef} onScroll={handleScroll} sx={{ height: submitRef.current ? `calc(100% - ${submitHeight}px)` : 'calc(100% - 76px)', flexGrow: 1, bgcolor: 'background.paper', overflow: 'auto', position: 'relative' }}>
              <div ref={messagesEndRef}></div>
                    {countsMemo}
                    
                </Box>
                {scrollDownMemo}
                
                </>
            )
}
        // };
      });

      export default CountList;