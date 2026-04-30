import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { FlowEditor } from './components/FlowEditor/FlowEditor';
import { Dashboard } from './components/Dashboard/Dashboard';
import { MLStudio } from './components/MLStudio/MLStudio';
import { Chat } from './components/Chat/Chat';
import { Generator } from './components/Generator/Generator';
import { EasyAgent } from './components/EasyAgent/EasyAgent';
import { Auth } from './components/Auth/Auth';
import { Landing } from './components/Landing/Landing';
import { Templates } from './components/Templates/Templates';
import { Analytics } from './components/Analytics/Analytics';
import { useApp } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authLoading } = useApp();
  
  // Show nothing while checking auth state (prevents flash of login page)
  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
          <p className="text-text-muted text-sm">جاري التحقق من الجلسة...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) return <Navigate to="/landing" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/landing" element={<Landing />} />
        <Route path="/auth" element={<AuthRedirect />} />

        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute><ErrorBoundary><Layout /></ErrorBoundary></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="editor" element={<FlowEditor />} />
          <Route path="editor/:id" element={<FlowEditor />} />
          <Route path="ml" element={<MLStudio />} />
          <Route path="chat" element={<Chat />} />
          <Route path="chat/:id" element={<Chat />} />
          <Route path="generator" element={<Generator />} />
          <Route path="easy-agent" element={<EasyAgent />} />
          <Route path="templates" element={<Templates />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

/** Redirect to dashboard if already authenticated, else show Auth */
function AuthRedirect() {
  const { isAuthenticated, authLoading } = useApp();
  
  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
      </div>
    );
  }
  
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <Auth />;
}

export default App;
