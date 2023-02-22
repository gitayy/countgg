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
  xp: number;
  titles: number[];
  card_borders: number[];
  card_backgrounds: number[];
  money: number;
};

export type Counter = {
  uuid: string,
  id: number,
  discordId: string,
  name: string,
  color: string,
  roles: string[],
  avatar: string,
  cardStyle: string,
  cardBorderStyle: string,
  pronouns: [string, string, string, string],
  title: string,
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
};

export const unverified_roles = ['unverified', 'manual_verification_needed', 'discord_verified', 'denied']