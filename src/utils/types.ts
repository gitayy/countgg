export type User = {
  id: string
  uuid: string
  discordId: string
  accessToken: string
  refreshToken: string
  username: string
  discriminator: string
  pref_online: boolean
  pref_discord_pings: boolean
  pref_load_from_bottom: boolean
  pref_strike_color: string
  pref_submit_shortcut: string
  pref_clear: string
  pref_nightMode: string
  pref_standardize_format: string
  pref_time_since_last_count: boolean
  pref_custom_stricken: string
  pref_post_style: string
  pref_post_style_mobile: string
  pref_reply_time_interval: number
  pref_night_mode_colors: string
  pref_post_position: string
  pref_hide_stricken: string
  pref_highlight_last_count: boolean
  pref_highlight_last_count_color: string
  pref_sound_on_stricken: string
  pref_hide_thread_picker: boolean
  pref_stricken_count_opacity: number
  pref_timestamp_display: string
  pref_show_latency: boolean
  titles: number[]
  card_borders: number[]
  card_backgrounds: number[]
  money: number
  inventory: any[]
  isUhh: boolean
  reddit: string
  redditAccess: string
  redditRefresh: string
  timeOnline?: string
  threadPreferences?: ThreadPrefs[]
  macroPresetId?: number | null
}

export interface PreferencesType {
  pref_online: boolean
  pref_discord_pings: boolean
  pref_load_from_bottom: boolean
  pref_strike_color: string
  pref_submit_shortcut: string
  pref_clear: string
  pref_nightMode: string
  pref_standardize_format: string
  pref_time_since_last_count: boolean
  pref_custom_stricken: string
  pref_post_style: string
  pref_post_style_mobile: string
  pref_reply_time_interval: number
  pref_night_mode_colors: string
  pref_post_position: string
  pref_hide_stricken: string
  pref_highlight_last_count: boolean
  pref_highlight_last_count_color: string
  pref_sound_on_stricken: string
  pref_hide_thread_picker: boolean
  pref_stricken_count_opacity: number
  pref_timestamp_display: string
  pref_show_latency: boolean
}

export type ThreadPrefs = {
  user: User
  thread: ThreadType
  enabled: boolean
  macroPresetId?: number | null
  pref_online: boolean
  pref_discord_pings: boolean
  pref_load_from_bottom: boolean
  pref_strike_color: string
  pref_submit_shortcut: string
  pref_clear: string
  pref_nightMode: string
  pref_standardize_format: string
  pref_time_since_last_count: boolean
  pref_custom_stricken: string
  pref_post_style: string
  pref_post_style_mobile: string
  pref_reply_time_interval: number
  pref_night_mode_colors: string
  pref_post_position: string
  pref_hide_stricken: string
  pref_highlight_last_count: boolean
  pref_highlight_last_count_color: string
  pref_sound_on_stricken: string
  pref_hide_thread_picker: boolean
  pref_stricken_count_opacity: number
}

export type Counter = {
  uuid: string
  id: number
  discordId: string
  name: string
  username: string
  color: string
  roles: string[]
  rainbow: number
  avatar: string
  cardStyle: string
  cardBorderStyle: string
  pronouns: [string, string, string, string]
  title: string
  xp: number
  lastRob?: string
  emoji?: string
}

export type MiscSettings = {
  categories: CategoryWithoutFullThreads[]
  lastUpdated: number
}

export type PostType = {
  uuid: string
  timestamp: string
  timeSinceLastCount: number
  timeSinceLastPost: number
  rawText: string
  isCount: boolean
  isValidCount?: boolean
  countContent?: string
  rawCount?: string
  stricken: boolean
  thread: string
  hasComment: boolean
  hasThreeCharComment: boolean
  comment?: string
  authorUUID: string
  isDeleted: boolean
  isCommentDeleted: boolean
  reactions: object[]
  validCountNumber: number
  latency?: number
  processingLatency?: number
  post_hash?: string
  roll?: number
  chance?: number
}

export type SpeedRecord = {
  start: string
  end: string
  time: number
  startCount: string
  endCount: string
  startCountNumber?: number
  endCountNumber?: number
  qualifiedCounters: string[]
  isFake?: boolean
}

