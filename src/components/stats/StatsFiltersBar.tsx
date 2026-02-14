import { Box, Button, FormControl, IconButton, InputAdornment, MenuItem, Select, TextField, Typography } from '@mui/material'
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
  return (
    <Box sx={{ mb: 2, p: 2, pl: 0, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
      <FormControl variant="standard" sx={{ minWidth: 220 }}>
        <Typography>Please select a thread:</Typography>
        <Select value={selectedThread ? selectedThread.uuid : ''} onChange={(e) => onThreadChange(e.target.value)}>
          <MenuItem key={'all'} value={'all'}>
            all
          </MenuItem>
          {allThreads.map((thread) => (
            <MenuItem key={thread.uuid} value={thread.uuid}>
              {thread.title}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

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
