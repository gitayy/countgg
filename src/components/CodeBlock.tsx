import { Box, alpha, useTheme } from '@mui/material';

export const CodeBlock = ({ children }) => {

    const theme = useTheme();

  return (<Box
    component="code"
    sx={{
      display: 'inline-block',
      backgroundColor: alpha(theme.palette.primary.light, 0.5),
      borderRadius: '4px',
      padding: '2px 4px',
      fontFamily: 'Monaco, monospace',
      fontSize: '0.875em',
    }}
  >
    {children}
  </Box>)
};