import { StateCreator, StoreMutatorIdentifier } from 'zustand';

type Logger = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  f: StateCreator<T, Mps, Mcs>,
  name?: string
) => StateCreator<T, Mps, Mcs>;

type LoggerImpl = <T>(
  f: StateCreator<T, [], []>,
  name?: string
) => StateCreator<T, [], []>;

const loggerImpl: LoggerImpl = (f, name) => (set, get, store) => {
  const loggedSet: typeof set = (...a) => {
    const previousState = get();
    set(...a);
    const nextState = get();
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${name || 'Zustand'}] State change:`, {
        previous: previousState,
        next: nextState,
      });
    }
  };
  store.setState = loggedSet;
  return f(loggedSet, get, store);
};

export const logger = loggerImpl as Logger;