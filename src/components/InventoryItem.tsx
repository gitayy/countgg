import { makeStyles, Card, CardHeader, CardContent, Typography, IconButton } from '@mui/material';
import React, { useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// const useStyles = makeStyles((theme) => ({
const stylez = {
  card: {
    maxWidth: 300,
    margin: '4px',
  },
  content: {
    cursor: 'pointer',
    height: 72,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    transition: 'height 0.3s',
  },
  expanded: {
    height: 'auto',
  },
}
// }));

export const InventoryItem = (props: any) => {
  const [expanded, setExpanded] = useState(false);
//   const classes = useStyles();

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <Card sx={{maxWidth: 300, m: 1, minWidth: 300}}>
      <CardHeader title={props.name} subheader={props.type} sx={{p: 1}} />
      <CardContent
        sx={{
            cursor: 'pointer',
    // height: expanded ? 'auto' : 72,
    height: 'auto',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    transition: 'height 0.3s',
    p: 1
        }}
        // className={`${classes.content} ${expanded && classes.expanded}`}
        onClick={handleExpandClick}
      >
      </CardContent>
      {expanded && (
        <CardContent sx={{p: 1}}>
            <Typography variant="body2">{props.description}</Typography>
          <Typography component={'div'} variant="caption">Unlocked by: {props.unlocker}</Typography>
          <Typography component={'div'} variant="caption">Timestamp: {props.timestamp}</Typography>
        </CardContent>
      )}
      <IconButton onClick={handleExpandClick}>
        <ExpandMoreIcon />
      </IconButton>
    </Card>
  );
};