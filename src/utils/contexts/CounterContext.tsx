import { createContext } from 'react';
import { Counter } from '../types';

type CounterContextType = {
  counter?: Counter;
  loading: boolean,
};

export const CounterContext = createContext<CounterContextType>({loading: true});