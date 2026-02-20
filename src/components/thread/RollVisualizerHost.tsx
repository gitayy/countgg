import React, {
  ForwardedRef,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Button } from '@mui/material'
import { cachedCounters } from '../../utils/helpers'
import { PostType } from '../../utils/types'
import RollVisualizer, { RollLuckStats, RollSample } from './RollVisualizer'

const MAX_RENDERED_ROLLS = 100
const EXTREMA_HISTORY_CAP = 100
const UI_FLUSH_INTERVAL_MS = 16
const SIM_INTERVAL_MS = 50
const DEFAULT_CHANCE = 1 / 4147

export type RollVisualizerHostHandle = {
  registerSampleFromPost: (post?: PostType) => void
  reset: () => void
}

type Props = {
  threadName: string
}

const initialLuckStats: RollLuckStats = {
  currentPercent: 100,
  currentProb: 1,
  currentCount: 0,
  lastCompletedProb: null,
  lastCompletedCount: 0,
}

function RollVisualizerHostComponent({ threadName }: Props, ref: ForwardedRef<RollVisualizerHostHandle>) {
  const [rollSamples, setRollSamples] = useState<RollSample[]>([])
  const [rollHighSamples, setRollHighSamples] = useState<RollSample[]>([])
  const [rollLowSamples, setRollLowSamples] = useState<RollSample[]>([])
  const [highestRollSample, setHighestRollSample] = useState<RollSample | undefined>(undefined)
  const [lowestRollSample, setLowestRollSample] = useState<RollSample | undefined>(undefined)
  const [isSimulatingRolls, setIsSimulatingRolls] = useState(false)
  const [rollLuckStats, setRollLuckStats] = useState<RollLuckStats>(initialLuckStats)

  const rollSamplesRef = useRef<RollSample[]>([])
  const rollSimulatorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const rollFlushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRollSamplesRef = useRef<RollSample[]>([])
  const sampleIdCounterRef = useRef(0)
  const simulationCounterRef = useRef(0)

  const persistSamples = useCallback((samples: RollSample[]) => {
    rollSamplesRef.current = samples
    setRollSamples(samples)
  }, [])

  const flushPendingRollSamples = useCallback(() => {
    const pending = pendingRollSamplesRef.current
    if (pending.length === 0) return
    pendingRollSamplesRef.current = []

    const queued = [...pending]
    persistSamples((() => {
      const next = [...rollSamplesRef.current, ...queued]
      if (next.length > MAX_RENDERED_ROLLS) {
        return next.slice(next.length - MAX_RENDERED_ROLLS)
      }
      return next
    })())

    const queuedHigh = queued.filter((sample) => sample.roll > 0.99)
    if (queuedHigh.length > 0) {
      setRollHighSamples((prev) => {
        const next = [...prev, ...queuedHigh]
        if (next.length > EXTREMA_HISTORY_CAP) {
          return next.slice(next.length - EXTREMA_HISTORY_CAP)
        }
        return next
      })
    }

    const queuedLow = queued.filter((sample) => sample.roll < 0.01)
    if (queuedLow.length > 0) {
      setRollLowSamples((prev) => {
        const next = [...prev, ...queuedLow]
        if (next.length > EXTREMA_HISTORY_CAP) {
          return next.slice(next.length - EXTREMA_HISTORY_CAP)
        }
        return next
      })
    }

    setHighestRollSample((prev) => {
      let best = prev
      for (const sample of queued) {
        if (!best || sample.roll > best.roll) best = sample
      }
      return best
    })

    setLowestRollSample((prev) => {
      let best = prev
      for (const sample of queued) {
        if (!best || sample.roll < best.roll) best = sample
      }
      return best
    })

    setRollLuckStats((prev) => {
      let currentProb = prev.currentProb
      let currentCount = prev.currentCount
      let lastCompletedProb = prev.lastCompletedProb
      let lastCompletedCount = prev.lastCompletedCount

      for (const sample of queued) {
        const { roll, chance } = sample
        if (roll > chance) {
          currentProb *= Math.max(0, 1 - chance)
          currentCount += 1
        } else {
          if (currentCount > 0) {
            lastCompletedProb = currentProb
            lastCompletedCount = currentCount
          }
          currentProb = 1
          currentCount = 0
        }
      }

      return {
        currentProb,
        currentCount,
        currentPercent: Math.round(currentProb * 1000) / 10,
        lastCompletedProb,
        lastCompletedCount,
      }
    })
  }, [persistSamples])

  const enqueueRollSample = useCallback(
    (sample: RollSample) => {
      pendingRollSamplesRef.current.push(sample)
      if (rollFlushTimeoutRef.current) return
      rollFlushTimeoutRef.current = setTimeout(() => {
        rollFlushTimeoutRef.current = null
        flushPendingRollSamples()
      }, UI_FLUSH_INTERVAL_MS)
    },
    [flushPendingRollSamples],
  )

  const registerSample = useCallback(
    (sample: RollSample) => {
      sampleIdCounterRef.current += 1
      enqueueRollSample({
        ...sample,
        id: `${sample.id}_${sampleIdCounterRef.current}`,
      })
    },
    [enqueueRollSample],
  )

  const registerSampleFromPost = useCallback(
    (post?: PostType) => {
      if (!post) return
      const roll = Number(post.roll)
      const chance = Number(post.chance)
      if (!Number.isFinite(roll) || !Number.isFinite(chance) || chance <= 0) return
      registerSample({
        id: post.uuid,
        roll,
        chance,
        authorColor: cachedCounters[post.authorUUID]?.color,
      })
    },
    [registerSample],
  )

  const stopRollSimulation = useCallback(() => {
    if (rollSimulatorIntervalRef.current) {
      clearInterval(rollSimulatorIntervalRef.current)
      rollSimulatorIntervalRef.current = null
    }
    setIsSimulatingRolls(false)
  }, [])

  const startRollSimulation = useCallback(() => {
    if (rollSimulatorIntervalRef.current) return
    setIsSimulatingRolls(true)
    rollSimulatorIntervalRef.current = setInterval(() => {
      simulationCounterRef.current += 1
      const lastChance = rollSamplesRef.current.length
        ? Number(rollSamplesRef.current[rollSamplesRef.current.length - 1].chance)
        : DEFAULT_CHANCE
      const chance = Number.isFinite(lastChance) && lastChance > 0 && lastChance <= 1 ? lastChance : DEFAULT_CHANCE
      registerSample({
        id: `sim_${threadName}_${Date.now()}_${simulationCounterRef.current}`,
        roll: Math.random(),
        chance,
        authorColor: '#4FC3F7',
      })
    }, SIM_INTERVAL_MS)
  }, [registerSample, threadName])

  const toggleRollSimulation = useCallback(() => {
    if (isSimulatingRolls) {
      stopRollSimulation()
      return
    }
    startRollSimulation()
  }, [isSimulatingRolls, startRollSimulation, stopRollSimulation])

  const reset = useCallback(() => {
    stopRollSimulation()
    pendingRollSamplesRef.current = []
    rollSamplesRef.current = []
    sampleIdCounterRef.current = 0
    simulationCounterRef.current = 0
    if (rollFlushTimeoutRef.current) {
      clearTimeout(rollFlushTimeoutRef.current)
      rollFlushTimeoutRef.current = null
    }
    setRollSamples([])
    setRollHighSamples([])
    setRollLowSamples([])
    setHighestRollSample(undefined)
    setLowestRollSample(undefined)
    setRollLuckStats(initialLuckStats)
  }, [stopRollSimulation])

  useImperativeHandle(
    ref,
    () => ({
      registerSampleFromPost,
      reset,
    }),
    [registerSampleFromPost, reset],
  )

  useEffect(() => {
    reset()
  }, [threadName, reset])

  useEffect(() => {
    return () => {
      if (rollSimulatorIntervalRef.current) {
        clearInterval(rollSimulatorIntervalRef.current)
        rollSimulatorIntervalRef.current = null
      }
      if (rollFlushTimeoutRef.current) {
        clearTimeout(rollFlushTimeoutRef.current)
        rollFlushTimeoutRef.current = null
      }
    }
  }, [])

  const simLabel = useMemo(
    () => (isSimulatingRolls ? `Stop ${SIM_INTERVAL_MS}ms Sim` : `Start ${SIM_INTERVAL_MS}ms Sim`),
    [isSimulatingRolls],
  )

  return (
    <>
      <Button
        size="small"
        variant={isSimulatingRolls ? 'contained' : 'outlined'}
        color={isSimulatingRolls ? 'warning' : 'primary'}
        sx={{ mb: 1 }}
        onClick={toggleRollSimulation}
      >
        {simLabel}
      </Button>
      <RollVisualizer
        rolls={rollSamples}
        recentHighRollHistory={rollHighSamples}
        recentLowRollHistory={rollLowSamples}
        highestRoll={highestRollSample}
        lowestRoll={lowestRollSample}
        luckStats={rollLuckStats}
        animateLatestDot={!isSimulatingRolls}
      />
    </>
  )
}

const RollVisualizerHost = memo(forwardRef(RollVisualizerHostComponent))

export default RollVisualizerHost
