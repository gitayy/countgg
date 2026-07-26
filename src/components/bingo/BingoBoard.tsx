import { alpha, Box, LinearProgress, Paper, Tooltip, Typography, useTheme } from '@mui/material'
import { useMemo } from 'react'
import { bingoThemeTokens, getBingoRankColor, getBingoRankLabel, getBingoTeamVisual } from './bingoTheme'
import { Counter } from '../../utils/types'

export type BingoSquare = {
  id: number
  index: number
  challengeType: string
  rank: string
  threadUuid?: string | null
  target: number
  params?: any
  progressValue: number
  isUnlocked: boolean
  mostRecentUnlockerUserUuid?: string
  mostRecentUnlockerTeamId?: number
  mostRecentUnlockAt?: number
  scoreToBeat?: number
}

// Per-team live scores for a square, keyed by teamId (as a string, matching the backend's
// params._teamScores shape) — present once any team has posted progress on this square.
const getTeamScores = (square: BingoSquare): Record<string, number> => {
  const raw = (square.params as any)?._teamScores
  return raw && typeof raw === 'object' ? raw : {}
}

const getScoreMode = (square: BingoSquare): 'higher' | 'lower' | null => {
  const mode = (square.params as any)?._scoreMode
  return mode === 'higher' || mode === 'lower' ? mode : null
}

// For count-style ('higher' mode) squares with 2+ teams reporting, the small board only has
// room for one extra number — the gap between 1st and 2nd place is the most useful at a glance,
// so that's what gets shown (3rd place's gap is available via tooltip on non-small variants).
const getLeaderGapText = (square: BingoSquare): string | null => {
  const mode = getScoreMode(square)
  if (mode !== 'higher') {
    return null
  }
  const scores = Object.values(getTeamScores(square))
    .map(Number)
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => b - a)
  if (scores.length < 2) {
    return null
  }
  const gap = scores[0] - scores[1]
  if (gap <= 0) {
    return null
  }
  return `+${Math.round(gap)}`
}

// Fuller ranked breakdown (up to 3 teams) for tooltips, where there's room to show 3rd place's
// gap too — the small board itself only ever shows the 1st-vs-2nd gap.
const getRankedGapLines = (square: BingoSquare): string[] => {
  const mode = getScoreMode(square)
  if (mode !== 'higher') {
    return []
  }
  const ranked = Object.entries(getTeamScores(square))
    .map(([teamId, score]) => ({ teamId: Number(teamId), score: Number(score) }))
    .filter((entry) => Number.isFinite(entry.score))
    .sort((a, b) => b.score - a.score)
  if (ranked.length < 2) {
    return []
  }
  const leaderScore = ranked[0].score
  return ranked.map((entry, index) => {
    const gap = leaderScore - entry.score
    const gapText = index === 0 ? 'Leader' : `-${Math.round(gap)}`
    return `#${index + 1}: ${Math.round(entry.score)} (${gapText})`
  })
}

export type BingoMember = {
  counter: Counter
  role: string
  status: string
  teamId: number
  teamName?: string
  teamKey?: string
}

export type BingoBoardVariant = 'xsmall' | 'small' | 'large'

export const getTeamColorMap = (members: BingoMember[]) => {
  const uniqueTeamIds = Array.from(new Set(members.map((member) => member.teamId))).sort((a, b) => a - b)
  return uniqueTeamIds.reduce<Record<number, string>>((acc, teamId, index) => {
    const teamMember = members.find((member) => member.teamId === teamId)
    const fallbackKey = index === 0 ? 'wave' : index === 1 ? 'blaze' : 'radiant'
    const visual = getBingoTeamVisual(teamMember?.teamKey || teamMember?.teamName || fallbackKey)
    acc[teamId] = visual.color
    return acc
  }, {})
}

const challengeTitleMap: Record<string, string> = {
  thread_counts: 'total counts',
  get_under_ms: 'speed',
  roll: 'roll',
  count_attempts: 'attempts',
}

export const formatChallengeTitle = (challengeType: string) =>
  challengeTitleMap[challengeType] || challengeType.replace(/_/g, ' ').trim()
const challengeShortLabel: Record<string, string> = {
  thread_counts: 'COUNTS',
  split_under_ms: 'SPLIT',
  get_under_ms: 'SPEED',
  bars_within_ms: 'BARS',
  lrwoed_score: 'LRWOED',
  number_shuffle_win: 'SHUFFLE',
  roll: 'ROLL',
  accuracy_rate: 'ACC',
  count_attempts: 'ATTEMPTS',
}

