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
import { Box, Button, TextField, Typography } from '@mui/material'
import { cachedCounters } from '../../utils/helpers'
import { PostType } from '../../utils/types'
import RollVisualizer, { RollLuckStats, RollSample } from './RollVisualizer'

const DEFAULT_MAX_RENDERED_ROLLS = 100
const EXTREMA_HISTORY_CAP = 100
const UI_FLUSH_INTERVAL_MS = 16
const UI_TARGET_FPS = 170
const UI_PUBLISH_INTERVAL_MS = Math.max(1, Math.floor(1000 / UI_TARGET_FPS))
const DEFAULT_SIM_INTERVAL_MS = 50
const DEFAULT_CHANCE = 1 / 4147

export type RollVisualizerHostHandle = {
  registerSampleFromPost: (post?: PostType) => void
  reset: () => void
}

type Props = {
  threadName: string
  showSimControls?: boolean
}

const initialLuckStats: RollLuckStats = {
  currentPercent: 100,
  currentProb: 1,
  currentCount: 0,
  lastCompletedProb: null,
  lastCompletedCount: 0,
}

type RollVisualizerUiState = {
  rolls: RollSample[]
  recentHighRollHistory: RollSample[]
  recentLowRollHistory: RollSample[]
  highestRoll?: RollSample
  lowestRoll?: RollSample
  luckStats: RollLuckStats
}