export type ThreadType = {
  uuid: string
  name: string
  title: string
  description: string
  rules: string
  firstValidCount: string
  validationType: string
  visibleTo: string[]
  updatableBy: string[]
  locked: boolean
  autoValidated: boolean
  resetOnMistakes: boolean
  allowDoublePosts: boolean
  moderators: string[]
  verifiers: string[]
  countBans: string[]
  postBans: string[]
  shortDescription: string
  color1: string
  color2: string
  category: string
  countsPerSplit: number
  splitsPerGet: number
  splitOffset: number
  threadOfTheDay: boolean
}

export type AchievementType = {
  id: number
  name: string
  icon?: string
  isPublic: boolean
  description: string
  countersEarned: number
  maxProgress: number
}

export type CounterAchievementType = {
  id: number
  counterUUID: string
  achievementId: number
  progress: number
  isComplete: boolean
  lastChecked: boolean
  timestamp: string
}

export const unverified_roles = ['unverified', 'manual_verification_needed', 'discord_verified', 'denied']

export type AllegianceType = {
  id: number
  name: string
  val: {
    ph: number
    team_inventory: object[]
    members: string[]
    pm2: string[]
    pm3: string[]
    c: number
    q: {
      lU: string | null
      tTA: number
      cA: string[]
      qH: string[]
    }
    p0: [number, number]
    p1: [number, number]
    p2: [number, number]
  }
}

export type Item = {
  id: number
  name: string
  internal_name: string
  description: string
  category: string
  unlockMethod: string
  unlockDescription: string
  price: number
  quantity: number
  levelToUnlock: number
  achievementId: number
}

export type RedditPost = {
  author: string
  body: string
  body_html: string
  created: number
  created_utc: number
  embeds: string[]
  id: string
  mobile_embeds: string[]
  name: string
  stricken: boolean
  latency?: number
  timestamp: number
  real_timestamp?: number
  timestamp_prediction_error?: number
  fakePost: boolean
  counter?: Counter
  replyTime?: number
}

export type Challenge = {
  id: number
  day: string
  timestamp: string
  thread: string
  progress: number
  maxProgress: number
  reward: number
  rewardType: string
  difficulty: string
  status: string
  category: string
  challengeNumber: number
  title: string
  description: string
  misc: string[]
}

// id: number;

// @PrimaryColumn()
// uuid: string;

// @Index()
// @Column()
// timestamp: string;

// @Column({nullable: true})
// edited_timestamp: string;

// @Column()
// title: string;

// @Column({type: "text", length: 100000})
// body: string;

// @Index()
// @Column()
// author: string;

// @Column("json")
// tags: object;

// @Column({default: 1})
// views: number;

// @OneToMany(() => BlogLike, (bloglike) => bloglike.blog)
// likes: BlogLike[];

export type Blog = {
  id: number
  uuid: string
  timestamp: string
  edited_timestamp: string
  title: string
  body: string
  author: Counter
  tags: string[]
  views: number
  likes: number
}

export interface Category {
  name: string
  threads: ThreadType[]
  expanded: boolean
}

export interface CategoryWithoutFullThreads {
  name: string
  threadUUIDs: string[]
  expanded: boolean
}

export type Server = {
  id: number
  discordID: string
  name: string
  avatar: string
  counts: number
  botMods: string[]
  nsfw: boolean
  isBanned: boolean
  threads: ThreadType[]
  isActive: boolean
  canUsersJoinWithoutApproval: boolean
  canUsersNotInTheServerJoin: boolean
  kickUsersAfterTheyLeaveTheDiscordServer: boolean
}

export type MacroPresetVisibility = 'PUBLIC'

export type MacroEntryType = 'CHAR_INSERT' | 'ACTION' | 'SUBMIT' | 'SUBMIT_ACTION' | 'TOGGLE' | 'COMBO'

export type MacroActionType =
  | 'BACKSPACE'
  | 'DELETE'
  | 'CTRL_BACKSPACE'
  | 'LEFT'
  | 'RIGHT'
  | 'UP'
  | 'DOWN'
  | 'HOME'
  | 'END'
  | 'SELECT_ALL'
  | 'COPY'
  | 'PASTE'

