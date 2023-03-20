import axios, { AxiosRequestConfig } from 'axios';
import {
  User,
  Counter,
  ThreadType,
} from './types';


const CONFIG: AxiosRequestConfig = { withCredentials: true };
const API_URL = `${process.env.REACT_APP_API_HOST}/api`

export const getAuthStatus = () =>
  axios.get<User>(`${API_URL}/auth/status`, CONFIG);

  export const logout = () =>
  axios.post(
    `${API_URL}/auth/logout`,
    {},
    CONFIG
  );

export const getCounter = () =>
  axios.get<Counter>(`${API_URL}/counter/info`, CONFIG);

export const getAllThreads = () =>
axios.get<ThreadType[]>(`${API_URL}/thread/all`, CONFIG);

export const getThread = (name: string) =>
axios.get<ThreadType>(`${API_URL}/thread/${name}`, CONFIG);

export const loadCounter = (counter_id: string) =>
axios.post(
  `${API_URL}/counter/load_counter`,
  {uuid: counter_id},
  CONFIG
);

export const loadCounters = (counter_ids: string) =>
axios.post(
  `${API_URL}/counter/load_counters`,
  {uuids: counter_ids},
  CONFIG
);

export const getCountersPage = (page: number) =>
axios.get<{counters: Counter[], pageCount: number}>(`${API_URL}/counter/counters/${page}`, CONFIG);

export const getFreeSecretAchievement = () =>
axios.get<any>(`${API_URL}/counter/free_secret_achievement`, CONFIG);

export const getThreadStats = (threadName: string) =>
axios.get<{stats: {gets: object[], assists: object[], palindromes: object[], repdigits: object[], speed: object[], leaderboard: object[], last_updated: string}, counters: Counter[]}>(`${API_URL}/thread/stats/${threadName}`, CONFIG);

export const updateCounter = (counter: Counter) =>
axios.post(
  `${API_URL}/counter/update`,
  {updateInfo: counter},
  CONFIG
);

export const registerCounter = (updateInfo: object) =>
axios.post(
  `${API_URL}/counter/register`,
  {update: updateInfo},
  CONFIG
);

export const updateCounterPrefs = (update: User, counter: Counter) =>
axios.post(
  `${API_URL}/user/prefs`,
  {prefsUpdate: update, counterUpdate: counter},
  CONFIG
);

export const getRecentCounts = (thread_name: string, context: string | (string | null)[] | null, commentsOnly?: boolean) =>
axios.post(
  `${API_URL}/thread/getRecent`,
  {thread_name: thread_name, context: context, commentsOnly: commentsOnly},
  CONFIG
);

export const getOlderCounts = (thread_name: string, uuid: string) =>
axios.post(
  `${API_URL}/thread/getOlder`,
  {thread_name: thread_name, uuid: uuid},
  CONFIG
);

export const getCountByUuid = (uuid: string) =>
axios.post(
  `${API_URL}/thread/getCountByUuid`,
  {uuid: uuid},
  CONFIG
);

export const findPostByThreadAndNumber = (thread: string, number: string) =>
axios.post(
  `${API_URL}/thread/findPostByThreadAndNumber`,
  {thread: thread,
  number: number},
  CONFIG
);

export const findPostByThreadAndRawCount = (thread: string, rawCount: string) =>
axios.post(
  `${API_URL}/thread/findPostByThreadAndRawCount`,
  {thread: thread,
  rawCount: rawCount},
  CONFIG
);

export const getAchievements = (uuid: string) =>
axios.get<any>(`${API_URL}/counter/achievements/${uuid}`, CONFIG);

  //Admin API
export const getUnapproved = () =>
axios.get<Counter[]>(`${API_URL}/counter/unapproved`, CONFIG);

export const adminApproveDiscord = (counter_ids: string[]) =>
axios.post(
  `${API_URL}/counter/makeDiscordVerified`,
  {counter_ids},
  CONFIG
);

export const adminApproveCounter = (counter_ids: string[]) =>
axios.post(
  `${API_URL}/counter/makeCounter`,
  {counter_ids},
  CONFIG
);

export const adminDeny = (counter_ids: string[]) =>
axios.post(
  `${API_URL}/counter/denyCounter`,
  {counter_ids},
  CONFIG
);

export const adminCreateThread = (name: string, title: string, description: string, rules: string, firstValidCount: string, validationType: string, visibleTo: string, updatableBy: string, locked: boolean, autoValidated: boolean, resetOnMistakes: boolean, allowDoublePosts: boolean, moderators: string, verifiers: string, uuid?: string) =>
axios.post(
  `${API_URL}/thread/create`,
  {name: name,
  title: title,
  description: description, 
  rules: rules,
  firstValidCount: firstValidCount,
  validationType: validationType,
  visibleTo: visibleTo,
  updatableBy: updatableBy,
  locked: locked,
  autoValidated: autoValidated,
  resetOnMistakes: resetOnMistakes,
  allowDoublePosts: allowDoublePosts,
  moderators: moderators,
  verifiers: verifiers,
  uuid: uuid
  },
  CONFIG
);

export const adminToggleThreadLock = (thread_uuid: string) =>
axios.post(
  `${API_URL}/thread/adminToggleThreadLock`,
  {thread_uuid: thread_uuid},
  CONFIG
);

export const adminToggleBan = (uuid: string) =>
axios.post(
  `${API_URL}/counter/adminToggleBan`,
  {uuid: uuid},
  CONFIG
);

export const adminToggleMute = (uuid: string) =>
axios.post(
  `${API_URL}/counter/adminToggleMute`,
  {uuid: uuid},
  CONFIG
);