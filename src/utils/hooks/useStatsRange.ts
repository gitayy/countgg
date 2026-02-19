import { useCallback, useMemo } from 'react'
import moment from 'moment-timezone'

type StatsSource = Record<string, any> | undefined

export const useStatsRange = (
  allStats: StatsSource,
  selectedStartDate: any | null,
  selectedEndDate: any | null,
  timezone: string,
) => {
  const toStatsDayKey = useCallback((date: any): string | undefined => {
    if (!date || !moment.isMoment(date) || !date.isValid()) {
      return undefined
    }
    return date.clone().tz(timezone).format('YYYY-MM-DD')
  }, [timezone])

  const disableDate = useCallback((date: any) => {
    const minDate = moment.tz('2023-02-22', 'YYYY-MM-DD', timezone).startOf('day').unix()
    const maxDate = moment().tz(timezone).startOf('day').unix()
    return date.unix() < minDate || date.unix() >= maxDate
  }, [timezone])

  const { stats, graphStatsSource } = useMemo(() => {
    if (!allStats) {
      return { stats: undefined, graphStatsSource: undefined }
    }

    const mergeStats = (stats1: any, stats2: any): any => {
      if (!stats1) return stats2
      if (!stats2) return stats1

      const latestStats = {
        last_updated: Math.max(stats1.last_updated, stats2.last_updated),
        last_updated_uuid: stats1.last_updated > stats2.last_updated ? stats1.last_updated_uuid : stats2.last_updated_uuid,
      }

      const keysToMerge = ['gets', 'assists', 'palindromes', 'repdigits', 'leaderboard']
      keysToMerge.forEach((key) => {
        latestStats[key] = {}

        if (stats1[key]) {
          for (const id in stats1[key]) {
            if (stats1[key].hasOwnProperty(id)) {
              latestStats[key][id] = (latestStats[key][id] || 0) + stats1[key][id]
            }
          }
        }

        if (stats2[key]) {
          for (const id in stats2[key]) {
            if (stats2[key].hasOwnProperty(id)) {
              latestStats[key][id] = (latestStats[key][id] || 0) + stats2[key][id]
            }
          }
        }
      })

      latestStats['speed'] = (stats1.speed || []).concat(stats2.speed || [])
      latestStats['splitSpeed'] = (stats1.splitSpeed || []).concat(stats2.splitSpeed || [])
      latestStats['speedCount'] = (stats1.speedCount ?? stats1.speed?.length ?? 0) + (stats2.speedCount ?? stats2.speed?.length ?? 0)
      latestStats['splitSpeedCount'] =
        (stats1.splitSpeedCount ?? stats1.splitSpeed?.length ?? 0) + (stats2.splitSpeedCount ?? stats2.splitSpeed?.length ?? 0)
      return latestStats
    }

    const getFirstDate = (statsObj: Record<string, any>) => {
      let firstDate: string | null = null
      for (const dateStr in statsObj) {
        if (statsObj.hasOwnProperty(dateStr) && dateStr !== 'all') {
          if (!firstDate || dateStr < firstDate) {
            firstDate = dateStr
          }
        }
      }
      return firstDate
    }

    const getNextDate = (dateStr: string) => moment.tz(dateStr, 'YYYY-MM-DD', timezone).add(1, 'days').format('YYYY-MM-DD')
    const startDateStr = selectedStartDate && !disableDate(selectedStartDate) ? toStatsDayKey(selectedStartDate) : undefined
    const endDateStr = selectedEndDate && !disableDate(selectedEndDate) ? toStatsDayKey(selectedEndDate) : undefined

    const buildGraphStatsSource = (startDate?: string, endDate?: string) => {
      if (!startDate && !endDate) {
        return allStats
      }

      const filtered: Record<string, any> = {}
      if (startDate && endDate) {
        for (let date = startDate; date <= endDate; date = getNextDate(date)) {
          if (allStats[date]) {
            filtered[date] = allStats[date]
          }
        }
      } else if (endDate) {
        const firstDate = getFirstDate(allStats)
        if (!firstDate) return undefined
        for (let date = firstDate; date <= endDate; date = getNextDate(date)) {
          if (allStats[date]) {
            filtered[date] = allStats[date]
          }
        }
      } else if (startDate && allStats[startDate]) {
        filtered[startDate] = allStats[startDate]
      }

      let merged: any = undefined
      Object.keys(filtered)
        .sort()
        .forEach((date) => {
          merged = mergeStats(merged, filtered[date])
        })
      if (merged) {
        filtered['all'] = merged
      }
      return filtered
    }

    if (startDateStr && endDateStr) {
      let merged = allStats[startDateStr]
      for (let date = getNextDate(startDateStr); date <= endDateStr; date = getNextDate(date)) {
        merged = mergeStats(merged, allStats[date])
      }
      return { stats: merged, graphStatsSource: buildGraphStatsSource(startDateStr, endDateStr) }
    }

    if (endDateStr) {
      const firstDate = getFirstDate(allStats)
      if (!firstDate) {
        return { stats: undefined, graphStatsSource: undefined }
      }
      let merged = allStats[firstDate]
      for (let date = getNextDate(firstDate); date <= endDateStr; date = getNextDate(date)) {
        merged = mergeStats(merged, allStats[date])
      }
      return { stats: merged, graphStatsSource: buildGraphStatsSource(undefined, endDateStr) }
    }

    if (startDateStr) {
      return {
        stats: allStats[startDateStr],
        graphStatsSource: buildGraphStatsSource(startDateStr, startDateStr),
      }
    }

    return { stats: allStats['all'], graphStatsSource: allStats }
  }, [allStats, selectedStartDate, selectedEndDate, timezone, disableDate, toStatsDayKey])

  return {
    stats,
    graphStatsSource,
    disableDate,
    toStatsDayKey,
  }
}
