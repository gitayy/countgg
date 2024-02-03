import { useState, useEffect } from 'react';

const NumberAnimator = ({ number, startRange, endRange, animationDuration }) => {
    const [animatedNumber, setAnimatedNumber] = useState(number);
  
    useEffect(() => {
      let intervalId;
  
      // Run animation when the number prop changes
      const animateOnNumberChange = () => {
        const startTime = Date.now();
        const duration = animationDuration;
  
        intervalId = setInterval(() => {
          const elapsedTime = Date.now() - startTime;
          if (elapsedTime < duration) {
            const progress = elapsedTime / duration;
            const randomValue = Math.floor(progress * (endRange - startRange + 1) + startRange);
            setAnimatedNumber(randomValue);
          } else {
            setAnimatedNumber(number);
            clearInterval(intervalId);
          }
        }, 16); // Approximately 60 frames per second
      };
  
      animateOnNumberChange();
  
      // Cleanup interval when component unmounts or number prop changes
      return () => clearInterval(intervalId);
    }, [number, startRange, endRange]);
  
    return <div>{animatedNumber}</div>;
  };
  
  export default NumberAnimator;