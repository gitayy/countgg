import React, { Component, ErrorInfo } from 'react';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter as Router } from 'react-router-dom';
import '@fontsource/roboto';
import { createRoot } from 'react-dom/client';

// ErrorBoundary Component
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null; errorInfo: ErrorInfo | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught in ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '1rem', color: 'red', fontFamily: 'monospace', backgroundColor: 'black', display: 'flex', flexGrow: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontSize: 'large' }}>
          <h1>I messed up.</h1>
          <br />
          <h1>Please screenshot this and ping @pull_fish on Discord</h1>
          {this.state.error && <p>Error: {this.state.error.message}</p>}
          {this.state.errorInfo && (
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {this.state.errorInfo.componentStack}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// React application root
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <ErrorBoundary>
    <Router>
      <App />
    </Router>
  </ErrorBoundary>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
