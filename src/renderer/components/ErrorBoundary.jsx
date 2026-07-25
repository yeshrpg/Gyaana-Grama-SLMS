import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-danger mb-4" />
          <p className="text-white font-semibold mb-2">Something went wrong</p>
          <p className="text-gray-400 text-sm mb-4">{this.state.error.message}</p>
          <button
            onClick={() => { this.setState({ error: null }); window.location.hash = '#/dashboard'; }}
            className="px-4 py-2 bg-accent text-app-bg rounded-lg font-medium"
          >
            Go to Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
