import { useEffect, useRef } from "react";
import tinycon from "tinycon";

export function useFavicon() {


  const countRef = useRef(0);

  tinycon.setOptions({
	// width: 7,
	// height: 9,
	// font: '10px arial',
	// color: '#ffffff',
	// background: '#549A2F',
	fallback: true
});

  useEffect(() => {
    // tinycon.setOptions({ width: 16, height: 16, fallback: true });

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Store the current count when the page is hidden
        countRef.current = tinycon.getBubble() || 0;
        tinycon.setBubble(0);
      } else {
        // Restore the previous count when the page is visible again
        countRef.current = 0;
        tinycon.setBubble(countRef.current);        
        tinycon.reset();
      }
    };

    // Listen for visibility changes and update the favicon accordingly
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Clean up the event listener on unmount
    return () => {
        tinycon.reset();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

//   const setCount = (count: number) => {
//     countRef.current = count;
//     tinycon.setBubble(count);
//   };

  const setCount = () => {
    countRef.current += 1;
    tinycon.setBubble(countRef.current);
  };

  return setCount;
}