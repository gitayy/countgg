import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { memo, useCallback, useContext, useEffect, useRef, useState } from 'react';
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
import { UserContext } from '../utils/contexts/UserContext';

export const IndividualCountPage = memo(() => {
    const params = useParams();
    const thread_name:string = params.thread_name || "main";
    const count_uuid:string = params.count_uuid || "main";
    const navigate = useNavigate();
    const theme = useTheme();

    const location = useLocation();
    useEffect(() => {
        document.title = `View Post | countGG`;
        return (() => {
          document.title = 'countGG';
        })
      }, [location.pathname]);

    const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'));
    
    const socket = useContext(SocketContext);

    const { user, counter, loading } = useContext(UserContext);
    const { thread, threadLoading } = useFetchThread(thread_name);
    const { specificCount, specificCountLoading, setSpecificCount } = useFetchSpecificCount(count_uuid);
    const [ modalOpen, setModalOpen ] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const isMounted = useIsMounted();

    const myUUIDCheck = useRef('');
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
            socket.emit('watch', thread_name);
            socket.emit('watchCount', count_uuid);

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
            });

            return () => {
                socket.emit('leave_threads');
                socket.emit('unwatchCount', count_uuid);
                socket.off('connection_error');
                socket.off('post');
                socket.off('lastCount');
                socket.off('watcher_count');
                socket.off('deleteComment');
            }
        }
    },[]);

    const deleteComment = useCallback((data) => {
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
      socket.on(`deleteComment`, deleteComment);
      return () => {
        socket.off(`deleteComment`, deleteComment);
      };
    }, [deleteComment]);    

    if(!loading && !threadLoading && thread && cachedCounters && specificCount[0]) {

        return (
            <Box sx={{ bgcolor: 'background.paper', display: 'flex', justifyContent: 'center', flexGrow: 1, p: 2 }}>
              {isDesktop ? (
                <>
                <Stack direction="column" alignItems="center" sx={{width: '50%'}}>
                    <Typography sx={{mb: 2}} variant="h5" color={"text.primary"}><Link onClick={(e) => {e.preventDefault();navigate(`..`);}} color={"text.primary"} underline='hover' href={`..`}>{thread.title}</Link></Typography>
                    <Typography sx={{mb: 2}} variant="h6" color={"text.secondary"}>This is one update from the thread. Click the thread name above to see the latest counts, or see the context of this post <Link onClick={(e) => {e.preventDefault();navigate(`..?context=${specificCount[0].uuid}`);}} underline='always' color={"text.secondary"} href={`..?context=${specificCount[0].uuid}`}>here.</Link></Typography>
                    <Box sx={{ width: '100%', justifyContent: 'center', margin: { xs: 'auto', lg: 'initial' } }}>
                    {specificCount.map(count => (
                        <Count user={user} key={count.uuid} socket={socket} post={count} counter={cachedCounters[count.authorUUID]} maxWidth={'32px'} maxHeight={'32px'} />
                    ))}
                    </Box>
                </Stack>
                </>
              ) : (
                <>
                <Stack direction="column" alignItems="center" sx={{width: '100%'}}>
                    <Typography sx={{mb: 2}} variant="h5" color={"text.primary"}><Link onClick={(e) => {e.preventDefault();navigate(`..`);}} color={"text.primary"} underline='hover' href={`..`}>{thread.title}</Link></Typography>
                    <Typography sx={{mb: 2}} variant="h6" color={"text.secondary"}>This is one update from the thread. Click the thread name above to see the latest counts, or see the context of this post <Link onClick={(e) => {e.preventDefault();navigate(`..?context=${specificCount[0].uuid}`);}} underline='always' color={"text.secondary"} href={`..?context=${specificCount[0].uuid}`}>here.</Link></Typography>
                    <Box sx={{ width: '100%', justifyContent: 'center', margin: { xs: 'auto', lg: 'initial' } }}>
                    {specificCount.map(count => (
                        <CountMobile user={user} key={count.uuid} socket={socket} post={count} counter={cachedCounters[count.authorUUID]} maxWidth={'32px'} maxHeight={'32px'} />
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
