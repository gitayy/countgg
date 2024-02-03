import { useState, useEffect } from 'react'

function CaesarCipher({ text }) {
  const [cipheredText, setCipheredText] = useState(text)
  const [isCiphered, setIsCiphered] = useState(true)
  const [isInit, setIsInit] = useState(false)

  useEffect(() => {
    setTimeout(() => {
      setIsInit(true)
    }, 60000)
    setTimeout(() => {
      setIsCiphered(false)
    }, 70000)
  }, [])

  useEffect(() => {
    if (isCiphered && isInit) {
      let currentIndex = 0
      const ciphered = getCipheredText(text)

      const intervalId = setInterval(() => {
        setCipheredText((prevText) => prevText.slice(0, currentIndex) + ciphered[currentIndex] + prevText.slice(currentIndex + 1))

        currentIndex++

        if (currentIndex === text.length) {
          clearInterval(intervalId)
        }
      }, 50)

      return () => {
        clearInterval(intervalId)
      }
    } else if (!isCiphered && isInit) {
      let currentIndex = 0
      const original = getOriginalText(cipheredText)

      const intervalId = setInterval(() => {
        setCipheredText((prevText) => prevText.slice(0, currentIndex) + original[currentIndex] + prevText.slice(currentIndex + 1))

        currentIndex++

        if (currentIndex === cipheredText.length) {
          clearInterval(intervalId)
        }
      }, 50)

      return () => {
        clearInterval(intervalId)
      }
    }
  }, [isCiphered, isInit])

  function getCipheredText(text) {
    let ciphered = ''

    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i)
      let cipheredCharCode

      if (charCode >= 65 && charCode <= 90) {
        // uppercase letter
        cipheredCharCode = ((charCode - 65 + 23) % 26) + 65
      } else if (charCode >= 97 && charCode <= 122) {
        // lowercase letter
        cipheredCharCode = ((charCode - 97 + 23) % 26) + 97
      } else {
        // not a letter
        cipheredCharCode = charCode
      }

      ciphered += String.fromCharCode(cipheredCharCode)
    }

    return ciphered
  }

  function getOriginalText(text) {
    let original = ''

    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i)
      let originalCharCode

      if (charCode >= 65 && charCode <= 90) {
        // uppercase letter
        originalCharCode = ((charCode - 65 - 23 + 26) % 26) + 65
      } else if (charCode >= 97 && charCode <= 122) {
        // lowercase letter
        originalCharCode = ((charCode - 97 - 23 + 26) % 26) + 97
      } else {
        // not a letter
        originalCharCode = charCode
      }

      original += String.fromCharCode(originalCharCode)
    }

    return original
  }

  return <span>{cipheredText}</span>
}

export default CaesarCipher
