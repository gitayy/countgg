import { useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { Counter } from '../utils/types';

const CounterAutocomplete = ({ counters, onCounterSelect }) => {
  const [selectedCounter, setSelectedCounter] = useState<Counter|null>(null);

  return (
    <Autocomplete
      options={counters}
      value={selectedCounter}
      onChange={(event, newValue) => {
        setSelectedCounter(newValue);
        onCounterSelect(newValue);
      }}
      renderInput={(params) => (
        <TextField {...params} label="Select User" variant="outlined" />
      )}
    />
  );
};

export default CounterAutocomplete;
