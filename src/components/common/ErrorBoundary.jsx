import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        console.error('Error caught by boundary:', error, errorInfo);
    }

    handleReset = () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#F8F9FF] flex items-center justify-center p-6">
                    <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-2xl w-full border-2 border-red-50">
                        <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
                            <span className="text-4xl">⚠️</span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Application Encountered an Error</h1>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            Something unexpected happened. We've captured the error and are working on it. 
                            In the meantime, you can try refreshing the page or resetting your session.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 mb-8">
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-200"
                            >
                                Refresh Page
                            </button>
                            <button
                                onClick={this.handleReset}
                                className="flex-1 bg-white border-2 border-gray-200 hover:border-purple-600 hover:text-purple-600 text-gray-600 font-bold py-4 rounded-2xl transition-all"
                            >
                                Clear Session & Reset
                            </button>
                        </div>

                        <details className="bg-gray-50 rounded-2xl overflow-hidden">
                            <summary className="px-6 py-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors list-none flex justify-between items-center">
                                <span>Technical Details</span>
                                <span className="text-gray-400">View</span>
                            </summary>
                            <div className="p-6 border-t border-gray-200">
                                <pre className="text-sm font-mono text-gray-800 bg-gray-100 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap max-h-48">
                                    {this.state.error && this.state.error.toString()}
                                    {"\n\n"}
                                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                                </pre>
                            </div>
                        </details>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;