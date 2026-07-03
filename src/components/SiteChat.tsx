import { useContext, useEffect, useRef, useState } from 'react'
import { Box, IconButton, InputAdornment, Link, OutlinedInput, Paper, Typography, useTheme } from '@mui/material'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import CloseIcon from '@mui/icons-material/Close'
import SendIcon from '@mui/icons-material/Send'
import { UserContext } from '../utils/contexts/UserContext'
import { SocketContext } from '../utils/contexts/SocketContext'
import { getRecentCounts } from '../utils/api'
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const postHashRef = useRef(0)
  const lastSentRef = useRef(0)
  const [rateLimited, setRateLimited] = useState(false)

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

  // Subscribe to site_chat room and listen for new posts
  useEffect(() => {
    socket.emit('chat_watch')

    const postHandler = (data: { post: PostType; counter: Counter }) => {
      addCounterToCache(data.counter)
      setMessages((prev) => [...prev, data.post].slice(-MAX_MESSAGES))
    }
    const watcherHandler = (count: number) => setWatchers(count)
    const connectHandler = () => setSocketStatus('LIVE')
    const disconnectHandler = () => setSocketStatus('DISCONNECTED')

    socket.on('chat_post', postHandler)
    socket.on('chat_watcher_count', watcherHandler)
    socket.on('connect', connectHandler)
    socket.on('disconnect', disconnectHandler)
    if (socket.connected) setSocketStatus('LIVE')

    return () => {
      socket.off('chat_post', postHandler)
      socket.off('chat_watcher_count', watcherHandler)
      socket.off('connect', connectHandler)
      socket.off('disconnect', disconnectHandler)
    }
  }, [socket])

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
  }

  const lastMessage = messages[messages.length - 1]
  const lastAuthorCounter = lastMessage ? cachedCounters[lastMessage.authorUUID] : null
  const lastAuthor = lastAuthorCounter?.name ?? '…'
  const lastText = lastMessage?.comment || lastMessage?.rawText || ''

  const canWrite = canPost(counter)
  const bgColor = theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff'
  const borderColor = theme.palette.mode === 'dark' ? '#444' : '#ccc'

  if (superCollapsed) {
    return (
      <Paper
        elevation={4}
        onClick={() => { setSuperCollapsed(false); setExpanded(true) }}
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
          <Typography variant="body2" fontWeight={700} noWrap sx={{ flexShrink: 0, mr: 1 }}>
            Chat
          </Typography>
          {expanded && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1, flexShrink: 0 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: socketStatus === 'LIVE' ? 'success.light' : socketStatus === 'DISCONNECTED' ? 'error.light' : 'info.light',
                }}
              />
              {watchers !== null && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1 }}>
                  {watchers}
                </Typography>
              )}
            </Box>
          )}
          {!expanded && lastMessage && (
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', overflow: 'hidden', gap: 0.5, alignItems: 'center' }}>
              <Typography
                variant="caption"
                noWrap
                sx={{ color: lastAuthorCounter?.color || 'rgba(255,255,255,0.8)', flexShrink: 0, maxWidth: '50%', overflow: 'hidden', textOverflow: 'ellipsis' }}
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
            <IconButton size="small" sx={{ color: '#fff', p: 0 }} onClick={() => { setSuperCollapsed(true); setExpanded(false) }}>
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
              const text = msg.comment || msg.rawText || ''
              const displayName = author
                ? author.emoji
                  ? `${author.emoji} ${author.name} ${author.emoji}`
                  : author.name
                : '?'
              return (
                <Box key={msg.uuid} sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', lineHeight: 1.4 }}>
                  <Link
                    variant="caption"
                    underline="hover"
                    href={`/counter/${author?.username ?? ''}`}
                    sx={{ color: author?.color || 'text.secondary', whiteSpace: 'nowrap' }}
                  >
                    {displayName}:
                  </Link>
                  <Typography variant="caption" sx={{ color: 'text.primary', wordBreak: 'break-word' }}>
                    {text}
                  </Typography>
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
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
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
