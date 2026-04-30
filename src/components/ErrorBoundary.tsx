import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-bg-dark text-white p-6 text-center relative overflow-hidden" dir="rtl">
          {/* Grid Background */}
          <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="glass-panel p-10 rounded-[2rem] max-w-2xl w-full relative z-10 shadow-[0_0_50px_rgba(248,113,113,0.1)] border-red-500/20">
            <AlertTriangle size={80} className="text-red-400 mb-6 mx-auto drop-shadow-[0_0_15px_rgba(248,113,113,0.5)]" />
            <h1 className="text-4xl font-black mb-4 text-white">عذراً، حدث خطأ غير متوقع</h1>
            <p className="text-text-muted mb-8 text-lg font-light">
              حدث خطأ أثناء تحميل هذه الصفحة. يرجى إعادة تحميل الصفحة أو العودة للرئيسية.
            </p>
            <div className="bg-[#020B18] border border-red-500/20 p-6 rounded-[1.5rem] text-left text-sm font-mono text-red-400 overflow-x-auto w-full mb-8 custom-scrollbar shadow-inner" dir="ltr">
              {this.state.error?.message}
            </div>
            <button 
              onClick={() => window.location.href = '/'}
              className="px-8 py-4 bg-red-500 hover:bg-red-400 text-white rounded-full transition shadow-[0_0_20px_rgba(248,113,113,0.4)] font-bold text-lg inline-block"
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
