import { Component, type ReactNode } from 'react';
export default class RouteErrorBoundary extends Component<{ children: ReactNode; title?: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div role="alert" className="p-6"><p>{this.props.title ?? 'Không mở được màn hình'}</p><button onClick={() => this.setState({ failed: false })}>Thử lại</button></div> : this.props.children; }
}
