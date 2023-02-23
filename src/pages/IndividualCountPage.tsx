import { useNavigate, useParams } from 'react-router-dom';
import { memo, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CounterContext } from '../utils/contexts/CounterContext';
import { Box, Link, Stack, Theme, Typography, useMediaQuery, useTheme } from '@mui/material';
import { Loading } from '../components/Loading';
import { addCounterToCache, cachedCounters } from '../utils/helpers';
import { useFetchThread } from '../utils/hooks/useFetchThread';
import { SocketContext } from '../utils/contexts/SocketContext';
import { Counter, PostType } from '../utils/types';
import { useIsMounted } from '../utils/hooks/useIsMounted';
import Count from '../components/Count';
import CountMobile from '../components/CountMobile';
import { useFetchSpecificCount } from '../utils/hooks/useFetchSpecificCount';

export const IndividualCountPage = memo(() => {
    const params = useParams();
    const thread_name:string = params.thread_name || "main";
    const count_uuid:string = params.count_uuid || "main";
    const navigate = useNavigate();
    const theme = useTheme();

    const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'));
    
    const socket = useContext(SocketContext);
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [socketStatus, setSocketStatus] = useState("CONNECTING...");
    const [socketViewers, setSocketViewers] = useState(1);

    const { counter, loading } = useContext(CounterContext);
    const { thread, threadLoading } = useFetchThread(thread_name);
    const { specificCount, specificCountLoading, setSpecificCount } = useFetchSpecificCount(count_uuid);
    const [ modalOpen, setModalOpen ] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [lastCount, setLastCount] = useState<{lastCount: PostType, lastCounter: Counter}>();
    const isMounted = useIsMounted();

    // var latencyCheck = "";
    // const [latencyCheck, setLatencyCheck] = useState('');
    // const [latency, setLatency] = useState(0);
    const latency = useRef(0);
    const latencyCheck = useRef('');
    const myUUIDCheck = useRef('');
    const [renderLatencyCheck, setRenderLatencyCheck] = useState(false);
    // const [deleteComments, setDeleteComments] = useState(2);
    const [deleteComments, setDeleteComments] = useState("");
    const [latencyStateTest, setLatencyStateTest] = useState("");

    //turn myUUIDCheck into uuid on counter load
    useEffect(() => {
      if(counter) {
        myUUIDCheck.current = counter.uuid
      }
    }, [counter]);

    //Handle Socket data
    useEffect(() => {
        if(isMounted) {
            socket.emit('watch', thread_name)

            socket.on("connect_error", (err) => {
              console.log(`connect_error due to ${err.message}`);
            });
            socket.on(`deleteComment`, function(data) {
              setSpecificCount(prevCounts => {
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
              console.log('Cached counters: ');
              console.log(cachedCounters);
            });

            return () => {
                socket.off('connection_error');
                socket.off('post');
                socket.off('lastCount');
                socket.off('watcher_count');
                socket.off('deleteComment');
            }
        }
    },[]);

    const deleteComment = useCallback((data) => {
      console.log("Deleting comments");
      setSpecificCount((counts) =>
        counts.map((count) => {
          if (count.uuid === data.uuid) {
            return data;
          }
          return count;
        })
      );
      setLatencyStateTest(data.uuid);
    }, [setSpecificCount]);
  
    useEffect(() => {
      console.log('Creating socket useCallback');
      socket.on(`deleteComment`, deleteComment);
      return () => {
        socket.off(`deleteComment`, deleteComment);
      };
    }, [deleteComment]);    

    if(!loading && !threadLoading && thread && cachedCounters && specificCount[0]) {

        console.log("IndividualCountPage render");
        return (
            <Box sx={{ bgcolor: 'background.paper', display: 'flex', justifyContent: 'center', flexGrow: 1, p: 2 }}>
              {isDesktop ? (
                <>
                <Stack direction="column" alignItems="center" sx={{width: '50%'}}>
                    <Typography sx={{mb: 2}} variant="h5" color={"text.primary"}><Link color={"text.primary"} underline='hover' href={`.`}>{thread.title}</Link></Typography>
                    <Typography sx={{mb: 2}} variant="h6" color={"text.secondary"}>This is one update from the thread. Click the thread name above to see the latest counts, or see the context of this post <Link underline='always' color={"text.secondary"} href={`.?context=${specificCount[0].uuid}`}>here.</Link></Typography>
                    <Box sx={{ width: '100%', justifyContent: 'center', margin: { xs: 'auto', lg: 'initial' } }}>
                    {specificCount.map(count => (
                        <Count key={count.uuid} socket={socket} post={count} counter={cachedCounters[count.authorUUID]} maxWidth={'32px'} maxHeight={'32px'} />
                    ))}
                    </Box>
                </Stack>
                </>
              ) : (
                <>
                <Stack direction="column" alignItems="center" sx={{width: '100%'}}>
                    <Typography sx={{mb: 2}} variant="h5" color={"text.primary"}><Link color={"text.primary"} underline='hover' href={`.`}>{thread.title}</Link></Typography>
                    <Typography sx={{mb: 2}} variant="h6" color={"text.secondary"}>This is one update from the thread. Click the thread name above to see the latest counts, or see the context of this post <Link underline='always' color={"text.secondary"} href={`.?context=${specificCount[0].uuid}`}>here.</Link></Typography>
                    <Box sx={{ width: '100%', justifyContent: 'center', margin: { xs: 'auto', lg: 'initial' } }}>
                    {specificCount.map(count => (
                        <CountMobile key={count.uuid} socket={socket} post={count} counter={cachedCounters[count.authorUUID]} maxWidth={'32px'} maxHeight={'32px'} />
                    ))}
                    </Box>
                </Stack>
                </>
              )}
            </Box>
          );
    } else {
        return(<Loading />);
    }

});
