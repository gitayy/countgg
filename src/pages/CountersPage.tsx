import { useContext, useEffect, useState } from 'react';
import { Box, Card, CardContent, Grid, Link, Pagination, PaginationItem, Theme, Typography, useMediaQuery } from '@mui/material';
import { Loading } from '../components/Loading';
import { Counter } from '../utils/types';
import { getCountersPage } from '../utils/api';
import { Link as routerLink, useLocation, useNavigate } from 'react-router-dom';
import { CounterCard } from '../components/CounterCard';
import { useIsMounted } from '../utils/hooks/useIsMounted';
import { UserContext } from '../utils/contexts/UserContext';

export const CountersPage = () => {
  const { counter, loading } = useContext(UserContext);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [countersLoading, setCountersLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number|undefined>();
  const [count, setCount] = useState(0);
  const [urlCheck, setUrlCheck] = useState(false);
  const isMounted = useIsMounted();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'))

  const location = useLocation();
    useEffect(() => {
        document.title = `Counters | countGG`;
        return (() => {
          document.title = 'countGG';
        })
      }, [location.pathname]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const currentPage = parseInt(searchParams.get("page") || '1');
    if (!isNaN(currentPage)) {
      setUrlCheck(true);
      setPage(currentPage);
    } else {
      setUrlCheck(true);
      setPage(1);
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      if(page) {
        setCountersLoading(true);
        getCountersPage(page)
        .then(({ data }) => {
          if(isMounted.current) {
            setCounters(data.counters);
            setCount(data.pageCount);
            setCountersLoading(false);
          }
          
        })
        .catch((err) => {
          console.log(err);
        })
      }
      }
    if(urlCheck && page) {fetchData();}
  }, [urlCheck, page]);

  function handleChangePage(event, value) {
    setPage(value);
  }

  if(!loading && !countersLoading) {

    return (
      <Box sx={{ bgcolor: 'primary.light', flexGrow: 1, p: 2}}>
      <Box display="flex" flexDirection="column" alignItems="center" mt={4}>
      <Box width={isDesktop ? "75%" : "100%"}>
      <Box mb={2} display="flex" justifyContent="center">
          <Pagination
            count={Math.ceil(count / 50)}
            page={page}
            onChange={handleChangePage}
            color="primary"
            boundaryCount={2}
            renderItem={(item) => (
              <PaginationItem
                component={routerLink}
                to={`/counters?page=${item.page}`}
                {...item}
              />
            )}
            siblingCount={2}
            showFirstButton
            showLastButton
            shape="rounded"
            variant="outlined"
            size="large"
            sx={{
              "& ul": { display: "flex", justifyContent: "center" },
              "& ul li button": { fontSize: 18 },
            }}
          />
        </Box>
        <Grid container spacing={2}>
          {counters.map((counter) => (
            <Grid key={counter.uuid} item xs={12} sm={6} md={4}>
              <Link color={'inherit'} underline='none' href={`/counter/${counter.username}`} onClick={(e) => {e.preventDefault();navigate(`/counter/${counter.username}`);}}>
              <CounterCard fullSize={false} maxHeight={64} maxWidth={64} boxPadding={2} counter={counter}></CounterCard>
              </Link>
            </Grid>
          ))}
        </Grid>
        <Box mt={2} display="flex" justifyContent="center">
          <Pagination
            count={Math.ceil(count / 50)}
            page={page}
            onChange={handleChangePage}
            color="primary"
            boundaryCount={2}
            renderItem={(item) => (
              <PaginationItem
                component={routerLink}
                to={`/counters?page=${item.page}`}
                {...item}
              />
            )}
            siblingCount={2}
            showFirstButton
            showLastButton
            shape="rounded"
            variant="outlined"
            size="large"
            sx={{
              "& ul": { display: "flex", justifyContent: "center" },
              "& ul li button": { fontSize: 18 },
            }}
          />
        </Box>
      </Box>
    </Box>
    </Box>
    )
  } else {
    return(<Loading />);
  }

};
