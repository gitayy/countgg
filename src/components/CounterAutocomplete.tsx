import { useEffect, useRef, useState } from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import { cachedCounters } from '../utils/helpers'

interface Props {
  onCounterSelect: (users: string[]) => void
  label?: string
  debounceMs?: number
  options?: string[]
  selectedUsers?: string[]
}

const CounterAutocomplete = ({ onCounterSelect, label = 'Select User(s)', debounceMs = 200, options, selectedUsers }: Props) => {
  const [selectedCounter, setSelectedCounter] = useState<string[]>([])
  const onCounterSelectRef = useRef(onCounterSelect)

  const counterAutocompleteOptions = options ?? Object.values(cachedCounters).map((counter) => counter.username)

  useEffect(() => {
    onCounterSelectRef.current = onCounterSelect
  }, [onCounterSelect])

  useEffect(() => {
    if (!selectedUsers) return
    setSelectedCounter((prev) => {
      const current = [...prev].sort()
      const next = [...selectedUsers].sort()
      if (current.length === next.length && current.every((value, idx) => value === next[idx])) {
        return prev
      }
      return selectedUsers
    })
  }, [selectedUsers])

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
