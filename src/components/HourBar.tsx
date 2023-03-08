import { Box, Typography } from '@mui/material';

export const HourBar = ({ label }) => {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', my: 1, userSelect: 'none' }}>
        <Box
          sx={{
            flexGrow: 1,
            height: 0,
            borderTop: '1px solid',
            borderColor: 'text.secondary',
          }}
        />
        <Typography variant="body2" sx={{ mx: 1, color: 'text.secondary' }}>
          {label}
        </Typography>
        <Box
          sx={{
            flexGrow: 1,
            height: 0,
            borderTop: '1px solid',
            borderColor: 'text.secondary',
          }}
        />
      </Box>
    );
  };