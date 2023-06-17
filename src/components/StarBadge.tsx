import React from 'react';
import { Box, Badge, useTheme } from '@mui/material';

const StarBadge = ({ number }) => {

    const theme = useTheme();
    return (
        <Box sx={{
          position: 'relative',
        }}>
          <Badge
            badgeContent={number}
            color="primary"
            sx={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              transform: 'translate(50%, -50%)',
              borderRadius: '50%',
              background: (theme) => theme.palette.secondary.main,
              padding: '8px',
              color: (theme) => theme.palette.common.white,
              zIndex: 1,
            }}
          >
            <Box
              sx={{
                position: 'relative',
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                background: (theme) => `linear-gradient(to bottom, ${theme.palette.warning.dark}, ${theme.palette.warning.light})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 6,
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: '-24px',
                  width: '100%',
                  height: '48px',
                  background: '#FFD700',
                  zIndex: -1,
                  clipPath: 'polygon(50% 0%, 75% 30%, 75% 50%, 50% 70%, 25% 50%, 25% 30%)',
                }}
              />
            </Box>
          </Badge>
        </Box>
      );
//   return (
//     <Box sx={{
//         position: 'relative',
//       }}>
//       <Badge
//         badgeContent={number}
//         color="primary"
//         sx={{
//             position: 'absolute',
//             top: theme.spacing(1),
//             right: theme.spacing(1),
//             transform: 'translate(50%, -50%)',
//             borderRadius: '50%',
//             background: theme.palette.secondary.main,
//             padding: theme.spacing(1),
//             color: theme.palette.common.white,
//           }}
//       >
//         <Box sx={{
//     width: theme.spacing(6),
//     height: theme.spacing(6),
//     background: 'linear-gradient(135deg, yellow, orange)',
//     clipPath: 'polygon(50% 0%, 59% 35%, 95% 35%, 68% 57%, 76% 91%, 50% 70%, 24% 91%, 32% 57%, 5% 35%, 41% 35%)',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//   }}></Box>
//       </Badge>
//     </Box>
//   );
};

export default StarBadge;