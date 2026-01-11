import React, { useEffect, useState } from 'react';
import { Box, Typography, IconButton, TextField, Button } from '@mui/material';
import { Check, Close, Edit } from '@mui/icons-material';
import { Counter, ThreadType } from '../../utils/types';
import Markdown from "markdown-parser-react";
import { transformMarkdown } from '../../utils/helpers';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '@mui/material/styles';


interface CommunityNotesProps {
  thread: ThreadType | undefined; // Assuming 'Thread' is a type you defined
  setThread: Function|undefined;
  counter: Counter | undefined; // Assuming 'Counter' is a type you defined
  onSave: (update: string) => void; // Function that handles the save logic
}

export default function CommunityNotes({ thread, setThread, counter, onSave }: CommunityNotesProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [updatedThread, setUpdatedThread] = useState<ThreadType | undefined>(thread);
  
    const handleEditClick = () => {
      setIsEditing(true);
    };
  
    const handleCancelClick = () => {
      setIsEditing(false);
      setUpdatedThread(thread);
    };
  
    const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (updatedThread) {
        setUpdatedThread({
          ...updatedThread,
          rules: value,
        });
      }
    };

    useEffect(() => {
      if(!isEditing && thread && updatedThread && thread.rules !== updatedThread.rules) {
        setUpdatedThread(thread);
      }
    }, [thread, isEditing])
  
    const handleSaveClick = () => {
      if(updatedThread && updatedThread.rules.length > 0 ) {
        onSave(updatedThread.rules);
        if(setThread && updatedThread) {setThread(updatedThread)}
        setIsEditing(false);
      }
    };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
            Notes
        </Typography>
        {/* {counter && getLevelFromXP(counter.xp2) >= 0 ? ( */}
        {counter && counter.xp >= 54321 ? (
            <>
            <IconButton onClick={isEditing ? handleCancelClick : handleEditClick}>
                {isEditing ? <Close /> : <Edit />}
            </IconButton>
            {isEditing && (
                <IconButton onClick={handleSaveClick}>
                <Check />
                </IconButton>
            )}
            </>
        ) : (
            <Typography variant='body2' fontSize={'small'} component="div" sx={{ width: '100%', mt: 0, color: (theme) => theme.palette.text.secondary, fontStyle: 'italic' }}>
            You can edit this when you reach level 20
            </Typography>
        )}
    </Box>

      {thread ? (
        <Box sx={{ mt: 2 }}>
          {isEditing ? (
            <TextField
              name="info"
              value={updatedThread ? updatedThread.rules || '' : ''}
              onChange={handleTextChange}
              fullWidth
              multiline
              rows={12} // Make the textbox larger
              variant="outlined"
              label="Info"
              sx={{ mb: 2 }}
              inputProps={{maxLength: 16384}}
            />
          ) : (
            
            <Typography variant="body1" sx={{overflowWrap: 'anywhere'}}>
                <Typography>{thread.rules}</Typography>  
            </Typography>
          )}
        </Box>
      ) : (
        <>Loading...</>
      )}
    </Box>
  );
}
