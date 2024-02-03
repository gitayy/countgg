import React, { useState, useEffect } from 'react'
import CaesarCipher from './Caesar'

function Timer() {
  const targetTime = Date.parse('2023-04-01T04:00:00Z') // the target time to count down to
  const [remainingTime, setRemainingTime] = useState(targetTime - Date.now()) // calculate the initial remaining time
  const [showOops, setShowOops] = useState(false) // set the flag to false initially
  const [stopped, setStopped] = useState(false) // set the flag to false initially

  useEffect(() => {
    if (!stopped) {
      const timer = setInterval(() => {
        const remainingTime = targetTime - Date.now()
        setRemainingTime(remainingTime)

        if (remainingTime <= 10 * 60 * 1000) {
          // if less than 10 minutes remaining
          setShowOops(true) // set the flag to true
        }
      }, 501)

      return () => clearInterval(timer) // clear the timer when the component unmounts
    }
  }, [stopped, targetTime])

  const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24))
  const hours = Math.floor((remainingTime / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((remainingTime / 1000 / 60) % 60)
  const seconds = Math.floor((remainingTime / 1000) % 60)

  let timeString = ''
  if (days !== 0) {
    timeString += `${days}:`
  }
  if (hours !== 0 || days !== 0) {
    timeString += `${hours.toString().padStart(2, '0')}:`
  }
  timeString += `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  function handleClick() {
    setStopped(true)
    setShowOops(false)
  }

  const timerStyle = {
    backgroundColor: showOops ? 'rgba(255, 0, 0, 0.5)' : 'transparent',
    marginTop: '10px',
    cursor: stopped ? 'default' : 'pointer',
  }

  return (
    <div onClick={handleClick} title={`4/1/2023`} style={timerStyle}>
      {showOops ? (
        `You're on an older version of the site. If you see this, try refreshing. If refreshing doesn't work, see if admin is just late pushing the site update. Thank you for your participation.`
      ) : stopped ? (
        `Be there.`
      ) : (
        <>
          <CaesarCipher text={'Prepare.'} />
          &nbsp;{timeString}
        </>
      )}
    </div>
  )
}

export default Timer
