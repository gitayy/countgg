// Decodes the RLE-encoded rolling accuracy window sent by the API: "<total>:<base64 bitstring>".
// Bit k (0-indexed from oldest=0 to newest=total-1) is 1 for a valid attempt, 0 for a miss.
// Only the most recent `windowSize` bits are ever relevant.

export type AccuracyWindowStats = {
  total: number
  effective: number
  validCount: number
  pct: number | null
}

function decode(window: string | null): { total: number; buf: Uint8Array } | null {
  if (!window) return null
  const colon = window.indexOf(':')
  if (colon === -1) return null
  const total = parseInt(window.slice(0, colon), 10)
  if (!Number.isFinite(total) || total <= 0) return null
  const b64 = window.slice(colon + 1)
  const binary = atob(b64)
  const buf = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i)
  return { total, buf }
}

function bitAt(buf: Uint8Array, k: number): boolean {
  const byteIdx = buf.length - 1 - Math.floor(k / 8)
  const bitPos = k % 8
  return (buf[byteIdx] & (1 << bitPos)) !== 0
}

export function getAccuracyWindowStats(window: string | null, windowSize: number): AccuracyWindowStats {
  const decoded = decode(window)
  if (!decoded) return { total: 0, effective: 0, validCount: 0, pct: null }
  const { total, buf } = decoded
  const effective = Math.min(total, windowSize)
  let validCount = 0
  for (let k = total - effective; k < total; k++) {
    if (bitAt(buf, k)) validCount++
  }
  return {
    total,
    effective,
    validCount,
    pct: effective > 0 ? Math.round((validCount / effective) * 1000) / 10 : null,
  }
}

// Inverse of decode() — builds an RLE window string from an ordered (oldest-first) array of
// valid/invalid bits. Used by the admin accuracy-meter test tool to synthesize a fake window at
// an arbitrary rate/size without touching the backend.
export function encodeWindow(bitsOldestFirst: boolean[]): string {
  const total = bitsOldestFirst.length
  const byteLength = Math.ceil(total / 8)
  const buf = new Uint8Array(byteLength)
  bitsOldestFirst.forEach((valid, k) => {
    if (!valid) return
    const byteIdx = byteLength - 1 - Math.floor(k / 8)
    const bitPos = k % 8
    buf[byteIdx] |= 1 << bitPos
  })
  let binary = ''
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i])
  return `${total}:${btoa(binary)}`
}

// Appends one new bit (newest attempt) onto an existing encoded window, keeping at most
// `maxTotal` bits (drops the oldest once exceeded) — mirrors how the backend's rolling window
// only ever needs to retain up to the largest windowSize any challenge cares about.
export function pushBit(window: string | null, valid: boolean, maxTotal: number): string {
  const decoded = decode(window)
  const bitsOldestFirst: boolean[] = []
  if (decoded) {
    for (let k = 0; k < decoded.total; k++) bitsOldestFirst.push(bitAt(decoded.buf, k))
  }
  bitsOldestFirst.push(valid)
  if (bitsOldestFirst.length > maxTotal) bitsOldestFirst.splice(0, bitsOldestFirst.length - maxTotal)
  return encodeWindow(bitsOldestFirst)
}

// Minimum valid attempts required out of the full windowSize to clear minAccuracyPct
// once the window is full (e.g. windowSize=20, minAccuracyPct=75 -> 15/20). Rounds up.
export function minValidForThreshold(windowSize: number, minAccuracyPct: number): number {
  return Math.ceil((minAccuracyPct / 100) * windowSize)
}

// Bucketed hit-rate series for visualizing large windows without one element per attempt.
// Aggregates the *effective* (most recent windowSize) attempts into at most `maxBuckets`
// buckets, oldest first. Each bucket reports how many valid/total attempts it covers, plus the
// absolute [rangeStart, rangeEnd) bit range it spans — rangeStart/rangeEnd let a bucket be
// drilled into (re-bucketed on just that sub-range) for the nested nested batch-of-batches view.
export type AccuracyBucket = { valid: number; total: number; rangeStart: number; rangeEnd: number }

export function getAccuracyBuckets(window: string | null, windowSize: number, maxBuckets = 200): AccuracyBucket[] {
  const decoded = decode(window)
  if (!decoded) return []
  const { total, buf } = decoded
  const effective = Math.min(total, windowSize)
  if (effective <= 0) return []

  return getAccuracyBucketsInRange(buf, total - effective, total, maxBuckets)
}

