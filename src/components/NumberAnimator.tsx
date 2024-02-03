import { useState, useEffect } from 'react';

const NumberAnimator = ({ number, startRange, endRange }) => {
    const [animatedNumber, setAnimatedNumber] = useState(number);
  
    useEffect(() => {
      let intervalId;
  
      // Run animation when the number prop changes
      const animateOnNumberChange = () => {
        const startTime = Date.now();
        const duration = 500; // 1 second
  
        intervalId = setInterval(() => {
          const elapsedTime = Date.now() - startTime;
          if (elapsedTime < duration) {
            const progress = elapsedTime / duration;
            const randomValue = Math.floor(progress * (endRange - startRange + 1) + startRange);
            setAnimatedNumber(randomValue);
          } else {
            // Stop the interval after 1 second
            clearInterval(intervalId);
            setAnimatedNumber(number);
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

// const NumberAnimator = ({ number, startRange, endRange }) => {
//   const [animatedNumber, setAnimatedNumber] = useState(number);

//   useEffect(() => {
//     let intervalId;

//     const animateNumber = () => {
//       const randomValue = Math.floor(Math.random() * (endRange - startRange + 1) + startRange);
//       setAnimatedNumber(randomValue);
//     };

//     // Start animation when component mounts
//     intervalId = setInterval(animateNumber, 1000);

//     // Cleanup interval when component unmounts
//     return () => clearInterval(intervalId);
//   }, [startRange, endRange]);

//   return <div>{animatedNumber}</div>;
// };

// export default NumberAnimator;