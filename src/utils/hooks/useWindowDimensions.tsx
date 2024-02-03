import { useState, useEffect } from 'react'

export default function useWindowDimensions() {
  const hasWindow = typeof window !== 'undefined'

  function getWindowDimensions() {
    const width = hasWindow ? Math.floor(window.visualViewport ? window.visualViewport.width : window.innerWidth) : null
    const height = hasWindow ? Math.floor(window.visualViewport ? window.visualViewport.height : window.innerHeight) : null
    return {
      width,
      height,
    }
  }

  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions())

  useEffect(() => {
    if (hasWindow) {
      const handleResize = () => {
        setWindowDimensions(getWindowDimensions())
      }

      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [hasWindow])

  return windowDimensions
}
