import { getTeamColorMap } from './BingoBoard'
import { bingoThemeTokens, getBingoRankColor } from './bingoTheme'
import { RANK_COLORS } from '../../utils/rankColors'

describe('bingo theme helpers', () => {
  test('returns known rank colors and fallback for unknown values', () => {
    expect(getBingoRankColor('bronze')).toBe(RANK_COLORS.bronze)
    expect(getBingoRankColor('gold')).toBe(RANK_COLORS.gold)
    expect(getBingoRankColor('peak')).toBe(RANK_COLORS.peak)
    expect(getBingoRankColor('impossible')).toBe(bingoThemeTokens.fallback)
    expect(getBingoRankColor(undefined)).toBe(bingoThemeTokens.fallback)
  })

  test('maps unique team ids to palette entries in sorted order', () => {
    const map = getTeamColorMap([
      {
        userUuid: 'u1',
        username: 'a',
        role: 'member',
        status: 'active',
        teamId: 3,
      },
      {
        userUuid: 'u2',
        username: 'b',
        role: 'member',
        status: 'active',
        teamId: 1,
      },
      {
        userUuid: 'u3',
        username: 'c',
        role: 'member',
        status: 'active',
        teamId: 3,
      },
    ])

    expect(Object.keys(map)).toEqual(['1', '3'])
    expect(map[1]).toBeDefined()
    expect(map[3]).toBeDefined()
    expect(map[1]).not.toBe(map[3])
  })
})
