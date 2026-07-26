import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RankTabPanel } from './RankTabPanel'
import {
  getRankCounterProfile,
  getRankGgProjection,
  getRankReplayData,
  markRankCompletionSeen,
  markRankUpSeen,
  markRankEntranceSeen,
} from '../utils/api'
import { socket } from '../utils/contexts/SocketContext'
import { ChallengeLog, Counter, ThreadType, ThreadRankRow, RankUpEvent } from '../utils/types'

jest.mock('../utils/api', () => ({
  getRankCounterProfile: jest.fn(),
  getRankGgProjection: jest.fn(),
  adminSetThreadRank: jest.fn(),
  getRankReplayData: jest.fn(),
  markRankCompletionSeen: jest.fn(),
  markRankUpSeen: jest.fn(),
  markRankEntranceSeen: jest.fn(),
}))

jest.mock('../utils/contexts/SocketContext', () => ({
  socket: { on: jest.fn(), off: jest.fn(), emit: jest.fn() },
}))

const mockedGetRankCounterProfile = getRankCounterProfile as jest.Mock
const mockedGetRankGgProjection = getRankGgProjection as jest.Mock
const mockedGetRankReplayData = getRankReplayData as jest.Mock
const mockedMarkRankCompletionSeen = markRankCompletionSeen as jest.Mock
const mockedMarkRankUpSeen = markRankUpSeen as jest.Mock
const mockedMarkRankEntranceSeen = markRankEntranceSeen as jest.Mock

const COUNTER = { uuid: 'counter-1', username: 'tester', roles: [] } as unknown as Counter
const THREAD = { uuid: 'thread-1', title: 'Double Counting' } as unknown as ThreadType

const makeLog = (overrides: Partial<ChallengeLog> = {}): ChallengeLog =>
  ({
    id: 1,
    counterUuid: 'counter-1',
    challengeId: 'challenge-1',
    seasonId: 1,
    context: 'rank',
    progress: 0,
    target: 5,
    accuracyWindow: null,
    completedAt: null,
    ggAwarded: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    type: 'thread_counts',
    params: null,
    threadUuid: 'thread-1',
    ggReward: 10,
    rank: 'bronze',
    sequencePosition: 1,
    sequenceTotal: 1,
    ...overrides,
  }) as ChallengeLog

const makeRankRow = (overrides: Partial<ThreadRankRow> = {}): ThreadRankRow => ({
  id: 1,
  counterUuid: 'counter-1',
  threadUuid: 'thread-1',
  seasonId: 1,
  rank: 'bronze',
  division: 1,
  gg: 0,
  ggTotal: 0,
  ...overrides,
})

const makeRankUpEvent = (overrides: Partial<RankUpEvent> = {}): RankUpEvent => ({
  id: 1,
  counterUuid: 'counter-1',
  threadUuid: 'thread-1',
  seasonId: 1,
  fromRank: 'bronze',
  fromDivision: 1,
  toRank: 'bronze',
  toDivision: 2,
  createdAt: Date.now(),
  seenAt: null,
  ...overrides,
})

// rank_updated now carries the changed data directly instead of just { threadUuid } — the
// frontend applies this straight to state and never re-fetches getRankCounterProfile on a live
// update (only at mount/reconnect). Build the payload shape RankTabPanel's handler expects.
const makeDelta = (
  overrides: {
    threadUuid?: string
    progress?: ChallengeLog[]
    completions?: ChallengeLog[]
    threadRank?: ThreadRankRow | null
    sitewideRank?: ThreadRankRow | null
  } = {},
) => ({
  threadUuid: overrides.threadUuid ?? 'thread-1',
  progress: overrides.progress ?? [],
  completions: overrides.completions ?? [],
  threadRank: overrides.threadRank ?? null,
  sitewideRank: overrides.sitewideRank ?? null,
})

// Advancing from tab-activation to live state now takes one extra async hop (getRankReplayData
// resolves -> both-replays-done effect -> fetchRankData -> getRankCounterProfile), which
// waitFor's interval-based polling doesn't reliably observe in this test environment even with
// a generous timeout — an explicit act()-wrapped real-time wait flushes it reliably. Call this
// once after renderPanel() in any test that needs the live jump to have already happened.
const flushReplayHandoff = () => act(() => new Promise((r) => setTimeout(r, 50)))

const renderPanel = (props: Partial<React.ComponentProps<typeof RankTabPanel>> = {}) => {
  const isMounted = { current: true }
  const sidebarScrollRef = { current: null }
  const sidebarScrollTopRef = { current: 0 }
  const onRankThreadRowChange = jest.fn()
  const onThreadRankUpdated = jest.fn()
  const onCompletionsAdded = jest.fn()
  const initialRankProfilePromiseRef = { current: Promise.resolve(null) }
  const utils = render(
    <MemoryRouter>
      <RankTabPanel
        counter={COUNTER}
        thread={THREAD}
        thread_name="double_counting"
        isMounted={isMounted as any}
        active={true}
        rankThreadRow={null}
        onRankThreadRowChange={onRankThreadRowChange}
        onThreadRankUpdated={onThreadRankUpdated}
        onCompletionsAdded={onCompletionsAdded}
        initialRankProfilePromiseRef={initialRankProfilePromiseRef as any}
        sidebarScrollRef={sidebarScrollRef as any}
        sidebarScrollTopRef={sidebarScrollTopRef as any}
        {...props}
      />
    </MemoryRouter>,
  )
  return { ...utils, onRankThreadRowChange, onThreadRankUpdated, onCompletionsAdded }
}

