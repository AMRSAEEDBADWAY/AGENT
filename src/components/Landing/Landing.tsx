import { useNavigate } from 'react-router-dom';
import { Network, Zap, BrainCircuit, Bot, ArrowLeft, Sparkles, Eye } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Landing = () => {
  const navigate = useNavigate();
  const { lang } = useApp();

  const t = {
    ar: { hero: 'ابنِ وكلاء الذكاء الاصطناعي بصرياً', sub: 'صمم، درب، وأطلق فرق AI كاملة بدون سطر كود. سحب وإفلات فقط.', cta: 'ابدأ مجاناً', features: 'المميزات', f1t: 'محرر بصري', f1d: 'صمم Workflows بالسحب والإفلات تماماً مثل n8n', f2t: 'تدريب ML', f2d: 'درّب نماذج XGBoost و LightGBM بضغطة واحدة', f3t: 'وكلاء أذكياء', f3d: 'وكلاء يعملون معاً لإنجاز المهام المعقدة', f4t: 'مولّد ذكي', f4d: 'أوصف المشروع بالعربي والذكاء الاصطناعي يبنيه لك' },
    en: { hero: 'Build AI Agents Visually', sub: 'Design, train, and deploy full AI teams without writing a single line of code.', cta: 'Get Started Free', features: 'Features', f1t: 'Visual Editor', f1d: 'Design Workflows with drag & drop just like n8n', f2t: 'ML Training', f2d: 'Train XGBoost & LightGBM models with one click', f3t: 'Smart Agents', f3d: 'Agents working together to accomplish complex tasks', f4t: 'Smart Generator', f4d: 'Describe your project and AI builds it for you' }
  }[lang];

  const features = [
    { icon: Network, title: t.f1t, desc: t.f1d, color: 'from-violet-500 to-purple-600' },
    { icon: BrainCircuit, title: t.f2t, desc: t.f2d, color: 'from-pink-500 to-rose-600' },
    { icon: Bot, title: t.f3t, desc: t.f3d, color: 'from-emerald-500 to-teal-600' },
    { icon: Sparkles, title: t.f4t, desc: t.f4d, color: 'from-amber-500 to-orange-600' },
  ];

  return (
    <div className="min-h-screen bg-bg-dark overflow-hidden relative" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* BG effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="grid-bg" />
        <div className="radial-glow" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between max-w-7xl mx-auto px-8 py-6 mt-4">
        <div className="glass-panel px-6 py-4 rounded-full flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-primary/10 border border-brand-primary/30 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(26,255,162,0.2)]">
              <Eye className="text-brand-primary w-5 h-5 neon-text" />
            </div>
            <span className="text-xl font-black text-brand-primary neon-text tracking-tight">BaseerFlow</span>
          </div>
          <div>
            <button onClick={() => navigate('/auth')} className="px-6 py-2 glass-panel border-brand-primary/30 text-white rounded-full font-semibold hover:bg-brand-primary/10 transition flex items-center gap-2">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              {lang === 'ar' ? 'دخول بحساب Google' : 'Sign in with Google'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto text-center pt-32 pb-20 px-8">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-panel border border-brand-primary/30 text-brand-primary text-sm font-bold mb-10 shadow-[0_0_15px_rgba(26,255,162,0.15)]">
          <Zap size={16} className="text-brand-primary" />
          {lang === 'ar' ? 'مفتوح المصدر' : 'Free & Open-source'}
        </div>
        <h1 className="text-6xl md:text-8xl font-black text-brand-primary neon-text leading-tight mb-8 tracking-tight" style={{textShadow: '0 0 40px rgba(26,255,162,0.4), 0 0 80px rgba(26,255,162,0.2)'}}>
          {lang === 'ar' ? 'ابنِ وكيلك' : 'Build Your Own'}<br/>{lang === 'ar' ? 'الذكي بنفسك' : 'AI Agent'}
        </h1>
        <p className="text-xl text-text-muted max-w-2xl mx-auto mb-14 leading-relaxed font-light">{t.sub}</p>
        <button onClick={() => navigate('/auth')}
          className="px-10 py-4 bg-brand-primary/10 border border-brand-primary text-brand-primary rounded-full font-bold text-lg shadow-[0_0_20px_rgba(26,255,162,0.3)] hover:bg-brand-primary hover:text-bg-dark transition-all transform hover:scale-105 inline-flex items-center gap-3">
          {lang === 'ar' ? 'ابدأ مجاناً' : 'Get Started for free'}
          <ArrowLeft size={20} className={lang === 'en' ? 'rotate-180' : ''} />
        </button>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-8 pb-32">
        <h2 className="text-center text-3xl font-bold text-white mb-16">{t.features}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <div key={i} className="glass-card rounded-3xl p-8 text-center group transition-all duration-500 hover:-translate-y-2">
              <div className={`w-16 h-16 rounded-2xl bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(26,255,162,0.1)] group-hover:scale-110 transition-transform duration-500 group-hover:shadow-[0_0_25px_rgba(26,255,162,0.3)]`}>
                <f.icon className="text-brand-primary w-8 h-8 neon-text" />
              </div>
              <h3 className="text-lg font-bold text-brand-primary mb-3 neon-text">{f.title}</h3>
              <p className="text-text-muted text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
