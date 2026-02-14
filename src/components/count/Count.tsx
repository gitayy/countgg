import {
  Box,
  CardMedia,
  CardContent,
  Typography,
  Grid,
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Link,
  Popover,
  useTheme,
  Table,
  Modal,
  Avatar,
  CardHeader,
} from '@mui/material'
import { Component, ErrorInfo, Fragment, ReactNode, memo, useContext, useRef, useState } from 'react'
import CggLogo2 from '../../assets/emotes/gg.png'
import {
  cachedCounters,
  convertMsToFancyTime,
  customBlockquotePlugin,
  defaultCounter,
  EmojiTest,
  fancyTime2,
  formatDate,
  formatDateWithMilliseconds,
  formatTimeDiff,
  getInterpolatedReplyColor,
  getReplyColorName,
  transformMarkdown,
} from '../../utils/helpers'
import { Counter } from '../../utils/types'
import DeleteIcon from '@mui/icons-material/Delete'
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS'
// import { SentimentVerySatisfied } from '@mui/icons-material';
import SentimentVerySatisfied from '@mui/icons-material/SentimentVerySatisfied'
import { useLocation, useNavigate } from 'react-router-dom'
import Picker from '@emoji-mart/react' // works in @latest
import { custom_emojis } from '../../utils/custom_emojis'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import data from '@emoji-mart/data/sets/14/twitter.json'
import { UserContext } from '../../utils/contexts/UserContext'
import ErrorBoundary from '../ErrorBoundary'

