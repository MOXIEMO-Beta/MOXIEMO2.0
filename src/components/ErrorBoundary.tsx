import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("[MOXIE Error Boundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="font-display text-2xl mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            This section hit an error. The rest of MOXIE is still working.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="bg-accent text-accent-foreground rounded-lg px-5 py-2 text-sm font-medium hover:opacity-90 transition"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;