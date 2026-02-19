import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Typography, alpha, keyframes, useTheme } from '@mui/material'

export type RollSample = {
  id: string
  roll: number
  chance: number
  authorColor?: string
}

const popIn = keyframes`
  0% {
    transform: translate(-50%, -50%) scale(0.35);
    opacity: 0.2;
  }
  70% {
    transform: translate(-50%, -50%) scale(1.22);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
`

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
}

export default function RollVisualizer({ rolls }: Props) {
  const theme = useTheme()
  const recentScrollRef = useRef<HTMLDivElement | null>(null)
  const [showRecentFade, setShowRecentFade] = useState(false)
  const renderOdds = (probability: number) => {
    const oddsText = formatOddsFromProbability(probability)
    if (oddsText === '6 in 7') {
      return (
        <Box component="span" sx={{ fontWeight: 700 }}>
          ({oddsText})
        </Box>
      )
    }
    return <>{`(${oddsText})`}</>
  }
  const latestChance = useMemo(() => {
    for (let i = rolls.length - 1; i >= 0; i -= 1) {
      const chance = Number(rolls[i]?.chance)
      if (Number.isFinite(chance) && chance > 0) return chance
    }
    return 1
  }, [rolls])
  const rollProbabilities = useMemo(
    () => rolls.map((sample) => safeProbability(sample.roll)).filter((value) => value > 0),
    [rolls],
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
  const highestRoll = useMemo(() => {
    if (!rolls.length) return undefined
    return rolls.reduce((best, sample) => (sample.roll > best.roll ? sample : best), rolls[0])
  }, [rolls])
  const lowestRoll = useMemo(() => {
    if (!rolls.length) return undefined
    return rolls.reduce((best, sample) => (sample.roll < best.roll ? sample : best), rolls[0])
  }, [rolls])
  const recentRolls = useMemo(() => [...rolls].reverse(), [rolls])
  const recentHighRolls = useMemo(
    () => [...rolls].reverse().filter((sample) => sample.roll > 0.99).slice(0, 5),
    [rolls],
  )
  const recentLowRolls = useMemo(
    () => [...rolls].reverse().filter((sample) => sample.roll < 0.01).slice(0, 5),
    [rolls],
  )
  const latestId = rolls.length > 0 ? rolls[rolls.length - 1].id : ''

  useEffect(() => {
    const el = recentScrollRef.current
    if (!el) return
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1
    setShowRecentFade(!atBottom)
  }, [recentRolls.length])

  if (!rolls.length) {
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
            Highest: {formatProbability(highestRoll.roll)}{' '}
            {renderOdds(highestRoll.roll)}
          </Typography>
        )}
        {lowestRoll && (
          <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.25 }}>
            Lowest: {formatProbability(lowestRoll.roll)}{' '}
            {renderOdds(lowestRoll.roll)}
          </Typography>
        )}
      </Box>
      <Box
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
                  borderLeft: '1px dashed',
                  borderColor: 'divider',
                  opacity: 0.7,
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
                }}
              >
                {formatThreshold(threshold)}
              </Typography>
            </Box>
          )
        })}
        {rolls.map((sample, idx) => {
          const x = positionByLogProbability(sample.roll, minDecade)
          const plotX = 0.04 + x * 0.92
          const age = Math.max(0, rolls.length - 1 - idx)
          const dotAlpha = Math.max(0.08, 1 - age / 28)
          const fillColor = alpha(sample.authorColor || theme.palette.info.main, dotAlpha)
          const yBand = (idx % 9) - 4
          const isLatest = sample.id === latestId
          return (
            <Box
              key={sample.id}
              title={`${sample.roll} ${sample.roll > sample.chance ? '>' : '<='} ${sample.chance}`}
              sx={{
                position: 'absolute',
                left: `${plotX * 100}%`,
                top: `calc(58% + ${yBand * 8}px)`,
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: fillColor,
                border: '1px solid',
                borderColor: theme.palette.grey[500],
                transform: 'translate(-50%, -50%)',
                animation: isLatest ? `${popIn} 420ms ease-out` : 'none',
              }}
            />
          )
        })}
      </Box>
      <Box
        sx={{
          mt: 1,
          display: 'flex',
          gap: 1,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          p: 1,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0, borderRight: '1px solid', borderColor: 'divider', pr: 1 }}>
          <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.4 }}>
            Recent
          </Typography>
          <Box sx={{ position: 'relative' }}>
            <Box
              ref={recentScrollRef}
              onScroll={(event) => {
                const el = event.currentTarget
                const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1
                setShowRecentFade(!atBottom)
              }}
              sx={{ maxHeight: 140, overflowY: 'auto', pr: 0.5 }}
            >
              {recentRolls.map((sample) => {
                return (
                  <Typography key={`recent-${sample.id}`} variant="caption" sx={{ display: 'block', lineHeight: 1.25 }}>
                    {formatProbability(sample.roll)} {renderOdds(sample.roll)}
                  </Typography>
                )
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
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
          <Box sx={{ pb: 0.6, borderBottom: '1px solid', borderColor: 'divider', minHeight: 62 }}>
            <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.4 }}>
              Recent High ({'>'}0.99)
            </Typography>
            {recentHighRolls.length === 0 ? (
              <Typography variant="caption" color="text.secondary">
                None
              </Typography>
            ) : (
              recentHighRolls.map((sample, idx) => {
                const opacity = Math.max(0.28, 1 - idx * 0.18)
                return (
                  <Typography key={`high-${sample.id}`} variant="caption" sx={{ display: 'block', lineHeight: 1.2, opacity }}>
                    {formatProbability(sample.roll)}{' '}
                    {renderOdds(sample.roll)}
                  </Typography>
                )
              })
            )}
          </Box>
          <Box sx={{ minHeight: 62 }}>
            <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.4 }}>
              Recent Low ({'<'}0.01)
            </Typography>
            {recentLowRolls.length === 0 ? (
              <Typography variant="caption" color="text.secondary">
                None
              </Typography>
            ) : (
              recentLowRolls.map((sample, idx) => {
                const opacity = Math.max(0.28, 1 - idx * 0.18)
                return (
                  <Typography key={`low-${sample.id}`} variant="caption" sx={{ display: 'block', lineHeight: 1.2, opacity }}>
                    {formatProbability(sample.roll)}{' '}
                    {renderOdds(sample.roll)}
                  </Typography>
                )
              })
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
