import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Typography, alpha, useTheme } from '@mui/material'

export type RollSample = {
  id: string
  roll: number
  chance: number
  authorColor?: string
}
export type RollLuckStats = {
  currentPercent: number
  currentProb: number
  currentCount: number
  lastCompletedProb: number | null
  lastCompletedCount: number
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

const safeProbability = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return 0
  return value
}

const formatThreshold = (value: number) => {
  if (value >= 1) return '1'
  if (value >= 0.1) return value.toFixed(1)
  if (value >= 0.01) return value.toFixed(2)
  if (value >= 0.001) return value.toFixed(3)
  return value.toExponential(0)
}

const formatProbability = (value: number) => {
  const p = safeProbability(value)
  if (p <= 0) return '0'
  if (p >= 0.9999) return p.toFixed(8).replace(/0+$/, '').replace(/\.$/, '')
  if (p >= 0.99) return p.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')
  if (p >= 0.1) return p.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
  if (p >= 0.001) return p.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')
  return p.toExponential(3)
}

const formatOddsFromProbability = (probability: number) => {
  const p = safeProbability(probability)
  if (p <= 0) return '?'
  if (p >= 1) return '1 in 1'

  // For high probabilities, show nearest X in X+1 (e.g. 0.999 -> 999 in 1000)
  if (p > 0.5) {
    const numerator = Math.max(1, Math.round(p / (1 - p)))
    const denominator = numerator + 1
    return `${numerator.toLocaleString()} in ${denominator.toLocaleString()}`
  }

  const oneIn = 1 / p
  if (!Number.isFinite(oneIn)) return '?'
  return `1 in ${Math.max(1, Math.round(oneIn)).toLocaleString()}`
}

const positionByLogProbability = (probability: number, minDecade: number) => {
  const p = safeProbability(probability)
  if (p >= 1) return 1
  if (p <= 0) return 0
  const min = Math.min(-1, minDecade)
  const logProbability = Math.log10(p)
  return clamp01((logProbability - min) / (0 - min))
}

type Props = {
  rolls: RollSample[]
  recentHighRollHistory?: RollSample[]
  recentLowRollHistory?: RollSample[]
  highestRoll?: RollSample
  lowestRoll?: RollSample
  luckStats?: RollLuckStats
  animateLatestDot?: boolean
  maxRenderedRolls?: number
}

const getStableBand = (id: string) => {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  return (hash % 9) - 4
}

