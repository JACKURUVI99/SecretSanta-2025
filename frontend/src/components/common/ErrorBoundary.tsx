import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-red-900 text-white flex flex-col items-center justify-center p-4">
                    <div className="bg-white text-black p-8 border-4 border-black shadow-[10px_10px_0px_0px_black] max-w-2xl">
                        <h1 className="text-4xl font-black uppercase mb-4 text-red-600">⚠️ Oops! Crash!</h1>
                        <p className="font-bold mb-4">Something went wrong in the dashboard.</p>
                        <div className="bg-gray-100 p-4 border-2 border-black mb-6 overflow-auto max-h-60">
                            <p className="font-mono text-xs text-red-600 font-bold whitespace-pre-wrap">
                                {this.state.error?.toString()}
                            </p>
                            <p className="font-mono text-xs text-gray-500 mt-2 whitespace-pre-wrap">
                                {this.state.errorInfo?.componentStack}
                            </p>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-black text-white px-6 py-3 font-black uppercase hover:-translate-y-1 transition-transform border-4 border-transparent hover:border-black"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
