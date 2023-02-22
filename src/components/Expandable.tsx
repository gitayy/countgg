import { Accordion, AccordionDetails, AccordionSummary, Box, Checkbox, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { FC } from 'react';

interface Props {
    title: string;
    description: string[];
    isExpanded: boolean;
    onToggle: any;
    index: number;
}

export const Expandable: FC<Props> = ({ title, description, isExpanded, onToggle, index }) => {
  return (
    <Box onClick={() => onToggle(index)}>
    <Accordion sx={{mb: 0.5}}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">{title}</Typography>
        {isExpanded && <Checkbox checked={isExpanded} />}
      </AccordionSummary>
      <AccordionDetails>
        {description.map((text, index) => (
            <Typography key={index} paragraph>
                {text}
            </Typography>
        ))}
      </AccordionDetails>
    </Accordion>
    </Box>
  );
}