import { useEffect, useRef, useState } from "react";
import { defaultCounter } from "../utils/helpers";
import { PostType } from "../utils/types";
import Count from "./Count";


//Very scuffed scrapped idea. gpt generated. it did not go as i wanted but maybe i will put it back someday


const fakePost1: PostType = {
    uuid: '12321321', 
    timestamp: Date.now().toString(), 
    timeSinceLastCount: 231,
    timeSinceLastPost: 231,
    rawText: '1',
    isCount: true, 
    isValidCount: true,
    countContent: '1',
    rawCount: '1',
    stricken: false,
    thread: 'fake',
    hasComment: false,
    authorUUID: 'fake1',
    isDeleted: false,
    isCommentDeleted: false,
    reactions: [],
  }

  const fakeCounter1 = defaultCounter('fake1');

  const fakeCounts = [
    <Count key={"1"} post={fakePost1} counter={fakeCounter1} maxWidth={'32px'} maxHeight={'32px'} />,
    <Count key={"2"} post={fakePost1} counter={fakeCounter1} maxWidth={'32px'} maxHeight={'32px'} />,
    <Count key={"3"} post={fakePost1} counter={fakeCounter1} maxWidth={'32px'} maxHeight={'32px'} />,
    <Count key={"4"} post={fakePost1} counter={fakeCounter1} maxWidth={'32px'} maxHeight={'32px'} />, 
  ]

export const ScrollingList = ({ height }) => {
    const listRef = useRef<HTMLDivElement>(null);
    const [items, setItems] = useState([1, 2, 3, 4, 5]);
  
    const itemHeight = 50; // adjust to fit your item height
    const numVisibleItems = Math.ceil(height / itemHeight);
  
    const removeItems = () => {
      const listEl = listRef.current;
      const listHeight = listEl!.scrollHeight;
      const scrollTop = listEl!.scrollTop;
      const scrollBottom = scrollTop + height;
      const numItems = Math.ceil(listHeight / itemHeight);
      const numHiddenItems = numItems - numVisibleItems;
      const firstHiddenItem = Math.floor(scrollTop / itemHeight) - 1;
      const lastHiddenItem = Math.ceil(scrollBottom / itemHeight) + 1;
  
      if (firstHiddenItem >= numHiddenItems || lastHiddenItem <= numVisibleItems) {
        return;
      }
  
      setItems((items) => {
        const newItems = [...items];
        if (firstHiddenItem >= 0) {
          newItems.splice(0, firstHiddenItem);
        }
        if (lastHiddenItem < numItems) {
          newItems.splice(lastHiddenItem - numHiddenItems);
        }
        return newItems;
      });
    };
  
    useEffect(() => {
      const listEl = listRef.current;
      const listHeight = listEl!.scrollHeight;
      const windowHeight = height;
      let animationFrameId = -112;
  
      const scroll = (timestamp) => {
        const progress = timestamp * 0.0001 % 1;
        listEl!.scrollTop = listHeight * progress - windowHeight;
        animationFrameId = window.requestAnimationFrame(scroll);
      };
  
      animationFrameId = window.requestAnimationFrame(scroll);
  
      const intervalId = setInterval(() => {
        setItems((items) => [...items, items.length + 1]);
        removeItems();
      }, 1000);
  
      return () => {
        window.cancelAnimationFrame(animationFrameId);
        clearInterval(intervalId);
      };
    }, [height]);
  
    return (
      <div
        ref={listRef}
        style={{
          height: height + 'px',
          overflow: 'hidden',
        }}
      >
        {items.map((item) => (
          <div key={item}>{item}</div>
        ))}
      </div>
    );
  };

// const ScrollingList = memo( (props: any) => {
//     const listRef = useRef<HTMLDivElement>(null);
//     const [items, setItems] = useState<number[]>([]);
//     const [scrollTop, setScrollTop] = useState(0);
  
//     useEffect(() => {
//       const listEl = listRef.current;
//       const listHeight = listEl!.scrollHeight;
//       const windowHeight = props.height;
//       let animationFrameId = -112;
  
//       const scroll = (timestamp) => {
//         const progress = timestamp * 0.0005 % 1;
//         setScrollTop(-(listHeight * progress - windowHeight));
//         animationFrameId = window.requestAnimationFrame(scroll);
//       };
  
//       animationFrameId = window.requestAnimationFrame(scroll);
  
//       const intervalId = setInterval(() => {
//         setItems((items) => [...items, items.length + 1]);
//       }, 1000);
  
//       return () => {
//         window.cancelAnimationFrame(animationFrameId);
//         // clearInterval(intervalId);
//       };
//     }, [props.height, props.keyProp]);
  
//     return (
//       <div
//         ref={listRef}
//         style={{
//           height: props.height + "px",
//           overflow: "hidden",
//         }}
//       >
//         <div style={{ transform: `translateY(${scrollTop}px)` }}>
//           {items.map((item, i) => (
//             <div key={i}>{item}</div>
//           ))}
//         </div>
//       </div>
//     );
//   });

//   export default ScrollingList;

// export const ScrollingList = ({ items, height }) => {
//     const listRef = useRef<HTMLDivElement>(null);
//     const [scrollTop, setScrollTop] = useState(0);
  
//     useEffect(() => {
//       const listEl = listRef.current;
//       const listHeight = listEl!.scrollHeight;
//       const windowHeight = height;
//       let animationFrameId = -112;
  
//       const scroll = (timestamp) => {
//         const progress = timestamp * 0.0001 % 1;
//         setScrollTop(listHeight * progress - windowHeight);
//         animationFrameId = window.requestAnimationFrame(scroll);
//       };
  
//       animationFrameId = window.requestAnimationFrame(scroll);
  
//       return () => {
//         window.cancelAnimationFrame(animationFrameId);
//       };
//     }, []);
  
//     return (
//       <div
//         ref={listRef}
//         style={{
//           height: height + 'px',
//           overflow: 'hidden',
//         }}
//       >
//         <div style={{ transform: `translateY(${scrollTop}px)` }}>
//           {items.map((item, i) => (
//             <div key={i}>{item}</div>
//           ))}
//         </div>
//       </div>
//     );
//   };

// export const ScrollingList = ({ items, scrollSpeed, itemHeight }) => {
//     const [index, setIndex] = useState(0);
//     const containerRef = useRef<HTMLDivElement>(null);
  
//     useEffect(() => {
//       const interval = setInterval(() => {
//         setIndex((index) => (index + 1) % items.length);
//       }, scrollSpeed);
  
//       return () => clearInterval(interval);
//     }, [items.length, scrollSpeed]);
  
//     useEffect(() => {
//       if (containerRef.current) {
//         containerRef.current.scrollTop = (index % items.length) * itemHeight;
//       }
//     }, [index, items.length, itemHeight]);
  
//     return (
//       <div style={{ height: '112px', overflow: "hidden", scrollBehavior: 'smooth' }} ref={containerRef}>
//         <div>
//           {items.map((item, i) => (
//             <div key={i} style={{ height: itemHeight }}>
//               {item}
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   };