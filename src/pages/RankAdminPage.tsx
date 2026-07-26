import { Fragment, useContext, useEffect, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import {
  getRankChallenges,
  getRankSeasons,
  adminCreateChallenge,
  adminCreateChallengeBatch,
  adminUpdateChallenge,
  adminDeleteChallenge,
  adminStartSeason,
  adminEndSeason,
} from '../utils/api'
import { RankChallenge, RankSeason, RankName, ThreadType } from '../utils/types'
import { getChallengeTitle, getPrettyTypeName } from '../utils/challengeTitle'
import { UserContext } from '../utils/contexts/UserContext'
import { ThreadsContext } from '../utils/contexts/ThreadsContext'
import { ThresholdLeaderboard } from '../components/ThresholdLeaderboard'
import { CHALLENGE_TYPES, SITEWIDE_ONLY_TYPES, THREAD_REQUIRED_TYPES, RANK_OPTIONS } from '../utils/challengeTypes'

const DEFAULT_TIER_TARGET = 1
const DEFAULT_TIER_GG = 20
const BULK_SEQUENCES_PER_RANK = 3

// One row per (rank, sequence) template — type/thread are shared across the whole batch above,
// but params/target/ggReward are each row's own, since different tiers in the same chain almost
// always need different thresholds (e.g. a tighter maxMs for a higher rank). Grouped by rank with
// sequence auto-numbered within each rank (0, 1, 2, then the next rank restarts at 0), matching
// how assignNextInChain actually chains templates. existingId is set when this row was reconciled
// against an already-saved challenge (see reconcileBulkRows) — submitting a row with existingId
// issues an UPDATE instead of a CREATE, so re-opening bulk mode on a type/thread that already has
// challenges is safe to re-submit without creating duplicates.
interface BulkTierRow {
  existingId: string | null
  rank: RankName | ''
  sequence: number
  target: number
  ggReward: number
  params: string
}

// Default grid: every rank, 3 sequence steps each (27 rows) — "give me everything, per rank,
// pre-numbered" with zero clicks. Admins trim with Remove for ranks/steps they don't want. Every
// row starts with the same seedParams (typically whatever was in the single-create form when
// bulk mode was switched on) as a starting point, editable per row afterward.
const defaultBulkRows = (seedParams = ''): BulkTierRow[] => {
  const rows: BulkTierRow[] = []
  for (const rank of RANK_OPTIONS) {
    for (let seq = 0; seq < BULK_SEQUENCES_PER_RANK; seq++) {
      rows.push({ existingId: null, rank, sequence: seq, target: DEFAULT_TIER_TARGET, ggReward: DEFAULT_TIER_GG, params: seedParams })
    }
  }
  return rows
}

// Matches each default row against an already-saved challenge sharing the same (rank, sequence)
// within this type/thread combo — if found, the row is prefilled with that challenge's real
// target/ggReward/params/id so editing + submitting updates it in place instead of creating a
// duplicate. Existing challenges with a (rank, sequence) NOT covered by the default 3-per-rank
// grid (e.g. a hand-added sequence 3) are appended as their own rows so nothing already saved
// goes invisible.
const reconcileBulkRows = (existing: RankChallenge[], seedParams = ''): BulkTierRow[] => {
  const rows = defaultBulkRows(seedParams)
  const matchedIds = new Set<string>()
  for (const row of rows) {
    const match = existing.find((c) => c.rank === row.rank && c.sequence === row.sequence)
    if (match) {
      row.existingId = match.id
      row.target = match.target
      row.ggReward = match.ggReward
      row.params = match.params ? JSON.stringify(match.params, null, 2) : ''
      matchedIds.add(match.id)
    }
  }
  const extras = existing
    .filter((c) => !matchedIds.has(c.id))
    .sort((a, b) => RANK_OPTIONS.indexOf(a.rank) - RANK_OPTIONS.indexOf(b.rank) || a.sequence - b.sequence)
    .map((c) => ({
      existingId: c.id,
      rank: c.rank,
      sequence: c.sequence,
      target: c.target,
      ggReward: c.ggReward,
      params: c.params ? JSON.stringify(c.params, null, 2) : '',
    }))
  return [...rows, ...extras]
}

interface ChallengeFormState {
  type: string
  rank: RankName | ''
  sequence: number
  target: number
  ggReward: number
  rewardType: 'gg' | 'auto_jump'
  threadUuid: string
  params: string
}

const emptyForm = (): ChallengeFormState => ({
  type: '',
  rank: '',
  sequence: 0,
  target: DEFAULT_TIER_TARGET,
  ggReward: DEFAULT_TIER_GG,
  rewardType: 'gg',
  threadUuid: '',
  params: '',
})

const challengeToForm = (c: RankChallenge): ChallengeFormState => ({
  type: c.type ?? '',
  rank: c.rank ?? '',
  sequence: c.sequence ?? 0,
  target: c.target ?? 0,
  ggReward: c.ggReward ?? 0,
  rewardType: c.rewardType ?? 'gg',
  threadUuid: c.threadUuid ?? '',
  params: c.params ? JSON.stringify(c.params, null, 2) : '',
})

// Typed-field schema for each type's known/required params (mirrors rank.evaluation.service.ts's
// actual params.* reads) — rendered as normal labeled inputs instead of raw JSON. The JSON
// textarea underneath stays as a free-form "override" merged on top via spread, so anything not
// covered here (or a future param) is still reachable without a code change.
type ParamFieldSchema = {
  key: string
  label: string
  kind: 'number' | 'text' | 'stringList' | 'select'
  defaultValue: number | string | string[]
  // Only used when kind === 'select' — free-text would let a typo (e.g. "Under") silently no-op
  // on the backend's exact string comparison (params?.direction === 'over') instead of erroring.
  options?: string[]
}

// Every field here is named/typed to match EXACTLY what rank.evaluation.service.ts actually
// reads off params.* for that challenge type (see the `params?.xxx` reads in each evaluator) —
// a mismatched key here silently no-ops on the backend (falls through to that read's default,
// e.g. `params?.maxScore ?? Infinity`) instead of erroring, so drift here is invisible until a
// real challenge quietly does the wrong thing. If you add/change a params.* read on the
// backend, mirror it here in the same commit.
const PARAM_FIELD_SCHEMAS: Record<string, ParamFieldSchema[]> = {
  accuracy_rate: [
    { key: 'windowSize', label: 'Window Size (counts)', kind: 'number', defaultValue: 200 },
    { key: 'minAccuracyPercent', label: 'Min Accuracy %', kind: 'number', defaultValue: 95 },
  ],
  split_under_ms: [{ key: 'maxMs', label: 'Max Ms', kind: 'number', defaultValue: 5000 }],
  get_under_ms: [{ key: 'maxMs', label: 'Max Ms', kind: 'number', defaultValue: 5000 }],
  bars_within_ms: [{ key: 'maxMs', label: 'Max Ms (per bar)', kind: 'number', defaultValue: 500 }],
  // Lower is better — a play only counts toward this challenge if its score <= maxScore. target
  // is the number of QUALIFYING plays needed (usually 1, for "get a score this good once"), not
  // the score itself — see handleLrwoedScore.
  lrwoed_score: [{ key: 'maxScore', label: 'Max Score (lower is better)', kind: 'number', defaultValue: 10 }],
  // target is the number of qualifying (size >= minSize, non-preseeded) wins needed — see
  // handleNumberShuffleWin.
  number_shuffle_win: [{ key: 'minSize', label: 'Min Size', kind: 'number', defaultValue: 5 }],
  // direction picks the comparison (backend does an exact string check, params?.direction ===
  // 'over' — see evaluateRollChallenges); threshold is the roll value compared against.
  roll: [
    { key: 'direction', label: 'Direction', kind: 'select', options: ['under', 'over'], defaultValue: 'under' },
    { key: 'threshold', label: 'Threshold', kind: 'number', defaultValue: 10 },
  ],
}

// Mirrors RankAssignmentService.chainKey (countgg-api/src/rank/rank.assignment.service.ts) —
// the actual grouping the backend uses to decide "what's the next challenge in this chain"
// when one completes. Different types group by different fields (not uniformly by
// type+thread), so the admin comparison table needs the same logic or it'll show the wrong
// "existing challenges in this chain" set for accuracy_rate.
function chainKey(c: Pick<RankChallenge, 'type' | 'threadUuid' | 'params'>): string {
  switch (c.type) {
    case 'thread_counts':
    case 'counts_in_day':
      return `${c.type}:${c.threadUuid ?? 'sitewide'}`
    case 'accuracy_rate':
      return `${c.type}:${c.threadUuid ?? 'sitewide'}:${c.params?.validationType ?? ''}`
    // Per-thread speedrun/split challenges — must include threadUuid, same as the backend's
    // real chainKey (rank.constants.ts), or two different threads' instances of the same type
    // would be incorrectly treated as one chain here.
    case 'split_under_ms':
    case 'get_under_ms':
    case 'bars_within_ms':
      return `${c.type}:${c.threadUuid ?? 'sitewide'}:${c.params?.validationType ?? ''}`
    case 'count_attempts':
      return `${c.type}:${c.threadUuid ?? 'sitewide'}`
    case 'roll':
      return `${c.type}:${c.params?.direction ?? ''}:${c.params?.validationType ?? ''}`
    case 'lrwoed_score':
    case 'number_shuffle_win':
      return `${c.type}:${c.params?.validationType ?? ''}`
    default:
      return c.type
  }
}

function ChallengeForm({
  form,
  setForm,
  error,
  onSubmit,
  onCancel,
  submitLabel,
  threads = [],
  editingId = null,
  isEdit = false,
  success = null,
  bulkRows = null,
  setBulkRows,
}: {
  form: ChallengeFormState
  setForm: (f: ChallengeFormState) => void
  error: string | null
  success?: string | null
  onSubmit: () => void
  onCancel: () => void
  submitLabel: string
  threads?: ThreadType[]
  editingId?: string | null
  isEdit?: boolean
  // Non-null enables bulk-tier mode: rank/sequence/target/ggReward become a repeatable list of
  // rows instead of single fields, all sharing this form's type/thread/params. Only offered on
  // create (never edit — editing one row at a time is unambiguous already).
  bulkRows?: BulkTierRow[] | null
  setBulkRows?: (rows: BulkTierRow[]) => void
}) {
  const threadDisabled = SITEWIDE_ONLY_TYPES.has(form.type)
  const threadRequired = THREAD_REQUIRED_TYPES.has(form.type)

  const selectedThread = threads.find((t) => t.uuid === form.threadUuid) ?? null

  // Same-chain challenges for comparison — uses the actual backend chainKey grouping (not
  // just type+thread), since several types key off params.validationType instead.
  let formParams: RankChallenge['params'] = null
  try {
    formParams = form.params.trim() ? JSON.parse(form.params) : null
  } catch {
    formParams = null
  }
  const formChainKey = form.type
    ? chainKey({ type: form.type as RankChallenge['type'], threadUuid: form.threadUuid || null, params: formParams })
    : null

  // Chain-preview data is fetched fresh, scoped by type (+ rank, + threadUuid when the type is
  // thread-scoped) — rather than reusing the site-wide `allChallenges` list (500 challenges
  // across every thread) — so this stays correct and cheap as the number of threads grows.
  // Non-thread-scoped types (split_under_ms etc.) still fetch by type+rank alone, matching how
  // chainKey groups them (by validationType, not thread).
  const [comboCandidates, setComboCandidates] = useState<RankChallenge[]>([])
  useEffect(() => {
    if (!form.type || !form.rank) {
      setComboCandidates([])
      return
    }
    let cancelled = false
    getRankChallenges({
      type: form.type,
      rank: form.rank,
      threadUuid: !threadDisabled && form.threadUuid ? form.threadUuid : undefined,
      limit: 200,
    })
      .then(({ data }) => {
        if (!cancelled) setComboCandidates(data.items as RankChallenge[])
      })
      .catch(() => {
        if (!cancelled) setComboCandidates([])
      })
    return () => {
      cancelled = true
    }
  }, [form.type, form.rank, form.threadUuid, threadDisabled])

  // Bulk mode spans every rank, so it needs its own fetch (no rank filter) — re-reconciles
  // whenever type/thread changes while bulk mode is open, not just at the moment it was
  // switched on, so picking a different thread after already being in bulk mode still loads
  // that combo's existing tiers instead of leaving stale/empty rows.
  useEffect(() => {
    if (bulkRows == null || !setBulkRows) return
    if (!form.type) return
    let cancelled = false
    getRankChallenges({
      type: form.type,
      threadUuid: !threadDisabled && form.threadUuid ? form.threadUuid : undefined,
      limit: 200,
    })
      .then(({ data }) => {
        if (cancelled) return
        const items = data.items as RankChallenge[]
        // getRankChallenges omits threadUuid from the query entirely for sitewide (rather than
        // filtering threadUuid: null), so for non-thread types it can return every thread's
        // rows — filter client-side to exactly this combo's threadUuid (null/''/undefined all
        // mean sitewide here) before reconciling.
        const scoped = items.filter((c) => (c.threadUuid || '') === (form.threadUuid || ''))
        setBulkRows!(reconcileBulkRows(scoped, form.params))
      })
      .catch(() => {
        if (!cancelled) setBulkRows!(defaultBulkRows(form.params))
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.type, form.threadUuid, threadDisabled, bulkRows == null])

  // Must also match rank — assignNextInChain's actual siblings query scopes by { type, rank }
  // before applying chainKey, so two challenges with the same type+chainKey but different
  // rank are separate chains in reality (e.g. a bronze and a silver thread_counts challenge
  // for the same thread each legitimately start their own chain at sequence 0).
  const sameCombo = formChainKey
    ? comboCandidates.filter((c) => c.type === form.type && c.rank === form.rank && chainKey(c) === formChainKey && c.id !== editingId)
    : []
  const sameComboSorted = sameCombo.slice().sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
  // Flag gaps/duplicates in the sequence — the actual thing that breaks chain auto-advance
  // (assignNextInChain looks for sequence+1 exactly; a gap silently breaks progression).
  const sequenceIssues: string[] = []
  const seqs = sameComboSorted.map((c) => c.sequence ?? 0)
  const seqCounts = new Map<number, number>()
  for (const s of seqs) seqCounts.set(s, (seqCounts.get(s) ?? 0) + 1)
  Array.from(seqCounts.entries()).forEach(([s, count]) => {
    if (count > 1) sequenceIssues.push(`sequence ${s} is used by ${count} challenges`)
  })
  for (let i = 0; i < seqs.length - 1; i++) {
    if (seqs[i + 1] - seqs[i] > 1) sequenceIssues.push(`gap between sequence ${seqs[i]} and ${seqs[i + 1]}`)
  }

  // Speed types store their threshold as maxMs (ms per count, or per bar for bars_within_ms)
  // rather than a human counts/sec rate — surface the equivalent rate so it's easy to judge
  // whether a threshold is actually reasonable without doing the division by hand.
  const maxMs = typeof formParams?.maxMs === 'number' ? formParams.maxMs : null
  const speedRateLabel =
    maxMs && maxMs > 0 && (form.type === 'split_under_ms' || form.type === 'get_under_ms' || form.type === 'bars_within_ms')
      ? `≈ ${(1000 / maxMs).toFixed(2)} counts/sec${form.type === 'bars_within_ms' ? ' per bar' : ''}`
      : null

  // Known params (per PARAM_FIELD_SCHEMAS) get labeled inputs; everything else in the parsed
  // params object is "extra" and lives in the override JSON box, spread on top on save so a
  // param this schema doesn't know about is never silently dropped.
  const fieldSchema = PARAM_FIELD_SCHEMAS[form.type] ?? []
  const schemaKeys = new Set(fieldSchema.map((f) => f.key))
  const extraParams = formParams ? Object.fromEntries(Object.entries(formParams).filter(([k]) => !schemaKeys.has(k))) : {}
  const overrideParamsText = Object.keys(extraParams).length > 0 ? JSON.stringify(extraParams, null, 2) : ''

  const setParamField = (key: string, value: any) =>
    setForm({ ...form, params: JSON.stringify({ ...formParams, [key]: value }, null, 2) })
  const setOverrideParams = (raw: string) => {
    let extra: Record<string, any>
    try {
      extra = raw.trim() ? JSON.parse(raw) : {}
    } catch {
      return // leave params untouched until the JSON is valid again
    }
    const known: Record<string, any> = {}
    for (const field of fieldSchema) {
      if (formParams && field.key in formParams) known[field.key] = formParams[field.key]
    }
    setForm({ ...form, params: JSON.stringify({ ...known, ...extra }, null, 2) })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      {/* Row 1: Type + Thread */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ flex: '1 1 180px' }}>
          <InputLabel>Type</InputLabel>
          <Select
            label="Type"
            value={form.type}
            disabled={isEdit}
            onChange={(e) => {
              const newType = e.target.value
              const newThreadUuid = SITEWIDE_ONLY_TYPES.has(newType) ? '' : form.threadUuid
              const schema = PARAM_FIELD_SCHEMAS[newType] ?? []
              const defaults =
                schema.length > 0 ? JSON.stringify(Object.fromEntries(schema.map((f) => [f.key, f.defaultValue])), null, 2) : ''
              setForm({ ...form, type: newType, threadUuid: newThreadUuid, params: defaults })
            }}
          >
            {CHALLENGE_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {getPrettyTypeName(t)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Autocomplete
          size="small"
          sx={{ flex: '1 1 220px' }}
          options={threads}
          getOptionLabel={(t) => t.name}
          value={threadDisabled ? null : selectedThread}
          disabled={threadDisabled}
          onChange={(_e, val) => setForm({ ...form, threadUuid: val?.uuid ?? '' })}
          renderInput={(params) => (
            <TextField
              {...params}
              label={threadRequired ? 'Thread (required)' : threadDisabled ? 'Thread (sitewide only)' : 'Thread (optional)'}
              error={threadRequired && !form.threadUuid}
              helperText={threadRequired && !form.threadUuid ? 'Required for thread_counts' : undefined}
            />
          )}
          clearOnEscape
          isOptionEqualToValue={(a, b) => a.uuid === b.uuid}
          noOptionsText="No threads found"
        />
      </Box>

      {bulkRows == null ? (
        <>
          {/* Row 2: Rank */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ flex: '1 1 140px' }}>
              <InputLabel>Rank</InputLabel>
              <Select label="Rank" value={form.rank} onChange={(e) => setForm({ ...form, rank: e.target.value as RankName })}>
                {RANK_OPTIONS.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Row 3: Sequence, Target, GG */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Sequence"
              type="number"
              size="small"
              value={form.sequence}
              onChange={(e) => setForm({ ...form, sequence: Number(e.target.value) })}
              sx={{ flex: '0 1 100px' }}
            />
            <TextField
              label="Target"
              type="number"
              required
              size="small"
              value={form.target}
              onChange={(e) => setForm({ ...form, target: Number(e.target.value) })}
              sx={{ flex: '0 1 100px' }}
            />
            <TextField
              label="GG Reward"
              type="number"
              required
              size="small"
              value={form.ggReward}
              onChange={(e) => setForm({ ...form, ggReward: Number(e.target.value) })}
              sx={{ flex: '0 1 110px' }}
            />
            <FormControl size="small" sx={{ flex: '1 1 160px' }}>
              <InputLabel>Reward Type</InputLabel>
              <Select
                label="Reward Type"
                value={form.rewardType}
                onChange={(e) => setForm({ ...form, rewardType: e.target.value as 'gg' | 'auto_jump' })}
              >
                <MenuItem value="gg">GG (normal)</MenuItem>
                <MenuItem value="auto_jump">Auto-jump to rank</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </>
      ) : (
        // Bulk-tier mode: rows grouped by rank, sequence auto-numbered within each group (0, 1,
        // 2, ...) — matches assignNextInChain's actual chaining, so sequence is never manually
        // typed (that's how gaps/duplicates happened before). A pale highlight marks rows
        // reconciled against an already-saved challenge (existingId set) — submitting those
        // updates in place rather than creating a duplicate.
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Tiers (type/thread shared by every row; target/GG/params are each row's own) — grouped by rank, sequence auto-numbered:
          </Typography>
          {RANK_OPTIONS.filter((r) => bulkRows.some((row) => row.rank === r)).map((rank) => {
            const rankRows = bulkRows.filter((row) => row.rank === rank)
            return (
              <Box key={rank} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="caption" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
                  {rank}
                </Typography>
                {rankRows.map((row) => {
                  const i = bulkRows.indexOf(row)
                  let rowParams: RankChallenge['params'] = null
                  try {
                    rowParams = row.params.trim() ? JSON.parse(row.params) : null
                  } catch {
                    rowParams = null
                  }
                  const setRowField = (patch: Partial<BulkTierRow>) => {
                    const next = bulkRows.slice()
                    next[i] = { ...row, ...patch }
                    setBulkRows!(next)
                  }
                  const setRowParamField = (key: string, value: any) =>
                    setRowField({ params: JSON.stringify({ ...rowParams, [key]: value }, null, 2) })
                  return (
                    <Box
                      key={i}
                      sx={{
                        display: 'flex',
                        gap: 2,
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        pl: 2,
                        py: 0.5,
                        ...(row.existingId ? { bgcolor: 'rgba(33,150,243,0.08)', borderRadius: 1 } : {}),
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ flex: '0 0 70px' }}>
                        Seq {row.sequence}
                        {row.existingId ? ' (existing)' : ''}
                      </Typography>
                      <TextField
                        label="Target"
                        type="number"
                        required
                        size="small"
                        value={row.target}
                        onChange={(e) => setRowField({ target: Number(e.target.value) })}
                        sx={{ flex: '0 0 100px' }}
                      />
                      <TextField
                        label="GG Reward"
                        type="number"
                        required
                        size="small"
                        value={row.ggReward}
                        onChange={(e) => setRowField({ ggReward: Number(e.target.value) })}
                        sx={{ flex: '0 0 110px' }}
                      />
                      {fieldSchema.map((field) => {
                        const raw = rowParams?.[field.key]
                        if (field.kind === 'select') {
                          const value = raw ?? field.defaultValue
                          return (
                            <FormControl size="small" key={field.key} sx={{ flex: '0 0 140px' }}>
                              <InputLabel>{field.label}</InputLabel>
                              <Select label={field.label} value={value} onChange={(e) => setRowParamField(field.key, e.target.value)}>
                                {(field.options ?? []).map((opt) => (
                                  <MenuItem key={opt} value={opt}>
                                    {opt}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )
                        }
                        if (field.kind === 'stringList') {
                          const value = Array.isArray(raw) ? raw.join(', ') : raw ?? (field.defaultValue as string[]).join(', ')
                          return (
                            <TextField
                              key={field.key}
                              label={field.label}
                              size="small"
                              value={value}
                              onChange={(e) =>
                                setRowParamField(
                                  field.key,
                                  e.target.value
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                )
                              }
                              sx={{ flex: '0 0 200px' }}
                            />
                          )
                        }
                        const value = raw ?? field.defaultValue
                        return (
                          <TextField
                            key={field.key}
                            label={field.label}
                            type={field.kind === 'number' ? 'number' : 'text'}
                            size="small"
                            value={value}
                            onChange={(e) =>
                              setRowParamField(field.key, field.kind === 'number' ? Number(e.target.value) : e.target.value)
                            }
                            sx={{ flex: '0 0 140px' }}
                          />
                        )
                      })}
                      <Button size="small" color="error" onClick={() => setBulkRows!(bulkRows.filter((_, j) => j !== i))}>
                        Remove
                      </Button>
                    </Box>
                  )
                })}
                <Button
                  size="small"
                  variant="text"
                  sx={{ alignSelf: 'flex-start', ml: 2 }}
                  onClick={() => {
                    const nextSeq = Math.max(-1, ...rankRows.map((r) => r.sequence)) + 1
                    const last = rankRows[rankRows.length - 1]
                    setBulkRows!([
                      ...bulkRows,
                      {
                        existingId: null,
                        rank,
                        sequence: nextSeq,
                        target: last?.target ?? DEFAULT_TIER_TARGET,
                        ggReward: last?.ggReward ?? DEFAULT_TIER_GG,
                        params: last?.params ?? '',
                      },
                    ])
                  }}
                >
                  + Add sequence step to {rank}
                </Button>
              </Box>
            )
          })}
          <FormControl size="small" sx={{ alignSelf: 'flex-start', minWidth: 180 }}>
            <InputLabel>+ Add rank</InputLabel>
            <Select
              label="+ Add rank"
              value=""
              onChange={(e) => {
                const rank = e.target.value as RankName
                setBulkRows!([
                  ...bulkRows,
                  { existingId: null, rank, sequence: 0, target: DEFAULT_TIER_TARGET, ggReward: DEFAULT_TIER_GG, params: '' },
                ])
              }}
            >
              {RANK_OPTIONS.filter((r) => !bulkRows.some((row) => row.rank === r)).map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Chain preview: every existing template in the same auto-advance chain (per the
          backend's chainKey grouping — type + threadUuid/params.validationType depending on
          type, NOT just type+thread), ordered by sequence within the form's selected rank.
          assignNextInChain only ever looks for sequence+1 within this exact grouping, so a
          gap or duplicate here silently breaks chain progression for real users. */}
      {sameCombo.length > 0 && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            Chain preview — same auto-advance group (type{form.threadUuid ? ' + thread' : ''}
            {formParams?.validationType ? ` + validationType "${formParams.validationType}"` : ''}):
          </Typography>
          {sequenceIssues.length > 0 && (
            <Alert severity="warning" sx={{ mb: 1 }}>
              {sequenceIssues.join('; ')} — chain auto-advance (assignNextInChain) only looks for sequence+1, so this will break
              progression for anyone in this chain.
            </Alert>
          )}
          <TableContainer component={Card} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Rank</TableCell>
                  <TableCell>Seq</TableCell>
                  <TableCell>Target</TableCell>
                  <TableCell>GG</TableCell>
                  <TableCell>Params</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sameComboSorted.map((c, i) => {
                  const prevInChain = sameComboSorted[i - 1]
                  const rankChanged = prevInChain && prevInChain.rank !== c.rank
                  return (
                    <TableRow key={c.id} sx={rankChanged ? { borderTop: '2px solid rgba(255,255,255,0.2)' } : undefined}>
                      <TableCell>{getChallengeTitle(c)}</TableCell>
                      <TableCell>{c.rank}</TableCell>
                      <TableCell>{c.sequence}</TableCell>
                      <TableCell>{c.target}</TableCell>
                      <TableCell>{c.ggReward}</TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                          {c.params ? JSON.stringify(c.params) : '—'}
                        </Typography>
                        {typeof c.params?.maxMs === 'number' && c.params.maxMs > 0 && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            ≈ {(1000 / c.params.maxMs).toFixed(2)} counts/sec{c.type === 'bars_within_ms' ? ' per bar' : ''}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Params: known fields for this type get normal labeled inputs (schema below mirrors
          rank.evaluation.service.ts's actual params.* reads); anything else goes in the JSON
          override box and is spread on top, so no param is ever unreachable. Only shown for
          single-create — in bulk mode each row has its own params (rendered inline above),
          since different tiers in a chain almost always need different thresholds. */}
      {bulkRows == null && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {fieldSchema.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Params:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {fieldSchema.map((field) => {
                  const raw = formParams?.[field.key]
                  if (field.kind === 'select') {
                    const value = raw ?? field.defaultValue
                    return (
                      <FormControl size="small" fullWidth key={field.key}>
                        <InputLabel>{field.label}</InputLabel>
                        <Select label={field.label} value={value} onChange={(e) => setParamField(field.key, e.target.value)}>
                          {(field.options ?? []).map((opt) => (
                            <MenuItem key={opt} value={opt}>
                              {opt}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )
                  }
                  if (field.kind === 'stringList') {
                    const value = Array.isArray(raw) ? raw.join(', ') : raw ?? (field.defaultValue as string[]).join(', ')
                    return (
                      <TextField
                        key={field.key}
                        label={field.label}
                        size="small"
                        fullWidth
                        value={value}
                        onChange={(e) =>
                          setParamField(
                            field.key,
                            e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          )
                        }
                      />
                    )
                  }
                  const value = raw ?? field.defaultValue
                  return (
                    <TextField
                      key={field.key}
                      label={field.label}
                      type={field.kind === 'number' ? 'number' : 'text'}
                      size="small"
                      fullWidth
                      value={value}
                      onChange={(e) => setParamField(field.key, field.kind === 'number' ? Number(e.target.value) : e.target.value)}
                    />
                  )
                })}
              </Box>
              {speedRateLabel && (
                <Typography variant="caption" color="text.secondary">
                  {speedRateLabel}
                </Typography>
              )}
            </Box>
          )}
          <TextField
            label={fieldSchema.length > 0 ? 'Extra params override (JSON, merged on top)' : 'Params (JSON)'}
            size="small"
            multiline
            rows={fieldSchema.length > 0 ? 2 : 3}
            defaultValue={overrideParamsText}
            key={form.type}
            onBlur={(e) => setOverrideParams(e.target.value)}
            placeholder="{}"
            inputProps={{ style: { fontFamily: 'monospace', fontSize: '0.8rem' } }}
          />
          {fieldSchema.length === 0 && speedRateLabel && (
            <Typography variant="caption" color="text.secondary">
              {speedRateLabel}
            </Typography>
          )}
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button variant="contained" size="small" onClick={onSubmit}>
          {submitLabel}
        </Button>
        <Button variant="outlined" size="small" onClick={onCancel}>
          Cancel
        </Button>
      </Box>

      {/* Threshold context: real leaderboard data to help pick a fair target */}
      {selectedThread?.name && (form.type === 'split_under_ms' || form.type === 'get_under_ms' || form.type === 'thread_counts') && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            Threshold context — click a row to use that value:
          </Typography>
          <Card variant="outlined">
            <CardContent>
              <ThresholdLeaderboard
                kind={form.type === 'thread_counts' ? 'daily_counts' : (form.type as 'split_under_ms' | 'get_under_ms')}
                threadName={selectedThread.name}
                onPickThreshold={(value) => {
                  if (form.type === 'thread_counts') {
                    setForm({ ...form, target: value })
                    return
                  }
                  let parsed: Record<string, any> = {}
                  try {
                    parsed = form.params ? JSON.parse(form.params) : {}
                  } catch {
                    parsed = {}
                  }
                  setForm({ ...form, params: JSON.stringify({ ...parsed, maxMs: value }, null, 2) })
                }}
              />
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  )
}

// At-a-glance grid answering "do we have challenges for every rank yet, for this type/thread" —
// without this, the only way to check was scrolling the flat challenge table or opening the
// create form's per-combo chain preview one thread at a time. Rows = threads (+ a Sitewide row
// for types that allow threadUuid: null), columns = ranks, cell = count of challenges in that
// combo (0 renders as an empty/warning cell so gaps jump out).
function CoverageMatrix({ challenges, threads }: { challenges: RankChallenge[]; threads: ThreadType[] }) {
  const [matrixType, setMatrixType] = useState<string>('')

  if (challenges.length === 0 && !matrixType) return null

  const sitewideOnly = SITEWIDE_ONLY_TYPES.has(matrixType)
  const threadRequired = THREAD_REQUIRED_TYPES.has(matrixType)

  const relevant = matrixType ? challenges.filter((c) => c.type === matrixType) : []

  // Row set: sitewide-only types get a single synthetic "sitewide" row; thread-required types
  // list every known thread; optionally-thread-scoped types (thread_counts, counts_in_day,
  // accuracy_rate) list every thread PLUS a Sitewide row, since either is valid for those.
  type Row = { key: string; label: string; threadUuid: string | null }
  const rows: Row[] = sitewideOnly
    ? [{ key: 'sitewide', label: 'Sitewide', threadUuid: null }]
    : [
        ...(threadRequired ? [] : [{ key: 'sitewide', label: 'Sitewide', threadUuid: null }]),
        ...threads.map((t) => ({ key: t.uuid, label: t.name, threadUuid: t.uuid })),
      ]

  const countFor = (threadUuid: string | null, rank: RankName): number =>
    relevant.filter((c) => (c.threadUuid ?? null) === threadUuid && c.rank === rank).length

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Coverage
        </Typography>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Type to check</InputLabel>
          <Select label="Type to check" value={matrixType} onChange={(e) => setMatrixType(e.target.value)}>
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {CHALLENGE_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {getPrettyTypeName(t)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      {matrixType && (
        <TableContainer component={Card} variant="outlined" sx={{ maxHeight: 420, overflow: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Thread</TableCell>
                {RANK_OPTIONS.map((r) => (
                  <TableCell key={r} align="center">
                    {r}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.key}>
                  <TableCell>{row.label}</TableCell>
                  {RANK_OPTIONS.map((r) => {
                    const count = countFor(row.threadUuid, r)
                    return (
                      <TableCell
                        key={r}
                        align="center"
                        sx={{
                          bgcolor: count === 0 ? 'rgba(244,67,54,0.12)' : 'rgba(76,175,80,0.12)',
                          color: count === 0 ? 'error.main' : 'success.main',
                          fontWeight: 600,
                        }}
                      >
                        {count === 0 ? '—' : count}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={RANK_OPTIONS.length + 1}>
                    <Typography variant="body2" color="text.secondary">
                      No threads found.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}

export const RankAdminPage = () => {
  const { counter } = useContext(UserContext)
  const { allThreads } = useContext(ThreadsContext)

  const [seasons, setSeasons] = useState<RankSeason[]>([])
  const [seasonError, setSeasonError] = useState<string | null>(null)
  const [showStartForm, setShowStartForm] = useState(false)
  const [newSeasonName, setNewSeasonName] = useState('')

  const [challenges, setChallenges] = useState<RankChallenge[]>([])
  const [challengeError, setChallengeError] = useState<string | null>(null)
  const [viewSeasonId, setViewSeasonId] = useState<number | null>(null)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState<ChallengeFormState>(emptyForm())
  const [createFormError, setCreateFormError] = useState<string | null>(null)
  const [createFormSuccess, setCreateFormSuccess] = useState<string | null>(null)
  const [bulkMode, setBulkMode] = useState(true)
  const [bulkRows, setBulkRows] = useState<BulkTierRow[]>(() => defaultBulkRows())

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<ChallengeFormState>(emptyForm())
  const [editFormError, setEditFormError] = useState<string | null>(null)

  const fetchSeasons = () => {
    getRankSeasons()
      .then(({ data }) => setSeasons(data))
      .catch(() => setSeasonError('Failed to load seasons'))
  }

  const fetchChallenges = (seasonId?: number) => {
    getRankChallenges({ limit: 500, seasonId })
      .then(({ data }) => setChallenges(data.items as RankChallenge[]))
      .catch(() => setChallengeError('Failed to load challenges'))
  }

  useEffect(() => {
    fetchSeasons()
  }, [])

  // Default the challenge view to the active season once seasons have loaded — falls back to
  // showing nothing (rather than every season's templates mixed together) if none is active yet.
  useEffect(() => {
    if (seasons.length === 0) return
    if (viewSeasonId != null) return
    const active = seasons.find((s) => s.endedAt == null)
    if (active) setViewSeasonId(active.id)
  }, [seasons, viewSeasonId])

  useEffect(() => {
    if (viewSeasonId == null) return
    fetchChallenges(viewSeasonId)
  }, [viewSeasonId])

  if (!counter?.roles?.includes('admin')) {
    return (
      <Box sx={{ maxWidth: 900, mx: 'auto', px: 2, py: 3 }}>
        <Typography variant="h5">Access denied.</Typography>
      </Box>
    )
  }

  const activeSeason = seasons.find((s) => s.endedAt == null)
  const isViewingActiveSeason = activeSeason != null && viewSeasonId === activeSeason.id

  const handleStartSeason = async () => {
    if (!newSeasonName.trim()) return
    try {
      await adminStartSeason(newSeasonName.trim())
      setNewSeasonName('')
      setShowStartForm(false)
      setSeasonError(null)
      fetchSeasons()
    } catch (err: any) {
      setSeasonError(err?.response?.data?.message || 'Failed to start season')
    }
  }

  const handleEndSeason = async () => {
    if (!window.confirm('End the current active season?')) return
    try {
      await adminEndSeason()
      setSeasonError(null)
      fetchSeasons()
    } catch (err: any) {
      setSeasonError(err?.response?.data?.message || 'Failed to end season')
    }
  }

  const parseParams = (raw: string): object | null | undefined => {
    if (!raw.trim()) return undefined
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  const MAXMS_TYPES = new Set(['split_under_ms', 'get_under_ms', 'bars_within_ms'])
  const requiresMaxMs = (form: ChallengeFormState, params: object | undefined) => MAXMS_TYPES.has(form.type) && !(params as any)?.maxMs

  const buildCreateDto = (form: ChallengeFormState): object | null => {
    const params = parseParams(form.params)
    if (params === null) return null
    if (requiresMaxMs(form, params)) return null
    return {
      type: form.type,
      rank: form.rank || undefined,
      sequence: form.sequence,
      target: form.target,
      ggReward: form.ggReward,
      rewardType: form.rewardType,
      threadUuid: form.threadUuid || undefined,
      params: params ?? undefined,
    }
  }

  const buildUpdateDto = (form: ChallengeFormState): object | null => {
    const params = parseParams(form.params)
    if (params === null) return null
    if (requiresMaxMs(form, params)) return null
    return {
      rank: form.rank || undefined,
      sequence: form.sequence,
      target: form.target,
      ggReward: form.ggReward,
      rewardType: form.rewardType,
      threadUuid: form.threadUuid || undefined,
      params: params ?? undefined,
    }
  }

  const handleCreate = async () => {
    if (bulkMode) {
      if (bulkRows.length === 0 || bulkRows.some((r) => !r.rank)) {
        setCreateFormError('Every tier row needs a rank selected')
        return
      }
      // Each row's params are parsed independently — a typo in one tier's params shouldn't
      // block submitting the rest, but we still refuse to submit anything until every row's
      // JSON is valid so nothing gets silently sent with the wrong params.
      const rowParams = new Map<number, object | undefined>()
      for (let i = 0; i < bulkRows.length; i++) {
        const parsed = parseParams(bulkRows[i].params)
        if (parsed === null) {
          setCreateFormError(`Invalid JSON in params for ${bulkRows[i].rank} seq ${bulkRows[i].sequence}`)
          return
        }
        rowParams.set(i, parsed)
      }
      // Rows reconciled against an existing challenge (existingId set — see reconcileBulkRows)
      // are PATCHed in place; brand-new rows are created via the existing batch endpoint. This
      // lets bulk mode be safely re-opened and re-submitted on a type/thread that already has
      // some challenges without ever creating duplicates.
      const toCreate = bulkRows.map((r, i) => ({ row: r, i })).filter(({ row }) => !row.existingId)
      const toUpdate = bulkRows.map((r, i) => ({ row: r, i })).filter(({ row }) => row.existingId)
      const createDtos = toCreate.map(({ row, i }) => ({
        type: createForm.type,
        rank: row.rank,
        sequence: row.sequence,
        target: row.target,
        ggReward: row.ggReward,
        threadUuid: createForm.threadUuid || undefined,
        params: rowParams.get(i),
      }))
      const updateDto = (row: BulkTierRow, i: number) => ({
        rank: row.rank,
        sequence: row.sequence,
        target: row.target,
        ggReward: row.ggReward,
        threadUuid: createForm.threadUuid || undefined,
        params: rowParams.get(i),
      })
      try {
        await Promise.all([
          createDtos.length > 0 ? adminCreateChallengeBatch(createDtos) : Promise.resolve(),
          ...toUpdate.map(({ row, i }) => adminUpdateChallenge(row.existingId as string, updateDto(row, i))),
        ])
        setCreateFormError(null)
        setCreateFormSuccess(
          [createDtos.length > 0 ? `${createDtos.length} created` : null, toUpdate.length > 0 ? `${toUpdate.length} updated` : null]
            .filter(Boolean)
            .join(', ') + '!',
        )
        fetchChallenges(viewSeasonId ?? undefined)
      } catch (err: any) {
        setCreateFormSuccess(null)
        setCreateFormError(err?.response?.data?.message || 'Failed to save challenges')
      }
      return
    }

    const dto = buildCreateDto(createForm)
    if (dto === null) {
      const p = parseParams(createForm.params)
      setCreateFormError(p === null ? 'Invalid JSON in params field' : 'maxMs is required for this challenge type')
      return
    }
    try {
      await adminCreateChallenge(dto)
      setCreateFormError(null)
      setCreateFormSuccess('Challenge created!')
      setCreateForm((prev) => ({ ...prev, sequence: prev.sequence + 1 }))
      fetchChallenges(viewSeasonId ?? undefined)
    } catch (err: any) {
      setCreateFormSuccess(null)
      setCreateFormError(err?.response?.data?.message || 'Failed to create challenge')
    }
  }

  const handleEditSave = async () => {
    if (!editingId) return
    const dto = buildUpdateDto(editForm)
    if (dto === null) {
      const p = parseParams(editForm.params)
      setEditFormError(p === null ? 'Invalid JSON in params field' : 'maxMs is required for this challenge type')
      return
    }
    try {
      await adminUpdateChallenge(editingId, dto)
      setEditingId(null)
      setEditFormError(null)
      fetchChallenges(viewSeasonId ?? undefined)
    } catch (err: any) {
      setEditFormError(err?.response?.data?.message || 'Failed to update challenge')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this challenge?')) return
    try {
      await adminDeleteChallenge(id)
      fetchChallenges(viewSeasonId ?? undefined)
    } catch (err: any) {
      setChallengeError(err?.response?.data?.message || 'Failed to delete challenge')
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
      <Box sx={{ maxWidth: 1100, mx: 'auto', px: 2, py: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Rank Admin
        </Typography>

        {/* Season Management */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Season Management
            </Typography>
            {seasonError && (
              <Alert severity="error" sx={{ mb: 1 }}>
                {seasonError}
              </Alert>
            )}

            <Box sx={{ mb: 2 }}>
              {activeSeason ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Typography variant="body2">
                    Active season: <strong>{activeSeason.name}</strong> (started{' '}
                    {new Date(Number(activeSeason.startedAt)).toLocaleDateString()})
                  </Typography>
                  <Button variant="outlined" color="error" size="small" onClick={handleEndSeason}>
                    End Season
                  </Button>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No active season
                </Typography>
              )}
            </Box>

            {!showStartForm ? (
              <Button variant="contained" size="small" onClick={() => setShowStartForm(true)}>
                Start Season
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField label="Season name" size="small" value={newSeasonName} onChange={(e) => setNewSeasonName(e.target.value)} />
                <Button variant="contained" size="small" onClick={handleStartSeason}>
                  Confirm
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setShowStartForm(false)
                    setNewSeasonName('')
                  }}
                >
                  Cancel
                </Button>
              </Box>
            )}

            {seasons.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  All Seasons
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Started</TableCell>
                        <TableCell>Ended</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {seasons.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>{s.name}</TableCell>
                          <TableCell>{new Date(Number(s.startedAt)).toLocaleDateString()}</TableCell>
                          <TableCell>{s.endedAt ? new Date(Number(s.endedAt)).toLocaleDateString() : '—'}</TableCell>
                          <TableCell>
                            {s.endedAt == null ? (
                              <Chip label="Active" color="primary" size="small" />
                            ) : (
                              <Chip label="Ended" size="small" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Challenge Management */}
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
              <Typography variant="h6">Challenge Management</Typography>
              {isViewingActiveSeason && !showCreateForm && (
                <Button variant="contained" size="small" onClick={() => setShowCreateForm(true)}>
                  Create Challenge
                </Button>
              )}
            </Box>

            {seasons.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                {seasons.map((s) => (
                  <Chip
                    key={s.id}
                    label={s.endedAt == null ? `${s.name} (active)` : s.name}
                    size="small"
                    variant={viewSeasonId === s.id ? 'filled' : 'outlined'}
                    color={viewSeasonId === s.id ? 'primary' : 'default'}
                    onClick={() => {
                      setViewSeasonId(s.id)
                      setShowCreateForm(false)
                      setEditingId(null)
                    }}
                  />
                ))}
              </Box>
            )}

            {!isViewingActiveSeason && viewSeasonId != null && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Viewing a past season's challenges — read-only history. Switch to the active season to make changes.
              </Alert>
            )}

            {challengeError && (
              <Alert severity="error" sx={{ mb: 1 }}>
                {challengeError}
              </Alert>
            )}

            <CoverageMatrix challenges={challenges} threads={allThreads} />

            {showCreateForm && (
              <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    New {bulkMode ? 'Challenges (bulk tiers)' : 'Challenge'}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      // Reconciliation itself happens in ChallengeForm's own effect (keyed off
                      // bulkRows being non-null + type/threadUuid) so it also re-fires if the
                      // type/thread is changed again later while already in bulk mode.
                      setBulkMode((prev) => !prev)
                      setCreateFormError(null)
                      setCreateFormSuccess(null)
                    }}
                  >
                    {bulkMode ? 'Switch to single' : 'Switch to bulk tiers'}
                  </Button>
                </Box>
                <ChallengeForm
                  form={createForm}
                  setForm={setCreateForm}
                  error={createFormError}
                  success={createFormSuccess}
                  onSubmit={handleCreate}
                  onCancel={() => {
                    setShowCreateForm(false)
                    setCreateForm(emptyForm())
                    setCreateFormError(null)
                    setCreateFormSuccess(null)
                    setBulkMode(true)
                  }}
                  submitLabel={
                    bulkMode
                      ? `Save ${bulkRows.length} tiers (${bulkRows.filter((r) => r.existingId).length} update, ${bulkRows.filter((r) => !r.existingId).length} new)`
                      : 'Create'
                  }
                  threads={allThreads}
                  editingId={null}
                  isEdit={false}
                  bulkRows={bulkMode ? bulkRows : null}
                  setBulkRows={setBulkRows}
                />
              </Card>
            )}

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Rank</TableCell>
                    <TableCell>Seq</TableCell>
                    <TableCell>Target</TableCell>
                    <TableCell>GG</TableCell>
                    <TableCell>Thread</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {challenges
                    .filter((c) => {
                      if (!showCreateForm) return true
                      if (createForm.type && c.type !== createForm.type) return false
                      if (createForm.rank && c.rank !== createForm.rank) return false
                      if (createForm.threadUuid && c.threadUuid !== createForm.threadUuid) return false
                      return true
                    })
                    .map((c) => (
                      <Fragment key={c.id}>
                        <TableRow>
                          <TableCell>{getChallengeTitle(c)}</TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                              {getPrettyTypeName(c.type)}
                            </Typography>
                          </TableCell>
                          <TableCell>{c.rank}</TableCell>
                          <TableCell>{c.sequence}</TableCell>
                          <TableCell>{c.target}</TableCell>
                          <TableCell>{c.ggReward}</TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                              {c.threadUuid ? `${c.threadUuid.slice(0, 8)}…` : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {isViewingActiveSeason ? (
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => {
                                    setEditingId(c.id)
                                    setEditForm(challengeToForm(c))
                                    setEditFormError(null)
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(c.id)}>
                                  Delete
                                </Button>
                              </Box>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                read-only
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                        {editingId === c.id && (
                          <TableRow>
                            <TableCell colSpan={9}>
                              <Card variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="subtitle1" fontWeight={600}>
                                  Edit Challenge
                                </Typography>
                                <ChallengeForm
                                  form={editForm}
                                  setForm={setEditForm}
                                  error={editFormError}
                                  onSubmit={handleEditSave}
                                  onCancel={() => {
                                    setEditingId(null)
                                    setEditFormError(null)
                                  }}
                                  submitLabel="Save"
                                  threads={allThreads}
                                  editingId={editingId}
                                  isEdit={true}
                                />
                              </Card>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    ))}
                  {challenges.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9}>
                        <Typography variant="body2" color="text.secondary">
                          No challenges yet.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
