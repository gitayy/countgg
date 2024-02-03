import React, { useState } from 'react'

function Lever() {
  //   const [isDragging, setIsDragging] = useState(false);
  //   const [leverPosition, setLeverPosition] = useState(0);

  //   const handleMouseDown = (e) => {
  //     setIsDragging(true);
  //     const initialX = e.clientX;
  //     e.preventDefault();

  //     const handleMouseMove = (event) => {
  //       if (isDragging) {
  //         const deltaX = event.clientX - initialX;
  //         const newPosition = leverPosition + deltaX;

  //         // Limit lever movement within a certain range
  //         const minPosition = 0;
  //         const maxPosition = 100; // Adjust as needed
  //         const clampedPosition = Math.max(minPosition, Math.min(maxPosition, newPosition));

  //         setLeverPosition(clampedPosition);
  //       }
  //     };

  //     const handleMouseUp = () => {
  //       setIsDragging(false);
  //       document.removeEventListener('mousemove', handleMouseMove);
  //       document.removeEventListener('mouseup', handleMouseUp);
  //     };

  //     document.addEventListener('mousemove', handleMouseMove);
  //     document.addEventListener('mouseup', handleMouseUp);
  //   };

  const [isPristine, setIsPristine] = useState(true)
  const [ariaChecked, setAriaChecked] = useState(true)

  const handleChange = () => {
    setIsPristine(false)
    setAriaChecked(!ariaChecked)
  }

  return (
    <form className="lever-form">
      <input
        type="checkbox"
        name="lever"
        className={`lever ${isPristine ? 'pristine' : ''}`}
        onClick={handleChange}
        id="lever"
        value="lever value"
        role="switch"
        aria-label="lever"
        aria-checked={ariaChecked}
      />
      <label htmlFor="lever">
        <span>On</span>
      </label>
      <label htmlFor="lever">
        <span>Off</span>
      </label>
    </form>
  )
}

export default Lever
