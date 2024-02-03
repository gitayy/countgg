import { useEffect, useState } from 'react'
import { getCounter } from '../api'
import { AllegianceType, Counter } from '../types'
import { useIsMounted } from './useIsMounted'

export function useCounterConfig() {
  const [counter, setCounter] = useState<Counter>()
  const [loading, setLoading] = useState<boolean>(true)
  const [allegiance, setAllegiance] = useState<AllegianceType>()
  const isMounted = useIsMounted()

  useEffect(() => {
    getCounter()
      .then(({ data }) => {
        if (isMounted.current) {
          setCounter(data.counter)
          if (data.allegiance) {
            setAllegiance(data.allegiance)
          }
        }
        setLoading(false)
      })
      .catch((err) => {
        console.log(err)
      })
  }, [])

  return { counter, loading, setCounter, allegiance, setAllegiance }
}