// Same bucketing logic as getAccuracyBuckets, but scoped to an arbitrary [rangeStart, rangeEnd)
// slice of bit indices rather than always the window's own most-recent-effective range — this is
// what powers drilling into a single bucket to reveal its own sub-batches.
function getAccuracyBucketsInRange(buf: Uint8Array, rangeStart: number, rangeEnd: number, maxBuckets: number): AccuracyBucket[] {
  const span = rangeEnd - rangeStart
  if (span <= 0) return []

  const bucketCount = Math.min(maxBuckets, span)
  const buckets: AccuracyBucket[] = new Array(bucketCount)

  for (let b = 0; b < bucketCount; b++) {
    const bStart = rangeStart + Math.floor((b * span) / bucketCount)
    const bEnd = rangeStart + Math.floor(((b + 1) * span) / bucketCount)
    let valid = 0
    for (let k = bStart; k < bEnd; k++) {
      if (bitAt(buf, k)) valid++
    }
    buckets[b] = { valid, total: bEnd - bStart, rangeStart: bStart, rangeEnd: bEnd }
  }
  return buckets
}

// Drills into one bucket's own [rangeStart, rangeEnd) sub-range, re-bucketing it into up to
// maxBuckets smaller batches. Returns [] once the range can no longer be usefully split (i.e.
// it already represents a single attempt), which is the signal the UI uses to stop nesting.
export function drillAccuracyBucket(
  window: string | null,
  rangeStart: number,
  rangeEnd: number,
  maxBuckets: number,
): AccuracyBucket[] {
  const decoded = decode(window)
  if (!decoded) return []
  if (rangeEnd - rangeStart <= 1) return []
  return getAccuracyBucketsInRange(decoded.buf, rangeStart, rangeEnd, maxBuckets)
}

// How aggressively the z-score (see below) saturates toward full green/red as a fraction of
// Z_FOR_FULL_OPACITY — <1 would mean even small z-scores read as strongly colored; >1 would
// require an implausibly large sample to ever reach full saturation. 1 keeps the mapping direct:
// SATURATION_EXPONENT only shapes the curve's *shape* between 0 and Z_FOR_FULL_OPACITY, not an
// extra scaling factor on top of it.
const SATURATION_EXPONENT = 0.7

// A batch needs to be this many standard errors away from the threshold to render fully
// saturated (opaque) green/red. ~2 standard errors is roughly a 95%-confidence margin — enough
// samples confidently past the line that this isn't noise, without requiring an extreme z-score
// that only astronomically large batches could ever reach.
const Z_FOR_FULL_OPACITY = 2

export type BatchColorSignal = { side: 'good' | 'bad'; opacity: number }

// Returns which side of the pass/fail threshold a batch falls on, plus a 0..1 opacity for how
// strongly to color it, using a z-score (how many standard errors the batch's own hit-rate sits
// from the threshold, treating the threshold itself as the assumed true rate under a binomial
// model) rather than the raw percentage-point gap. This is what makes sample size matter in the
// MAGNITUDE of the color, not just as a dampener on tiny batches: 85.5% vs. an 85% target is
// statistical noise at n=20 (z close to 0, near-transparent) but a huge, confidently-real margin
// at n=4000 (many standard errors out, fully saturated green) — a plain percentage-point
// distance can't tell those two apart at all, since the raw gap (0.5 points) is identical.
export function getBatchColorSignal(valid: number, total: number, thresholdPct: number): BatchColorSignal {
  if (total <= 0) return { side: 'good', opacity: 0 }
  const threshold = thresholdPct / 100
  const rawRate = valid / total

  const side: 'good' | 'bad' = rawRate >= threshold ? 'good' : 'bad'

  // Standard error of a proportion under a binomial model, using the threshold as the assumed
  // true rate (the natural "null hypothesis" here: is this batch behaving like the target rate,
  // or significantly different from it?). At a 0%/100% threshold the variance term is 0, so the
  // usual z-score is undefined — landing exactly ON that threshold (gap 0) is the best possible
  // outcome and should read as maximally significant (not "no evidence" from a naive 0/0), while
  // any nonzero gap away from it is still infinitely significant (impossible under a true 0%/100%
  // rate) — total attempts still matter there via SATURATION_EXPONENT's shape, just not via z.
  const variance = threshold * (1 - threshold)
  const gap = Math.abs(rawRate - threshold)
  const z = variance > 0 ? gap / Math.sqrt(variance / total) : Infinity

  const normalized = Math.min(1, z / Z_FOR_FULL_OPACITY)
  const opacity = Math.pow(normalized, SATURATION_EXPONENT)

  return { side, opacity }
}
