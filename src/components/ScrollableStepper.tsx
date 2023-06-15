import { Box, Stepper, Step, StepLabel, Typography, useTheme, Badge } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import GiftBox from './GiftBox';
import { UserContext } from '../utils/contexts/UserContext';
import { calculateLevel, levelThresholds } from '../utils/helpers';
import ItemBox from './ItemBox';

const ScrollableStepper = () => {
  const { counter, items, loading } = useContext(UserContext);
  const theme = useTheme();
  const [level, setLevel] = useState(counter ? parseInt(calculateLevel(counter.xp).level) : 0);

  useEffect(() => {
    setLevel(counter ? parseInt(calculateLevel(counter.xp).level) : 0);
    setActiveStep(counter ? parseInt(calculateLevel(counter.xp).level) - 1 : 0);
  }, [loading])

  const [activeStep, setActiveStep] = useState(counter ? parseInt(calculateLevel(counter.xp).level) - 1 : 0);
  const steps = Array.from(Array(50).keys()); // Array of 50 steps
  const handleStepClick = (index) => {
    setActiveStep(index);
    // Perform any additional navigation or logic here
  };

  // console.log("Ok");
  // console.log(calculateLevel(2999999));
  // console.log(calculateLevel(3000000));
  // console.log(calculateLevel(3000001));

  return (
    <Box overflow="auto">
      <Stepper orientation="vertical" activeStep={activeStep}>
        {steps.map((step, index) => {
          const reward = items ? items.filter(item => {return item.levelToUnlock === index + 1}) : [];
          const isItemUnlocked = reward.length > 0;
          return (          
          <Step key={index} onClick={() => handleStepClick(index)}>
            <StepLabel
              optional={index === activeStep ? <Typography>XP Needed: {levelThresholds[index].minXP.toLocaleString()} </Typography> : null}
              sx={{
                cursor: "pointer!important", 
                transition: 'background-color 0.3s ease-in-out',
                borderRadius: theme.shape.borderRadius,
                '&:hover': {
                  backgroundColor: `${theme.palette.primary.main}50`,
                  color: theme.palette.getContrastText(theme.palette.primary.main),
                }
              }}
            >
              {counter && !isItemUnlocked && (level > index) ?
              <Typography variant="body1" component="span">
                LVL {step + 1}: 🎁 Reward Available 🎁
              </Typography>
              :
              <Typography variant="body1" component="span">
                LVL {step + 1}
              </Typography>
              }
            </StepLabel>
            {index === activeStep ? <>
              {counter && (isItemUnlocked ? <Typography>Item unlocked: {reward[0].name} ({reward[0].category})</Typography> : (level > index ? <Typography>Reward available! Press the gift box to receive your reward!</Typography> : <Typography>You're just {(levelThresholds[index].minXP - counter.xp).toLocaleString()} xp away from unlocking this reward!</Typography>))}
            {counter && (isItemUnlocked ? <ItemBox item={reward[0]} /> : (level > index ? <GiftBox level={activeStep+1} /> : <Typography variant='body2' sx={{fontSize: 12}}>1 reward at LVL {activeStep + 1}</Typography>) )}
            </> : null}
          </Step>)}
        )}
      </Stepper>
    </Box>
  );
};

export default ScrollableStepper;