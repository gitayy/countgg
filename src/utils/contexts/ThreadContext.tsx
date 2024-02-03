import React, { createContext, useContext, useState } from 'react'
import { ThreadType } from '../types'

type ThreadContextType = {
  threadName: string | undefined
  setThreadName: Function | undefined
  fullThread: ThreadType | undefined
  setFullThread: Function | undefined
}

const ThreadContext = createContext<ThreadContextType>({
  threadName: undefined,
  setThreadName: undefined,
  fullThread: undefined,
  setFullThread: undefined,
}) // Provide a default value

export function ThreadProvider({ children }) {
  const [threadName, setThreadName] = useState(undefined)
  const [fullThread, setFullThread] = useState<ThreadType | undefined>(undefined)

  return (
    <ThreadContext.Provider
      value={{ threadName: threadName, setThreadName: setThreadName, fullThread: fullThread, setFullThread: setFullThread }}
    >
      {children}
    </ThreadContext.Provider>
  )
}

export function useThread() {
  return useContext(ThreadContext)
}
