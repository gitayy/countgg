export type User = {
  id: string;
  uuid: string;
  discordId: string;
  accessToken: string;
  refreshToken: string;
  username: string;
  discriminator: string;
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
  pref_reply_time_interval: number;
  pref_night_mode_colors: string;
  pref_post_position: string;
  pref_hide_stricken: string;
  titles: number[];
  card_borders: number[];
  card_backgrounds: number[];
  money: number;
  inventory: any[];
  isUhh: boolean;
};

export type Counter = {
  uuid: string,
  id: number,
  discordId: string,
  name: string,
  username: string,
  color: string,
  roles: string[],
  avatar: string,
  cardStyle: string,
  cardBorderStyle: string,
  pronouns: [string, string, string, string],
  title: string,
  xp: number,
  lastRob?: string,
  emoji?: string,
};

export type PostType = {
  uuid: string;
  timestamp: string;
  timeSinceLastCount: number;
  timeSinceLastPost: number;
  rawText: string;
  isCount: boolean; 
  isValidCount?: boolean;
  countContent?: string;
  rawCount?: string;
  stricken: boolean;
  thread: string;
  hasComment: boolean; 
  comment?: string;
  authorUUID: string;
  isDeleted: boolean;
  isCommentDeleted: boolean;
  reactions: object[];

  latency?: number;
}

export type ThreadType = {
  uuid: string;
  name: string;
  title: string;
  description: string;
  rules: string;
  firstValidCount: string;
  validationType: string;
  visibleTo: string[];
  updatableBy: string[];
  locked: boolean;
  autoValidated: boolean;
  resetOnMistakes: boolean;
  allowDoublePosts: boolean;
  moderators: string[];
  verifiers: string[];
  countBans: string[];
  postBans: string[];
  shortDescription: string;
  color1: string;
  color2: string;
  category: string;
};

export type AchievementType = {
  id: number;
  name: string; 
  icon?: string; 
  isPublic: boolean;
  description: string;
  countersEarned: number;
  maxProgress: number;
}

export type CounterAchievementType = {
  id: number;
  counterUUID: string; 
  achievementId: number;
  progress: number;
  isComplete: boolean;
  lastChecked: boolean;
  timestamp: string; 
}

export const unverified_roles = ['unverified', 'manual_verification_needed', 'discord_verified', 'denied']

export type AllegianceType = {
  id: number,
  name: string,
  val: {
    ph: number,
    team_inventory: object[],
    members: string[],
    pm2: string[],
    pm3: string[],
    c: number,
    q: {
      lU: string|null,
      tTA: number,
      cA: string[],
      qH: string[],
    },
    p0: [number, number],
    p1: [number, number],
    p2: [number, number]
  }
}

export type Item = {
  id: number;
  name: string;
  internal_name: string;
  description: string;
  category: string;
  unlockMethod: string;
  unlockDescription: string;
  price: number;
  quantity: number;
  levelToUnlock: number;
  achievementId: number;
}