const Count = memo((props: any) => {
  let maybeSpace
  let countContentCopy = props.post.countContent
  const { user, counter, preferences } = useContext(UserContext)

  if (props.post.countContent && props.post.rawText.includes(props.post.countContent)) {
    const index = props.post.rawText.indexOf(props.post.countContent) + props.post.countContent.length
    if (props.post.rawText[index] === ' ') {
      maybeSpace = ' '
    }
  }

  if (
    user &&
    preferences && preferences.pref_standardize_format != 'Disabled' &&
    props.thread &&
    ![
      'binary',
      'ternary',
      'quaternary',
      'quinary',
      'senary',
      'septenary',
      'octonary',
      'nonary',
      'hexadecimal',
      'alphanumerics',
      'base62',
      'base64',
      'coordinates',
      'coordinates_tow',
      'wave',
      'mayan',
      '2048',
    ].includes(props.thread.validationType) &&
    props.post.countContent &&
    props.post.rawCount
  ) {
    const format = preferences.pref_standardize_format
    switch (format) {
      case 'No Separator':
        countContentCopy = props.post.rawCount
        break
      case 'Commas':
        countContentCopy = props.post.rawCount.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        break
      case 'Periods':
        countContentCopy = props.post.rawCount.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
        break
      case 'Spaces':
        countContentCopy = props.post.rawCount.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
        break
      default:
        break
    }
  }

  const navigate = useNavigate()

  const theme = useTheme()
  const location = useLocation()


  // build the URL
  const url = `/thread/${props.thread ? props.thread.name : ''}/${props.post.uuid}`
  // isSameUuid
  //   ? location.pathname
  //   : hasPostFinder && props.thread ? `${location.pathname.replace(/\/+$/, '').replace('post-finder', `thread/${props.thread.name}`)}/${props.post.uuid}` : `${location.pathname.replace(/\/+$/, '')}/${props.post.uuid}`;

  const uncachedCounter: Counter = defaultCounter(props.post.authorUUID)

  const renderedCounter: Counter = props.renderedCounter || uncachedCounter
  const roundedLatency = Math.round(Number(props.post.latency))
  const roundedProcessingLatency = Math.round(Number(props.post.processingLatency))
  const showProcessingLatency =
    roundedLatency >= 100 &&
    Number.isFinite(roundedProcessingLatency)
  const latencyDisplayText = showProcessingLatency
    ? `${roundedLatency}ms, ${roundedProcessingLatency}ms PL`
    : `${roundedLatency}ms`
  const showHoverProcessingSuffix =
    !showProcessingLatency && Number.isFinite(roundedProcessingLatency)
  const latencyTooltip = Number.isFinite(roundedProcessingLatency)
    ? `End-to-end latency (client send to receive): ${roundedLatency}ms. Processing latency (server receive to emit): ${roundedProcessingLatency}ms.`
    : 'Time it took, from sending, for this post to be received from the server.'

  // const hoursSinceLastCount = Math.floor(props.post.timeSinceLastCount / 3600000)
  // const minutesSinceLastCount = Math.floor(props.post.timeSinceLastCount / 60000) % 60
  // const secondsSinceLastCount = Math.floor(props.post.timeSinceLastCount / 1000) % 60
  // const msSinceLastCount = Math.round(props.post.timeSinceLastCount) % 1000
  // const paddedMsSinceLastCount = msSinceLastCount.toString().padStart(3, '0')

  const roundedTimeSinceLastPost = Math.round(props.post.timeSinceLastPost);
  const hoursSinceLastPost = Math.floor(roundedTimeSinceLastPost / 3600000)
  const minutesSinceLastPost = Math.floor(roundedTimeSinceLastPost / 60000) % 60
  const secondsSinceLastPost = Math.floor(roundedTimeSinceLastPost / 1000) % 60
  const msSinceLastPost = roundedTimeSinceLastPost % 1000
  const paddedMsSinceLastPost = msSinceLastPost.toString().padStart(3, '0')
  const fancyMs = convertMsToFancyTime(Math.round(props.post.timeSinceLastPost))
  const fancyMs2 = fancyTime2(0, Math.round(props.post.timeSinceLastPost), true)

  const isRainbow = renderedCounter.rainbow === roundedTimeSinceLastPost;

  const [action, setAction] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const handleConfirm = () => {
    // Perform the action based on the button that was clicked
    if (action === 'delete') {
      handleDeleteComment()
      setOpen(false)
    } else if (action === 'strike') {
      setOpen(false)
    }
  }

  const replyTimeColor = getReplyColorName(
    props.post.timeSinceLastPost,
    user && preferences && preferences.pref_reply_time_interval !== undefined ? preferences.pref_reply_time_interval : undefined,
  )

  const newReplyTimeColor = getInterpolatedReplyColor(
    props.post.timeSinceLastPost,
    (theme.palette.mode === 'dark' && (user && preferences ? preferences.pref_night_mode_colors === 'Dark' : true)),
    user && preferences && preferences.pref_reply_time_interval !== undefined ? preferences.pref_reply_time_interval : undefined,    
  )

  function handleDeleteComment() {
    props.socket.emit('deleteComment', { uuid: props.post.uuid })
  }

  const anchorRef = useRef(null)

  const [expanded, setExpanded] = useState(
    user && preferences && preferences.pref_hide_stricken === 'Minimize' && props.post.stricken && !props.post.hasComment ? false : true,
  )

  const handleExpand = () => {
    setExpanded(!expanded)
  }

  const [pickerOpen, setPickerOpen] = useState(false)
  function handleEmojiSelect(emoji) {
    props.socket.emit(`updateReactions`, { id: emoji.id, post_uuid: props.post.uuid })
    setPickerOpen(false)
  }

  const components = {
    p: 'span' as any,
    // blockquote: ({ children }) => <>&gt;{children}</>,
    li: ({ children }) => <li style={{ whiteSpace: 'initial' }}>{children}</li>,
    code: ({ children }) => {
      return Object.keys(data.emojis).includes((children[0] as string).toLowerCase()) ? (
        EmojiTest({ id: (children[0] as string).toLowerCase(), size: 24, set: 'twitter' })
      ) : (
        <code>{children}</code>
      )
    },
  }
  if (user && preferences && preferences.pref_post_style == 'Minimal') {
    return (
      <>
        {user && preferences && preferences.pref_hide_stricken === 'Minimize' && props.post.stricken && !props.post.hasComment && (
          <div
            className="minimized-post-toggler"
            onClick={() => handleExpand()}
            style={{ cursor: 'pointer', userSelect: 'none', marginLeft: '5px' }}
          >
            {expanded ? `[-]` : `[+]`} Show Hidden Post
          </div>
        )}
        <div
          className={`count countDesktop ${props.contextRef && 'highlighted'}`}
          style={{
            display: expanded ? 'block' : 'none',
            paddingLeft: 2,
            paddingRight: 2,
            boxSizing: 'border-box',
            wordWrap: 'break-word',
            filter: props.post.stricken && user && preferences && preferences.pref_custom_stricken == 'Inverse' ? 'invert(1)' : '',
            opacity: props.post.stricken && user && preferences ? preferences.pref_stricken_count_opacity : 1,
            border:
              props.mostRecentCount && user && preferences && preferences.pref_highlight_last_count
                ? `1px solid ${preferences.pref_highlight_last_count_color}`
                : '1px solid transparent',
            background:
              props.mostRecentCount && user && preferences && preferences.pref_highlight_last_count
                ? `${preferences.pref_highlight_last_count_color}1c`
                : props.post.stricken && user && preferences && preferences.pref_custom_stricken != 'Disabled'
                  ? preferences.pref_strike_color
                  : 'initial',
          }}
        >
          <span className={isRainbow ? "rainbow-text" : undefined} style={{ color: renderedCounter.color }}>{renderedCounter.name}</span>
          &nbsp;
          <span style={{ textDecoration: props.post.stricken ? 'line-through' : 'none' }}>{countContentCopy}</span>
          {maybeSpace}
          {props.post.comment && props.post.comment.startsWith('\n') ? `\u00A0${props.post.comment}` : props.post.comment}
        </div>
      </>
    )
  } else if (user && preferences && preferences.pref_post_style == 'LC') {
    return (
      <>
        {user && preferences && preferences.pref_hide_stricken === 'Minimize' && props.post.stricken && !props.post.hasComment && (
          <Typography
            className="minimized-post-toggler"
            variant="body2"
            onClick={() => handleExpand()}
            sx={{ cursor: 'pointer', userSelect: 'none', marginLeft: '5px' }}
          >
            {expanded ? `[-]` : `[+]`} Show Hidden Post
          </Typography>
        )}
        <Box
          ref={props.contextRef}
          className={`count countDesktop ${props.contextRef && 'highlighted'}`}
          sx={{
            display: expanded ? 'block' : 'none',
            pl: 2,
            pr: 2,
            boxSizing: 'border-box',
            wordWrap: 'break-word',
            filter: props.post.stricken && user && preferences && preferences.pref_custom_stricken == 'Inverse' ? 'invert(1)' : '',
            opacity: props.post.stricken && user && preferences ? preferences.pref_stricken_count_opacity : 1,
            border:
              props.mostRecentCount && user && preferences && preferences.pref_highlight_last_count
                ? `1px solid ${preferences.pref_highlight_last_count_color}`
                : '1px solid transparent',
            background:
              props.mostRecentCount && user && preferences && preferences.pref_highlight_last_count
                ? `${preferences.pref_highlight_last_count_color}1c`
                : props.post.stricken && user && preferences && preferences.pref_custom_stricken != 'Disabled'
                  ? preferences.pref_strike_color
                  : 'initial',
          }}
        >
          <Box sx={{}}>
            <Grid container>
              <Grid item xs={4}>
                <Grid container sx={{ display: 'flex' }}>
                  <Grid item xs={12} sx={{}}>
                    <Grid container sx={{ width: '95%' }}>
                      <Grid
                        item
                        xs={12}
                        sx={{
                          color: 'text.primary',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                        }}
                      >
                        <Link
                          fontSize={9}
                          onClick={(e) => {
                            e.preventDefault()
                            navigate(url)
                          }}
                          href={url}
                          underline={'hover'}
                          sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textAlign: 'right' }}
                          variant="caption"
                          color="textSecondary"
                        >
                          {props.thread && props.thread.name === 'bars'
                            ? formatDateWithMilliseconds(parseInt(props.post.timestamp))
                            : formatDate(parseInt(props.post.timestamp))}{' '}
                          {props.post.latency && (
                            <>
                              {' '}
                              (
                                <Typography
                                  component={'span'}
                                  fontSize={9}
                                  sx={{
                                    width: 'fit-content',
                                    color: 'text.secondary',
                                    '&:hover .plHoverSuffix': {
                                      maxWidth: 160,
                                      opacity: 1,
                                    },
                                  }}
                                  title={latencyTooltip}
                                  style={{ borderBottom: '1px dotted grey', borderRadius: '1px', cursor: 'help', position: 'relative' }}
                                >
                                  {latencyDisplayText}
                                  {showHoverProcessingSuffix && (
                                    <Box
                                      component="span"
                                      className="plHoverSuffix"
                                      sx={{
                                        maxWidth: 0,
                                        opacity: 0,
                                        overflow: 'hidden',
                                        display: 'inline-block',
                                        whiteSpace: 'nowrap',
                                        verticalAlign: 'bottom',
                                        transition: 'max-width 0.18s ease, opacity 0.18s ease',
                                      }}
                                    >
                                      {`, ${roundedProcessingLatency}ms PL`}
                                    </Box>
                                  )}
                                </Typography>
                              )
                            </>
                          )}
                        </Link>
                        <Box
                          component={'div'}
                          title={`${convertMsToFancyTime(Math.round(props.post.timeSinceLastCount))} since last count`}
                          sx={{
                            color:
                              user && preferences && preferences.pref_night_mode_colors && preferences.pref_night_mode_colors !== 'Default'
                                ? preferences.pref_night_mode_colors === 'Light'
                                  ? '#000000de'
                                  : '#ffffffde'
                                : 'text.primary',
                            textAlign: 'right',
                            bgcolor: `${replyTimeColor}.${theme.palette.mode}`,
                          }}
                        >
                          {hoursSinceLastPost > 0 ? (
                            <Typography fontFamily={'Verdana'} component="span" fontSize={12}>
                              {hoursSinceLastPost}
                              <Typography fontFamily={'Verdana'} component="span" fontSize={12}>
                                h
                              </Typography>
                            </Typography>
                          ) : null}
                          {minutesSinceLastPost > 0 || hoursSinceLastPost > 0 ? (
                            <Typography fontFamily={'Verdana'} component="span" fontSize={12}>
                              {minutesSinceLastPost}
                              <Typography fontFamily={'Verdana'} component="span" fontSize={12}>
                                m
                              </Typography>
                            </Typography>
                          ) : null}
                          {secondsSinceLastPost > 0 || minutesSinceLastPost > 0 || hoursSinceLastPost > 0 ? (
                            <Typography fontFamily={'Verdana'} component="span" fontSize={12}>
                              {secondsSinceLastPost}
                              <Typography fontFamily={'Verdana'} component="span" fontSize={12}>
                                s
                              </Typography>
                            </Typography>
                          ) : null}
                          <Typography fontFamily={'Verdana'} component="span" fontSize={12}>
                            {props.post.timeSinceLastPost > 999 ? paddedMsSinceLastPost : msSinceLastPost}
                            <Typography fontFamily={'Verdana'} component="span" fontSize={12}>
                              ms
                            </Typography>
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                  <CardContent
                    sx={{
                      maxWidth: 'fit-content',
                      flex: '1 0 auto',
                      p: 0,
                      pb: 0,
                      overflowWrap: 'anywhere',
                      '&:last-child': { pb: '0px' },
                    }}
                  >
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'end' }}>
                      <Typography
                        component="span"
                        variant="body1"
                        fontFamily={'Verdana'}
                        fontSize={14}
                        color={'text.primary'}
                        sx={{ whiteSpace: 'pre-wrap', mr: 1 }}
                      >
                        <span style={{ textDecoration: props.post.stricken ? 'line-through' : 'none' }}>{countContentCopy}</span>
                        {maybeSpace}
                        {props.post.comment && (
                          // <>{props.post.comment.startsWith('\n')
                          // ? `\u00A0${props.post.comment}`
                          // : props.post.comment}</>
                          // <ErrorBoundary comment={props.post.comment}>
                          <ReactMarkdown
                            children={
                              props.post.comment.startsWith('\n')
                                ? `\u00A0${transformMarkdown(props.post.comment)}`
                                : transformMarkdown(props.post.comment)
                            }
                            components={components}
                            remarkPlugins={[remarkGfm]}
                          />
                          // </ErrorBoundary>
                        )}
                        {props.post.isCommentDeleted && (
                          <Typography
                            fontFamily={'Verdana'}
                            fontSize={14}
                            component={'span'}
                            sx={{ width: 'fit-content', p: 0.5, bgcolor: 'lightgray', color: 'black' }}
                          >
                            [deleted]
                          </Typography>
                        )}
                      </Typography>
                      <Typography fontSize={13} fontFamily={'Verdana'} component="span">
                        <Link
                          underline="hover"
                          sx={{
                            textDecoration: renderedCounter.roles.includes('banned') ? 'line-through' : 'none',
                            fontStyle: renderedCounter.roles.includes('muted') ? 'italic' : 'normal',
                          }}
                          className={isRainbow ? "rainbow-text" : undefined}
                          color={renderedCounter.color}
                          onClick={(e) => {
                            e.preventDefault()
                            navigate(
                              `/counter/${cachedCounters[props.post.authorUUID] ? cachedCounters[props.post.authorUUID].username : props.post.authorUUID}`,
                            )
                          }}
                          href={`/counter/${cachedCounters[props.post.authorUUID] ? cachedCounters[props.post.authorUUID].username : props.post.authorUUID}`}
                        >
                          {renderedCounter.emoji
                            ? `${renderedCounter.emoji} ${renderedCounter.name} ${renderedCounter.emoji}`
                            : renderedCounter.name}
                        </Link>
                        &nbsp;
                      </Typography>
                    </Box>
                    {Object.entries(props.post.reactions).length > 0 && (
                      <Box sx={{ display: 'inline-flex', flexWrap: 'wrap' }}>
                        {props.post.reactions &&
                          Object.entries(props.post.reactions).map((reaction: [string, unknown]) => {
                            if (counter && reaction[1] && (reaction[1] as string[]).includes(counter.uuid)) {
                              return (
                                <Box
                                  key={reaction[0]}
                                  onClick={() => {
                                    props.socket.emit(`updateReactions`, { id: reaction[0], post_uuid: props.post.uuid })
                                  }}
                                  component={'div'}
                                  sx={{
                                    background: '#6ab3ff82',
                                    cursor: 'pointer',
                                    paddingTop: '6px',
                                    marginRight: '5px',
                                    paddingLeft: '5px',
                                    paddingRight: '5px',
                                    gap: '8px',
                                    alignItems: 'center',
                                    height: '30px',
                                    display: 'inline-flex',
                                    border: '1px solid #3c3cff82',
                                    borderRadius: '10px',
                                  }}
                                >
                                  {EmojiTest({ id: reaction[0], size: 24, set: 'twitter' })} {(reaction[1] as string[]).length}
                                </Box>
                              )
                            } else {
                              return (
                                <Box
                                  key={reaction[0]}
                                  onClick={() => {
                                    props.socket.emit(`updateReactions`, { id: reaction[0], post_uuid: props.post.uuid })
                                  }}
                                  component={'div'}
                                  sx={{
                                    background: '#afafaf21',
                                    cursor: 'pointer',
                                    paddingTop: '6px',
                                    marginRight: '5px',
                                    paddingLeft: '5px',
                                    paddingRight: '5px',
                                    gap: '8px',
                                    alignItems: 'center',
                                    height: '30px',
                                    display: 'inline-flex',
                                    border: '1px solid #3c3cff82',
                                    borderRadius: '10px',
                                  }}
                                >
                                  {EmojiTest({ id: reaction[0], size: 24, set: 'twitter' })} {(reaction[1] as string[]).length}
                                </Box>
                              )
                            }
                          })}
                      </Box>
                    )}
                  </CardContent>
                </Box>
              </Grid>
              <Grid item xs={2} lg={2}>
                <Box ref={anchorRef}></Box>
                {counter && (
                  <Box className="countActionsDesktop" sx={{ display: 'none', justifyContent: 'end' }}>
                    <SentimentVerySatisfied
                      sx={{ cursor: 'pointer', mr: 1 }}
                      color="action"
                      fontSize="small"
                      aria-label="Reaction"
                      onClick={() => {
                        setPickerOpen(!pickerOpen)
                      }}
                    />
                    {props.post.isCount &&
                      props.thread &&
                      props.thread.autoValidated === false &&
                      ((counter && counter.uuid == props.post.authorUUID) || (counter && counter.roles.includes('mod'))) && (
                        <StrikethroughSIcon
                          sx={{ cursor: 'pointer', mr: 1 }}
                          color="action"
                          fontSize="small"
                          aria-label="Strike"
                          onClick={() => {
                            setAction('strike')
                            setOpen(true)
                          }}
                        />
                      )}
                    {props.post.hasComment &&
                      ((counter && counter.uuid == props.post.authorUUID) || (counter && counter.roles.includes('mod'))) && (
                        <DeleteIcon
                          sx={{ cursor: 'pointer', mr: 1 }}
                          color="action"
                          fontSize="small"
                          aria-label="Delete"
                          onClick={() => {
                            setAction('delete')
                            setOpen(true)
                          }}
                        />
                      )}

                    {pickerOpen && (
                      <Popover
                        open={pickerOpen}
                        anchorEl={anchorRef.current}
                        anchorOrigin={{ vertical: 'top', horizontal: -250 }}
                        onClose={() => setPickerOpen(false)}
                      >
                        <Picker set={'twitter'} custom={custom_emojis} onEmojiSelect={handleEmojiSelect} />
                      </Popover>
                    )}

                    <Dialog open={open} onClose={() => setOpen(false)}>
                      <DialogTitle>Confirm action</DialogTitle>
                      <DialogContent>
                        <DialogContentText>
                          {action === 'delete'
                            ? `Are you sure you want to delete this post's text? The count itself will remain. This can't be undone.`
                            : 'Are you sure you want to toggle strike on this post? This can be undone.'}
                        </DialogContentText>
                      </DialogContent>
                      <DialogActions>
                        <Button onClick={() => setOpen(false)}>Cancel</Button>
                        <Button sx={{ fontWeight: 'bold' }} autoFocus onClick={handleConfirm}>
                          Confirm
                        </Button>
                      </DialogActions>
                    </Dialog>
                  </Box>
                )}
              </Grid>
              {props.post.chance && props.post.roll && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'left', width: '100%', textAlign: 'center' }}>
                    <Typography
                      fontSize={9}
                      sx={{ width: 'fit-content', color: 'text.secondary' }}
                      title="RNG roll versus the odds of it happening. These aren't stored permanently."
                      style={{ borderBottom: '1px dotted grey', borderRadius: '1px', cursor: 'help', position: 'relative' }}
                    >
                      {props.post.roll} {props.post.roll > props.post.chance ? `>` : `<`} {props.post.chance}
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        </Box>
      </>
    )
  } else if (user && preferences && preferences.pref_post_style === 'Classic') {
    return (
      <>
        {user && preferences && preferences.pref_hide_stricken === 'Minimize' && props.post.stricken && !props.post.hasComment && (
          <Typography
            className="minimized-post-toggler"
            variant="body2"
            onClick={() => handleExpand()}
            sx={{ cursor: 'pointer', userSelect: 'none', marginLeft: '5px' }}
          >
            {expanded ? `[-]` : `[+]`} Show Hidden Post
          </Typography>
        )}
        <Box
          ref={props.contextRef}
          className={`count countDesktop ${props.contextRef && 'highlighted'}`}
          sx={{
            display: expanded ? 'block' : 'none',
            pl: 2,
            pr: 2,
            boxSizing: 'border-box',
            wordWrap: 'break-word',
            filter: props.post.stricken && user && preferences && preferences.pref_custom_stricken == 'Inverse' ? 'invert(1)' : '',
            opacity: props.post.stricken && user && preferences ? preferences.pref_stricken_count_opacity : 1,
            border:
              props.mostRecentCount && user && preferences && preferences.pref_highlight_last_count
                ? `1px solid ${preferences.pref_highlight_last_count_color}`
                : '1px solid transparent',
            background:
              props.mostRecentCount && user && preferences && preferences.pref_highlight_last_count
                ? `${preferences.pref_highlight_last_count_color}1c`
                : props.post.stricken && user && preferences && preferences.pref_custom_stricken != 'Disabled'
                  ? preferences.pref_strike_color
                  : 'initial',
          }}
        >
          <Box>
            <Grid container>
              <Grid item xs={4}>
                <Grid container sx={{ display: 'flex' }}>
                  <Grid item xs={2} sx={{ justifyContent: 'center', display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                    <Box sx={{ p: props.boxPadding }}>
                      <Link
                        href={`/counter/${cachedCounters[props.post.authorUUID] ? cachedCounters[props.post.authorUUID].username : props.post.authorUUID}`}
                        onClick={(e) => {
                          e.preventDefault()
                          navigate(
                            `/counter/${cachedCounters[props.post.authorUUID] ? cachedCounters[props.post.authorUUID].username : props.post.authorUUID}`,
                          )
                        }}
                      >
                        <Avatar
                          className={renderedCounter.cardBorderStyle}
                          src={`${(renderedCounter.avatar.length > 5 && `https://cdn.discordapp.com/avatars/${renderedCounter.discordId}/${renderedCounter.avatar}`) || CggLogo2}`}
                          alt={renderedCounter.name}
                        />
                      </Link>
                    </Box>
                    {props.post.latency && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', textAlign: 'center' }}>
                          <Typography
                            fontSize={9}
                            sx={{
                              width: 'fit-content',
                              color: 'text.secondary',
                              '&:hover .plHoverSuffix': {
                                maxWidth: 160,
                                opacity: 1,
                              },
                            }}
                            title={latencyTooltip}
                            style={{ borderBottom: '1px dotted grey', borderRadius: '1px', cursor: 'help', position: 'relative' }}
                          >
                            {latencyDisplayText}
                            {showHoverProcessingSuffix && (
                              <Box
                                component="span"
                                className="plHoverSuffix"
                                sx={{
                                  maxWidth: 0,
                                  opacity: 0,
                                  overflow: 'hidden',
                                  display: 'inline-block',
                                  whiteSpace: 'nowrap',
                                  verticalAlign: 'bottom',
                                  transition: 'max-width 0.18s ease, opacity 0.18s ease',
                                }}
                              >
                                {`, ${roundedProcessingLatency}ms PL`}
                              </Box>
                            )}
                          </Typography>
                        </Box>
                      )}
                  </Grid>
                  <Grid item xs={10}>
                    <Grid container sx={{ width: '95%' }}>
                      <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'right', alignItems: 'center' }}>
                        <Box
                          component={'div'}
                          title={`${convertMsToFancyTime(Math.round(props.post.timeSinceLastCount))} since last count`}
                          sx={{
                            color:
                              user && preferences && preferences.pref_night_mode_colors && preferences.pref_night_mode_colors !== 'Default'
                                ? preferences.pref_night_mode_colors === 'Light'
                                  ? '#000000de'
                                  : '#ffffffde'
                                : 'text.primary',
                            textAlign: 'right',
                            overflow: 'hidden',
                            bgcolor: `${replyTimeColor}.${theme.palette.mode}`,
                          }}
                        >
                          {hoursSinceLastPost > 0 ? (
                            <Typography component="span" variant="h5">
                              {hoursSinceLastPost}
                              <Typography component="span" variant="subtitle2">
                                h
                              </Typography>
                            </Typography>
                          ) : null}
                          {minutesSinceLastPost > 0 || hoursSinceLastPost > 0 ? (
                            <Typography component="span" variant="h5">
                              {minutesSinceLastPost}
                              <Typography component="span" variant="subtitle2">
                                m
                              </Typography>
                            </Typography>
                          ) : null}
                          {secondsSinceLastPost > 0 || minutesSinceLastPost > 0 || hoursSinceLastPost > 0 ? (
                            <Typography component="span" variant="h5">
                              {secondsSinceLastPost}
                              <Typography component="span" variant="subtitle2">
                                s
                              </Typography>
                            </Typography>
                          ) : null}
                          <Typography component="span" variant="h5">
                            {props.post.timeSinceLastPost > 999 ? paddedMsSinceLastPost : msSinceLastPost}
                            <Typography component="span" variant="subtitle2">
                              ms
                            </Typography>
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ textAlign: 'left' }}></Box>
                        <Link
                          onClick={(e) => {
                            e.preventDefault()
                            navigate(url)
                          }}
                          href={url}
                          underline={'hover'}
                          sx={{ textAlign: 'right' }}
                          variant="caption"
                          color="textSecondary"
                        >
                          {props.thread && props.thread.name === 'bars'
                            ? formatDateWithMilliseconds(parseInt(props.post.timestamp))
                            : formatDate(parseInt(props.post.timestamp))}
                        </Link>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                  <CardContent
                    sx={{
                      maxWidth: 'fit-content',
                      flex: '1 0 auto',
                      p: 0,
                      pb: 0,
                      overflowWrap: 'anywhere',
                      '&:last-child': { pb: '2px' },
                    }}
                  >
                    <Typography component="div" variant="body1" color={'text.primary'} sx={{ whiteSpace: 'pre-wrap' }}>
                      <span style={{ textDecoration: props.post.stricken ? 'line-through' : 'none' }}>{countContentCopy}</span>
                      {maybeSpace}
                      {props.post.comment && (
                        // <>{props.post.comment.startsWith('\n')
                        // ? `\u00A0${props.post.comment}`
                        // : props.post.comment}</>
                        <ReactMarkdown
                          children={
                            props.post.comment.startsWith('\n')
                              ? `\u00A0${transformMarkdown(props.post.comment)}`
                              : transformMarkdown(props.post.comment)
                          }
                          components={components}
                          remarkPlugins={[remarkGfm]}
                        />

                        // <ErrorBoundary comment={props.post.comment}>
                        //   <ReactMarkdown
                        //           children={
                        //             props.post.comment.startsWith('\n')
                        //               ? `\u00A0${props.post.comment}`
                        //               : props.post.comment
                        //           }
                        //           components={components}
                        //           remarkPlugins={[remarkGfm]}
                        //         />
                        // </ErrorBoundary>
                      )}
                      {props.post.isCommentDeleted && (
                        <Typography component={'span'} sx={{ width: 'fit-content', p: 0.5, bgcolor: 'lightgray', color: 'black' }}>
                          [deleted]
                        </Typography>
                      )}
                    </Typography>
                    <Typography variant="subtitle1" component="div">
                      <Link
                        underline="hover"
                        sx={{
                          textDecoration: renderedCounter.roles.includes('banned') ? 'line-through' : 'none',
                          fontStyle: renderedCounter.roles.includes('muted') ? 'italic' : 'normal',
                        }}
                        className={isRainbow ? "rainbow-text" : undefined}
                        color={renderedCounter.color}
                        onClick={(e) => {
                          e.preventDefault()
                          navigate(
                            `/counter/${cachedCounters[props.post.authorUUID] ? cachedCounters[props.post.authorUUID].username : props.post.authorUUID}`,
                          )
                        }}
                        href={`/counter/${cachedCounters[props.post.authorUUID] ? cachedCounters[props.post.authorUUID].username : props.post.authorUUID}`}
                      >
                        {renderedCounter.emoji
                          ? `${renderedCounter.emoji} ${renderedCounter.name} ${renderedCounter.emoji}`
                          : renderedCounter.name}
                      </Link>
                      &nbsp;
                    </Typography>
                    <Box
                      sx={{
                        display: props.post.reactions && Object.entries(props.post.reactions).length > 0 ? 'inline-flex' : 'none',
                        flexWrap: 'wrap',
                      }}
                    >
                      {props.post.reactions &&
                        Object.entries(props.post.reactions).map((reaction: [string, unknown]) => {
                          if (counter && reaction[1] && (reaction[1] as string[]).includes(counter.uuid)) {
                            return (
                              <Box
                                key={reaction[0]}
                                onClick={() => {
                                  props.socket.emit(`updateReactions`, { id: reaction[0], post_uuid: props.post.uuid })
                                }}
                                component={'div'}
                                sx={{
                                  background: '#6ab3ff82',
                                  cursor: 'pointer',
                                  paddingTop: '6px',
                                  marginRight: '5px',
                                  paddingLeft: '5px',
                                  paddingRight: '5px',
                                  gap: '8px',
                                  alignItems: 'center',
                                  height: '30px',
                                  display: 'inline-flex',
                                  border: '1px solid #3c3cff82',
                                  borderRadius: '10px',
                                }}
                              >
                                {EmojiTest({ id: reaction[0], size: 24, set: 'twitter' })} {(reaction[1] as string[]).length}
                              </Box>
                            )
                          } else {
                            return (
                              <Box
                                key={reaction[0]}
                                onClick={() => {
                                  props.socket.emit(`updateReactions`, { id: reaction[0], post_uuid: props.post.uuid })
                                }}
                                component={'div'}
                                sx={{
                                  background: '#afafaf21',
                                  cursor: 'pointer',
                                  paddingTop: '6px',
                                  marginRight: '5px',
                                  paddingLeft: '5px',
                                  paddingRight: '5px',
                                  gap: '8px',
                                  alignItems: 'center',
                                  height: '30px',
                                  display: 'inline-flex',
                                  border: '1px solid #3c3cff82',
                                  borderRadius: '10px',
                                }}
                              >
                                {EmojiTest({ id: reaction[0], size: 24, set: 'twitter' })} {(reaction[1] as string[]).length}
                              </Box>
                            )
                          }
                        })}
                      {/* {props.post.reactions && Object.keys(props.post.reactions).length > 0 && <IconButton sx={{height: '20px', width: '20px'}} onClick={handleOpenReax}><HelpOutline /></IconButton>} */}
                    </Box>
                  </CardContent>
                </Box>
              </Grid>
              <Grid item xs={2} lg={2}>
                <Box ref={anchorRef}></Box>
                {counter && (
                  <Box className="countActionsDesktop" sx={{ display: 'none', justifyContent: 'end' }}>
                    <IconButton
                      // ref={anchorRef}
                      aria-label="Reaction"
                      onClick={() => {
                        setPickerOpen(!pickerOpen)
                      }}
                    >
                      <SentimentVerySatisfied />
                    </IconButton>
                    {props.post.isCount &&
                      props.thread &&
                      props.thread.autoValidated === false &&
                      ((counter && counter.uuid == props.post.authorUUID) || (counter && counter.roles.includes('mod'))) && (
                        <IconButton
                          aria-label="Strike"
                          onClick={() => {
                            setAction('strike')
                            setOpen(true)
                          }}
                        >
                          <StrikethroughSIcon />
                        </IconButton>
                      )}
                    {props.post.hasComment &&
                      ((counter && counter.uuid == props.post.authorUUID) || (counter && counter.roles.includes('mod'))) && (
                        <IconButton
                          aria-label="Delete"
                          onClick={() => {
                            setAction('delete')
                            setOpen(true)
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}

                    {pickerOpen && (
                      <Popover
                        open={pickerOpen}
                        anchorEl={anchorRef.current}
                        anchorOrigin={{ vertical: 'top', horizontal: -250 }}
                        onClose={() => setPickerOpen(false)}
                      >
                        <Picker set={'twitter'} custom={custom_emojis} onEmojiSelect={handleEmojiSelect} />
                      </Popover>
                    )}

                    <Dialog open={open} onClose={() => setOpen(false)}>
                      <DialogTitle>Confirm action</DialogTitle>
                      <DialogContent>
                        <DialogContentText>
                          {action === 'delete'
                            ? `Are you sure you want to delete this post's text? The count itself will remain. This can't be undone.`
                            : 'Are you sure you want to toggle strike on this post? This can be undone.'}
                        </DialogContentText>
                      </DialogContent>
                      <DialogActions>
                        <Button onClick={() => setOpen(false)}>Cancel</Button>
                        <Button sx={{ fontWeight: 'bold' }} autoFocus onClick={handleConfirm}>
                          Confirm
                        </Button>
                      </DialogActions>
                    </Dialog>
                  </Box>
                )}
              </Grid>
              {props.post.chance && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'left', width: '100%', textAlign: 'center' }}>
                    <Typography
                      fontSize={9}
                      sx={{ width: 'fit-content', color: 'text.secondary' }}
                      title="RNG roll versus the odds of it happening. These aren't stored permanently."
                      style={{ borderBottom: '1px dotted grey', borderRadius: '1px', cursor: 'help', position: 'relative' }}
                    >
                      {props.post.roll} {props.post.roll > props.post.chance ? `>` : `<`} {props.post.chance}
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        </Box>
      </>
    )
  } else {
    return (
      <>
        {user && preferences && preferences.pref_hide_stricken === 'Minimize' && props.post.stricken && !props.post.hasComment && (
          <Typography
            className="minimized-post-toggler"
            variant="body2"
            onClick={() => handleExpand()}
            sx={{ cursor: 'pointer', userSelect: 'none', marginLeft: '5px' }}
          >
            {expanded ? `[-]` : `[+]`} Show Hidden Post
          </Typography>
        )}
        <Box
          ref={props.contextRef}
          className={`count countDesktop ${props.contextRef && 'highlighted'}`}
          sx={{
            display: expanded ? 'block' : 'none',
            // pl: 2,
            // pr: 2,
            boxSizing: 'border-box',
            wordWrap: 'break-word',
            filter: props.post.stricken && user && preferences && preferences.pref_custom_stricken == 'Inverse' ? 'invert(1)' : '',
            opacity: props.post.stricken && user && preferences ? preferences.pref_stricken_count_opacity : 1,
            border:
              props.mostRecentCount && user && preferences && preferences.pref_highlight_last_count
                ? `1px solid ${preferences.pref_highlight_last_count_color}`
                : '1px solid transparent',
            background:
              props.mostRecentCount && user && preferences && preferences.pref_highlight_last_count
                ? `${preferences.pref_highlight_last_count_color}1c`
                : props.post.stricken && (user && preferences && preferences.pref_custom_stricken != 'Disabled')
                  ? preferences.pref_strike_color
                  : 'initial',
          }}
        >
          <Box sx={{}}>
            <Grid container>
              <Grid item xs={4}>
                <Grid container sx={{ display: 'flex', height: '100%', }}>
                  <Grid item xs={12} sx={{}}>
                    <Grid container sx={{ width: '100%', height: '100%' }}>
                      <Grid
                        item
                        xs={12}
                        sx={{
                          color: 'text.primary',
                          display: 'flex',
                          justifyContent: 'space-between',
                          bgcolor: `${newReplyTimeColor}`,
                          height: '100%',
                          position: 'relative',
                          // ...(Math.round(props.post.timeSinceLastCount) < 200 && {filter})
                        }}
                      >
                      {Math.round(props.post.timeSinceLastPost) < 200 && <Box sx={{
  position: 'absolute',
  top: 0,
  left: 0,
  width: `${Math.round(props.post.timeSinceLastPost) / 2}%`,
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.075)',  // Black tint with 10% opacity
  borderRight: `1px solid ${renderedCounter.color}66`,
  pointerEvents: 'none', // Allows clicks to pass through
}}></Box>}
                        <Link
                          fontSize={11}
                          onClick={(e) => {
                            e.preventDefault()
                            navigate(url)
                          }}
                          href={url}
                          underline={'hover'}
                          sx={{ margin: '1px', flexGrow: 1, display: 'flex', flexDirection: 'row', whiteSpace: 'nowrap', overflow: 'hidden', textAlign: 'left', alignItems: 'center' }}
                          variant="caption"
                          color="textSecondary"
                        >
                          {formatDateWithMilliseconds(parseInt(props.post.timestamp), true)}{' '}
                          {props.post.latency && (
                            <Box component={'span'} className='displayOnHover'>
                            &nbsp;
                              {/* {' '} */}
                              <Typography
                                component={'span'}
                                // fontSize={11}
                                // sx={{ 
                                //   // width: 'fit-content',
                                //    color: 'text.secondary' }}
                                title={latencyTooltip}
                                sx={{ borderBottom: '1px dotted grey', borderRadius: '1px', cursor: 'help', position: 'relative',
                                  color: 'text.secondary',
                                  fontSize: 'inherit',
                                  '&:hover .plHoverSuffix': {
                                    maxWidth: 160,
                                    opacity: 1,
                                  },
                                  
                                 }}
                              >
                                ({latencyDisplayText})
                                {showHoverProcessingSuffix && (
                                  <Box
                                    component="span"
                                    className="plHoverSuffix"
                                    sx={{
                                      maxWidth: 0,
                                      opacity: 0,
                                      overflow: 'hidden',
                                      display: 'inline-block',
                                      whiteSpace: 'nowrap',
                                      verticalAlign: 'bottom',
                                      transition: 'max-width 0.18s ease, opacity 0.18s ease',
                                    }}
                                  >
                                    {`, ${roundedProcessingLatency}ms PL`}
                                  </Box>
                                )}
                              </Typography>
                            </Box>
                          )}
                          {/* <Box
                          sx={{
                            // display: 'flex',
                            flexGrow: 1,
                          }}></Box> */}
                          <Box
                          component={'span'}
                          title={`${convertMsToFancyTime(Math.round(props.post.timeSinceLastCount))} since last count`}
                          sx={{
                            flexGrow: 1,
                            color:
                              user && preferences && preferences.pref_night_mode_colors && preferences.pref_night_mode_colors !== 'Default'
                                ? preferences.pref_night_mode_colors === 'Light'
                                  ? '#000000de'
                                  : '#ffffffde'
                                : 'text.primary',
                            textAlign: 'right',
                            bgcolor: `${newReplyTimeColor}`,
                            fontSize: '14px'
                          }}
                        >
                          {fancyMs2}
                        </Box>
                        </Link>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={6}>
                <Grid container direction={'row'}>
                  <Grid item xs={2.5} sx={{
                    display: 'flex',
                    justifyContent: 'center',
                  }}>
                  <Link
                          underline="hover"
                          sx={{
                            textDecoration: renderedCounter.roles.includes('banned') ? 'line-through' : 'none',
                            fontStyle: renderedCounter.roles.includes('muted') ? 'italic' : 'normal',
                            // display: 'block',
                            // height: '100%',
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                          className={isRainbow ? "rainbow-text" : undefined}
                          color={renderedCounter.color}
                          onClick={(e) => {
                            e.preventDefault()
                            navigate(
                              `/counter/${cachedCounters[props.post.authorUUID] ? cachedCounters[props.post.authorUUID].username : props.post.authorUUID}`,
                            )
                          }}
                          href={`/counter/${cachedCounters[props.post.authorUUID] ? cachedCounters[props.post.authorUUID].username : props.post.authorUUID}`}
                        >
                          <CardMedia
                    component="span"
                    className={`border_${renderedCounter.cardBorderStyle} pfp-image`}
                    sx={{
                      display: 'inline-block',
                      backgroundSize: 'contain',
                      // width: '100%',
                      width: 36,
                      height: 36,
                      // height: '100%',
                      // width: 46,
                      // maxWidth: 46,
                      // maxHeight: 4,
                      backgroundImage:
                      renderedCounter.avatar.length > 5
                          ? `url(https://cdn.discordapp.com/avatars/${renderedCounter.discordId}/${renderedCounter.avatar})`
                          : `url(${CggLogo2})`,
                    }}
                  />
                        </Link>
                  </Grid>
                  <Grid item xs={9.5}>
                <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                  <CardContent
                    sx={{
                      maxWidth: 'fit-content',
                      flex: '1 0 auto',
                      p: 0,
                      pb: 0,
                      overflowWrap: 'anywhere',
                      '&:last-child': { pb: '0px' },
                    }}
                  >
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'end', flexDirection: 'row' }}>
                      <Typography
                        component="span"
                        // variant="body1"
                        fontFamily={'Verdana'}
                        fontSize={14}
                        color={'text.primary'}
                        sx={{ whiteSpace: 'pre-wrap', mr: 1 }}
                      >
                        {/* <Typography fontSize={10} fontFamily={'Verdana'} component="span"> */}
                        {/* <CardHeader
                  sx={{ p: 0 }}
                  // avatar={
                  //   renderedCounter &&
                  //   renderedCounter.name && (
                  //     // <Avatar
                  //     //   component={'span'}
                  //     //   sx={{ width: 24, height: 24 }}
                  //     //   alt={`${renderedCounter.name}`}
                  //     //   src={`${(renderedCounter.avatar.length > 5 && `https://cdn.discordapp.com/avatars/${renderedCounter.discordId}/${renderedCounter.avatar}`) || `https://cdn.discordapp.com/embed/avatars/0.png`}`}
                  //     // ></Avatar>
                  //   )
                  // }
                  title={
                    <Link
                          underline="hover"
                          sx={{
                            textDecoration: renderedCounter.roles.includes('banned') ? 'line-through' : 'none',
                            fontStyle: renderedCounter.roles.includes('muted') ? 'italic' : 'normal',
                            fontSize: 14,
                            m: 0,
                            p: 0,
                            // fontWeight: 600,
                            // fontWeight: 'bold',
                          }}
                          className={isRainbow ? "rainbow-text" : undefined}
                          color={renderedCounter.color}
                          onClick={(e) => {
                            e.preventDefault()
                            navigate(
                              `/counter/${cachedCounters[props.post.authorUUID] ? cachedCounters[props.post.authorUUID].username : props.post.authorUUID}`,
                            )
                          }}
                          href={`/counter/${cachedCounters[props.post.authorUUID] ? cachedCounters[props.post.authorUUID].username : props.post.authorUUID}`}
                        >
                          {renderedCounter.emoji
                            ? `${renderedCounter.emoji} ${renderedCounter.name} ${renderedCounter.emoji}`
                            : renderedCounter.name}
                        </Link>
                  }
                ></CardHeader> */}
                <Grid container>
                  <Grid item xs={12}>
                  <Link
                          underline="hover"
                          sx={{
                            textDecoration: renderedCounter.roles.includes('banned') ? 'line-through' : 'none',
                            fontStyle: renderedCounter.roles.includes('muted') ? 'italic' : 'normal',
                            fontSize: 12,
                            m: 0,
                            p: 0,
                            // fontWeight: 600,
                            // fontWeight: 'bold',
                          }}
                          className={isRainbow ? "rainbow-text" : undefined}
                          color={renderedCounter.color}
                          onClick={(e) => {
                            e.preventDefault()
                            navigate(
                              `/counter/${cachedCounters[props.post.authorUUID] ? cachedCounters[props.post.authorUUID].username : props.post.authorUUID}`,
                            )
                          }}
                          href={`/counter/${cachedCounters[props.post.authorUUID] ? cachedCounters[props.post.authorUUID].username : props.post.authorUUID}`}
                        >
                          {/* <CardMedia
                    component="span"
                    className={`border_${renderedCounter.cardBorderStyle} pfp-image`}
                    sx={{
                      backgroundSize: 'contain',
                      // width: '100%',
                      maxWidth: 24,
                      maxHeight: 24,
                      backgroundImage:
                      renderedCounter.avatar.length > 5
                          ? `url(https://cdn.discordapp.com/avatars/${renderedCounter.discordId}/${renderedCounter.avatar})`
                          : `url(${CggLogo2})`,
                    }}
                  /> */}
                          {renderedCounter.emoji
                            ? `${renderedCounter.emoji} ${renderedCounter.name} ${renderedCounter.emoji}`
                            : renderedCounter.name}
                        </Link>
                        &nbsp;
                  </Grid>
                  <Grid item xs={12}>
                    <span style={{ textDecoration: props.post.stricken ? 'line-through' : 'none' }}>{countContentCopy}</span>
                        {maybeSpace}
                        {props.post.comment && (
                          <ReactMarkdown
                            children={
                              props.post.comment.startsWith('\n')
                                ? `\u00A0${transformMarkdown(props.post.comment)}`
                                : transformMarkdown(props.post.comment)
                            }
                            components={components}
                            remarkPlugins={[remarkGfm]}
                          />
                        )}
                        {props.post.isCommentDeleted && (
                          <Typography
                            fontFamily={'Verdana'}
                            fontSize={14}
                            component={'span'}
                            sx={{ width: 'fit-content', p: 0.5, bgcolor: 'lightgray', color: 'black' }}
                          >
                            [deleted]
                          </Typography>
                        )}
                  </Grid>
                </Grid>
                
                      
                      </Typography>
                    </Box>
                    {Object.entries(props.post.reactions).length > 0 && (
                      <Box sx={{ display: 'inline-flex', flexWrap: 'wrap' }}>
                        {props.post.reactions &&
                          Object.entries(props.post.reactions).map((reaction: [string, unknown]) => {
                            if (counter && reaction[1] && (reaction[1] as string[]).includes(counter.uuid)) {
                              return (
                                <Box
                                  key={reaction[0]}
                                  onClick={() => {
                                    props.socket.emit(`updateReactions`, { id: reaction[0], post_uuid: props.post.uuid })
                                  }}
                                  component={'div'}
                                  sx={{
                                    background: '#6ab3ff82',
                                    cursor: 'pointer',
                                    paddingTop: '6px',
                                    marginRight: '5px',
                                    paddingLeft: '5px',
                                    paddingRight: '5px',
                                    gap: '8px',
                                    alignItems: 'center',
                                    height: '30px',
                                    display: 'inline-flex',
                                    border: '1px solid #3c3cff82',
                                    borderRadius: '10px',
                                  }}
                                >
                                  {EmojiTest({ id: reaction[0], size: 24, set: 'twitter' })} {(reaction[1] as string[]).length}
                                </Box>
                              )
                            } else {
                              return (
                                <Box
                                  key={reaction[0]}
                                  onClick={() => {
                                    props.socket.emit(`updateReactions`, { id: reaction[0], post_uuid: props.post.uuid })
                                  }}
                                  component={'div'}
                                  sx={{
                                    background: '#afafaf21',
                                    cursor: 'pointer',
                                    paddingTop: '6px',
                                    marginRight: '5px',
                                    paddingLeft: '5px',
                                    paddingRight: '5px',
                                    gap: '8px',
                                    alignItems: 'center',
                                    height: '30px',
                                    display: 'inline-flex',
                                    border: '1px solid #3c3cff82',
                                    borderRadius: '10px',
                                  }}
                                >
                                  {EmojiTest({ id: reaction[0], size: 24, set: 'twitter' })} {(reaction[1] as string[]).length}
                                </Box>
                              )
                            }
                          })}
                      </Box>
                    )}
                  </CardContent>
                </Box>
                </Grid>
                </Grid>
              </Grid>
              <Grid item xs={2} lg={2}>
                <Box ref={anchorRef}></Box>
                {counter && (
                  <Box className="countActionsDesktop" sx={{ display: 'none', justifyContent: 'end' }}>
                    <SentimentVerySatisfied
                      sx={{ cursor: 'pointer', mr: 1 }}
                      color="action"
                      fontSize="small"
                      aria-label="Reaction"
                      onClick={() => {
                        setPickerOpen(!pickerOpen)
                      }}
                    />
                    {props.post.isCount &&
                      props.thread &&
                      props.thread.autoValidated === false &&
                      ((counter && counter.uuid == props.post.authorUUID) || (counter && counter.roles.includes('mod'))) && (
                        <StrikethroughSIcon
                          sx={{ cursor: 'pointer', mr: 1 }}
                          color="action"
                          fontSize="small"
                          aria-label="Strike"
                          onClick={() => {
                            setAction('strike')
                            setOpen(true)
                          }}
                        />
                      )}
                    {props.post.hasComment &&
                      ((counter && counter.uuid == props.post.authorUUID) || (counter && counter.roles.includes('mod'))) && (
                        <DeleteIcon
                          sx={{ cursor: 'pointer', mr: 1 }}
                          color="action"
                          fontSize="small"
                          aria-label="Delete"
                          onClick={() => {
                            setAction('delete')
                            setOpen(true)
                          }}
                        />
                      )}

                    {pickerOpen && (
                      <Popover
                        open={pickerOpen}
                        anchorEl={anchorRef.current}
                        anchorOrigin={{ vertical: 'top', horizontal: -250 }}
                        onClose={() => setPickerOpen(false)}
                      >
                        <Picker set={'twitter'} custom={custom_emojis} onEmojiSelect={handleEmojiSelect} />
                      </Popover>
                    )}

                    <Dialog open={open} onClose={() => setOpen(false)}>
                      <DialogTitle>Confirm action</DialogTitle>
                      <DialogContent>
                        <DialogContentText>
                          {action === 'delete'
                            ? `Are you sure you want to delete this post's text? The count itself will remain. This can't be undone.`
                            : 'Are you sure you want to toggle strike on this post? This can be undone.'}
                        </DialogContentText>
                      </DialogContent>
                      <DialogActions>
                        <Button onClick={() => setOpen(false)}>Cancel</Button>
                        <Button sx={{ fontWeight: 'bold' }} autoFocus onClick={handleConfirm}>
                          Confirm
                        </Button>
                      </DialogActions>
                    </Dialog>
                  </Box>
                )}
              </Grid>
              {props.post.chance && props.post.roll && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'left', width: '100%', textAlign: 'center' }}>
                    <Typography
                      fontSize={9}
                      sx={{ width: 'fit-content', color: 'text.secondary' }}
                      title="RNG roll versus the odds of it happening. These aren't stored permanently."
                      style={{ borderBottom: '1px dotted grey', borderRadius: '1px', cursor: 'help', position: 'relative' }}
                    >
                      {props.post.roll} {props.post.roll > props.post.chance ? `>` : `<`} {props.post.chance}
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        </Box>
      </>
    )
  }
})

export default Count
