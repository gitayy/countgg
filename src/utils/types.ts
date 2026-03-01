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
  pref_online: boolean;
  pref_discord_pings: boolean;
  pref_load_from_bottom: boolean;
  pref_strike_color: string;
  pref_submit_shortcut: string;
  pref_clear: string;
  pref_nightMode: string;
  pref_standardize_format: string;
  pref_time_since_last_count: boolean;
  pref_custom_stricken: string;
  pref_post_style: string;
  pref_post_style_mobile: string;
  pref_reply_time_interval: number;
  pref_night_mode_colors: string;
  pref_post_position: string;
  pref_hide_stricken: string;
  pref_highlight_last_count: boolean;
  pref_highlight_last_count_color: string;
  pref_sound_on_stricken: string;
  pref_hide_thread_picker: boolean;
  pref_stricken_count_opacity: number;
  pref_timestamp_display: string;
  pref_show_latency: boolean;
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
  name: string;
  threads: ThreadType[];
  expanded: boolean;
}

export interface CategoryWithoutFullThreads {
  name: string;
  threadUUIDs: string[];
  expanded: boolean;
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

export type MacroEntryType =
  | 'CHAR_INSERT'
  | 'ACTION'
  | 'SUBMIT'
  | 'SUBMIT_ACTION'
  | 'TOGGLE'
  | 'COMBO'

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

export type MacroComboId =
  | 'SELECT_ALL_COPY'
  | 'SELECT_ALL_PASTE'

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
