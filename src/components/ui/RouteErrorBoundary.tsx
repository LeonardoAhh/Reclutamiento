import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StatusPage, type StatusKind } from './StatusPage';

interface Props { children: ReactNode }
interface State { kind: StatusKind | null }

export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { kind: null };

  static getDerivedStateFromError(error: Error): State {
    const codeLoadFailed = /dynamically imported module|loading chunk|module script/i.test(error.message);
    return { kind: !navigator.onLine && codeLoadFailed ? 'offline' : 'server' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Route rendering failed', error, info.componentStack);
  }

  render() {
    if (this.state.kind) {
      return <StatusPage kind={this.state.kind} onRetry={() => window.location.reload()} />;
    }
    return this.props.children;
  }
}