export type MacroComboId = 'SELECT_ALL_COPY' | 'SELECT_ALL_PASTE'

export type MacroEntryPayload =
  | { char: string }
  | { action: MacroActionType; repeat?: number }
  | Record<string, never>
  | { comboId: MacroComboId }

export type MacroEntryDraft = {
  triggerKey: string
  macroType: MacroEntryType
  payloadJson: MacroEntryPayload
}

export type MacroPreset = {
  id: number
  name: string
  handle: string | null
  description: string
  visibility: MacroPresetVisibility
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  ownerCounter?: {
    uuid: string
    discordId: string
    name: string
    username: string
    avatar: string
  } | null
}

export type MacroEntry = {
  id: number
  triggerKey: string
  macroType: MacroEntryType
  payloadJson: Record<string, any>
  createdAt: string
  updatedAt: string
}

export type MacroPresetVersion = {
  id: number
  versionNumber: number
  changeNote: string | null
  createdAt: string
  entries?: MacroEntry[]
}

export type MacroPresetListResponse = {
  page: number
  limit: number
  total: number
  items: MacroPreset[]
}

export type MacroPresetReadResponse = {
  preset: MacroPreset
  latestVersionNumber: number | null
}

export type MacroSetPreferenceResponse = {
  macroPresetId: number | null
  latestVersionNumber: number | null
}

export type ThreadMacroSetPreferenceResponse = {
  threadId: string
  enabled: boolean
  macroPresetId: number | null
  latestVersionNumber: number | null
}

export type MacroApplyResponse = {
  threadId: string
  macroPresetId: number
  appliesCount: number
}

export type ThreadMacroPresetUsageRow = {
  id: number
  appliesCount: number
  lastAppliedAt: string | null
  macroPreset: MacroPreset
}

export type ThreadMacroPresetUsageResponse = {
  threadId: string
  total: number
  items: ThreadMacroPresetUsageRow[]
}

export type MacroPresetThreadUsageRow = {
  threadId: string
  threadName: string
  threadTitle: string
  appliesCount: number
  lastAppliedAt: string | null
}

export type MacroPresetThreadUsageResponse = {
  macroPresetId: number
  total: number
  items: MacroPresetThreadUsageRow[]
}

export type MacroPresetSummaryResponse = {
  items: Array<{
    macroPresetId: number
    latestVersionNumber: number | null
    entries: MacroEntry[]
    threadUsage: Array<{
      threadId: string
      threadName: string
      threadTitle: string
      appliesCount: number
    }>
    threadUsageTotal: number
  }>
}

export type ActiveMacroRuntime = {
  source: 'none' | 'global' | 'thread'
  enabled: boolean
  macroPresetId: number | null
  macroPresetVersionId: number | null
  macroPresetVersionNumber: number | null
  entries: MacroEntry[]
}

// ── Rank system ───────────────────────────────────────────────────────────────

export type RankName = 'bronze' | 'silver' | 'gold' | 'platinum' | 'emerald' | 'diamond' | 'countmeister' | 'grandcounter' | 'peak'

export type RankSeason = {
  id: number
  name: string
  startedAt: number
  endedAt: number | null
}

export type RankChallenge = {
  id: string
  type: string
  rank: RankName
  sequence: number
  ggReward: number
  rewardType: 'gg' | 'auto_jump'
  target: number
  params: Record<string, any> | null
  threadUuid: string | null
  bingoCategory: string | null
  seasonId: number
  clonedFromId: string | null
  createdAt: number
  // with context=true
  completionCount?: number
  topCompleters?: Array<{
    counterUuid: string
    username: string
    name: string
    completedAt: number
    ggAwarded: number
  }>
}

export type ThreadRankRow = {
  id: number
  counterUuid: string
  threadUuid: string | null
  seasonId: number | null
  rank: RankName
  division: 1 | 2 | 3
  gg: number
  ggTotal: number
  // enriched
  username?: string
  name?: string
  avatar?: string
  discordId?: string
  color?: string
  // Only populated by getRankCounterProfile — title (falls back to name) for threadUuid rows,
  // null for the sitewide row.
  threadName?: string | null
}

