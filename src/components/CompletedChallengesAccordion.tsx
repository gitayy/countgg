import { ReactNode } from 'react'
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

type Props = {
  count: number
  children: ReactNode
}

// Always-collapsed-by-default section for completed (non-repeatable, no longer
// active) challenges, kept separate from the active challenge list above it.
export const CompletedChallengesAccordion = ({ count, children }: Props) => {
  if (count === 0) return null
  return (
    <Accordion
      disableGutters
      sx={{
        '&:before': { display: 'none' },
        backgroundColor: 'transparent',
        boxShadow: 'none',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle2" color="text.secondary">
          Completed ({count})
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>{children}</Box>
      </AccordionDetails>
    </Accordion>
  )
}
