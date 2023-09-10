import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import { Loading } from '../components/Loading';
import { useFetchAllThreads } from '../utils/hooks/useFetchAllThreads';
import { ThreadCard } from '../components/ThreadCard';
import { UserContext } from '../utils/contexts/UserContext';
import TabPanel from '@mui/lab/TabPanel';
import TabContext from '@mui/lab/TabContext';

export const ThreadsPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { counter, loading } = useContext(UserContext);
  const { allThreads } = useFetchAllThreads();

  const location = useLocation();
    useEffect(() => {
        document.title = `Threads | Counting!`;
        return (() => {
          document.title = 'Counting!';
        })
      }, [location.pathname]);

      const [tabValue, setTabValue] = useState('tab_Traditional');

    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
      setTabValue(newValue);
    };

  const tabStyle = {
    minWidth: 0,
    padding: '16px',
    // textTransform: 'none',
    // fontWeight: 'bold',
    // '&:hover': {
    //   backgroundColor: '#f5f5f5',
    // },
    // '&.Mui-selected': {
    //   backgroundColor: '#1976d2',
    //   color: '#fff',
    // },
  };

  const tabsStyle = {
    // backgroundColor: '#fff',
    // backgroundColor: 'background.paper',
    borderRadius: '4px',
    boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
    // '& .MuiTabs-flexContainer': {
    //   justifyContent: 'space-around',
    // },
  };

  const handleChange = (event, newValue) => {
    setTabValue(newValue);
  };

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

  const customSort = (a, b) => {
    const specificOrder = ["Traditional", "Double Counting", "No Mistakes", "Miscellaneous"];

    if (specificOrder.includes(a) && specificOrder.includes(b)) {
      return specificOrder.indexOf(a) - specificOrder.indexOf(b);
    } else if (specificOrder.includes(a)) {
      return -1;
    } else if (specificOrder.includes(b)) {
      return 1;
    }

    return a.localeCompare(b); // Keep the rest in alphabetical order
  };

  const groupedThreads = groupThreadsByCategory(allThreads);
  
  function renderThreadCards(threads) {
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
        {threads.map((thread) => (
          <ThreadCard
            key={thread.id} // Assuming the thread object has a unique 'id' property
            title={thread.title}
            description={thread.shortDescription}
            href={`/thread/${thread.name}`} // Assuming the thread object has a 'slug' property
            color1={thread.color1}
            color2={thread.color2}
          />
        ))}
      </Box>
    );
  }
  
  function renderTabPanels() {
    return Object.keys(groupedThreads)
      .sort(customSort)
      .map((category) => (
        <TabPanel key={category} value={`tab_${category}`} sx={{ flexGrow: 1 }}>
          {renderThreadCards(groupedThreads[category])}
        </TabPanel>
      ));
  }
  
  function renderTabs() {
    return (
      <Tabs
        value={tabValue}
        variant="scrollable"
        allowScrollButtonsMobile
        onChange={handleChange}
        sx={{ bgcolor: 'background.paper' }}
        style={tabsStyle}
      >
        {Object.keys(groupedThreads)
          .sort(customSort)
          .map((category) => (
            <Tab
              key={`tab_${category}`}
              label={category}
              value={`tab_${category}`}
              style={tabStyle}
            />
          ))}
      </Tabs>
    );
  }

  if(!loading && allThreads ) {
    
    return (
      <Box sx={{ bgcolor: 'primary.light', flexGrow: 1, p: 2}}>
        <Typography variant="h4">All Threads</Typography>
        <Box sx={{ bgcolor: 'transparent' }}>
          <TabContext value={tabValue}>
            {renderTabs()}
            {renderTabPanels()}
          </TabContext>
        </Box>
      </Box>
    );
  } else if(!loading && !allThreads) {
    return (
      <>
      <Box sx={{ bgcolor: 'primary.light', flexGrow: 1, p: 2}}>No threads found :(</Box>
      </>
    )
  } else {
    return(<Loading />);
  }

}
