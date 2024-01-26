import { useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { Counter } from '../utils/types';
import { cachedCounters } from '../utils/helpers';

const CounterAutocomplete = ({ onCounterSelect }) => {
  const [selectedCounter, setSelectedCounter] = useState<string[]|undefined>();

  const counterAutocompleteOptions = Object.values(cachedCounters).map(counter => counter.username)

  return (
    <Autocomplete
      options={counterAutocompleteOptions}
      value={selectedCounter}
      multiple
      onChange={(event, newValue) => {
        setSelectedCounter(newValue);
        onCounterSelect(newValue);
      }}
      renderInput={(params) => (
        <TextField {...params} label="Select User(s)" variant="outlined" />
      )}
    />
  );
};

export default CounterAutocomplete;
