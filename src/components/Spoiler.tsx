import React, { useState } from 'react'
import { Box, Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

const Spoiler = ({ title, children }) => {
  const [expanded, setExpanded] = useState(false)

  const toggleExpanded = () => {
    setExpanded(!expanded)
  }

  return (
    <Box
      width="100%"
      borderRadius="4px"
      overflow="hidden"
      border="1px solid"
      borderColor={expanded ? 'text.primary' : 'divider'}
      bgcolor={expanded ? 'text.primary' : 'background.paper'}
    >
      <Accordion expanded={expanded} onChange={toggleExpanded}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="spoiler-content"
          id="spoiler-header"
          sx={{
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'text.primary',
              color: 'background.paper',
            },
          }}
        >
          {title}
        </AccordionSummary>
        <AccordionDetails>
          <Box p={2} bgcolor="background.paper" color="text.primary">
            {children}
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  )
}

export default Spoiler
