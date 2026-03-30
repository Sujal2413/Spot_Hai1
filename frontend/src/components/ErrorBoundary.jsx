import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error in ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{ padding: '40px', minHeight: '100vh', backgroundColor: 'var(--bg-primary, #0B0114)', color: 'var(--text-primary, #E2DDF0)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ maxWidth: '600px', width: '100%', backgroundColor: 'var(--bg-secondary, #130D26)', padding: '30px', borderRadius: '12px', border: '1px solid rgba(255,204,0,0.1)' }}>
            <h1 style={{ color: 'var(--danger, #ff4c4c)', marginBottom: '16px' }}>Oops! Something went wrong.</h1>
            <p style={{ marginBottom: '20px', color: 'var(--text-muted, #948AAB)' }}>
              The application encountered an unexpected error. This is likely a frontend crash.
            </p>
            
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'rgba(255,76,76,0.1)', borderRadius: '8px', border: '1px solid rgba(255,76,76,0.2)' }}>
              <p style={{ fontFamily: 'monospace', color: '#ff4c4c', wordBreak: 'break-all', margin: 0 }}>
                {this.state.error?.toString()}
              </p>
            </div>
            
            {this.state.errorInfo && (
              <details style={{ marginBottom: '24px' }}>
                <summary style={{ cursor: 'pointer', color: 'var(--primary-accent, #FFCC00)', marginBottom: '10px' }}>View Error Details</summary>
                <div style={{ padding: '15px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px', overflowX: 'auto' }}>
                  <pre style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted, #948AAB)' }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              </details>
            )}
            
            <button 
              onClick={() => window.location.href = '/'}
              style={{ padding: '12px 24px', backgroundColor: 'var(--primary-accent, #FFCC00)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
