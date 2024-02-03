import { Typography } from '@mui/material'
import { ReactNode, Component, ErrorInfo } from 'react'

interface ErrorBoundaryProps {
  comment: string
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can log the error or perform other actions here
    console.error('Error occurred:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // Render a fallback UI when an error occurs
      return (
        <>
          <Typography sx={{ color: 'red', fontWeight: 'bold' }}>[error rendering this post] </Typography>
          {this.props.comment}
        </>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
