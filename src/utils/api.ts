import axios, { AxiosRequestConfig } from 'axios'
import { User, Counter, ThreadType, AllegianceType, Item, PostType, Blog, MiscSettings, ThreadPrefs } from './types'

const CONFIG: AxiosRequestConfig = { withCredentials: true }
const API_URL = `${process.env.REACT_APP_API_HOST}/api`

export const getAuthStatus = () =>
  axios.get<{
    user: User
    counter: Counter
    items: Item[]
    miscSettings: MiscSettings
    site_version: string
    totalCounters: number
    unreadMentionCount: number
  }>(`${API_URL}/auth/status`, CONFIG)

export const logout = () => axios.post(`${API_URL}/auth/logout`, {}, CONFIG)

export const getCounter = () => axios.get<{ counter: Counter; allegiance?: AllegianceType }>(`${API_URL}/counter/info`, CONFIG)

export const getAllThreads = () => axios.get<ThreadType[]>(`${API_URL}/thread/all`, CONFIG)

export const getThread = (name: string) => axios.get<ThreadType>(`${API_URL}/thread/${name}`, CONFIG)

export const loadCounter = (counter_id: string) => axios.post(`${API_URL}/counter/load_counter`, { uuid: counter_id }, CONFIG)

export const loadCounters = (counter_ids: string) => axios.post(`${API_URL}/counter/load_counters`, { uuids: counter_ids }, CONFIG)

export const saveBlog = (title: string, body: string, tags: string[] | undefined) =>
  axios.post(`${API_URL}/api/createBlogPost`, { title: title, body: body, tags: tags }, CONFIG)

export const getCountersPage = (page: number) =>
  axios.get<{ counters: Counter[]; pageCount: number }>(`${API_URL}/counter/counters/${page}`, CONFIG)

export const getBlogs = (page: number) => axios.get<{ blogs: Blog[]; pageCount: number }>(`${API_URL}/thread/blogs/${page}`, CONFIG)

export const getAllBlogs = () => axios.get<{ blogs: Blog[] }>(`${API_URL}/thread/allBlogs`, CONFIG)

export const getFreeSecretAchievement = () => axios.get<any>(`${API_URL}/counter/free_secret_achievement`, CONFIG)

export const getShopItems = () => axios.get<any>(`${API_URL}/user/shop`, CONFIG)

export const getAllServers = () => axios.get<any>(`${API_URL}/server/all`, CONFIG)

export const purchaseItem = (item_id: number) => axios.post(`${API_URL}/api/purchaseItem`, { item_id: item_id }, CONFIG)

export const transcribeAudio = (audio: any) => {
  console.log({ audio: audio });
  return axios.post(`${API_URL}/thread/transcribeAudio`, { audio: audio }, 
{
  ...CONFIG,
  // headers: { 'Content-Type': 'multipart/form-data' }
})
}

export const changeMessageReadStatus = (post_uuids: string[], newReadStatus: boolean) =>
  axios.post(`${API_URL}/counter/changeMessageReadStatus`, { messageIDs: post_uuids, newReadStatus: newReadStatus }, CONFIG)

export const getThreadStats = (threadName: string, dateStr: string | undefined) =>
  axios.post<{
    stats: {
      gets: object[]
      assists: object[]
      palindromes: object[]
      repdigits: object[]
      speed: object[]
      leaderboard: object[]
      last_updated: string
      last_updated_uuid: string
    }[]
    counters: Counter[]
  }>(`${API_URL}/thread/stats/threadStats`, { thread: threadName, dateStr: dateStr }, CONFIG)

export const updateCounter = (counter: Counter) => axios.post(`${API_URL}/counter/update`, { updateInfo: counter }, CONFIG)

export const registerCounter = (updateInfo: object) => axios.post(`${API_URL}/counter/register`, { update: updateInfo }, CONFIG)

export const updateCounterPrefs = (update: User, counter: Counter) =>
  axios.post(`${API_URL}/user/prefs`, { prefsUpdate: update, counterUpdate: counter }, CONFIG)

export const updateThreadPrefs = (update: ThreadPrefs) =>
  axios.post(`${API_URL}/user/threadPrefs`, { prefsUpdate: update }, CONFIG)

export const deleteThreadPrefs = (thread: ThreadType) =>
  axios.delete(`${API_URL}/user/deleteThreadPrefs`, {...CONFIG,  params: {threadUUID: thread.uuid} })

export const getRecentCounts = (thread_name: string, context: string | (string | null)[] | null, commentsOnly?: boolean) =>
  axios.post(`${API_URL}/thread/getRecent`, { thread_name: thread_name, context: context, commentsOnly: commentsOnly }, CONFIG)

export const getOlderCounts = (thread_name: string, uuid: string) =>
  axios.post(`${API_URL}/thread/getOlder`, { thread_name: thread_name, uuid: uuid }, CONFIG)

export const loadOlderCounts = (thread_name?: string, uuid?: string, limit?: number, commentsOnly?: boolean) =>
  axios.get<{ counts: PostType[]; loadedOldest: boolean; loadedNewest: boolean }>(`${API_URL}/thread/loadOlderCounts`, {
    params: {
      thread_name: thread_name,
      uuid: uuid,
      limit: limit,
      commentsOnly: commentsOnly,
    },
    ...CONFIG,
  })