const getChallengeShortLabel = (challengeType: string) => {
  return challengeShortLabel[challengeType] || challengeType.replace(/_/g, ' ').slice(0, 8).toUpperCase()
}

const formatSecondsAsClock = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return null
  }
  const totalSeconds = Math.floor(seconds)
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const ss = String(totalSeconds % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

const getSecondaryLabel = (square: BingoSquare) => {
  const validationType = square.params?.validationType
  if (typeof validationType === 'string' && validationType.length > 0) {
    return validationType
  }
  return null
}

const getGoalValueText = (square: BingoSquare, compact: boolean) => {
  if (square.challengeType === 'split_under_ms' || square.challengeType === 'get_under_ms' || square.challengeType === 'bars_within_ms') {
    const seconds = Number(square.params?.maxMs) / 1000
    const clock = formatSecondsAsClock(seconds)
    if (clock) {
      return compact ? clock : `${clock}`
    }
  }
  if (square.challengeType === 'lrwoed_score') {
    const maxScore = square.params?.maxScore
    if (Number.isFinite(maxScore)) {
      return String(maxScore)
    }
  }
  if (square.challengeType === 'number_shuffle_win') {
    const minSize = square.params?.minSize
    if (Number.isFinite(minSize)) {
      return String(minSize)
    }
  }
  if (square.challengeType === 'accuracy_rate') {
    const minAccuracyPercent = square.params?.minAccuracyPercent
    if (Number.isFinite(minAccuracyPercent)) {
      return `${minAccuracyPercent}%`
    }
  }
  if (square.challengeType === 'roll') {
    const threshold = square.params?.threshold
    if (Number.isFinite(threshold)) {
      return String(threshold)
    }
  }
  return null
}

const formatScoreToBeat = (square: BingoSquare, compact: boolean) => {
  if (typeof square.scoreToBeat !== 'number' || !Number.isFinite(square.scoreToBeat)) {
    return null
  }

  const timed = square.challengeType === 'split_under_ms' || square.challengeType === 'get_under_ms' || square.challengeType === 'bars_within_ms'
  const timedValue = (square.scoreToBeat / 1000).toFixed(3)

  if (square.challengeType === 'roll') {
    const rollValue = square.scoreToBeat.toFixed(6)
    if (compact) {
      return rollValue
    }
    return square.params?.direction === 'over' ? `Highest: ${rollValue}` : `Lowest: ${rollValue}`
  }

  if (compact) {
    return timed ? timedValue : String(Math.round(square.scoreToBeat))
  }

  switch (square.challengeType) {
    case 'split_under_ms':
    case 'get_under_ms':
    case 'bars_within_ms':
      return `Fastest: ${timedValue}s`
    case 'lrwoed_score':
      return `Best score: ${Math.round(square.scoreToBeat)}`
    case 'number_shuffle_win':
      return `Best size: ${Math.round(square.scoreToBeat)}`
    case 'accuracy_rate':
      return `Best accuracy: ${square.scoreToBeat.toFixed(1)}%`
    default:
      return `Best: ${Math.round(square.scoreToBeat)}`
  }
}

export const getChallengeDetails = (square: BingoSquare): string[] => {
  const details: string[] = []
  const params = square.params || {}

  switch (square.challengeType) {
    case 'thread_counts':
      details.push(square.threadUuid ? 'Thread-specific challenge' : 'Sitewide — any thread')
      break
    case 'split_under_ms':
      details.push(`Validation type: ${params.validationType || 'unknown'}`)
      details.push(`Goal: split under ${(Number(params.maxMs) / 1000).toFixed(1)}s`)
      break
    case 'get_under_ms':
      details.push(`Validation type: ${params.validationType || 'unknown'}`)
      details.push(`Goal: get under ${(Number(params.maxMs) / 1000).toFixed(1)}s`)
      break
    case 'bars_within_ms':
      details.push(`Goal: bars split under ${(Number(params.maxMs) / 1000).toFixed(1)}s`)
      break
    case 'lrwoed_score':
      details.push(`Target score: ${params.maxScore ?? 8} or lower`)
      break
    case 'number_shuffle_win':
      details.push(`Min size: ${params.minSize ?? 10}`)
      break
    case 'roll':
      details.push(`Odds: 1/${params.oddsDenominator ?? 1000}`)
      break
    case 'accuracy_rate':
      details.push(`Min accuracy: ${params.minAccuracyPercent ?? 100}%`)
      break
    case 'count_attempts':
      details.push('Counts every attempt, valid or not')
      break
    default:
      details.push('No extra params')
      break
  }

  return details
}

export type BingoWinningLine = { teamId: number; line: number[] }

type Props = {
  squares: BingoSquare[]
  members: BingoMember[]
  variant: BingoBoardVariant
  winningLines?: BingoWinningLine[] | null
}

// Cell-center coordinates (in a 0-100 viewBox) for each of the 12 possible bingo lines' two
// endpoints, keyed by the line's sorted index tuple — used to draw a stroke through a completed
// line. Index math: col = index % 5, row = Math.floor(index / 5); cell center = col*20+10.
const getLineEndpoints = (line: number[]) => {
  const sorted = [...line].sort((a, b) => a - b)
  const start = sorted[0]
  const end = sorted[sorted.length - 1]
  const cellCenter = (index: number) => {
    const col = index % 5
    const row = Math.floor(index / 5)
    return { x: col * 20 + 10, y: row * 20 + 10 }
  }
  return { start: cellCenter(start), end: cellCenter(end) }
}

export const BingoBoard = ({ squares, members, variant, winningLines = null }: Props) => {
  const theme = useTheme();
  const teamColors = useMemo(() => getTeamColorMap(members), [members])
  const isXSmall = variant === 'xsmall'
  const isSmall = variant === 'small'
  const normalizedWinningLines = useMemo(() => (Array.isArray(winningLines) ? winningLines : []), [winningLines])
  const winningLineSet = useMemo(
    () => new Set(normalizedWinningLines.flatMap((entry) => entry.line)),
    [normalizedWinningLines],
  )

  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
          gap: isXSmall ? 0.45 : isSmall ? 0.75 : 1,
        }}
      >
        {squares.map((square) => {
        const borderColor = getBingoRankColor(square.rank)
        const ownerTeamColor = square.mostRecentUnlockerTeamId ? teamColors[square.mostRecentUnlockerTeamId] : undefined
        const isTeamOwned = square.isUnlocked && Boolean(ownerTeamColor)
        const unlockedAccent = ownerTeamColor || theme.palette.success.main
        const isWinningSquare = winningLineSet.has(square.index)

        const squareState = isTeamOwned
          ? 'unlocked_team_owned'
          : square.isUnlocked
            ? 'unlocked_neutral'
            : square.progressValue > 0
              ? 'in_progress'
              : 'locked'

        const cellBackground =
          squareState === 'unlocked_team_owned'
            ? alpha(unlockedAccent, 0.24)
            : squareState === 'unlocked_neutral'
              ? alpha(theme.palette.success.main, 0.2)
              : alpha('#0c162b', 0.88)

        const title = formatChallengeTitle(square.challengeType)
        const shortLabel = getChallengeShortLabel(square.challengeType)
        const secondaryLabel = getSecondaryLabel(square)
        const detailLines = getChallengeDetails(square)
        const progressPercent = square.target > 0 ? Math.min(100, (square.progressValue / square.target) * 100) : 0
        const showProgressBar = !square.mostRecentUnlockerTeamId && square.target > 1
        const scoreToBeatText = formatScoreToBeat(square, isSmall)
        const goalValueText =
          !scoreToBeatText && !square.mostRecentUnlockerTeamId && square.target === 1 ? getGoalValueText(square, isSmall) : null
        const progressText = goalValueText || scoreToBeatText || `${square.progressValue}/${square.target}`
        const showSplitProgressValue = !goalValueText && !scoreToBeatText && !square.mostRecentUnlockerTeamId && square.target > 0
        const tooltipGoalText = getGoalValueText(square, false)
        const leaderGapText = getLeaderGapText(square)

        if (isXSmall) {
          return (
            <Paper
              key={square.id}
              variant="outlined"
              sx={{
                p: 0,
                aspectRatio: '1 / 1',
                minHeight: 0,
                borderColor,
                borderWidth: 1.5,
                background: cellBackground,
                boxShadow: square.isUnlocked
                  ? `0 0 0 1px ${alpha(unlockedAccent, 0.55)}`
                  : `0 0 0 1px ${alpha(theme.palette.background.paper, 0.45)}`,
                outline: isWinningSquare ? `2px solid ${alpha('#ffffff', 0.92)}` : 'none',
                outlineOffset: isWinningSquare ? -2 : 0,
                transition: 'none',
                animation: isWinningSquare ? 'bingoWinPulse 1400ms ease-in-out 300ms 2' : 'none',
                '@keyframes bingoWinPulse': {
                  '0%, 100%': { boxShadow: `0 0 0 1px ${alpha(unlockedAccent, 0.55)}` },
                  '50%': { boxShadow: `0 0 14px 3px ${alpha(unlockedAccent, 0.85)}` },
                },
                '@media (prefers-reduced-motion: reduce)': {
                  animation: 'none',
                },
              }}
              aria-label={`Bingo square ${square.index + 1}`}
            />
          )
        }

        const card = (
          <Paper
            key={square.id}
            variant="outlined"
            sx={{
              p: isSmall ? 0.28 : 1,
              aspectRatio: '1 / 1',
              minHeight: 0,
              borderColor,
              borderWidth: 1.5,
              background: cellBackground,
              boxShadow: square.isUnlocked
                ? `0 0 0 1px ${alpha(unlockedAccent, 0.55)}`
                : `0 0 0 1px ${alpha(theme.palette.background.paper, 0.45)}`,
              outline: isWinningSquare ? `2px solid ${alpha('#ffffff', 0.92)}` : 'none',
              outlineOffset: isWinningSquare ? -2 : 0,
              transition: 'border-color 140ms ease, background-color 140ms ease',
              animation: isWinningSquare ? 'bingoWinPulse 1400ms ease-in-out 300ms 2' : 'none',
              '@keyframes bingoWinPulse': {
                '0%, 100%': { boxShadow: `0 0 0 1px ${alpha(unlockedAccent, 0.55)}` },
                '50%': { boxShadow: `0 0 14px 3px ${alpha(unlockedAccent, 0.85)}` },
              },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              overflow: 'hidden',
              position: 'relative',
              '@media (prefers-reduced-motion: reduce)': {
                transition: 'none',
                animation: 'none',
              },
            }}
          >
            {leaderGapText && (
              <Typography
                variant="caption"
                aria-label={`Leader ahead by ${leaderGapText.slice(1)}`}
                sx={{
                  position: 'absolute',
                  top: isSmall ? 1 : 3,
                  right: isSmall ? 1 : 3,
                  px: isSmall ? 0.24 : 0.5,
                  py: 0,
                  borderRadius: '4px',
                  bgcolor: alpha(unlockedAccent, 0.85),
                  color: '#fff',
                  fontWeight: 800,
                  lineHeight: 1.4,
                  fontSize: isSmall ? '0.46rem' : '0.6rem',
                  letterSpacing: 0.2,
                  whiteSpace: 'nowrap',
                  zIndex: 1,
                }}
              >
                {leaderGapText}
              </Typography>
            )}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  display: 'inline-block',
                  px: isSmall ? 0.22 : 0.6,
                  py: isSmall ? 0.04 : 0.2,
                  borderRadius: isSmall ? '4px' : '6px',
                  bgcolor: alpha(borderColor, 0.18),
                  textTransform: 'uppercase',
                  lineHeight: 1.1,
                  fontWeight: 700,
                  letterSpacing: isSmall ? 0.2 : 0.5,
                  fontSize: isSmall ? '0.52rem' : undefined,
                }}
              >
                {shortLabel}
              </Typography>
              {secondaryLabel && !isSmall && (
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 0.25,
                    ml: 0,
                    textTransform: 'uppercase',
                    opacity: 0.85,
                    letterSpacing: 0.2,
                    fontSize: '0.8rem',
                    lineHeight: 1.05,
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {secondaryLabel}
                </Typography>
              )}
              {!isSmall && (
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 0.6,
                    textTransform: 'capitalize',
                    fontWeight: 700,
                    letterSpacing: 0.2,
                    lineHeight: 1.2,
                  }}
                >
                  {title}
                </Typography>
              )}
            </Box>
            {!isSmall && (
              <>
                <Typography variant="caption" sx={{ color: theme.palette.primary.contrastText, textTransform: 'uppercase', letterSpacing: 0.28 }}>
                  Rank: {getBingoRankLabel(square.rank)}
                </Typography>
              </>
            )}
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: isSmall ? 0.2 : 0.6,
              }}
            >
              {showSplitProgressValue ? (
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                  }}
                >
                  <Typography
                    variant={isSmall ? 'caption' : 'body2'}
                    sx={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: isSmall ? 'clamp(0.68rem, 26cqw, 2.6rem)' : '1.1rem',
                      fontWeight: isSmall ? 800 : 700,
                      lineHeight: 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {square.progressValue}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: isSmall ? 'translate(-50%, 0.85rem)' : 'translate(-50%, 0.72rem)',
                      fontSize: isSmall ? '0.52rem' : '0.72rem',
                      fontWeight: 700,
                      letterSpacing: 0.2,
                      opacity: 0.9,
                      lineHeight: 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    /{square.target}
                  </Typography>
                </Box>
              ) : (
                <Typography
                  variant={isSmall ? 'caption' : 'body2'}
                  sx={{
                    fontSize: isSmall ? '0.72rem' : '1.05rem',
                    fontWeight: isSmall ? 800 : 700,
                    lineHeight: 1.05,
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                  }}
                >
                  {progressText}
                </Typography>
              )}
            </Box>
            <Box sx={{ mt: isSmall ? 0 : 0.25 }}>
              {showProgressBar && (
                <LinearProgress
                  variant="determinate"
                  value={progressPercent}
                  sx={{
                    height: isSmall ? 8 : 16,
                    minHeight: isSmall ? 8 : undefined,
                    borderRadius: 999,
                    bgcolor: alpha(borderColor, 0.14),
                    boxShadow: `inset 0 0 0 1px ${alpha(borderColor, 0.42)}`,
                    '& .MuiLinearProgress-bar': {
                      bgcolor: borderColor,
                    },
                  }}
                />
              )}
            </Box>
          </Paper>
        )

        if (!isSmall) {
          return card
        }

        return (
          <Tooltip
            key={square.id}
            arrow
            title={
              <Box sx={{ minWidth: 190 }}>
                <Typography variant="subtitle2">{title}</Typography>
                <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>
                  {shortLabel} | {getBingoRankLabel(square.rank)}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block' }}>
                  {tooltipGoalText ? `Target: ${tooltipGoalText}` : `Target value: ${square.target}`}
                </Typography>
                {secondaryLabel && (
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    Validation type: {secondaryLabel}
                  </Typography>
                )}

                <Typography variant="caption" sx={{ display: 'block' }}>
                  {formatScoreToBeat(square, false) || `Progress: ${square.progressValue}/${square.target}`}
                </Typography>
                {getRankedGapLines(square).map((line) => (
                  <Typography key={`${square.id}_gap_${line}`} variant="caption" sx={{ display: 'block', opacity: 0.85 }}>
                    {line}
                  </Typography>
                ))}
                {detailLines.map((line) => (
                  <Typography key={`${square.id}_tip_${line}`} variant="caption" sx={{ display: 'block' }}>
                    {line}
                  </Typography>
                ))}
                {square.threadUuid && (
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    Thread-specific challenge
                  </Typography>
                )}
              </Box>
            }
          >
            <Box>{card}</Box>
          </Tooltip>
        )
      })}
      </Box>
      {normalizedWinningLines.length > 0 && (
        <Box
          component="svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          {normalizedWinningLines.map((entry, lineIndex) => {
            const { start, end } = getLineEndpoints(entry.line)
            const color = teamColors[entry.teamId] || theme.palette.success.main
            const key = `${entry.teamId}-${entry.line.join('_')}`
            return (
              <line
                key={key}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={color}
                strokeWidth={2.4}
                strokeLinecap="round"
                pathLength={1}
                style={{
                  filter: `drop-shadow(0 0 3px ${alpha(color, 0.85)})`,
                  strokeDasharray: 1,
                  strokeDashoffset: 1,
                  animation: `bingoLineDraw 620ms ease-out ${lineIndex * 180}ms forwards`,
                }}
              />
            )
          })}
          <style>
            {`
              @keyframes bingoLineDraw {
                to { stroke-dashoffset: 0; }
              }
              @media (prefers-reduced-motion: reduce) {
                line { animation-duration: 1ms !important; animation-delay: 0ms !important; }
              }
            `}
          </style>
        </Box>
      )}
    </Box>
  )
}