function RollVisualizerHostComponent(
  { threadName, showSimControls = false }: Props,
  ref: ForwardedRef<RollVisualizerHostHandle>,
) {
  const [isSimulatingRolls, setIsSimulatingRolls] = useState(false)
  const [maxRenderedRolls, setMaxRenderedRolls] = useState(DEFAULT_MAX_RENDERED_ROLLS)
  const [simIntervalMs, setSimIntervalMs] = useState(DEFAULT_SIM_INTERVAL_MS)
  const [uiState, setUiState] = useState<RollVisualizerUiState>({
    rolls: [],
    recentHighRollHistory: [],
    recentLowRollHistory: [],
    highestRoll: undefined,
    lowestRoll: undefined,
    luckStats: initialLuckStats,
  })

  const rollSamplesRef = useRef<RollSample[]>([])
  const maxRenderedRollsRef = useRef(DEFAULT_MAX_RENDERED_ROLLS)
  const simIntervalMsRef = useRef(DEFAULT_SIM_INTERVAL_MS)
  const rollHighSamplesRef = useRef<RollSample[]>([])
  const rollLowSamplesRef = useRef<RollSample[]>([])
  const highestRollSampleRef = useRef<RollSample | undefined>(undefined)
  const lowestRollSampleRef = useRef<RollSample | undefined>(undefined)
  const rollLuckStatsRef = useRef<RollLuckStats>(initialLuckStats)
  const rollSimulatorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const uiPublishIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const rollFlushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRollSamplesRef = useRef<RollSample[]>([])
  const hasUiChangesRef = useRef(false)
  const sampleIdCounterRef = useRef(0)
  const simulationCounterRef = useRef(0)

  const persistSamples = useCallback((samples: RollSample[]) => {
    rollSamplesRef.current = samples
  }, [])

  const publishUiSnapshot = useCallback(() => {
    if (!hasUiChangesRef.current) return
    hasUiChangesRef.current = false
    setUiState({
      rolls: rollSamplesRef.current,
      recentHighRollHistory: rollHighSamplesRef.current,
      recentLowRollHistory: rollLowSamplesRef.current,
      highestRoll: highestRollSampleRef.current,
      lowestRoll: lowestRollSampleRef.current,
      luckStats: rollLuckStatsRef.current,
    })
  }, [])

  const flushPendingRollSamples = useCallback(() => {
    const pending = pendingRollSamplesRef.current
    if (pending.length === 0) return
    pendingRollSamplesRef.current = []

    const queued = [...pending]
    persistSamples((() => {
      const next = [...rollSamplesRef.current, ...queued]
      if (next.length > maxRenderedRollsRef.current) {
        return next.slice(next.length - maxRenderedRollsRef.current)
      }
      return next
    })())

    const queuedHigh = queued.filter((sample) => sample.roll > 0.99)
    if (queuedHigh.length > 0) {
      const next = [...rollHighSamplesRef.current, ...queuedHigh]
      rollHighSamplesRef.current =
        next.length > EXTREMA_HISTORY_CAP ? next.slice(next.length - EXTREMA_HISTORY_CAP) : next
    }

    const queuedLow = queued.filter((sample) => sample.roll < 0.01)
    if (queuedLow.length > 0) {
      const next = [...rollLowSamplesRef.current, ...queuedLow]
      rollLowSamplesRef.current =
        next.length > EXTREMA_HISTORY_CAP ? next.slice(next.length - EXTREMA_HISTORY_CAP) : next
    }

    let highest = highestRollSampleRef.current
    let lowest = lowestRollSampleRef.current
    const luck = rollLuckStatsRef.current
    let currentProb = luck.currentProb
    let currentCount = luck.currentCount
    let lastCompletedProb = luck.lastCompletedProb
    let lastCompletedCount = luck.lastCompletedCount

    for (const sample of queued) {
      if (!highest || sample.roll > highest.roll) highest = sample
      if (!lowest || sample.roll < lowest.roll) lowest = sample

      if (sample.roll > sample.chance) {
        currentProb *= Math.max(0, 1 - sample.chance)
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

    highestRollSampleRef.current = highest
    lowestRollSampleRef.current = lowest
    rollLuckStatsRef.current = {
      currentProb,
      currentCount,
      currentPercent: Math.round(currentProb * 1000) / 10,
      lastCompletedProb,
      lastCompletedCount,
    }
    hasUiChangesRef.current = true
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
    if (rollSimulatorIntervalRef.current) {
      clearInterval(rollSimulatorIntervalRef.current)
      rollSimulatorIntervalRef.current = null
    }
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
    }, simIntervalMsRef.current)
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
    rollHighSamplesRef.current = []
    rollLowSamplesRef.current = []
    highestRollSampleRef.current = undefined
    lowestRollSampleRef.current = undefined
    rollLuckStatsRef.current = initialLuckStats
    hasUiChangesRef.current = false
    sampleIdCounterRef.current = 0
    simulationCounterRef.current = 0
    maxRenderedRollsRef.current = DEFAULT_MAX_RENDERED_ROLLS
    simIntervalMsRef.current = DEFAULT_SIM_INTERVAL_MS

    if (rollFlushTimeoutRef.current) {
      clearTimeout(rollFlushTimeoutRef.current)
      rollFlushTimeoutRef.current = null
    }

    setUiState({
      rolls: [],
      recentHighRollHistory: [],
      recentLowRollHistory: [],
      highestRoll: undefined,
      lowestRoll: undefined,
      luckStats: initialLuckStats,
    })
    setMaxRenderedRolls(DEFAULT_MAX_RENDERED_ROLLS)
    setSimIntervalMs(DEFAULT_SIM_INTERVAL_MS)
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
    if (uiPublishIntervalRef.current) {
      clearInterval(uiPublishIntervalRef.current)
      uiPublishIntervalRef.current = null
    }

    uiPublishIntervalRef.current = setInterval(() => {
      publishUiSnapshot()
    }, UI_PUBLISH_INTERVAL_MS)

    return () => {
      if (uiPublishIntervalRef.current) {
        clearInterval(uiPublishIntervalRef.current)
        uiPublishIntervalRef.current = null
      }
    }
  }, [publishUiSnapshot])

  useEffect(() => {
    maxRenderedRollsRef.current = maxRenderedRolls
    if (rollSamplesRef.current.length > maxRenderedRolls) {
      rollSamplesRef.current = rollSamplesRef.current.slice(rollSamplesRef.current.length - maxRenderedRolls)
      hasUiChangesRef.current = true
      publishUiSnapshot()
    }
  }, [maxRenderedRolls, publishUiSnapshot])

  useEffect(() => {
    simIntervalMsRef.current = simIntervalMs
    if (!isSimulatingRolls) return
    startRollSimulation()
  }, [simIntervalMs, isSimulatingRolls, startRollSimulation])

  useEffect(() => {
    if (showSimControls) return
    stopRollSimulation()
  }, [showSimControls, stopRollSimulation])

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
      if (uiPublishIntervalRef.current) {
        clearInterval(uiPublishIntervalRef.current)
        uiPublishIntervalRef.current = null
      }
    }
  }, [])

  const simLabel = useMemo(
    () => (isSimulatingRolls ? `Stop ${simIntervalMs}ms Sim` : `Start ${simIntervalMs}ms Sim`),
    [isSimulatingRolls, simIntervalMs],
  )

  return (
    <>
      {showSimControls && (
        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Button
            size="small"
            variant={isSimulatingRolls ? 'contained' : 'outlined'}
            color={isSimulatingRolls ? 'warning' : 'primary'}
            onClick={toggleRollSimulation}
          >
            {simLabel}
          </Button>
          <TextField
            size="small"
            label="Sim ms"
            type="number"
            value={simIntervalMs}
            onChange={(event) => {
              const next = Number(event.target.value)
              if (!Number.isFinite(next)) return
              setSimIntervalMs(Math.max(1, Math.min(2000, Math.floor(next))))
            }}
            sx={{ width: 120 }}
            inputProps={{ min: 1, max: 2000, step: 1 }}
          />
          <TextField
            size="small"
            label="Max Rolls"
            type="number"
            value={maxRenderedRolls}
            onChange={(event) => {
              const next = Number(event.target.value)
              if (!Number.isFinite(next)) return
              setMaxRenderedRolls(Math.max(10, Math.min(5000, Math.floor(next))))
            }}
            sx={{ width: 140 }}
            inputProps={{ min: 10, max: 5000, step: 10 }}
          />
          <Typography variant="caption" color="text.secondary">
            Sim mode (`#sim`)
          </Typography>
        </Box>
      )}
      <RollVisualizer
        rolls={uiState.rolls}
        recentHighRollHistory={uiState.recentHighRollHistory}
        recentLowRollHistory={uiState.recentLowRollHistory}
        highestRoll={uiState.highestRoll}
        lowestRoll={uiState.lowestRoll}
        luckStats={uiState.luckStats}
        animateLatestDot={!isSimulatingRolls}
        maxRenderedRolls={maxRenderedRolls}
      />
    </>
  )
}

const RollVisualizerHost = memo(forwardRef(RollVisualizerHostComponent))

export default RollVisualizerHost