export const loadNewerCounts = (thread_name?: string, uuid?: string, limit?: number, commentsOnly?: boolean) =>
  axios.get<{ counts: PostType[]; loadedOldest: boolean; loadedNewest: boolean; counters: Counter[] }>(
    `${API_URL}/thread/loadNewerCounts`,
    {
      params: {
        thread_name: thread_name,
        uuid: uuid,
        limit: limit,
        commentsOnly: commentsOnly,
      },
      ...CONFIG,
    },
  )

export const getMentions = (from: number | undefined) =>
  axios.get(`${API_URL}/counter/getMentions`, {
    params: { from: from },
    ...CONFIG,
  })

export const getCountByUuid = (uuid: string) => axios.post(`${API_URL}/thread/getCountByUuid`, { uuid: uuid }, CONFIG)

export const findPostByThreadAndNumber = (number: string, thread?: string) =>
  axios.post(`${API_URL}/thread/findPostByThreadAndNumber`, { thread: thread, number: number }, CONFIG)

export const findPostByThreadAndRawCount = (rawCount: string, thread?: string) =>
  axios.post(`${API_URL}/thread/findPostByThreadAndRawCount`, { thread: thread, rawCount: rawCount }, CONFIG)

export const findPostByThreadAndComment = (comment: string, thread?: string) =>
  axios.post(`${API_URL}/thread/findPostByThreadAndComment`, { thread: thread, comment: comment }, CONFIG)

export const getAchievements = (uuid?: string) => axios.get<any>(`${API_URL}/counter/achievements/${uuid}`, CONFIG)

export const getAchievement = (id: number) => axios.get<any>(`${API_URL}/counter/achievement/${id}`, CONFIG)

export const unlockReward = (level: number) => axios.post(`${API_URL}/api/unlockReward`, { level: level }, CONFIG)

// export const unlockRewardSeason2 = (level: number) => axios.post(`${API_URL}/api/unlockRewardSeason2`, { level: level }, CONFIG)

// Contest related

export const joinAlliance = (timestamp: string) => axios.post(`${API_URL}/counter/joinAlliance`, { timestamp: timestamp }, CONFIG)

//Admin API
export const getUnapproved = () => axios.get<Counter[]>(`${API_URL}/counter/unapproved`, CONFIG)

export const adminApproveDiscord = (counter_ids: string[]) =>
  axios.post(`${API_URL}/counter/makeDiscordVerified`, { counter_ids }, CONFIG)

export const adminApproveCounter = (counter_ids: string[]) => axios.post(`${API_URL}/counter/makeCounter`, { counter_ids }, CONFIG)

export const adminDeny = (counter_ids: string[]) => axios.post(`${API_URL}/counter/denyCounter`, { counter_ids }, CONFIG)

export const adminCreateThread = (
  name: string,
  title: string,
  description: string,
  rules: string,
  firstValidCount: string,
  validationType: string,
  visibleTo: string,
  updatableBy: string,
  locked: boolean,
  autoValidated: boolean,
  resetOnMistakes: boolean,
  allowDoublePosts: boolean,
  moderators: string,
  verifiers: string,
  countBans: string,
  postBans: string,
  shortDescription: string,
  color1: string,
  color2: string,
  category: string,
  countsPerSplit: number,
  splitsPerGet: number,
  splitOffset: number,
  uuid?: string,
) =>
  axios.post(
    `${API_URL}/thread/create`,
    {
      name: name,
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
      countBans: countBans,
      postBans: postBans,
      shortDescription: shortDescription,
      color1: color1,
      color2: color2,
      category: category,
      countsPerSplit: countsPerSplit,
      splitsPerGet: splitsPerGet,
      splitOffset: splitOffset,
      uuid: uuid,
    },
    CONFIG,
  )

export const adminCreateNewItem = (
  name: string,
  internalName: string,
  description: string,
  category: string,
  unlockMethod: string,
  unlockDescription: string,
  price: number,
  quantity: number,
  levelToUnlock: number,
  achievementId: number,
) => {
  return axios.post(
    `${API_URL}/counter/createItem`,
    {
      name,
      internal_name: internalName,
      description,
      category,
      unlockMethod,
      unlockDescription,
      price,
      quantity,
      levelToUnlock,
      achievementId,
    },
    CONFIG,
  )
}

export const adminAwardAchievement = (counter_uuid: string, achievement_id: number) =>
  axios.post(`${API_URL}/counter/awardAchievement`, { counter_uuid: counter_uuid, achievement_id: achievement_id }, CONFIG)

export const modToggleThreadLock = (thread_uuid: string) =>
  axios.post(`${API_URL}/thread/modToggleThreadLock`, { thread_uuid: thread_uuid }, CONFIG)

export const modToggleSilentThreadLock = (thread_uuid: string) =>
  axios.post(`${API_URL}/thread/modToggleSilentThreadLock`, { thread_uuid: thread_uuid }, CONFIG)

export const modToggleBan = (uuid: string) => axios.post(`${API_URL}/counter/modToggleBan`, { uuid: uuid }, CONFIG)

export const modToggleMute = (uuid: string) => axios.post(`${API_URL}/counter/modToggleMute`, { uuid: uuid }, CONFIG)

export const adminSendSystemMessage = (message: string) =>
  axios.post(`${API_URL}/counter/adminSendSystemMessage`, { message: message }, CONFIG)
