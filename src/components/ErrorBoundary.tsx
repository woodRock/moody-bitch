import React from 'react';

interface State { error: Error | null }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Unhandled render error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="fatal-screen">
        <h1 className="skyrim-font">YOU DIED</h1>
        <div className="menu-separator" style={{ margin: '1rem auto', width: '260px' }} />
        <p className="skyrim-serif">The realm stumbled. Your progress is safe in the cloud.</p>
        <button className="btn-ghost skyrim-font" onClick={() => window.location.reload()}>LOAD LAST SAVE</button>
      </div>
    );
  }
}
