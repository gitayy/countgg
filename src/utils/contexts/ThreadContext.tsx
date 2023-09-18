import React, { createContext, useContext, useState } from 'react';

type ThreadContextType = {
    threadName: string|undefined;
    setThreadName: Function|undefined;
};

const ThreadContext = createContext<ThreadContextType>({ threadName: undefined, setThreadName: undefined }); // Provide a default value

export function ThreadProvider({ children }) {
  const [threadName, setThreadName] = useState(undefined);

  return (
    <ThreadContext.Provider value={{ threadName: threadName, setThreadName: setThreadName }}>
      {children}
    </ThreadContext.Provider>
  );
}

export function useThread() {
  return useContext(ThreadContext);
}