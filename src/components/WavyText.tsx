const WavyText = ({ text }) => {
  return (
    // <div className="wrap">
    //   <h1>{text.split('').map((char, index) => <span key={index}>{char}</span>)}</h1>
    // </div>
    <div className="wrap">
      {Array.from({ length: 20 }, (_, i) => (
        <h1 key={i}>
          {text.split('').map((char, index) => (
            <span key={index}>{char}</span>
          ))}
        </h1>
      ))}
    </div>
  )
}

export default WavyText

// const WavyText = ({ text }) => {
//     const b = "#222";
//     const num = 20;

//     const stroked = (stroke, color) => {
//       let shadow: string[] = [];
//       const from = stroke * -1;

//       for (let i = from; i <= stroke; i++) {
//         for (let j = from; j <= stroke; j++) {
//           shadow.push(`${i}px ${j}px 0 ${color}`);
//         }
//       }

//       return shadow.join(', ');
//     };

//     const strokeMixin = (stroke, color) => {
//       return {
//         textShadow: stroked(stroke, color),
//       };
//     };

//     return (
//       <div style={{ background: b, width: '100%', height: '100vh', overflow: 'hidden', fontFamily: 'Coop' }}>
//         <div style={{ position: 'absolute', left: '50%', top: '50%', width: '300px', height: '300px', transform: 'translateX(-50%) translateY(-50%)' }}>
//           <h1 style={{ color: b, position: 'absolute', fontSize: '100px', textAlign: 'center', lineHeight: '0.75', ...strokeMixin(1, '#26A69A') }}>
//             {Array.from({ length: num }, (_, i) => (
//               <span
//                 key={i}
//                 style={{
//                   display: 'inline-block',
//                   animation: `bounce 1s ease-in-out infinite`,
//                   animationDelay: `${i / -20}s`,
//                   willChange: 'transform',
//                 }}
//               >
//                 {Array.from({ length: num }, (_, j) => (
//                   <span
//                     key={j}
//                     style={{
//                       display: 'inline-block',
//                       animation: `rotate 1s ease-in-out infinite alternate`,
//                       animationDelay: `${j / -5}s`,
//                       willChange: 'transform',
//                     }}
//                   >
//                     {text}
//                   </span>
//                 ))}
//               </span>
//             ))}
//           </h1>
//         </div>
//       </div>
//     );
//   };

//   export default WavyText;
