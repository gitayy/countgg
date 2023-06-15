import { makeStyles, Box, Typography, Button, useTheme } from '@mui/material';
import React, { useContext } from 'react';
import { Item } from '../utils/types';
import { UserContext } from '../utils/contexts/UserContext';
import { CounterCard } from './CounterCard';
import Count from './Count';
import { fakePost } from '../utils/helpers';

interface ItemBoxProps {
    item: Item;
  }

const ItemBox = ({item}: ItemBoxProps) => {

    const theme = useTheme();
    const {user, counter} = useContext(UserContext);

const useStyles = {
  giftBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(3),
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[3],
  },
  giftImage: {
    width: 200,
    height: 200,
    marginBottom: theme.spacing(2),
  },
};
  const handleOpenClick = () => {
    // Handle the "open" button click event
  };

  const fakeCounter = counter ? {...counter} : undefined;

  if(item.category === 'card' && counter && fakeCounter) {
    fakeCounter.cardStyle = item.internal_name
  } else if(item.category === 'border' && counter && fakeCounter) {
    fakeCounter.cardBorderStyle = item.internal_name
  } else if(item.category === 'title' && counter && fakeCounter) {
    fakeCounter.title = item.internal_name;
  } else if(item.category === 'emoji' && counter && fakeCounter) {
    fakeCounter.emoji = item.internal_name;
  }

  return (
    ['card', 'border', 'title'].includes(item.category)
    ? <CounterCard fullSize={true} maxHeight={100} maxWidth={100} boxPadding={2} counter={fakeCounter}></CounterCard>
    : <Count user={user} myCounter={fakeCounter} key={`fakeCount_${Math.random()}`} thread={{}} socket={{}} post={fakePost(fakeCounter)} counter={fakeCounter} maxWidth={'32px'} maxHeight={'32px'} />
    // <Box sx={useStyles}>
    //   <Typography variant="h6" component="h2" gutterBottom>
    //     {item.name}
    //   </Typography>
    // </Box>
  );
};

export default ItemBox;