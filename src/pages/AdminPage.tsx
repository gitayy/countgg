 import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { UserContext } from '../utils/contexts/UserContext';
import { CounterContext } from '../utils/contexts/CounterContext';
import { Box, Container, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
  
  export const AdminPage = () => {
    const navigate = useNavigate();
    const { user} = useContext(UserContext);
    const { counter, loading } = useContext(CounterContext);
   
    if(counter && counter.roles.includes('admin')) {
    return (<>
    <Container maxWidth="xl" sx={{ bgcolor: 'primary.light', flexGrow: 1, p: 2}}>
      <Box>
        <List>
          <ListItem disablePadding>
            <ListItemButton component="a" href="/admin/threads">
              <ListItemText primary="Threads" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component="a" href="/admin/counters">
              <ListItemText primary="Counters" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component="a" href="/admin/approve">
              <ListItemText primary="Approve Users" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Container>
    </>
    )} else {
      return (<div>Page Not Found</div>
    )}
  };
  