describe('RankTabPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedGetRankGgProjection.mockResolvedValue({ data: null })
    // Default: nothing unseen, so existing tests exercise the live (non-replay) path exactly
    // as before this feature existed.
    mockedGetRankReplayData.mockResolvedValue({ data: { unseenCompletions: [], unseenRankUps: [] } })
    mockedMarkRankCompletionSeen.mockResolvedValue({ data: { ok: true } })
    mockedMarkRankUpSeen.mockResolvedValue({ data: { ok: true } })
    mockedMarkRankEntranceSeen.mockResolvedValue({ data: { ok: true } })
  })

  it('fetches and renders an in-progress challenge on first activation', async () => {
    const progressLog = makeLog({ challengeId: 'c1', progress: 2, target: 5 })
    mockedGetRankCounterProfile.mockResolvedValue({
      data: {
        ranks: [makeRankRow()],
        challengeProgress: [progressLog],
        recentCompletions: [],
      },
    })

    renderPanel()

    await flushReplayHandoff()
    await waitFor(() => expect(mockedGetRankCounterProfile).toHaveBeenCalledWith('tester'))
    // Entrance animation counts up 0 -> 2 over ~3s, so assert on the target (stable throughout)
    // rather than the animating current-progress number.
    expect(await screen.findByText(/\/ 5 Counts/)).toBeInTheDocument()
  })

  it('only shows challenges scoped to the current thread', async () => {
    const thisThread = makeLog({ id: 1, challengeId: 'c1', target: 5, threadUuid: 'thread-1' })
    const otherThread = makeLog({ id: 2, challengeId: 'c2', target: 9, threadUuid: 'thread-2' })
    mockedGetRankCounterProfile.mockResolvedValue({
      data: { ranks: [], challengeProgress: [thisThread, otherThread], recentCompletions: [] },
    })

    renderPanel()
    await flushReplayHandoff()

    expect(await screen.findByText('0 / 5 Counts')).toBeInTheDocument()
    expect(screen.queryByText('0 / 9 Counts')).not.toBeInTheDocument()
  })

  it('registers exactly one rank_updated socket listener and cleans it up on unmount', () => {
    mockedGetRankCounterProfile.mockResolvedValue({ data: { ranks: [], challengeProgress: [], recentCompletions: [] } })
    const { unmount } = renderPanel()

    expect(socket.on as jest.Mock).toHaveBeenCalledWith('rank_updated', expect.any(Function))
    const onCallsForRankUpdated = (socket.on as jest.Mock).mock.calls.filter((c) => c[0] === 'rank_updated')
    expect(onCallsForRankUpdated).toHaveLength(1)

    unmount()
    expect(socket.off as jest.Mock).toHaveBeenCalledWith('rank_updated', expect.any(Function))
  })

  it('renders a SpeedChallengeCard for split_under_ms type challenges', async () => {
    const speedLog = makeLog({
      challengeId: 'c1',
      type: 'split_under_ms',
      params: { maxMs: 5000 },
    })
    mockedGetRankCounterProfile.mockResolvedValue({
      data: { ranks: [], challengeProgress: [speedLog], recentCompletions: [] },
    })

    renderPanel()
    await flushReplayHandoff()

    expect(await screen.findByText('0/5 0:05.000 Splits')).toBeInTheDocument()
  })

  it('renders a SpeedChallengeCard (not the generic count card) for bars_within_ms type challenges', async () => {
    const barsLog = makeLog({
      challengeId: 'c1',
      type: 'bars_within_ms',
      params: { maxMs: 500 },
    })
    mockedGetRankCounterProfile.mockResolvedValue({
      data: { ranks: [], challengeProgress: [barsLog], recentCompletions: [] },
    })

    renderPanel()
    await flushReplayHandoff()

    expect(await screen.findByText('0/5 0:00.500 Splits')).toBeInTheDocument()
  })

  it('drops the plural "s" for a split_under_ms/get_under_ms challenge with target 1', async () => {
    const speedLog = makeLog({
      challengeId: 'c1',
      type: 'get_under_ms',
      target: 1,
      params: { maxMs: 5000 },
    })
    mockedGetRankCounterProfile.mockResolvedValue({
      data: { ranks: [], challengeProgress: [speedLog], recentCompletions: [] },
    })

    renderPanel()
    await flushReplayHandoff()

    expect(await screen.findByText('0/1 0:05.000 Get')).toBeInTheDocument()
  })

  it('renders an AccuracyMeter for accuracy_rate type challenges', async () => {
    const accuracyLog = makeLog({
      challengeId: 'c1',
      type: 'accuracy_rate',
      params: { windowSize: 20, minAccuracyPercent: 95 },
    })
    mockedGetRankCounterProfile.mockResolvedValue({
      data: { ranks: [], challengeProgress: [accuracyLog], recentCompletions: [] },
    })

    renderPanel()
    await flushReplayHandoff()

    expect(await screen.findByText(/95%/)).toBeInTheDocument()
  })

  it('shows the empty state once loaded with no challenges assigned', async () => {
    mockedGetRankCounterProfile.mockResolvedValue({ data: { ranks: [], challengeProgress: [], recentCompletions: [] } })

    renderPanel()
    await flushReplayHandoff()

    expect(await screen.findByText('No challenges assigned for Double Counting yet.')).toBeInTheDocument()
  })

  it('reports sitewide rank updates up via onThreadRankUpdated when rank_updated fires', async () => {
    mockedGetRankCounterProfile.mockResolvedValue({
      data: { ranks: [], challengeProgress: [], recentCompletions: [] },
    })
    const { onThreadRankUpdated } = renderPanel()
    await flushReplayHandoff()

    // Thread and sitewide each independently jump to live state once their own (empty) replay
    // queue finishes, so the initial settle can fire getRankCounterProfile more than once.
    await waitFor(() => expect(mockedGetRankCounterProfile).toHaveBeenCalled())

    const handler = (socket.on as jest.Mock).mock.calls.find((c) => c[0] === 'rank_updated')![1]
    await act(async () => {
      handler(makeDelta({ threadRank: makeRankRow({ threadUuid: 'thread-9' }) }))
      await Promise.resolve()
    })

    await waitFor(() => expect(onThreadRankUpdated).toHaveBeenCalledWith(expect.objectContaining({ 'thread-9': expect.any(Object) })))
  })

  // Regression coverage for the real bug: rank_updated used to trigger a full-profile HTTP
  // re-fetch on every live event, which under a burst of rapid attempts blew through the
  // sitewide rate limit. The delta now carries the changed data directly, so no re-fetch should
  // ever happen in response to a live event — only at mount (already observed above) or reconnect.
  it('does not call getRankCounterProfile again when a live rank_updated event fires', async () => {
    mockedGetRankCounterProfile.mockResolvedValue({
      data: { ranks: [], challengeProgress: [], recentCompletions: [] },
    })
    renderPanel()
    await flushReplayHandoff()
    await waitFor(() => expect(mockedGetRankCounterProfile).toHaveBeenCalled())
    const callsAfterMount = mockedGetRankCounterProfile.mock.calls.length

    const handler = (socket.on as jest.Mock).mock.calls.find((c) => c[0] === 'rank_updated')![1]
    const progressLog = makeLog({ id: 90, challengeId: 'c1', progress: 3, target: 5, completedAt: null })
    const completedLog = makeLog({ id: 91, challengeId: 'c2', progress: 5, target: 5, completedAt: Date.now() })
    await act(async () => {
      handler(
        makeDelta({
          progress: [progressLog],
          completions: [completedLog],
          threadRank: makeRankRow({ threadUuid: 'thread-9' }),
          sitewideRank: makeRankRow({ threadUuid: null as any }),
        }),
      )
      await Promise.resolve()
    })

    expect(mockedGetRankCounterProfile.mock.calls.length).toBe(callsAfterMount)
  })

  // Regression coverage: ThreadPage already fetches getRankCounterProfile eagerly on page mount
  // (to populate its own sidebar badges) and exposes it as an in-flight promise — first
  // activation must await and reuse it directly instead of issuing an identical second request
  // the instant the tab opens, which is what the user actually reported ("why is it making an
  // API call, aren't the challenges already loaded from the initial load"). Deliberately passed
  // as an ALREADY-RESOLVED promise (not a bare value) so this also covers the timing this
  // feature actually exists for: RankTabPanel awaits the promise rather than checking a
  // synchronous flag, so it works whether the mount-time fetch resolved before or after the tab
  // was opened.
  it('reuses the in-flight initial rank profile promise on first activation instead of re-fetching', async () => {
    const progressLog = makeLog({ challengeId: 'c1', progress: 2, target: 5 })
    const { unmount } = renderPanel({
      initialRankProfilePromiseRef: {
        current: Promise.resolve({
          counter: { uuid: 'counter-1', username: 'tester', name: 'Tester', avatar: '', discordId: '', color: '' },
          ranks: [makeRankRow()],
          challengeProgress: [progressLog],
          recentCompletions: [],
        }),
      } as any,
    })
    await flushReplayHandoff()

    expect(await screen.findByText(/\/ 5 Counts/)).toBeInTheDocument()
    expect(mockedGetRankCounterProfile).not.toHaveBeenCalled()
    unmount()
  })

  it('falls back to a real fetch when the initial rank profile promise resolves to null (e.g. it failed)', async () => {
    const progressLog = makeLog({ challengeId: 'c1', progress: 2, target: 5 })
    mockedGetRankCounterProfile.mockResolvedValue({
      data: { ranks: [makeRankRow()], challengeProgress: [progressLog], recentCompletions: [] },
    })
    const { unmount } = renderPanel({
      initialRankProfilePromiseRef: { current: Promise.resolve(null) } as any,
    })
    await flushReplayHandoff()

    expect(await screen.findByText(/\/ 5 Counts/)).toBeInTheDocument()
    expect(mockedGetRankCounterProfile).toHaveBeenCalledWith('tester')
    unmount()
  })

  it('does not show sitewide challenges while the Thread tab is selected', async () => {
    const sitewideLog = makeLog({ id: 1, challengeId: 'c1', threadUuid: null })
    mockedGetRankCounterProfile.mockResolvedValue({
      data: { ranks: [], challengeProgress: [sitewideLog], recentCompletions: [] },
    })

    renderPanel()
    await flushReplayHandoff()

    expect(await screen.findByText('No challenges assigned for Double Counting yet.')).toBeInTheDocument()
    expect(screen.queryByText('0 / 5 Counts')).not.toBeInTheDocument()
  })

  it('shows sitewide challenges only once the Sitewide tab is selected', async () => {
    const sitewideLog = makeLog({ id: 1, challengeId: 'c1', threadUuid: null })
    mockedGetRankCounterProfile.mockResolvedValue({
      data: { ranks: [], challengeProgress: [sitewideLog], recentCompletions: [] },
    })

    // The scope picker only renders once there's rank data of some kind — seed a thread rank
    // row so the Thread/Sitewide tabs actually appear to click between.
    renderPanel({ rankThreadRow: makeRankRow({ threadUuid: 'thread-1' }) })
    await flushReplayHandoff()

    fireEvent.click(await screen.findByRole('tab', { name: 'Sitewide' }))

    expect(await screen.findByText('0 / 5 Counts')).toBeInTheDocument()
  })

  it('shows a collapsed top-5 leaderboard under the thread rank card, expandable', async () => {
    mockedGetRankCounterProfile.mockResolvedValue({
      data: { ranks: [makeRankRow({ threadUuid: 'thread-1' })], challengeProgress: [], recentCompletions: [] },
    })
    renderPanel({ rankThreadRow: makeRankRow({ threadUuid: 'thread-1' }) })
    await flushReplayHandoff()

    const initialHandler = (socket.on as jest.Mock).mock.calls.find((c) => c[0] === 'rank_leaderboard_initial')![1]
    act(() => {
      initialHandler({
        threadUuid: 'thread-1',
        entries: [
          {
            counterUuid: 'c1',
            username: 'first',
            name: 'First',
            avatar: '',
            discordId: '',
            color: '',
            rank: 'gold',
            division: 1,
            gg: 500,
            ggTotal: 500,
            threadUuid: 'thread-1',
          },
          {
            counterUuid: 'c2',
            username: 'second',
            name: 'Second',
            avatar: '',
            discordId: '',
            color: '',
            rank: 'silver',
            division: 3,
            gg: 400,
            ggTotal: 400,
            threadUuid: 'thread-1',
          },
          {
            counterUuid: 'c3',
            username: 'third',
            name: 'Third',
            avatar: '',
            discordId: '',
            color: '',
            rank: 'silver',
            division: 2,
            gg: 300,
            ggTotal: 300,
            threadUuid: 'thread-1',
          },
          {
            counterUuid: 'c4',
            username: 'fourth',
            name: 'Fourth',
            avatar: '',
            discordId: '',
            color: '',
            rank: 'silver',
            division: 1,
            gg: 200,
            ggTotal: 200,
            threadUuid: 'thread-1',
          },
          {
            counterUuid: 'c5',
            username: 'fifth',
            name: 'Fifth',
            avatar: '',
            discordId: '',
            color: '',
            rank: 'bronze',
            division: 3,
            gg: 100,
            ggTotal: 100,
            threadUuid: 'thread-1',
          },
          {
            counterUuid: 'c6',
            username: 'sixth',
            name: 'Sixth',
            avatar: '',
            discordId: '',
            color: '',
            rank: 'bronze',
            division: 2,
            gg: 50,
            ggTotal: 50,
            threadUuid: 'thread-1',
          },
        ],
      })
    })

    // Top 5 always shown...
    expect(await screen.findByText('First')).toBeInTheDocument()
    expect(screen.getByText('Fifth')).toBeInTheDocument()
    // 6th is hidden until expanded
    expect(screen.queryByText('Sixth')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Show all 6'))
    expect(await screen.findByText('Sixth')).toBeInTheDocument()
  })

  // Leaderboard is now socket-driven — rank_leaderboard_initial sets the full list, and
  // rank_leaderboard_updated upserts a single entry in real time.
  it('populates thread leaderboard from rank_leaderboard_initial socket event', async () => {
    mockedGetRankCounterProfile.mockResolvedValue({
      data: { ranks: [], challengeProgress: [], recentCompletions: [] },
    })
    renderPanel({ rankThreadRow: makeRankRow({ threadUuid: 'thread-1' }) })
    await flushReplayHandoff()

    const initialHandler = (socket.on as jest.Mock).mock.calls.find((c) => c[0] === 'rank_leaderboard_initial')![1]
    act(() => {
      initialHandler({
        threadUuid: 'thread-1',
        entries: [
          {
            counterUuid: 'c1',
            username: 'first',
            name: 'First',
            avatar: '',
            discordId: '',
            color: '',
            rank: 'gold',
            division: 1,
            gg: 500,
            ggTotal: 500,
            threadUuid: 'thread-1',
          },
        ],
      })
    })

    expect(await screen.findByText('First')).toBeInTheDocument()
  })

  it('shows a collapsed top-5 leaderboard under the sitewide section, expandable', async () => {
    mockedGetRankCounterProfile.mockResolvedValue({
      data: { ranks: [makeRankRow({ threadUuid: null })], challengeProgress: [], recentCompletions: [] },
    })
    renderPanel()
    await flushReplayHandoff()

    fireEvent.click(await screen.findByRole('tab', { name: 'Sitewide' }))

    const initialHandler = (socket.on as jest.Mock).mock.calls.find((c) => c[0] === 'rank_leaderboard_initial')![1]
    act(() => {
      initialHandler({
        threadUuid: null,
        entries: [
          {
            counterUuid: 'c1',
            username: 'first',
            name: 'First',
            avatar: '',
            discordId: '',
            color: '',
            rank: 'gold',
            division: 1,
            gg: 500,
            ggTotal: 500,
            threadUuid: null,
          },
          {
            counterUuid: 'c2',
            username: 'second',
            name: 'Second',
            avatar: '',
            discordId: '',
            color: '',
            rank: 'silver',
            division: 3,
            gg: 400,
            ggTotal: 400,
            threadUuid: null,
          },
          {
            counterUuid: 'c3',
            username: 'third',
            name: 'Third',
            avatar: '',
            discordId: '',
            color: '',
            rank: 'silver',
            division: 2,
            gg: 300,
            ggTotal: 300,
            threadUuid: null,
          },
          {
            counterUuid: 'c4',
            username: 'fourth',
            name: 'Fourth',
            avatar: '',
            discordId: '',
            color: '',
            rank: 'silver',
            division: 1,
            gg: 200,
            ggTotal: 200,
            threadUuid: null,
          },
          {
            counterUuid: 'c5',
            username: 'fifth',
            name: 'Fifth',
            avatar: '',
            discordId: '',
            color: '',
            rank: 'bronze',
            division: 3,
            gg: 100,
            ggTotal: 100,
            threadUuid: null,
          },
          {
            counterUuid: 'c6',
            username: 'sixth',
            name: 'Sixth',
            avatar: '',
            discordId: '',
            color: '',
            rank: 'bronze',
            division: 2,
            gg: 50,
            ggTotal: 50,
            threadUuid: null,
          },
        ],
      })
    })

    // Top 5 always shown in collapsed view
    expect(await screen.findByText('First')).toBeInTheDocument()
    expect(screen.getByText('Fifth')).toBeInTheDocument()
    // 6th is hidden until expanded
    expect(screen.queryByText('Sixth')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Show all 6'))
    expect(await screen.findByText('Sixth')).toBeInTheDocument()
  })

  it('upserts a leaderboard entry on rank_leaderboard_updated', async () => {
    mockedGetRankCounterProfile.mockResolvedValue({
      data: { ranks: [makeRankRow({ threadUuid: null })], challengeProgress: [], recentCompletions: [] },
    })
    renderPanel()
    await flushReplayHandoff()

    fireEvent.click(await screen.findByRole('tab', { name: 'Sitewide' }))

    const initialHandler = (socket.on as jest.Mock).mock.calls.find((c) => c[0] === 'rank_leaderboard_initial')![1]
    act(() => {
      initialHandler({
        threadUuid: null,
        entries: [
          {
            counterUuid: 'c1',
            username: 'first',
            name: 'First',
            avatar: '',
            discordId: '',
            color: '',
            rank: 'silver',
            division: 1,
            gg: 100,
            ggTotal: 100,
            threadUuid: null,
          },
        ],
      })
    })
    expect(await screen.findByText('First')).toBeInTheDocument()

    const updatedHandler = (socket.on as jest.Mock).mock.calls.find((c) => c[0] === 'rank_leaderboard_updated')![1]
    act(() => {
      updatedHandler({
        counterUuid: 'c1',
        username: 'first',
        name: 'First',
        avatar: '',
        discordId: '',
        color: '',
        rank: 'gold',
        division: 1,
        gg: 200,
        ggTotal: 200,
        threadUuid: null,
      })
    })

    // Still visible after upsert
    expect(screen.getByText('First')).toBeInTheDocument()
  })

  it('shows the sitewide rank card under the Sitewide rank tab, even with no sitewide challenges', async () => {
    mockedGetRankCounterProfile.mockResolvedValue({
      data: {
        ranks: [makeRankRow({ threadUuid: null, rank: 'gold', division: 2, gg: 500, ggTotal: 1500 })],
        challengeProgress: [],
        recentCompletions: [],
      },
    })

    renderPanel()
    await flushReplayHandoff()

    fireEvent.click(await screen.findByRole('tab', { name: 'Sitewide' }))
    // RankProgressCard no longer renders rank-name text — assert on the progress bar's GG
    // label instead, which shows GG earned WITHIN this division vs. this division's span, not
    // the rank-relative absolute gg/divCeil. Gold div 2: floor(1400/3*1)=466 floor,
    // floor(1400/3*2)=933 ceiling, gg=500 -> (500-466)/(933-466) = 34/467.
    expect(await screen.findByText('34 / 467 GG')).toBeInTheDocument()
  })

  it('never shows a completed challenge as history — it disappears once its animation finishes', async () => {
    const completedLog = makeLog({ id: 5, challengeId: 'c1', target: 42, completedAt: Date.now() })
    mockedGetRankCounterProfile.mockResolvedValue({
      data: { ranks: [], challengeProgress: [], recentCompletions: [completedLog] },
    })

    renderPanel()
    await flushReplayHandoff()

    // Seeded as already-seen history on the initial fetch, so it was never animated and
    // never gets a slot at all — no "completed" section exists anymore.
    await waitFor(() => expect(mockedGetRankCounterProfile).toHaveBeenCalled())
    expect(screen.queryByText('42 Counts')).not.toBeInTheDocument()
    expect(await screen.findByText('No challenges assigned for Double Counting yet.')).toBeInTheDocument()
  })

  // Regression test for a real bug: a completion that arrives with NO pre-existing progress
  // slot to flip in place (useChallengeSlots' "no slot exists yet" fallback — e.g. a challenge
  // that was created and completed in the same tick, before the client ever saw it in-progress)
  // mounts fresh with isComplete=true, same as a replay 'completion' step. The same
  // "remounted mid-animation, skip it" guard silently dropped this with no visual indicator at
  // all — the challenge just vanished with nothing ever shown for it.
  it('shows the completion splash for a challenge that completes before ever being seen in-progress', async () => {
    mockedGetRankCounterProfile.mockResolvedValue({
      data: { ranks: [makeRankRow()], challengeProgress: [], recentCompletions: [] },
    })

    renderPanel()
    await flushReplayHandoff()
    expect(await screen.findByText('No challenges assigned for Double Counting yet.')).toBeInTheDocument()

    const completedLog = makeLog({ id: 72, challengeId: 'c-never-seen', progress: 5, target: 5, completedAt: Date.now() })
    const handler = (socket.on as jest.Mock).mock.calls.find((c) => c[0] === 'rank_updated')![1]
    await act(async () => {
      handler(makeDelta({ completions: [completedLog] }))
      await Promise.resolve()
    })

    expect(await screen.findByText('Complete!')).toBeInTheDocument()
    await act(() => new Promise((r) => setTimeout(r, 5900)))
    await waitFor(() => expect(mockedMarkRankCompletionSeen).toHaveBeenCalledWith('tester', 72))
  })

  // Regression test for a real bug: when a challenge completed and its chain immediately
  // assigned a next-sequence challenge (arriving in the SAME rank_updated payload), the
  // completion animation's finishAnimation callback closed over a stale `progress` array from
  // an earlier render and could fail to find the new challenge — silently dropping it from the
  // pending queue with no retry, so nothing appeared until a LATER, unrelated rank_updated
  // event (e.g. the user's next count) happened to re-trigger the reconciliation effect.
  it('shows the next chain challenge immediately once its completion animation finishes, without needing another unrelated update', async () => {
    const firstLog = makeLog({ id: 73, challengeId: 'c1', progress: 4, target: 5, completedAt: null })
    mockedGetRankCounterProfile.mockResolvedValue({
      data: { ranks: [makeRankRow()], challengeProgress: [firstLog], recentCompletions: [] },
    })

    renderPanel()
    await flushReplayHandoff()
    expect(await screen.findByText(/\/ 5 Counts/)).toBeInTheDocument()

    // Completion arrives, and its chain's next-sequence challenge is ALREADY present in the
    // same profile fetch — this is the realistic shape (assignNextInChain runs synchronously
    // server-side before rank_updated is ever emitted).
    const completedLog = { ...firstLog, progress: 5, completedAt: Date.now() }
    const nextChallenge = makeLog({ id: 74, challengeId: 'c2', progress: 0, target: 3, completedAt: null })
    const handler = (socket.on as jest.Mock).mock.calls.find((c) => c[0] === 'rank_updated')![1]
    await act(async () => {
      handler(makeDelta({ progress: [nextChallenge], completions: [completedLog] }))
      await Promise.resolve()
    })

    // Let the completion splash + collapse fully play out.
    await act(() => new Promise((r) => setTimeout(r, 5900)))

    // The next chain challenge must be visible now — no further rank_updated event fired.
    expect(await screen.findByText(/\/ 3 Counts/)).toBeInTheDocument()
  })

  // Regression test for a real bug: a LIVE completion (one flipped to 'completing' via a live
  // rank_updated event, not the replay-catchup path) never called markRankCompletionSeen at
  // all — only useRankReplay's onCompletionDone did, which is exclusively used for catching up
  // on completions that happened before the tab was opened. That meant the Rank tab's unseen
  // badge never cleared for anything the user actually watched complete live.
  it('marks a live (non-replay) completion as seen once its animation finishes', async () => {
    const progressLog = makeLog({ id: 70, challengeId: 'c1', progress: 4, target: 5, completedAt: null })
    mockedGetRankCounterProfile.mockResolvedValue({
      data: { ranks: [makeRankRow()], challengeProgress: [progressLog], recentCompletions: [] },
    })

    renderPanel()
    await flushReplayHandoff()
    expect(await screen.findByText(/\/ 5 Counts/)).toBeInTheDocument()

    const completedLog = { ...progressLog, progress: 5, completedAt: Date.now() }
    const handler = (socket.on as jest.Mock).mock.calls.find((c) => c[0] === 'rank_updated')![1]
    await act(async () => {
      handler(makeDelta({ completions: [completedLog] }))
      await Promise.resolve()
    })

    // Let the completion splash + collapse fully play out (2200 + 3000 + 420ms, padded).
    await act(() => new Promise((r) => setTimeout(r, 5900)))

    expect(mockedMarkRankCompletionSeen).toHaveBeenCalledWith('tester', 70)
  })

  // Regression test for a real bug: ChallengeCompletionWrapper's auto-collapse timer depended
  // on `summary`, a fresh object literal recreated on every parent render (getCompletionSummary
  // is never memoized) — so ANY unrelated re-render while a completion was mid-splash (e.g.
  // another rank_updated tick) cleared and restarted the whole 5.2s timer from scratch, making
  // completions appear to "never" disappear while the user kept actively counting.
  it('does not restart the completion auto-collapse timer on an unrelated re-render mid-splash', async () => {
    const progressLog = makeLog({ id: 71, challengeId: 'c1', progress: 4, target: 5, completedAt: null })
    mockedGetRankCounterProfile.mockResolvedValue({
      data: { ranks: [makeRankRow()], challengeProgress: [progressLog], recentCompletions: [] },
    })

    renderPanel()
    await flushReplayHandoff()
    expect(await screen.findByText(/\/ 5 Counts/)).toBeInTheDocument()

    const completedLog = { ...progressLog, progress: 5, completedAt: Date.now() }
    const handler = (socket.on as jest.Mock).mock.calls.find((c) => c[0] === 'rank_updated')![1]
    await act(async () => {
      handler(makeDelta({ completions: [completedLog] }))
      await Promise.resolve()
    })

    // Splash is now showing ("Complete!"). Fire several more unrelated live updates partway
    // through the hold — each one used to reset the 5.2s clock; now it must not.
    for (let i = 0; i < 3; i++) {
      await act(() => new Promise((r) => setTimeout(r, 1000)))
      await act(async () => {
        handler(makeDelta({ completions: [completedLog] }))
        await Promise.resolve()
      })
    }

    // Total elapsed so far: ~3s of interleaved re-renders. The original timer (5.2s hold +
    // 420ms collapse) should still fire on schedule from when the splash first started, not
    // from the last re-render — so within another ~3s it must have finished and disappeared.
    await act(() => new Promise((r) => setTimeout(r, 3000)))
    expect(await screen.findByText('No challenges assigned for Double Counting yet.')).toBeInTheDocument()
  })

  describe('replay system (unseen completions/rank-ups since last visit)', () => {
    const flushBarStep = () => act(() => new Promise((r) => setTimeout(r, 3100)))
    // Completion steps always carry a summary now (getCompletionSummary always returns
    // something), so the wrapper's splash hold is 2200ms + the extra 3000ms "appreciate it"
    // padding, plus the 420ms collapse — pad generously past that.
    const flushCompletionStep = () => act(() => new Promise((r) => setTimeout(r, 5900)))

    it('plays a single unseen completion (bar then splash) before falling back to live state', async () => {
      const unseenLog = makeLog({
        id: 10,
        challengeId: 'c1',
        target: 5,
        threadUuid: 'thread-1',
        completedAt: Date.now() - 1000,
      })
      mockedGetRankReplayData.mockResolvedValue({
        data: { unseenCompletions: [{ ...unseenLog, chainKey: 'thread_counts:thread-1' }], unseenRankUps: [] },
      })
      mockedGetRankCounterProfile.mockResolvedValue({
        data: { ranks: [], challengeProgress: [], recentCompletions: [] },
      })

      renderPanel()

      // Bar step first — the challenge's title is visible while its progress bar animates.
      expect(await screen.findByText('5 Counts')).toBeInTheDocument()
      expect(mockedMarkRankCompletionSeen).not.toHaveBeenCalled()

      await flushBarStep()
      // Regression test: a replay 'completion' step used to mount ChallengeCompletionWrapper
      // fresh with isComplete=true, which an internal "was this remounted mid-animation" guard
      // misread as "already finished, skip the splash" — so the bar-fill played but the
      // "Complete!" splash never showed at all, jumping straight to marked-seen. Assert the
      // splash text is actually visible mid-step, not just that markRankCompletionSeen
      // eventually fires (timing alone wouldn't catch a skipped-but-still-delayed call).
      expect(await screen.findByText('Complete!')).toBeInTheDocument()
      // Now in the 'completion' step — same challenge, playing its splash.
      await flushCompletionStep()

      await waitFor(() => expect(mockedMarkRankCompletionSeen).toHaveBeenCalledWith('tester', 10))
      // Caught up — live fetchRankData jump has now run (one more async hop after the queue
      // itself drains, same as the plain live-path tests need flushReplayHandoff for).
      await flushReplayHandoff()
      await waitFor(() => expect(mockedGetRankCounterProfile).toHaveBeenCalledWith('tester'))
    })

    // Regression test for a real bug: the live challenge list was completely hidden (and never
    // even fetched) for as long as ANY replay backlog was draining — content only rendered
    // renderReplay(...) OR the live slot list, never both. An unrelated in-progress challenge
    // (not part of the replay at all) was invisible the whole time a replay was playing.
    it('shows an unrelated live in-progress challenge alongside a playing replay, updating as it ticks', async () => {
      const replayedLog = makeLog({
        id: 80,
        challengeId: 'c-replay',
        target: 5,
        threadUuid: 'thread-1',
        completedAt: Date.now() - 1000,
      })
      const liveLog = makeLog({ id: 81, challengeId: 'c-live', progress: 2, target: 10, threadUuid: 'thread-1', completedAt: null })
      mockedGetRankReplayData.mockResolvedValue({
        data: { unseenCompletions: [{ ...replayedLog, chainKey: 'thread_counts:thread-1' }], unseenRankUps: [] },
      })
      // Live fetch (now issued immediately, not gated behind replay finishing) returns the
      // unrelated in-progress challenge alongside the completion the replay is about to show.
      mockedGetRankCounterProfile.mockResolvedValue({
        data: { ranks: [], challengeProgress: [liveLog], recentCompletions: [replayedLog] },
      })

      renderPanel()

      // Both are visible at once: the replay's bar step for c-replay, and the live c-live card.
      expect(await screen.findByText('5 Counts')).toBeInTheDocument()
      expect(await screen.findByText(/\/ 10 Counts/)).toBeInTheDocument()

      // Live challenge updates in place while the replay is still playing.
      const handler = (socket.on as jest.Mock).mock.calls.find((c) => c[0] === 'rank_updated')![1]
      await act(async () => {
        handler(makeDelta({ progress: [{ ...liveLog, progress: 6 }] }))
        await Promise.resolve()
      })
      expect(await screen.findByText(/\/ 10 Counts/)).toBeInTheDocument()

      // The replay's own challenge must NOT also appear as a duplicate live card underneath.
      expect(screen.queryAllByText('5 Counts')).toHaveLength(1)
    })

    // Regression test for a real bug: when a challenge completed and its chain immediately
    // assigned a next-sequence challenge WHILE another, unrelated replay backlog was still
    // draining, the live rank_updated handler's `if (threadReplayStatusRef.current === 'done')`
    // guard skipped applying the fetched profile entirely — so the next challenge stayed
    // invisible until some LATER, unrelated update happened to fire once the replay finally
    // finished. This is the realistic shape of the bug the user hit — the previous fix/test
    // only covered a session with NO replay backlog at all, which isn't what happens in
    // practice (any unseen completion queues a replay).
    it('shows a newly chain-assigned challenge that arrives while an unrelated replay is still playing', async () => {
      const replayedLog = makeLog({
        id: 82,
        challengeId: 'c-replay',
        target: 5,
        threadUuid: 'thread-1',
        completedAt: Date.now() - 1000,
      })
      mockedGetRankReplayData.mockResolvedValue({
        data: { unseenCompletions: [{ ...replayedLog, chainKey: 'thread_counts:thread-1' }], unseenRankUps: [] },
      })
      mockedGetRankCounterProfile.mockResolvedValue({
        data: { ranks: [], challengeProgress: [], recentCompletions: [replayedLog] },
      })

      renderPanel()
      expect(await screen.findByText('5 Counts')).toBeInTheDocument()

      // A completely unrelated challenge completes live and its chain immediately assigns the
      // next one — arriving via rank_updated while c-replay's replay is still mid-flight.
      const newlyAssigned = makeLog({
        id: 83,
        challengeId: 'c-next',
        progress: 0,
        target: 3,
        threadUuid: 'thread-1',
        completedAt: null,
      })
      const handler = (socket.on as jest.Mock).mock.calls.find((c) => c[0] === 'rank_updated')![1]
      await act(async () => {
        handler(makeDelta({ progress: [newlyAssigned] }))
        await Promise.resolve()
      })

      // Must be visible immediately — no further action, no waiting for the in-flight replay.
      expect(await screen.findByText(/\/ 3 Counts/)).toBeInTheDocument()
      // The still-playing replay is unaffected — its own bar step is still there too.
      expect(screen.getByText('5 Counts')).toBeInTheDocument()
    })

    it('replays two chained completions in order, not simultaneously', async () => {
      // Two full bar+completion flushes back to back (~18s of real timers) exceed the
      // sitewide 15s default — this test needs its own longer budget, not a faster fix.
      const first = makeLog({ id: 21, challengeId: 'c1', target: 5, threadUuid: 'thread-1', completedAt: 100 })
      const second = makeLog({ id: 22, challengeId: 'c2', target: 7, threadUuid: 'thread-1', completedAt: 200 })
      mockedGetRankReplayData.mockResolvedValue({
        data: {
          unseenCompletions: [
            { ...first, chainKey: 'thread_counts:thread-1' },
            { ...second, chainKey: 'thread_counts:thread-1' },
          ],
          unseenRankUps: [],
        },
      })
      mockedGetRankCounterProfile.mockResolvedValue({
        data: { ranks: [], challengeProgress: [], recentCompletions: [] },
      })

      renderPanel()

      expect(await screen.findByText('5 Counts')).toBeInTheDocument()
      expect(screen.queryByText('7 Counts')).not.toBeInTheDocument()

      await flushBarStep()
      await flushCompletionStep()
      await waitFor(() => expect(mockedMarkRankCompletionSeen).toHaveBeenCalledWith('tester', 21))

      // Second chain step now plays — first is gone, second has appeared.
      await waitFor(() => expect(screen.getByText('7 Counts')).toBeInTheDocument())
      expect(screen.queryByText('5 Counts')).not.toBeInTheDocument()

      await flushBarStep()
      await flushCompletionStep()
      await waitFor(() => expect(mockedMarkRankCompletionSeen).toHaveBeenCalledWith('tester', 22))
    }, 25000)

    it('replays two unseen completions of DIFFERENT chains concurrently, not one at a time', async () => {
      const countsLog = makeLog({
        id: 23,
        challengeId: 'c1',
        type: 'thread_counts',
        target: 5,
        threadUuid: 'thread-1',
        completedAt: 100,
      })
      const speedLog = makeLog({
        id: 24,
        challengeId: 'c2',
        type: 'split_under_ms',
        params: { maxMs: 4500 },
        threadUuid: 'thread-1',
        completedAt: 200,
      })
      mockedGetRankReplayData.mockResolvedValue({
        data: {
          unseenCompletions: [
            { ...countsLog, chainKey: 'thread_counts:thread-1' },
            { ...speedLog, chainKey: 'split_under_ms:thread-1:' },
          ],
          unseenRankUps: [],
        },
      })
      mockedGetRankCounterProfile.mockResolvedValue({
        data: { ranks: [], challengeProgress: [], recentCompletions: [] },
      })

      renderPanel()

      // Both chains' bar steps are visible at once — different chainKeys means independent
      // lanes, so the split_under_ms completion doesn't wait for thread_counts to finish.
      expect(await screen.findByText('5 Counts')).toBeInTheDocument()
      expect(await screen.findByText('0/5 0:04.500 Splits')).toBeInTheDocument()

      await flushBarStep()
      await flushCompletionStep()
      await waitFor(() => expect(mockedMarkRankCompletionSeen).toHaveBeenCalledWith('tester', 23))
      await waitFor(() => expect(mockedMarkRankCompletionSeen).toHaveBeenCalledWith('tester', 24))
    })

    it('blocks on an unseen rank-up until the overlay is clicked', async () => {
      const event = makeRankUpEvent({ id: 30, threadUuid: 'thread-1', toRank: 'silver', toDivision: 1 })
      mockedGetRankReplayData.mockResolvedValue({
        data: { unseenCompletions: [], unseenRankUps: [event] },
      })
      mockedGetRankCounterProfile.mockResolvedValue({
        data: { ranks: [], challengeProgress: [], recentCompletions: [] },
      })

      renderPanel()

      expect(await screen.findByText(/rank/i)).toBeInTheDocument()
      expect(mockedMarkRankUpSeen).not.toHaveBeenCalled()
      // The rank-up itself is still blocked on the overlay click — sitewide (which has nothing
      // queued here) is free to refresh independently in the meantime, so this no longer
      // asserts getRankCounterProfile was never called at all.

      const overlay = screen.getByText(/rank/i).closest('div')!
      fireEvent.click(overlay)

      await waitFor(() => expect(mockedMarkRankUpSeen).toHaveBeenCalledWith('tester', 30))
      await waitFor(() => expect(mockedGetRankCounterProfile).toHaveBeenCalledWith('tester'))
    })

    it('requires a separate click for each of multiple consecutive unseen rank-ups', async () => {
      const first = makeRankUpEvent({ id: 40, threadUuid: 'thread-1', createdAt: 100, toRank: 'bronze', toDivision: 2 })
      const second = makeRankUpEvent({ id: 41, threadUuid: 'thread-1', createdAt: 200, toRank: 'bronze', toDivision: 3 })
      mockedGetRankReplayData.mockResolvedValue({
        data: { unseenCompletions: [], unseenRankUps: [first, second] },
      })
      mockedGetRankCounterProfile.mockResolvedValue({
        data: { ranks: [], challengeProgress: [], recentCompletions: [] },
      })

      renderPanel()

      await screen.findByText(/rank/i)
      fireEvent.click(screen.getByText(/rank/i).closest('div')!)
      await waitFor(() => expect(mockedMarkRankUpSeen).toHaveBeenCalledWith('tester', 40))

      expect(mockedMarkRankUpSeen).not.toHaveBeenCalledWith('tester', 41)
      await screen.findByText(/rank/i)
      fireEvent.click(screen.getByText(/rank/i).closest('div')!)
      await waitFor(() => expect(mockedMarkRankUpSeen).toHaveBeenCalledWith('tester', 41))

      await waitFor(() => expect(mockedGetRankCounterProfile).toHaveBeenCalledWith('tester'))
    })

    it('replays the same unseen completion again on remount if its animation never finished (pause/resume, not skip)', async () => {
      const unseenLog = makeLog({
        id: 50,
        challengeId: 'c1',
        target: 5,
        threadUuid: 'thread-1',
        completedAt: 100,
      })
      mockedGetRankReplayData.mockResolvedValue({
        data: { unseenCompletions: [{ ...unseenLog, chainKey: 'thread_counts:thread-1' }], unseenRankUps: [] },
      })
      mockedGetRankCounterProfile.mockResolvedValue({
        data: { ranks: [], challengeProgress: [], recentCompletions: [] },
      })

      const { unmount } = renderPanel()
      // Interrupt mid-bar-step, before markRankCompletionSeen ever fires.
      expect(await screen.findByText('5 Counts')).toBeInTheDocument()
      unmount()

      expect(mockedMarkRankCompletionSeen).not.toHaveBeenCalled()

      // getRankReplayData is mocked to keep returning the same still-unseen item (as the real
      // backend would, since it was never marked seen) — remounting must replay it again.
      renderPanel()
      expect(await screen.findByText('5 Counts')).toBeInTheDocument()
    })

    it('updates the sidebar/badge callback immediately on a live rank_updated event even while a replay is actively playing', async () => {
      const unseenLog = makeLog({
        id: 60,
        challengeId: 'c1',
        target: 5,
        threadUuid: 'thread-1',
        completedAt: 100,
      })
      mockedGetRankReplayData.mockResolvedValue({
        data: { unseenCompletions: [{ ...unseenLog, chainKey: 'thread_counts:thread-1' }], unseenRankUps: [] },
      })
      mockedGetRankCounterProfile.mockResolvedValue({
        data: { ranks: [], challengeProgress: [], recentCompletions: [] },
      })

      const { onThreadRankUpdated } = renderPanel()
      // Thread scope is still mid-replay (bar step showing) — its own live fetchRankData jump
      // has NOT happened yet, even though sitewide (nothing queued here) may have already
      // refreshed independently.
      expect(await screen.findByText('5 Counts')).toBeInTheDocument()

      const handler = (socket.on as jest.Mock).mock.calls.find((c) => c[0] === 'rank_updated')![1]

      await act(async () => {
        handler(makeDelta({ threadRank: makeRankRow({ threadUuid: 'thread-9' }) }))
        await Promise.resolve()
      })

      // Badge callback fires immediately, independent of replay still playing.
      await waitFor(() =>
        expect(onThreadRankUpdated).toHaveBeenCalledWith(expect.objectContaining({ 'thread-9': expect.any(Object) })),
      )
    })

    it('animates a chain step 0 -> 100% even when a prior chain step in the same replay had a different (larger) target', async () => {
      // Regression test: the bar step used to carry the PREVIOUS chain step's target over as
      // the "from" checkpoint for the next step, so if step 1's target (e.g. 5) happened to
      // equal or exceed step 2's own target, step 2's bar would compute as already at 100% and
      // pop in complete with no visible animation at all.
      const first = makeLog({ id: 71, challengeId: 'c1', target: 10, threadUuid: 'thread-1', completedAt: 100 })
      const second = makeLog({ id: 72, challengeId: 'c2', target: 5, threadUuid: 'thread-1', completedAt: 200 })
      mockedGetRankReplayData.mockResolvedValue({
        data: {
          unseenCompletions: [
            { ...first, chainKey: 'thread_counts:thread-1' },
            { ...second, chainKey: 'thread_counts:thread-1' },
          ],
          unseenRankUps: [],
        },
      })
      mockedGetRankCounterProfile.mockResolvedValue({
        data: { ranks: [], challengeProgress: [], recentCompletions: [] },
      })

      renderPanel()

      await screen.findByText('10 Counts')
      await flushBarStep()
      await flushCompletionStep()
      await waitFor(() => expect(mockedMarkRankCompletionSeen).toHaveBeenCalledWith('tester', 71))

      // Chain B's bar step: must show 0 / 5, not already at its target, at the moment it first mounts.
      await waitFor(() => expect(screen.getByText('0 / 5 Counts')).toBeInTheDocument())
    })

    it("animates an in-progress challenge's bar filling 0 -> its current progress the first time it is shown after replay catches up", async () => {
      mockedGetRankReplayData.mockResolvedValue({
        data: { unseenCompletions: [], unseenRankUps: [] },
      })
      const openChallenge = makeLog({
        id: 80,
        challengeId: 'c1',
        progress: 3,
        target: 10,
        threadUuid: 'thread-1',
        completedAt: null,
      })
      mockedGetRankCounterProfile.mockResolvedValue({
        data: { ranks: [], challengeProgress: [openChallenge], recentCompletions: [] },
      })

      renderPanel()
      await flushReplayHandoff()

      // Mounts at 0% first (entrance animation start point), not straight to 3/10.
      expect(await screen.findByText('0 / 10 Counts')).toBeInTheDocument()

      // After the entrance bar-fill duration, it settles on the real progress value.
      await act(() => new Promise((r) => setTimeout(r, 3200)))
      await waitFor(() => expect(screen.getByText('3 / 10 Counts')).toBeInTheDocument())
    })

    it('does not replay the entrance animation once entranceSeenAt is set (survives tab close/reopen)', async () => {
      mockedGetRankReplayData.mockResolvedValue({
        data: { unseenCompletions: [], unseenRankUps: [] },
      })
      // Same shape as a challenge whose entrance animation already played in an earlier
      // RankTabPanel mount (e.g. before the user switched tabs away and back, which unmounts
      // this whole component) — entranceSeenAt is now set server-side.
      const alreadySeenChallenge = makeLog({
        id: 81,
        challengeId: 'c1',
        progress: 3,
        target: 10,
        threadUuid: 'thread-1',
        completedAt: null,
        entranceSeenAt: Date.now(),
      })
      mockedGetRankCounterProfile.mockResolvedValue({
        data: { ranks: [], challengeProgress: [alreadySeenChallenge], recentCompletions: [] },
      })

      renderPanel()
      await flushReplayHandoff()

      // Mounts directly at the real progress value — no 0/10 entrance frame ever appears.
      expect(await screen.findByText('3 / 10 Counts')).toBeInTheDocument()
      expect(screen.queryByText('0 / 10 Counts')).not.toBeInTheDocument()
    })

    // Regression test for a real bug: markRankEntranceSeen used to fire only once the 3-second
    // entrance bar-fill animation finished. The Rank tab is a MUI TabPanel that unmounts this
    // whole component on every tab switch — trivially easy to do before 3 seconds are up — so an
    // interrupted view never persisted "seen" at all, and the entrance animation played again in
    // full on every subsequent reopen. It must now be marked seen the moment the decision to
    // animate is made (on mount here), not gated behind the animation ever completing.
    it('marks entranceSeenAt immediately on deciding to animate, not only once the animation finishes', async () => {
      mockedGetRankReplayData.mockResolvedValue({
        data: { unseenCompletions: [], unseenRankUps: [] },
      })
      const neverSeenChallenge = makeLog({
        id: 90,
        challengeId: 'c1',
        progress: 4,
        target: 10,
        threadUuid: 'thread-1',
        completedAt: null,
        entranceSeenAt: null,
      })
      mockedGetRankCounterProfile.mockResolvedValue({
        data: { ranks: [], challengeProgress: [neverSeenChallenge], recentCompletions: [] },
      })

      renderPanel()
      await flushReplayHandoff()

      // The entrance animation is still playing (well under its 3s duration) — confirm it
      // started at all — but markRankEntranceSeen must already have fired, not waited for it.
      expect(await screen.findByText(/\/ 10 Counts/)).toBeInTheDocument()
      expect(mockedMarkRankEntranceSeen).toHaveBeenCalledWith('tester', 90)
    })

    // Regression test for a second, related bug: a 0-progress challenge never has a bar-fill to
    // animate (shouldAnimateEntrance requires progress > 0), so entranceSeenAt was never marked
    // for it at all under the old logic — only the bar-fill's completion callback ever called
    // markRankEntranceSeen. That meant a freshly-assigned, still-at-0 challenge's one-time card
    // "pop in" mount animation (ChallengeCompletionWrapper's cardEnter, separate from the
    // bar-fill) replayed on literally every tab reopen forever, since nothing ever persisted
    // "seen" for it. It must now be marked seen immediately even with zero progress.
    it('marks entranceSeenAt immediately for a freshly-assigned challenge even at 0 progress', async () => {
      mockedGetRankReplayData.mockResolvedValue({
        data: { unseenCompletions: [], unseenRankUps: [] },
      })
      const freshZeroProgressChallenge = makeLog({
        id: 91,
        challengeId: 'c1',
        progress: 0,
        target: 10,
        threadUuid: 'thread-1',
        completedAt: null,
        entranceSeenAt: null,
      })
      mockedGetRankCounterProfile.mockResolvedValue({
        data: { ranks: [], challengeProgress: [freshZeroProgressChallenge], recentCompletions: [] },
      })

      renderPanel()
      await flushReplayHandoff()

      expect(await screen.findByText(/\/ 10 Counts/)).toBeInTheDocument()
      expect(mockedMarkRankEntranceSeen).toHaveBeenCalledWith('tester', 91)
    })
  })
})
