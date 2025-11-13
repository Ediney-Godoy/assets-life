import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null, resetKey: 0 };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info);
  }

  handleRetry = () => {
    this.setState((s) => ({ hasError: false, error: null, info: null, resetKey: s.resetKey + 1 }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4">
          <h2 className="text-xl font-semibold text-red-600">Ocorreu um erro nesta tela</h2>
          <p className="text-slate-700 dark:text-slate-300 mb-2">Tente novamente ou relate o problema.</p>
          {this.state.error && (
            <details open className="mb-2">
              <summary className="text-sm text-slate-800 dark:text-slate-200">Detalhes técnicos</summary>
              <pre className="text-xs bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-2 rounded-md overflow-auto">
                {(this.state.error?.stack || String(this.state.error))}
              </pre>
              {this.state.info?.componentStack && (
                <pre className="mt-2 text-xs bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-2 rounded-md overflow-auto">
                  {this.state.info.componentStack}
                </pre>
              )}
            </details>
          )}
          <button className="mt-2 px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700" onClick={this.handleRetry}>
            Tentar novamente
          </button>
        </div>
      );
    }

    return (
      <div key={this.state.resetKey}>
        {this.props.children}
      </div>
    );
  }
}