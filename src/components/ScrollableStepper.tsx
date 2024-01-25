import { Box, Stepper, Step, StepLabel, Typography, useTheme, Badge } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import GiftBox from './GiftBox';
import { UserContext } from '../utils/contexts/UserContext';
import { calculateLevel, levelThresholds } from '../utils/helpers';
import ItemBox from './ItemBox';
import { LinearProgressWithLabel } from '../utils/styles';

const ScrollableStepper = () => {
  const { counter, items, loading } = useContext(UserContext);
  const theme = useTheme();
  const [level, setLevel] = useState(counter ? parseInt(calculateLevel(counter.xp).level) : 0);

  useEffect(() => {
    setLevel(counter ? parseInt(calculateLevel(counter.xp).level) : 0);
    setActiveStep(counter ? parseInt(calculateLevel(counter.xp).level) - 1 : 0);
  }, [loading])

  const [activeStep, setActiveStep] = useState(counter ? parseInt(calculateLevel(counter.xp).level) - 1 : 0);
  const steps = Array.from(Array(levelThresholds.length).keys());
  const handleStepClick = (index) => {
    setActiveStep(index);
  };

  return (
    <Box overflow="auto">
      <Stepper orientation="vertical" activeStep={activeStep}>
        {steps.map((step, index) => {
          const reward = items ? items.filter(item => {return item.levelToUnlock === index + 1}) : [];
          const isItemUnlocked = reward.length > 0;
          const hasReachedLevel = counter && (counter.xp >= levelThresholds[index].minXP)
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
                },
                ...(level === index + 1 && {
                  // '&:hover': {
                    backgroundColor: `${theme.palette.secondary.main}50`,
                    color: theme.palette.getContrastText(theme.palette.secondary.main),
                  // }
                })
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
              {counter && <Box sx={{width: '50%'}}><LinearProgressWithLabel color={hasReachedLevel ? "success" : "secondary"} progress={counter.xp} max={levelThresholds[index].minXP} /></Box>}
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