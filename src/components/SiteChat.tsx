import { useContext, useEffect, useRef, useState } from 'react'
import { Badge, Box, IconButton, InputAdornment, Link, OutlinedInput, Paper, Tooltip, Typography, useTheme } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import CloseIcon from '@mui/icons-material/Close'
import SendIcon from '@mui/icons-material/Send'
import { UserContext } from '../utils/contexts/UserContext'
import { SocketContext } from '../utils/contexts/SocketContext'
import { getRecentCounts, loadNewerCounts } from '../utils/api'
import { addCounterToCache, cachedCounters } from '../utils/helpers'
import { Counter, PostType } from '../utils/types'

const THREAD = 'no_counting'
const MAX_MESSAGES = 50
const EXPANDED_HEIGHT = 360

const canPost = (counter?: Counter) => {
  if (!counter) return false
  const roles = counter.roles
  return roles.includes('counter') && !roles.includes('banned') && !roles.includes('muted')
}

const canDelete = (counter: Counter | undefined, authorUUID: string) => {
  if (!counter) return false
  if (counter.uuid === authorUUID) return true
  return counter.roles.includes('admin') || counter.roles.includes('moderator')
}

export const SiteChat = () => {
  const { user, counter, loading } = useContext(UserContext)
  const socket = useContext(SocketContext)
  const theme = useTheme()

  const [expanded, setExpanded] = useState(false)
  const [superCollapsed, setSuperCollapsed] = useState(false)
  const [watchers, setWatchers] = useState<number | null>(null)
  const [socketStatus, setSocketStatus] = useState<'CONNECTING' | 'LIVE' | 'DISCONNECTED'>('CONNECTING')
  const [messages, setMessages] = useState<PostType[]>([])
  const [inputValue, setInputValue] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [lastReadUUID, setLastReadUUID] = useState<string | null>(null)
  const [windowFocused, setWindowFocused] = useState(document.hasFocus())
  const [unreadMarkerUUID, setUnreadMarkerUUID] = useState<string | null>(null)
  const markerSetRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const postHashRef = useRef(0)
  const lastSentRef = useRef(0)
  const [rateLimited, setRateLimited] = useState(false)
  // Mirrors `messages` so the socket event handlers (registered once per socket instance, not
  // re-registered on every message) always see the latest uuid instead of whatever was captured
  // in their closure at registration time — needed as the backfill cursor on reconnect.
  const messagesRef = useRef<PostType[]>([])
  messagesRef.current = messages
  // True only after the socket has connected at least once — distinguishes the initial
  // 'connect' (nothing to backfill, getRecentCounts on mount already covers it) from a real
  // reconnect after a drop (where messages sent during the gap need to be fetched).
  const hasConnectedOnceRef = useRef(false)
  const [backfilling, setBackfilling] = useState(false)

  // Load initial messages
  useEffect(() => {
    if (loading) return
    setChatLoading(true)
    getRecentCounts(THREAD, null, false)
      .then(({ data }) => {
        if (data.recentCounts) {
          const sorted = [...data.recentCounts].reverse()
          setMessages(sorted.slice(-MAX_MESSAGES))
          for (const c of data.counters || []) addCounterToCache(c)
        }
      })
      .catch(() => {})
      .finally(() => setChatLoading(false))
  }, [loading])

  // Subscribe to site_chat room and listen for new posts. chat_watch is (re-)emitted from
  // inside connectHandler below rather than unconditionally here — see its comment for why a
  // reconnect needs it too, not just the initial mount.
  useEffect(() => {
    // Fetches any messages posted while the socket was disconnected, using the last message
    // currently held as the cursor. Merged in de-duped by uuid (a chat_post for the gap's
    // final message could race this fetch and arrive from both places). Loops on loadedNewest
    // in case the gap was larger than one page.
    const backfillAfterReconnect = async () => {
      const cursorUUID = messagesRef.current[messagesRef.current.length - 1]?.uuid
      if (!cursorUUID) return
      setBackfilling(true)
      try {
        let cursor = cursorUUID
        for (let page = 0; page < 10; page++) {
          const { data } = await loadNewerCounts(THREAD, cursor, MAX_MESSAGES, true)
          const newCounts = data.counts || []
          if (newCounts.length === 0) break
          for (const c of data.counters || []) addCounterToCache(c)
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => m.uuid))
            const merged = [...prev, ...newCounts.filter((m) => !seen.has(m.uuid))]
            return merged.slice(-MAX_MESSAGES)
          })
          cursor = newCounts[newCounts.length - 1].uuid
          if (data.loadedNewest) break
        }
      } catch {
        // Swallow — the live socket feed will still deliver anything posted from here on;
        // worst case this particular gap stays unfilled rather than crashing the widget.
      } finally {
        setBackfilling(false)
      }
    }

    const postHandler = (data: { post: PostType; counter: Counter }) => {
      addCounterToCache(data.counter)
      setMessages((prev) => {
        if (prev.some((m) => m.uuid === data.post.uuid)) return prev
        return [...prev, data.post].slice(-MAX_MESSAGES)
      })
    }
    const deleteHandler = (post: PostType) => {
      setMessages((prev) => prev.map((m) => (m.uuid === post.uuid ? post : m)))
    }
    const watcherHandler = (count: number) => setWatchers(count)
    const connectHandler = () => {
      setSocketStatus('LIVE')
      // A reconnect gets a brand-new socket.io connection server-side, so room membership
      // (site_chat) from before the drop is gone — without re-emitting chat_watch here, the
      // client would stay "connected" but silently stop receiving chat_post broadcasts
      // forever. Safe to re-emit on the very first connect too (join is idempotent).
      socket.emit('chat_watch')
      if (hasConnectedOnceRef.current) {
        backfillAfterReconnect()
      }
      hasConnectedOnceRef.current = true
    }
    const disconnectHandler = () => setSocketStatus('DISCONNECTED')
    const connectErrorHandler = () => setSocketStatus('DISCONNECTED')
    const lastReadHandler = (uuid: string | null) => setLastReadUUID(uuid)

    socket.on('chat_post', postHandler)
    socket.on('deleteComment', deleteHandler)
    socket.on('chat_watcher_count', watcherHandler)
    socket.on('connect', connectHandler)
    socket.on('disconnect', disconnectHandler)
    socket.on('connect_error', connectErrorHandler)
    socket.on('chat_last_read', lastReadHandler)
    if (socket.connected) {
      // Socket was already connected before this effect ran (e.g. SiteChat remounted while the
      // underlying socket stayed alive) — 'connect' won't fire again, so join site_chat here
      // directly rather than relying on connectHandler.
      setSocketStatus('LIVE')
      socket.emit('chat_watch')
      hasConnectedOnceRef.current = true
    }

    return () => {
      socket.off('chat_post', postHandler)
      socket.off('deleteComment', deleteHandler)
      socket.off('chat_watcher_count', watcherHandler)
      socket.off('connect', connectHandler)
      socket.off('disconnect', disconnectHandler)
      socket.off('connect_error', connectErrorHandler)
      socket.off('chat_last_read', lastReadHandler)
    }
  }, [socket])

  // Track window focus
  useEffect(() => {
    const onFocus = () => setWindowFocused(true)
    const onBlur = () => setWindowFocused(false)
    window.addEventListener('focus', onFocus)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  // Mark as read when expanded + focused; set unread marker once on first focus
  useEffect(() => {
    if (!expanded || !windowFocused || !user || messages.length === 0) return
    const latestUUID = messages[messages.length - 1].uuid
    // Set the visual marker once — only if there are actually unread messages
    if (!markerSetRef.current) {
      markerSetRef.current = true
      const hasUnread = lastReadUUID !== null && messages.some((m) => m.uuid > lastReadUUID)
      setUnreadMarkerUUID(hasUnread ? lastReadUUID : null)
    }
    if (latestUUID === lastReadUUID) return
    setLastReadUUID(latestUUID)
    socket.emit('chat_mark_read', latestUUID)
  }, [expanded, windowFocused, messages, user])

  // Scroll to bottom when expanded or new message arrives
  useEffect(() => {
    if (expanded) {
      messagesEndRef.current?.scrollIntoView()
    }
  }, [messages, expanded])

  const handleSend = () => {
    const text = inputValue.trim()
    if (!text || !counter) return
    const now = Date.now()
    if (now - lastSentRef.current < 500) return
    lastSentRef.current = now
    const post_hash = `chat_${now}_${postHashRef.current++}`
    socket.emit('post', { thread_name: THREAD, text, post_hash })
    setInputValue('')
    setRateLimited(true)
    setTimeout(() => setRateLimited(false), 500)
    // mark all current messages as read on send
    const latestUUID = messages[messages.length - 1]?.uuid
    if (latestUUID) {
      setLastReadUUID(latestUUID)
      socket.emit('chat_mark_read', latestUUID)
    }
  }

  const lastMessage = messages[messages.length - 1]
  const lastAuthorCounter = lastMessage ? cachedCounters[lastMessage.authorUUID] : null
  const lastAuthor = lastAuthorCounter?.name ?? '…'
  const lastText = lastMessage?.comment || lastMessage?.rawText || ''

  const unreadCount = user ? (lastReadUUID === null ? messages.length : messages.filter((m) => m.uuid > lastReadUUID).length) : 0

  const canWrite = canPost(counter)
  const bgColor = theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff'
  const borderColor = theme.palette.mode === 'dark' ? '#444' : '#ccc'

  if (superCollapsed) {
    return (
      <Paper
        elevation={4}
        onClick={() => {
          setSuperCollapsed(false)
          setExpanded(true)
        }}
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 0,
          zIndex: 1400,
          cursor: 'pointer',
          borderRadius: '6px 0 0 6px',
          bgcolor: theme.palette.primary.main,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          px: 0.5,
          py: 1,
          boxShadow: '-2px 2px 6px rgba(0,0,0,0.3)',
        }}
      >
        <ChevronLeftIcon fontSize="small" />
      </Paper>
    )
  }

  return (
    <Paper
      elevation={6}
      sx={{
        position: 'fixed',
        bottom: 0,
        right: { xs: 8, sm: 24 },
        width: { xs: 'calc(100vw - 16px)', sm: 320 },
        zIndex: 1400,
        borderRadius: '8px 8px 0 0',
        border: `1px solid ${borderColor}`,
        borderBottom: 'none',
        bgcolor: bgColor,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header / collapsed bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          py: 0.75,
          bgcolor: theme.palette.primary.main,
          color: '#fff',
          userSelect: 'none',
          minHeight: 36,
        }}
      >
        <Box
          onClick={() => setExpanded((e) => !e)}
          sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, cursor: 'pointer' }}
        >
          <Badge
            badgeContent={unreadCount > 50 ? '50+' : unreadCount}
            color="error"
            invisible={expanded || unreadCount === 0}
            sx={{ flexShrink: 0, mr: 1 }}
          >
            <Typography variant="body2" fontWeight={700} noWrap>
              Chat
            </Typography>
          </Badge>
          {expanded && (
            <Tooltip
              title={
                socketStatus === 'LIVE'
                  ? backfilling
                    ? 'Connected — loading missed messages…'
                    : 'Connected'
                  : socketStatus === 'DISCONNECTED'
                    ? 'Disconnected — reconnecting…'
                    : 'Connecting…'
              }
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1, flexShrink: 0 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor:
                      socketStatus === 'LIVE' ? 'success.light' : socketStatus === 'DISCONNECTED' ? 'error.light' : 'info.light',
                    flexShrink: 0,
                  }}
                />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1, whiteSpace: 'nowrap' }}>
                  {socketStatus === 'LIVE'
                    ? backfilling
                      ? 'syncing…'
                      : watchers !== null
                        ? watchers
                        : ''
                    : socketStatus === 'DISCONNECTED'
                      ? 'reconnecting…'
                      : 'connecting…'}
                </Typography>
              </Box>
            </Tooltip>
          )}
          {!expanded && lastMessage && (
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', overflow: 'hidden', gap: 0.5, alignItems: 'center' }}>
              <Typography
                variant="caption"
                noWrap
                sx={{
                  color: lastAuthorCounter?.color || 'rgba(255,255,255,0.8)',
                  flexShrink: 0,
                  maxWidth: '50%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {lastAuthor}:
              </Typography>
              <Typography
                variant="caption"
                noWrap
                sx={{ color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {lastText}
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          {expanded && (
            <IconButton
              size="small"
              sx={{ color: '#fff', p: 0 }}
              onClick={() => {
                setSuperCollapsed(true)
                setExpanded(false)
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton size="small" sx={{ color: '#fff', p: 0 }} onClick={() => setExpanded((e) => !e)}>
            {expanded ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>

      {/* Expanded body */}
      {expanded && (
        <>
          <Box
            ref={listRef}
            sx={{
              height: EXPANDED_HEIGHT,
              overflowY: 'auto',
              px: 1,
              py: 0.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.25,
            }}
          >
            {chatLoading && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Loading…
              </Typography>
            )}
            {!chatLoading && messages.length === 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                No messages yet.
              </Typography>
            )}
            {messages.map((msg) => {
              const author = cachedCounters[msg.authorUUID]
              const isDeleted = !!msg.isCommentDeleted
              const text = isDeleted ? '[deleted]' : msg.comment || msg.rawText || ''
              const displayName = author ? (author.emoji ? `${author.emoji} ${author.name} ${author.emoji}` : author.name) : '?'
              const showMarker =
                unreadMarkerUUID !== null && msg.uuid > unreadMarkerUUID && messages.find((m) => m.uuid > unreadMarkerUUID) === msg
              const showDelete = !isDeleted && canDelete(counter, msg.authorUUID)
              return (
                <Box key={msg.uuid}>
                  {showMarker && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 0.5 }}>
                      <Box sx={{ flex: 1, height: '1px', bgcolor: 'error.main' }} />
                      <Typography variant="caption" sx={{ color: 'error.main', whiteSpace: 'nowrap', fontSize: 10 }}>
                        new
                      </Typography>
                      <Box sx={{ flex: 1, height: '1px', bgcolor: 'error.main' }} />
                    </Box>
                  )}
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 0.5,
                      flexWrap: 'wrap',
                      lineHeight: 1.4,
                      alignItems: 'flex-start',
                      '&:hover .delete-btn': { opacity: 1 },
                    }}
                  >
                    <Link
                      variant="caption"
                      underline="hover"
                      href={`/counter/${author?.username ?? ''}`}
                      sx={{ color: isDeleted ? 'text.disabled' : author?.color || 'text.secondary', whiteSpace: 'nowrap' }}
                    >
                      {displayName}:
                    </Link>
                    <Typography
                      variant="caption"
                      sx={{
                        color: isDeleted ? 'text.disabled' : 'text.primary',
                        wordBreak: 'break-word',
                        fontStyle: isDeleted ? 'italic' : 'normal',
                      }}
                    >
                      {text}
                    </Typography>
                    {showDelete && (
                      <Tooltip title="Delete" placement="top">
                        <IconButton
                          className="delete-btn"
                          size="small"
                          onClick={() => socket.emit('deleteComment', { uuid: msg.uuid })}
                          sx={{ opacity: 0, transition: 'opacity 0.1s', p: 0, ml: 'auto', color: 'error.main' }}
                        >
                          <DeleteIcon sx={{ fontSize: 13 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              )
            })}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input */}
          {user && canWrite && (
            <Box sx={{ px: 1, pb: 1, pt: 0.5 }}>
              <OutlinedInput
                size="small"
                fullWidth
                placeholder="Message…"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                sx={{ fontSize: 13 }}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleSend} disabled={!inputValue.trim() || rateLimited}>
                      <SendIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                }
              />
            </Box>
          )}
        </>
      )}
    </Paper>
  )
}