export default function RollVisualizer({
  rolls,
  recentHighRollHistory,
  recentLowRollHistory,
  highestRoll: providedHighestRoll,
  lowestRoll: providedLowestRoll,
  luckStats: providedLuckStats,
  animateLatestDot = true,
  maxRenderedRolls = 100,
}: Props) {
  const theme = useTheme()
  const recentScrollRef = useRef<HTMLDivElement | null>(null)
  const recentHighScrollRef = useRef<HTMLDivElement | null>(null)
  const recentLowScrollRef = useRef<HTMLDivElement | null>(null)
  const plotRef = useRef<HTMLDivElement | null>(null)
  const plotCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [showRecentFade, setShowRecentFade] = useState(false)
  const [showRecentHighFade, setShowRecentHighFade] = useState(false)
  const [showRecentLowFade, setShowRecentLowFade] = useState(false)
  const renderOdds = (probability: number) => {
    const oddsText = formatOddsFromProbability(probability)
    if (oddsText === '6 in 7') {
      return (
        <Box component="span" sx={{ fontWeight: 700 }}>
          {oddsText}
        </Box>
      )
    }
    return <>{oddsText}</>
  }
  const renderRollLine = (sample: RollSample, key: string, lineHeight = 1.25) => (
    <Box
      key={key}
      sx={{
        display: 'grid',
        gridTemplateColumns: '40% 60%',
        alignItems: 'baseline',
        columnGap: 0.35,
        whiteSpace: 'nowrap',
        lineHeight,
        width: '100%',
        borderLeft: `4px solid ${sample.authorColor || theme.palette.grey[500]}`,
        pl: 0.6,
      }}
    >
      <Typography
        component="span"
        variant="caption"
        sx={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}
      >
        {formatProbability(sample.roll)}
      </Typography>
      <Typography
        component="span"
        variant="caption"
        sx={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}
      >
        {renderOdds(sample.roll)}
      </Typography>
    </Box>
  )
  const recentScopeRolls = useMemo(() => rolls.slice(-maxRenderedRolls), [rolls, maxRenderedRolls])
  const latestChance = useMemo(() => {
    for (let i = recentScopeRolls.length - 1; i >= 0; i -= 1) {
      const chance = Number(recentScopeRolls[i]?.chance)
      if (Number.isFinite(chance) && chance > 0) return chance
    }
    return 1
  }, [recentScopeRolls])
  const rollProbabilities = useMemo(
    () => recentScopeRolls.map((sample) => safeProbability(sample.roll)).filter((value) => value > 0),
    [recentScopeRolls],
  )
  const minDecade = useMemo(() => {
    const chanceDecade = latestChance > 0 ? Math.floor(Math.log10(latestChance)) : -4
    if (!rollProbabilities.length) return Math.max(-12, Math.min(-1, chanceDecade))
    const minRoll = Math.min(...rollProbabilities)
    const rollDecade = Math.floor(Math.log10(minRoll))
    const decade = Math.min(rollDecade, chanceDecade)
    return Math.max(-8, Math.min(-1, decade))
  }, [rollProbabilities, latestChance])
  const thresholdValues = useMemo(() => {
    const vals: number[] = []
    for (let exponent = minDecade; exponent <= 0; exponent += 1) {
      vals.push(10 ** exponent)
    }
    return vals
  }, [minDecade])
  const targetChancePlotX = useMemo(() => {
    const x = positionByLogProbability(latestChance, minDecade)
    return 0.04 + x * 0.92
  }, [latestChance, minDecade])
  const highestRoll = useMemo(() => {
    if (providedHighestRoll) return providedHighestRoll
    if (!recentScopeRolls.length) return undefined
    return recentScopeRolls.reduce((best, sample) => (sample.roll > best.roll ? sample : best), recentScopeRolls[0])
  }, [providedHighestRoll, recentScopeRolls])
  const lowestRoll = useMemo(() => {
    if (providedLowestRoll) return providedLowestRoll
    if (!recentScopeRolls.length) return undefined
    return recentScopeRolls.reduce((best, sample) => (sample.roll < best.roll ? sample : best), recentScopeRolls[0])
  }, [providedLowestRoll, recentScopeRolls])
  const derivedLuckStats = useMemo(() => {
    let currentStreakProb = 1
    let currentStreakCount = 0
    let lastCompletedStreakProb: number | null = null
    let lastCompletedStreakCount = 0

    for (const sample of recentScopeRolls) {
      const chance = Number(sample.chance)
      const roll = Number(sample.roll)
      if (!Number.isFinite(chance) || !Number.isFinite(roll) || chance < 0 || chance > 1) {
        continue
      }

      if (roll > chance) {
        currentStreakCount += 1
        currentStreakProb *= Math.max(0, 1 - chance)
      } else {
        if (currentStreakCount > 0) {
          lastCompletedStreakProb = currentStreakProb
          lastCompletedStreakCount = currentStreakCount
        }
        currentStreakProb = 1
        currentStreakCount = 0
      }
    }

    return {
      currentPercent: Math.round(currentStreakProb * 1000) / 10,
      currentProb: currentStreakProb,
      currentCount: currentStreakCount,
      lastCompletedProb: lastCompletedStreakProb,
      lastCompletedCount: lastCompletedStreakCount,
    }
  }, [recentScopeRolls])
  const luckStats = providedLuckStats || derivedLuckStats
  const recentRolls = useMemo(() => [...recentScopeRolls].reverse(), [recentScopeRolls])
  const recentHighRolls = useMemo(() => {
    if (recentHighRollHistory) {
      return [...recentHighRollHistory].reverse().slice(0, 5)
    }
    return [...recentScopeRolls].reverse().filter((sample) => sample.roll > 0.99).slice(0, 5)
  }, [recentHighRollHistory, recentScopeRolls])
  const recentLowRolls = useMemo(() => {
    if (recentLowRollHistory) {
      return [...recentLowRollHistory].reverse().slice(0, 5)
    }
    return [...recentScopeRolls].reverse().filter((sample) => sample.roll < 0.01).slice(0, 5)
  }, [recentLowRollHistory, recentScopeRolls])
  const latestId = recentScopeRolls.length > 0 ? recentScopeRolls[recentScopeRolls.length - 1].id : ''

  useEffect(() => {
    const canvas = plotCanvasRef.current
    const container = plotRef.current
    if (!canvas || !container) return

    const dpr = window.devicePixelRatio || 1
    const width = Math.max(1, container.clientWidth)
    const height = Math.max(1, container.clientHeight)
    const pxWidth = Math.floor(width * dpr)
    const pxHeight = Math.floor(height * dpr)
    if (canvas.width !== pxWidth || canvas.height !== pxHeight) {
      canvas.width = pxWidth
      canvas.height = pxHeight
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)

    const defaultColor = theme.palette.info.main
    const borderBaseColor = theme.palette.grey[500]
    for (let idx = 0; idx < recentScopeRolls.length; idx += 1) {
      const sample = recentScopeRolls[idx]
      const x = positionByLogProbability(sample.roll, minDecade)
      const plotX = (0.04 + x * 0.92) * width
      const yBand = getStableBand(sample.id)
      const plotY = height * 0.58 + yBand * 8
      const age = Math.max(0, recentScopeRolls.length - 1 - idx)
      const dotAlpha = Math.max(0.08, 1 - age / 28)
      const fadeStartAge = Math.max(0, maxRenderedRolls - 11)
      const borderFadeProgress = Math.max(0, Math.min(1, (age - fadeStartAge) / 10))
      const borderAlpha = Math.max(0, 1 - borderFadeProgress)
      const isLatest = sample.id === latestId
      const radius = isLatest && animateLatestDot ? 4.5 : 4

      ctx.globalAlpha = dotAlpha
      ctx.fillStyle = sample.authorColor || defaultColor
      ctx.beginPath()
      ctx.arc(plotX, plotY, radius, 0, Math.PI * 2)
      ctx.fill()

      if (borderAlpha > 0) {
        ctx.globalAlpha = borderAlpha
        ctx.strokeStyle = borderBaseColor
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(plotX, plotY, radius, 0, Math.PI * 2)
        ctx.stroke()
      }
    }
    ctx.globalAlpha = 1
  }, [recentScopeRolls, minDecade, latestId, animateLatestDot, theme, maxRenderedRolls])

  useEffect(() => {
    const handleResize = () => {
      const canvas = plotCanvasRef.current
      const container = plotRef.current
      if (!canvas || !container) return
      const dpr = window.devicePixelRatio || 1
      const width = Math.max(1, container.clientWidth)
      const height = Math.max(1, container.clientHeight)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    const el = recentScrollRef.current
    if (!el) return
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1
    setShowRecentFade(!atBottom)
  }, [recentRolls.length])
  useEffect(() => {
    const el = recentHighScrollRef.current
    if (!el) return
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1
    setShowRecentHighFade(!atBottom)
  }, [recentHighRolls.length])
  useEffect(() => {
    const el = recentLowScrollRef.current
    if (!el) return
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1
    setShowRecentLowFade(!atBottom)
  }, [recentLowRolls.length])

  if (!recentScopeRolls.length) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Roll Visualizer
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No roll samples yet.
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Roll Visualizer
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        {formatOddsFromProbability(latestChance)} ({formatProbability(latestChance)})
      </Typography>
      <Box sx={{ mb: 1 }}>
        {highestRoll && (
          <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.25 }}>
            Highest: {formatProbability(highestRoll.roll)} {renderOdds(highestRoll.roll)}
          </Typography>
        )}
        {lowestRoll && (
          <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.25 }}>
            Lowest: {formatProbability(lowestRoll.roll)} {renderOdds(lowestRoll.roll)}
          </Typography>
        )}
      </Box>
      <Box
        sx={{
          mb: 1,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          p: 1,
          display: 'grid',
          gridTemplateColumns: '3fr 1fr',
          gap: 1,
          alignItems: 'stretch',
        }}
      >
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
            Luck-o-meter
          </Typography>
          <Typography variant="body2" sx={{ lineHeight: 1.2 }}>
            {renderOdds(luckStats.currentProb)}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
            Streak length: {luckStats.currentCount}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
            Last win:{' '}
            {luckStats.lastCompletedProb === null
              ? 'n/a'
              : `${formatOddsFromProbability(luckStats.lastCompletedProb)} (${luckStats.lastCompletedCount} posts)`}
          </Typography>
        </Box>
        <Box
          sx={{
            borderLeft: '1px solid',
            borderColor: 'divider',
            pl: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            sx={{
              fontSize: 'clamp(1.2rem, 3.6vw, 2rem)',
              fontWeight: 700,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {luckStats.currentPercent.toPrecision(3)}%
          </Typography>
        </Box>
      </Box>
      <Box
        ref={plotRef}
        sx={{
          position: 'relative',
          width: '100%',
          height: 138,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default',
          px: 2,
          pt: 2.5,
          pb: 1,
          overflow: 'hidden',
        }}
        >
          <canvas
            ref={plotCanvasRef}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: 2,
            transform: 'translateY(-50%)',
            bgcolor: 'divider',
          }}
        />
        {thresholdValues.map((threshold) => {
          const x = positionByLogProbability(threshold, minDecade)
          const plotX = 0.04 + x * 0.92
          return (
            <Box key={`th-${threshold}`}>
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${plotX * 100}%`,
                  borderLeft: `1px dashed ${theme.palette.grey[500]}`,
                  opacity: 0.9,
                  zIndex: 2,
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  top: 2,
                  left: `${plotX * 100}%`,
                  transform: 'translateX(-50%)',
                  fontSize: 9,
                  bgcolor: 'background.paper',
                  px: 0.25,
                  color: 'text.secondary',
                  zIndex: 2,
                }}
              >
                {formatThreshold(threshold)}
              </Typography>
            </Box>
          )
        })}
        <Box>
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${targetChancePlotX * 100}%`,
              borderLeft: `2px dotted ${theme.palette.warning.main}`,
              opacity: 0.95,
            }}
          />
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              bottom: 2,
              left: `${targetChancePlotX * 100}%`,
              transform: 'translateX(-50%)',
              fontSize: 9,
              bgcolor: alpha(theme.palette.warning.main, 0.14),
              px: 0.35,
              color: theme.palette.warning.dark,
              borderRadius: 0.5,
              fontWeight: 700,
              zIndex: 2,
            }}
          >
            {formatOddsFromProbability(latestChance)}
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          mt: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.8,
          height: 300,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          p: 1,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ width: '100%', height: 140, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.4 }}>
            Recent
          </Typography>
          <Box sx={{ position: 'relative', flex: 1, minHeight: 0 }}>
            <Box
              ref={recentScrollRef}
              onScroll={(event) => {
                const el = event.currentTarget
                const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1
                setShowRecentFade(!atBottom)
              }}
              sx={{ height: '100%', overflowY: 'auto', overflowX: 'auto', pr: 0.5, overscrollBehavior: 'contain' }}
            >
              {recentRolls.map((sample) => {
                return renderRollLine(sample, `recent-${sample.id}`, 1.25)
              })}
            </Box>
            {showRecentFade && (
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 36,
                  pointerEvents: 'none',
                  background: `linear-gradient(to bottom, ${alpha(theme.palette.background.paper, 0)}, ${alpha(theme.palette.background.paper, 0.55)} 45%, ${alpha(theme.palette.background.paper, 0.96)})`,
                }}
              />
            )}
          </Box>
        </Box>
        <Box sx={{ width: '100%', height: 70, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.4 }}>
            Recent High ({'>'}0.99)
          </Typography>
          <Box sx={{ position: 'relative', flex: 1, minHeight: 0 }}>
            <Box
              ref={recentHighScrollRef}
              onScroll={(event) => {
                const el = event.currentTarget
                const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1
                setShowRecentHighFade(!atBottom)
              }}
              sx={{ height: '100%', overflowY: 'auto', overflowX: 'auto', pr: 0.5, overscrollBehavior: 'contain' }}
            >
              {recentHighRolls.length === 0 ? (
                <Typography variant="caption" color="text.secondary">
                  None
                </Typography>
              ) : (
                recentHighRolls.map((sample) => renderRollLine(sample, `high-${sample.id}`, 1.2))
              )}
            </Box>
            {showRecentHighFade && (
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 28,
                  pointerEvents: 'none',
                  background: `linear-gradient(to bottom, ${alpha(theme.palette.background.paper, 0)}, ${alpha(theme.palette.background.paper, 0.55)} 45%, ${alpha(theme.palette.background.paper, 0.96)})`,
                }}
              />
            )}
          </Box>
        </Box>
        <Box sx={{ width: '100%', height: 70, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.4 }}>
            Recent Low ({'<'}0.01)
          </Typography>
          <Box sx={{ position: 'relative', flex: 1, minHeight: 0 }}>
            <Box
              ref={recentLowScrollRef}
              onScroll={(event) => {
                const el = event.currentTarget
                const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1
                setShowRecentLowFade(!atBottom)
              }}
              sx={{ height: '100%', overflowY: 'auto', overflowX: 'auto', pr: 0.5, overscrollBehavior: 'contain' }}
            >
              {recentLowRolls.length === 0 ? (
                <Typography variant="caption" color="text.secondary">
                  None
                </Typography>
              ) : (
                recentLowRolls.map((sample) => renderRollLine(sample, `low-${sample.id}`, 1.2))
              )}
            </Box>
            {showRecentLowFade && (
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 28,
                  pointerEvents: 'none',
                  background: `linear-gradient(to bottom, ${alpha(theme.palette.background.paper, 0)}, ${alpha(theme.palette.background.paper, 0.55)} 45%, ${alpha(theme.palette.background.paper, 0.96)})`,
                }}
              />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
