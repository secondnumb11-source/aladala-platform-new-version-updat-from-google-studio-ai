import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  showDetails: boolean;
  copied: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    showDetails: false,
    copied: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, showDetails: false, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
    this.reportErrorToSupabase(error, errorInfo);
  }

  private reportErrorToSupabase = async (error: Error, info: ErrorInfo) => {
    try {
      // Automatic async reporting to Supabase if logic is available
      const crashLog = {
        message: error.toString(),
        stack: info.componentStack,
        timestamp: new Date().toISOString()
      };
      // We log locally and to a custom event that might be captured by a global service
      window.dispatchEvent(new CustomEvent('adalah-crash-report', { detail: crashLog }));
      console.log("[ErrorBoundary] System crash report dispatched to background services.");
    } catch (e) {
      console.warn("[ErrorBoundary] Failed to dispatch report auto-log:", e);
    }
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoDashboard = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.dispatchEvent(new CustomEvent('navigate-to-dashboard'));
  };

  private handleCopyError = () => {
    const errorText = `${this.state.error?.toString()}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack}`;
    navigator.clipboard.writeText(errorText).catch(e => console.error(e));
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-right" dir="rtl">
          <div className="max-w-xl w-full bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
            
            <div className="flex flex-col items-center text-center space-y-6 relative z-10 transition-all">
              <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center animate-bounce duration-[2000ms]">
                <AlertTriangle className="w-10 h-10 text-amber-500" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-black text-white">عذراً، تطلب النظام تدخل المحامي التقني</h1>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                  حدث تعارض في معالجة واجهة المستخدم. يمكنك العودة للوحة التحكم أو تصدير سجل الخطأ للدعم الفني.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full">
                <button
                  onClick={this.handleGoDashboard}
                  className="flex items-center justify-center gap-2 bg-amber-500 text-slate-950 py-4 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-xl shadow-amber-500/20"
                >
                  <Home className="w-4 h-4" />
                  <span>العودة للوحة القيادة</span>
                </button>
                <button
                  onClick={this.handleRefresh}
                  className="flex items-center justify-center gap-2 bg-slate-800 text-white py-4 rounded-2xl font-black text-sm transition-all active:scale-95 border border-white/5"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>إعادة تحميل الجلسة</span>
                </button>
              </div>

              <div className="w-full pt-4 border-t border-white/5">
                <button 
                  onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                  className="text-[11px] font-black text-slate-500 transition-colors uppercase tracking-widest"
                >
                  {this.state.showDetails ? 'إخفاء التقرير الفني ↑' : 'عرض التقرير الفني (للمطورين) ↓'}
                </button>
                
                {this.state.showDetails && (
                  <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="w-full bg-black/60 border border-white/10 rounded-2xl p-6 text-xs font-mono text-amber-200/80 text-left overflow-auto max-h-48 scrollbar-thin">
                      <p className="font-bold mb-2 text-amber-500">// Technical Stack Trace</p>
                      {this.state.error?.toString()}
                      <div className="mt-4 text-slate-500 border-t border-white/5 pt-2">
                        {this.state.errorInfo?.componentStack}
                      </div>
                    </div>
                    <button
                      onClick={this.handleCopyError}
                      className="w-full py-2.5 rounded-xl border border-white/10 text-[10px] font-black text-white flex items-center justify-center gap-2 transition-all"
                    >
                      {this.state.copied ? '✓ تمت عملية النسخ' : 'نسخ سجل الخطأ الفني'}
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-center pt-8">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">adalah-os system | error boundary v2.2</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
