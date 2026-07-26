import { RANK_COLORS, RANK_LABELS } from '../../utils/rankColors'
import { RankName } from '../../utils/types'

// TODO: remove, just use useTheme()
export const bingoThemeTokens = {
  bg0: '#0d1426',
  bg1: '#13203d',
  bg2: '#1a2c52',
  text0: '#f7fbff',
  text1: '#c5d3ed',
  accent: '#3ea6ff',
  success: '#38c172',
  warning: '#f4b740',
  danger: '#ef5350',
  fallback: '#aa4646',
} as const

export const BINGO_FALLBACK_COLOR = '#aa4646';

export const bingoTeamVisuals = {
  wave: {
    key: 'wave',
    name: 'Wave',
    color: '#1f8bff',
  },
  blaze: {
    key: 'blaze',
    name: 'Blaze',
    color: '#f4511e',
  },
  radiant: {
    key: 'radiant',
    name: 'Radiant',
    color: '#f6b71e',
  },
} as const

export type BingoTeamVisualKey = keyof typeof bingoTeamVisuals

export const getBingoTeamVisual = (teamKey?: string | null) => {
  const normalized = (teamKey || '').toLowerCase()
  if (normalized === 'wave') return bingoTeamVisuals.wave
  if (normalized === 'blaze') return bingoTeamVisuals.blaze
  if (normalized === 'radiant') return bingoTeamVisuals.radiant
  return bingoTeamVisuals.wave
}

export const getBingoRankColor = (rank?: string) => {
  if (!rank) {
    return BINGO_FALLBACK_COLOR
  }
  return RANK_COLORS[rank as RankName] || BINGO_FALLBACK_COLOR
}

export const getBingoRankLabel = (rank?: string) => {
  if (!rank) {
    return 'Bronze'
  }
  return RANK_LABELS[rank as RankName] || rank
}

export const getBingoColorToggleSx = (color: string, lightMode = false) => {
  return {
    color: lightMode ? '#133257' : '#eef5ff',
    borderColor: lightMode ? 'rgba(96, 128, 178, 0.35)' : 'rgba(196, 214, 245, 0.24)',
    transition: 'background-color 120ms ease, border-color 120ms ease, box-shadow 120ms ease, color 120ms ease',
    '&:hover': {
      bgcolor: `${color}38`,
      borderColor: `${color}88`,
    },
    '&.Mui-selected': {
      bgcolor: color,
      color: '#ffffff',
      borderColor: color,
      boxShadow: `0 0 0 1px ${color}cc, 0 8px 18px ${color}55`,
    },
    '&.Mui-selected:hover': {
      bgcolor: color,
      borderColor: color,
    },
    '&:focus-visible': {
      // outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: 2,
    },
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
    },
  } as const
}

export const getBingoRankToggleSx = (rank: RankName, lightMode = false) => {
  const color = getBingoRankColor(rank)
  return {
    color: lightMode ? '#133257' : '#eef5ff',
    borderColor: lightMode ? 'rgba(96, 128, 178, 0.35)' : 'rgba(196, 214, 245, 0.24)',
    transition: 'background-color 120ms ease, border-color 120ms ease, box-shadow 120ms ease, color 120ms ease',
    '&:hover': {
      bgcolor: `${color}38`,
      borderColor: `${color}88`,
    },
    '&.Mui-selected': {
      bgcolor: color,
      color: '#ffffff',
      borderColor: color,
      boxShadow: `0 0 0 1px ${color}cc, 0 8px 18px ${color}55`,
    },
    '&.Mui-selected:hover': {
      bgcolor: color,
      borderColor: color,
    },
    '&:focus-visible': {
      // outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: 2,
    },
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
    },
  } as const
}

export const bingoFocusRingSx = {
  '&:focus-visible': {
    // outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2,
  },
} as const
