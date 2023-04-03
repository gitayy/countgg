import { makeStyles, Card, CardHeader, CardContent, Typography, IconButton, Button, Box, Modal } from '@mui/material';
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

  const [noteModalOpen, setNoteModalOpen] = useState(false);

  const handleNoteOpen = () => {
    setNoteModalOpen(true);
  };

  const handleNoteClose = () => {
    setNoteModalOpen(false);
  };

  const typeEmojis = {
    'key': '🔑',
    'note': '🗒️'
  }

  const noteLines = props.content ? props.content.split('\n') : [];

  return (<>
    <Card sx={{maxWidth: 300, m: 1, minWidth: 300}}>
      <CardHeader title={`${typeEmojis[props.type] ? `${typeEmojis[props.type]} ` : ''}${props.name}`} sx={{p: 1}} />
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
        // onClick={handleExpandClick}
      >
        {props.type === 'note' && <Button onClick={handleNoteOpen} variant='contained'>Read</Button>}
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
    <Modal
        open={noteModalOpen}
        onClose={handleNoteClose}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            border: '2px solid #000',
            boxShadow: 24,
            p: 4,
            maxHeight: '500px',
            width: '70vw',
            overflowY: 'scroll',
          }}
        >
          <h2 id="modal-title">{props.name}</h2>
          <p id="modal-description">
            {/* {props.content} */}
            <>
      {noteLines.map((line, index) => (
        <Typography sx={{mb: 2}} key={index}>{line}</Typography>
        // <Typography variant="body2" key={index}>{line}</Typography>
      ))}
    </>
            </p>
          <Button onClick={() => {handleNoteClose()}}>Close</Button>
        </Box>
      </Modal> 
    </>
  );
};