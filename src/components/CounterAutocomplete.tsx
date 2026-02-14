import { useEffect, useRef, useState } from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import { cachedCounters } from '../utils/helpers'

interface Props {
  onCounterSelect: (users: string[]) => void
  label?: string
  debounceMs?: number
  options?: string[]
}

const CounterAutocomplete = ({ onCounterSelect, label = 'Select User(s)', debounceMs = 200, options }: Props) => {
  const [selectedCounter, setSelectedCounter] = useState<string[]>([])
  const onCounterSelectRef = useRef(onCounterSelect)

  const counterAutocompleteOptions = options ?? Object.values(cachedCounters).map((counter) => counter.username)

  useEffect(() => {
    onCounterSelectRef.current = onCounterSelect
  }, [onCounterSelect])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onCounterSelectRef.current(selectedCounter)
    }, debounceMs)

    return () => clearTimeout(timeout)
  }, [selectedCounter, debounceMs])

  return (
    <Autocomplete
      options={counterAutocompleteOptions}
      value={selectedCounter}
      multiple
      filterSelectedOptions
      onChange={(_event, newValue) => {
        setSelectedCounter(newValue ?? [])
      }}
      renderInput={(params) => <TextField {...params} label={label} variant="outlined" />}
    />
  )
}

export default CounterAutocomplete
