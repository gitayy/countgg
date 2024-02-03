import { Card, Box, CardContent, Typography, Link } from '@mui/material'
import { useNavigate } from 'react-router-dom'

export const ThreadCard = ({ title, description, href, color1, color2 }) => {
  const navigate = useNavigate()
  const styles = {
    card: { width: 500, maxWidth: '90%', margin: 2, display: 'inline-block' },
    media: { height: 150, background: `linear-gradient(to bottom, ${color1}, ${color2})` },
    title: { fontSize: 24 },
    description: { fontSize: 18 },
  }

  return (
    <Link
      href={href}
      sx={{ maxWidth: '100%' }}
      onClick={(e) => {
        e.preventDefault()
        navigate(href)
      }}
    >
      <Box sx={{ cursor: 'pointer', display: 'inline', maxWidth: '100%' }}>
        <Card className="threadcard" sx={styles.card}>
          <Box sx={styles.media} />
          <CardContent>
            <Typography sx={styles.title}>{title}</Typography>
            <Typography sx={styles.description}>{description}</Typography>
          </CardContent>
        </Card>
      </Box>
    </Link>
  )
}
