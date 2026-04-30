import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Eye, Loader2, Mail, Lock } from 'lucide-react';

/** Google "G" Logo SVG */
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export const Auth = () => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, demoLogin, lang } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const t = {
    ar: {
      title: 'BaseerFlow',
      subtitle: 'منصة بناء وكلاء الذكاء الاصطناعي البصرية',
      login: 'تسجيل الدخول',
      register: 'إنشاء حساب جديد',
      email: 'البريد الإلكتروني',
      pass: 'كلمة المرور',
      submitLogin: 'دخول',
      submitReg: 'إنشاء حساب',
      noAccount: 'ليس لديك حساب؟',
      hasAccount: 'لديك حساب بالفعل؟',
      or: 'أو',
      google: 'المتابعة بحساب Google',
      error: 'حدث خطأ. تأكد من صحة البيانات أو حاول لاحقاً.',
      demo: 'دخول تجريبي (Demo)',
    },
    en: {
      title: 'BaseerFlow',
      subtitle: 'Visual AI Agent Building Platform',
      login: 'Sign In',
      register: 'Create Account',
      email: 'Email Address',
      pass: 'Password',
      submitLogin: 'Sign In',
      submitReg: 'Sign Up',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      or: 'OR',
      google: 'Continue with Google',
      error: 'An error occurred. Please check your details or try again later.',
      demo: 'Try Demo Mode',
    },
  }[lang];

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError(lang === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' : 'Invalid email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError(lang === 'ar' ? 'هذا البريد الإلكتروني مسجل بالفعل.' : 'Email is already in use.');
      } else {
        setError(t.error);
      }
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
    } catch {
      setError(t.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center p-4 relative" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="grid-bg" />
        <div className="radial-glow" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8 relative z-10">
          <div className="w-20 h-20 bg-brand-primary/10 border-2 border-brand-primary/30 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(26,255,162,0.2)]">
            <Eye className="text-brand-primary w-10 h-10 neon-text" />
          </div>
          <h1 className="text-4xl font-black text-brand-primary neon-text mb-2">{t.title}</h1>
          <p className="text-text-muted font-light text-sm">{t.subtitle}</p>
        </div>

        {/* Auth Card */}
        <div className="glass-card rounded-[2rem] p-8 shadow-2xl relative z-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              {isLogin ? t.login : t.register}
            </h2>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-6 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            {/* Email Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-4 mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
                  <Mail className="w-5 h-5 text-text-muted" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#020B18]/50 border border-white/10 text-white rounded-xl py-3 ps-12 pe-4 focus:outline-none focus:border-brand-primary focus:shadow-[0_0_15px_rgba(26,255,162,0.2)] transition-all"
                  placeholder={t.email}
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
                  <Lock className="w-5 h-5 text-text-muted" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#020B18]/50 border border-white/10 text-white rounded-xl py-3 ps-12 pe-4 focus:outline-none focus:border-brand-primary focus:shadow-[0_0_15px_rgba(26,255,162,0.2)] transition-all"
                  placeholder={t.pass}
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 btn-neon-solid rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(26,255,162,0.3)] disabled:opacity-50 mt-2"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (isLogin ? t.submitLogin : t.submitReg)}
              </button>
            </form>

            <div className="text-center text-sm mb-6">
              <span className="text-text-muted">{isLogin ? t.noAccount : t.hasAccount} </span>
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-brand-primary font-bold hover:underline"
              >
                {isLogin ? t.register : t.login}
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-text-muted text-xs">{t.or}</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Google & Demo Buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-6 bg-white hover:bg-gray-50 text-gray-800 rounded-xl font-bold transition-all disabled:opacity-60"
              >
                <GoogleIcon />
                <span>{t.google}</span>
              </button>

              <button
                type="button"
                onClick={demoLogin}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 border border-brand-primary/30 text-brand-primary hover:bg-brand-primary/10 rounded-xl font-bold transition-all"
              >
                🚀 <span>{t.demo}</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
