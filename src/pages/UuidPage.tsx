import { useState } from 'react';
import { Box, TextField, Typography } from '@mui/material';
import { convertToTimestamp, formatDateExact, formatTimeDiff} from '../utils/helpers';

export const UuidPage = () => {
    const [uuid1, setUuid1] = useState('');
    const [uuid2, setUuid2] = useState('');
  
    const timestamp1 = convertToTimestamp(uuid1);
    const timestamp2 = convertToTimestamp(uuid2);
    const timeDiff = timestamp1 && timestamp2 ? Math.abs(timestamp1 - timestamp2) : null;
  
    return (
        <Box sx={{ bgcolor: 'background.paper', flexGrow: 1, p: 2, color: 'text.primary'}}>
        <Typography variant="h4" component="h1" align="center">
          UUID to Timestamp converter
        </Typography>
  
        <TextField
          label="UUID 1"
          variant="outlined"
          fullWidth
          margin="normal"
          value={uuid1}
          onChange={(e) => setUuid1(e.target.value)}
        />
  
        <TextField
          label="UUID 2"
          variant="outlined"
          fullWidth
          margin="normal"
          value={uuid2}
          onChange={(e) => setUuid2(e.target.value)}
        />
  
        {timestamp1 !== null && (
          <Typography variant="body1" component="p">
            UUID 1 timestamp: {formatDateExact(timestamp1)} ({timestamp1})
          </Typography>
        )}
  
        {timestamp2 !== null && (
          <Typography variant="body1" component="p">
            UUID 2 timestamp: {formatDateExact(timestamp2)} ({timestamp2})
          </Typography>
        )}
  
        {timeDiff !== null && (
          <Typography variant="body1" component="p">
            Time difference: {formatTimeDiff(timestamp1, timestamp2)}
          </Typography>
        )}
  
      </Box>
    );
  }
