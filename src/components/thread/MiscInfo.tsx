import React, { useState } from 'react';
import { Box, Typography, Collapse, IconButton, alpha, useTheme } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';

export default function MiscInfo({ thread }) {
  const [open, setOpen] = useState(false);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const theme = useTheme()

  return (
    <>
      <Box onClick={handleToggle} bgcolor={alpha(theme.palette.primary.light, 0.25)} sx={{ p: 1, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
        <Typography variant="body1" sx={{ flexGrow: 1 }}>
          Info
        </Typography>
        <IconButton>
          {open ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={open} timeout="auto" unmountOnExit>
        {thread ? (
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ fontSize: 9 }} variant="body2">
              Auto validated: {thread.autoValidated.toString()}
            </Typography>
            <Typography sx={{ fontSize: 9 }} variant="body2">
              Double counting: {thread.allowDoublePosts.toString()}
            </Typography>
            <Typography sx={{ fontSize: 9 }} variant="body2">
              Reset on mistakes: {thread.resetOnMistakes.toString()}
            </Typography>
            <Typography sx={{ fontSize: 9 }} variant="body2">
              Validation type: {thread.validationType}
            </Typography>
            <Typography sx={{ fontSize: 9 }} variant="body2">
              First count: {thread.firstValidCount}
            </Typography>
            <Typography sx={{ fontSize: 9 }} variant="body2">
              UUID: {thread.uuid}
            </Typography>
          </Box>
        ) : (
          <>Loading...</>
        )}
      </Collapse>
    </>
  );
}
