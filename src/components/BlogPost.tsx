import { Accordion, AccordionDetails, AccordionSummary, Avatar, Box, Checkbox, Link, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { FC } from 'react'
import { Counter } from '../utils/types'
import ReactMarkdown from 'react-markdown'
import { EmojiTest, formatDate, transformMarkdown } from '../utils/helpers'
import data from '@emoji-mart/data/sets/14/twitter.json'
import remarkGfm from 'remark-gfm'
import { useNavigate } from 'react-router-dom'
import { Table, TableBody, TableCell, TableHead, TableRow, Paper } from '@mui/material';
import { CodeBlock } from './CodeBlock'

interface Props {
  title: string
  body: string
  author: Counter
  timestamp: string
  update?: number
}

export const BlogPost: FC<Props> = ({ title, body, author, timestamp, update }) => {
  const components = {
    // p: ('span' as any),
    li: ({ children }) => <li style={{ whiteSpace: 'initial' }}>{children}</li>,
    code: ({ children }) => {
      return Object.keys(data.emojis).includes((children[0] as string).toLowerCase()) ? (
        EmojiTest({ id: (children[0] as string).toLowerCase(), size: 24, set: 'twitter' })
      ) : (
        // <code>{children}</code>
        <CodeBlock>{children}</CodeBlock>
      )
    },
    table: ({ children }) => (
      <Table component={Paper}>
        {children}
      </Table>
    ),
    thead: ({ children }) => <TableHead>{children}</TableHead>,
    tbody: ({ children }) => <TableBody>{children}</TableBody>,
    tr: ({ children }) => <TableRow>{children}</TableRow>,
    th: ({ children }) => <TableCell component="th">{children}</TableCell>,
    td: ({ children }) => <TableCell>{children}</TableCell>,
  }

  const navigate = useNavigate()

  return (
    <>
      <Typography variant="h4" align="left" sx={{ mb: 2 }}>
        {title}
      </Typography>
      <Typography sx={{ display: 'flex' }}>
        <Avatar
          component={'span'}
          sx={{ width: 48, height: 48 }}
          alt={`${author.name}`}
          src={`${(author.avatar.length > 5 && `https://cdn.discordapp.com/avatars/${author.discordId}/${author.avatar}`) || `https://cdn.discordapp.com/embed/avatars/0.png`}`}
        ></Avatar>
        <Box sx={{ ml: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Link
            sx={{ color: author.color, cursor: 'pointer' }}
            component={'span'}
            color={'inherit'}
            underline="hover"
            href={`/counter/${author.username}`}
            onClick={(e) => {
              e.preventDefault()
              navigate(`/counter/${author.username}`)
            }}
          >
            {author.name}
          </Link>
          <Typography variant="body2">{formatDate(parseFloat(timestamp))}</Typography>
        </Box>
      </Typography>
      <ReactMarkdown children={transformMarkdown(body, 250)} components={components} remarkPlugins={[remarkGfm]} />
    </>
  )
}
