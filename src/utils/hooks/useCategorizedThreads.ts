import { useContext, useEffect, useState } from 'react'
import { ThreadsContext } from '../contexts/ThreadsContext'
import { UserContext } from '../contexts/UserContext'
import { ThreadType } from '../types'

export interface CategorizedThread {
  name: string
  threads: ThreadType[]
  expanded: boolean
}

const defaultOtherThreadOverrides = ['no_counting']

export function useCategorizedThreads() {
  const { allThreads, allThreadsLoading } = useContext(ThreadsContext)
  const { loading, miscSettings } = useContext(UserContext)
  const [categorizedThreads, setCategorizedThreads] = useState<CategorizedThread[]>([])

  useEffect(() => {
    if (loading || allThreadsLoading || !allThreads || allThreads.length === 0) return

    const defaultFavorites = allThreads.filter((t) =>
      ['main', 'double_counting', 'bars', 'slow', 'no_mistakes'].includes(t.name),
    )
    const defaultTraditional = allThreads.filter(
      (t) =>
        !defaultOtherThreadOverrides.includes(t.name) &&
        !defaultFavorites.includes(t) &&
        !t.allowDoublePosts &&
        !t.resetOnMistakes,
    )
    const defaultDouble = allThreads.filter(
      (t) =>
        !defaultOtherThreadOverrides.includes(t.name) &&
        ![...defaultFavorites, ...defaultTraditional].includes(t) &&
        t.allowDoublePosts &&
        !t.resetOnMistakes,
    )
    const defaultNoMistakes = allThreads.filter(
      (t) =>
        !defaultOtherThreadOverrides.includes(t.name) &&
        ![...defaultFavorites, ...defaultTraditional, ...defaultDouble].includes(t) &&
        t.resetOnMistakes,
    )
    const defaultOther = allThreads.filter(
      (t) => ![...defaultFavorites, ...defaultTraditional, ...defaultDouble, ...defaultNoMistakes].includes(t),
    )
    const defaultCategories: CategorizedThread[] = [
      { name: 'Favorites', threads: defaultFavorites, expanded: true },
      { name: 'Traditional', threads: defaultTraditional, expanded: true },
      { name: 'Double Counting', threads: defaultDouble, expanded: true },
      { name: 'No Mistakes', threads: defaultNoMistakes, expanded: true },
      { name: 'Other', threads: defaultOther, expanded: true },
    ]

    if (!miscSettings?.categories?.length) {
      setCategorizedThreads(defaultCategories)
      return
    }

    const built: CategorizedThread[] = miscSettings.categories.map((cat) => ({
      name: cat.name,
      expanded: cat.expanded,
      threads: cat.threadUUIDs
        .map((uuid) => allThreads.find((t) => t.uuid === uuid))
        .filter((t): t is ThreadType => t !== undefined),
    }))

    if (!built.find((c) => c.name === 'Other')) {
      built.push({ name: 'Other', threads: [], expanded: true })
    }

    const threadsInCategories = built.flatMap((c) => c.threads)
    const uncategorized = allThreads.filter((t) => !threadsInCategories.includes(t))

    setCategorizedThreads(
      built.map((c) => (c.name === 'Other' ? { ...c, threads: [...c.threads, ...uncategorized] } : c)),
    )
  }, [allThreads, allThreadsLoading, loading, miscSettings])

  return { categorizedThreads, setCategorizedThreads }
}