export type ChallengeLog = {
  id: number
  counterUuid: string
  challengeId: string
  seasonId: number | null
  context: 'rank' | 'bingo' | 'meta'
  progress: number
  target: number
  accuracyWindow: string | null
  completedAt: number | null
  ggAwarded: number
  createdAt: number
  updatedAt: number
  // null = completed but not yet replayed (see the Rank tab's replay system) — only ever
  // transitions null -> a timestamp, once its completion animation has actually played.
  seenAt?: number | null
  // null = this still-in-progress instance's one-time entrance bar-fill animation (0 -> current
  // progress) hasn't played yet — only ever transitions null -> a timestamp. Durable server-side
  // flag so the animation doesn't replay every time the Rank tab is reopened (RankTabPanel
  // unmounts on tab switch, wiping any purely client-side "already animated" tracking).
  entranceSeenAt?: number | null
  // Joined in from the log's own RankChallenge template server-side — ThreadPage renders
  // purely from these logs and never fetches the template catalog itself.
  type: string
  params: Record<string, any> | null
  threadUuid: string | null
  ggReward: number
  rank: RankName
  // This template's 1-based position within its (type, rank, chainKey) combo, and the total
  // number of sequence steps currently in that combo — e.g. sequencePosition: 1, sequenceTotal: 4
  // renders as "1/4" on the card.
  sequencePosition: number
  sequenceTotal: number
}

export type RankUpEvent = {
  id: number
  counterUuid: string
  threadUuid: string | null
  seasonId: number | null
  fromRank: RankName
  fromDivision: 1 | 2 | 3
  toRank: RankName
  toDivision: 1 | 2 | 3
  createdAt: number
  seenAt: number | null
}

// unseenCompletions carry a server-computed chainKey so the frontend can group/sequence
// multi-step chain replays without reimplementing the backend's chain-grouping logic.
export type ChallengeLogWithChainKey = ChallengeLog & { chainKey: string }

export type ReplayData = {
  unseenCompletions: ChallengeLogWithChainKey[]
  unseenRankUps: RankUpEvent[]
}

// Lightweight badge-count shape — see getUnseenCompletionCounts in the backend RankService.
export type UnseenCompletionCounts = {
  total: number
  byThread: Record<string, number>
  sitewide: number
}

export type ThreadLeaderboardResponse = {
  season: RankSeason | null
  thread: { uuid: string; name: string; title: string }
  entries: ThreadRankRow[]
}

export type CounterRankProfileResponse = {
  counter: { uuid: string; username: string; name: string; avatar: string; discordId: string; color: string }
  ranks: ThreadRankRow[]
  challengeProgress: ChallengeLog[]
  recentCompletions: ChallengeLog[]
  recentCompletionsTotal: number
}

// Payload of the 'rank_updated' socket event — carries exactly what changed during ONE post
// attempt's evaluation, joined with display fields already. Only emitted when something
// genuinely changed (see challenge.processor.ts); the frontend applies this directly to state
// and never re-fetches getRankCounterProfile on a live update, only at mount/reconnect.
export type RankUpdatedDelta = {
  threadUuid: string
  progress: ChallengeLog[]
  completions: ChallengeLog[]
  threadRank: ThreadRankRow | null
  sitewideRank: ThreadRankRow | null
  rankUpEvents: RankUpEvent[]
}

export type SitewideLeaderboardResponse = {
  season: RankSeason | null
  entries: Array<{
    counterUuid: string
    username: string
    name: string
    avatar: string
    discordId: string
    color: string
    totalGg: number
    rank: RankName
    division: 1 | 2 | 3
  }>
  total: number
}

export type SpeedDistribution = {
  p10: number
  p25: number
  p50: number
  p75: number
  p90: number
  sampleSize: number
}

export type GgProjection = {
  dailyGgAvg: number
  currentGgTotal: number
  targetRank: RankName | null
  targetRankGgNeeded: number
  daysToTarget: number | null
  currentRank: RankName
  currentDivision: 1 | 2 | 3
}

export type VolumeHistogramEntry = { bucket: string; count: number }
