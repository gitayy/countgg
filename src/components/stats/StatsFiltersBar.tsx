import { useMemo } from 'react'
import { Autocomplete, Box, Button, IconButton, InputAdornment, TextField, Typography } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import ClearIcon from '@mui/icons-material/Clear'
import moment from 'moment-timezone'
import { ThreadType } from '../../utils/types'

interface Props {
  allThreads: ThreadType[]
  selectedThread: ThreadType | { name: string; uuid: string }
  onThreadChange: (uuid: string) => void
  selectedStartDate: any | null
  selectedEndDate: any | null
  onStartDateChange: (date: any | null) => void
  onEndDateChange: (date: any | null) => void
  onCopyLink: () => void
  statsTimezone: string
}

export const StatsFiltersBar = ({
  allThreads,
  selectedThread,
  onThreadChange,
  selectedStartDate,
  selectedEndDate,
  onStartDateChange,
  onEndDateChange,
  onCopyLink,
  statsTimezone,
}: Props) => {
  const uncategorizedLabel = 'Uncategorized'
  const categoryOrder: Record<string, number> = {
    'Double Counting': 0,
    Traditional: 1,
    'No Mistakes': 2,
    Miscellaneous: 3,
  }

  type ThreadOption = {
    uuid: string
    title: string
    name: string
    category: string
  }

  const threadOptions = useMemo<ThreadOption[]>(() => {
    const normalized = allThreads
      .map((thread) => ({
        uuid: thread.uuid,
        title: thread.title,
        name: thread.name,
        category: thread.category?.trim() || uncategorizedLabel,
      }))
      .sort((a, b) => {
        const aIsUncategorized = a.category === uncategorizedLabel
        const bIsUncategorized = b.category === uncategorizedLabel
        if (aIsUncategorized !== bIsUncategorized) {
          return aIsUncategorized ? 1 : -1
        }

        const aKnownRank = categoryOrder[a.category]
        const bKnownRank = categoryOrder[b.category]
        const aIsKnown = aKnownRank !== undefined
        const bIsKnown = bKnownRank !== undefined
        if (aIsKnown && bIsKnown && aKnownRank !== bKnownRank) {
          return aKnownRank - bKnownRank
        }
        if (aIsKnown !== bIsKnown) {
          return aIsKnown ? -1 : 1
        }

        const byCategory = a.category.localeCompare(b.category)
        if (byCategory !== 0) return byCategory
        return a.title.localeCompare(b.title)
      })

    return [{ uuid: 'all', title: 'All Threads', name: 'all', category: 'Overview' }, ...normalized]
  }, [allThreads])

  const selectedThreadOption = useMemo<ThreadOption | null>(() => {
    const selectedUuid = selectedThread?.uuid || 'all'
    return threadOptions.find((option) => option.uuid === selectedUuid) || threadOptions[0] || null
  }, [selectedThread, threadOptions])

  return (
    <Box sx={{ mb: 2, p: 2, pl: 0, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
      <Box sx={{ minWidth: 380 }}>
        <Autocomplete
          options={threadOptions}
          value={selectedThreadOption}
          groupBy={(option) => option.category}
          getOptionLabel={(option) => option.title}
          isOptionEqualToValue={(option, value) => option.uuid === value.uuid}
          onChange={(_event, option) => onThreadChange(option?.uuid || 'all')}
          renderOption={(props, option) => (
            <li {...props} key={option.uuid}>
              {option.title}
            </li>
          )}
          renderInput={(params) => <TextField {...params} size="medium" placeholder="Search thread..." />}
          sx={{ minWidth: 380 }}
        />
      </Box>

      <DatePicker
        label="Start Date"
        value={selectedStartDate}
        onChange={(date) => onStartDateChange(date)}
        minDate={moment.tz('2023-02-23', 'YYYY-MM-DD', statsTimezone).startOf('day')}
        maxDate={moment().tz(statsTimezone).startOf('day').subtract(1, 'day')}
        renderInput={(params) => (
          <TextField
            {...params}
            InputProps={{
              endAdornment: (
                <>
                  {params?.InputProps?.endAdornment}
                  {selectedStartDate && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => onStartDateChange(null)}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )}
                </>
              ),
            }}
          />
        )}
      />

      <DatePicker
        label="End Date"
        value={selectedEndDate}
        onChange={(date) => onEndDateChange(date)}
        minDate={moment.tz('2023-02-23', 'YYYY-MM-DD', statsTimezone).startOf('day')}
        maxDate={moment().tz(statsTimezone).startOf('day').subtract(1, 'day')}
        renderInput={(params) => (
          <TextField
            {...params}
            InputProps={{
              endAdornment: (
                <>
                  {params?.InputProps?.endAdornment}
                  {selectedEndDate && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => onEndDateChange(null)}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )}
                </>
              ),
            }}
          />
        )}
      />

      <Button variant="outlined" onClick={onCopyLink}>
        Copy Link
      </Button>
    </Box>
  )
}
