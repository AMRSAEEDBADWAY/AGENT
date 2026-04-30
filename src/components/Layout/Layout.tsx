import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Network, BrainCircuit, MessageSquare, LogOut, Wand2, Sparkles, FileText, BarChart2, Shield, Sun, Moon, Languages, Menu, Eye } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';

export const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang, toggleLang, theme, toggleTheme, user, logout } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { name: lang === 'ar' ? 'الرئيسية' : 'Home', icon: LayoutDashboard, path: '/' },
    { name: lang === 'ar' ? 'المعالج' : 'Flow Editor', icon: Network, path: '/editor' },
    { name: lang === 'ar' ? 'المولّد الذكي' : 'Generator', icon: Wand2, path: '/generator' },
    { name: lang === 'ar' ? 'المساعد السهل' : 'Easy Agent', icon: Sparkles, path: '/easy-agent' },
    { name: lang === 'ar' ? 'تدريب ML' : 'ML Studio', icon: BrainCircuit, path: '/ml' },
    { name: lang === 'ar' ? 'المحادثة' : 'Chat', icon: MessageSquare, path: '/chat' },
    { name: lang === 'ar' ? 'القوالب' : 'Templates', icon: FileText, path: '/templates' },
    { name: lang === 'ar' ? 'الإحصائيات' : 'Analytics', icon: BarChart2, path: '/analytics' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/landing');
  };

  return (
    <div className={`flex h-screen w-full relative text-text-main ${theme === 'dark' ? 'bg-bg-dark' : 'bg-gray-100'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {theme === 'dark' && <div className="grid-bg" />}
      {theme === 'dark' && <div className="radial-glow" />}
      <Toaster position={lang === 'ar' ? 'top-left' : 'top-right'} toastOptions={{
        style: { background: theme === 'dark' ? '#131313' : '#fff', color: theme === 'dark' ? '#fff' : '#000', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '16px' }
      }} />

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : (lang === 'ar' ? 'translate-x-full' : '-translate-x-full')} md:relative md:translate-x-0 w-64 ${theme === 'dark' ? 'glass-panel' : 'bg-white border-gray-200'} ${lang === 'ar' ? 'border-l' : 'border-r'} flex flex-col shrink-0 transition-transform duration-300`}>
        {/* Logo */}
        <div className={`p-6 flex flex-col items-center ${theme === 'dark' ? 'border-brand-primary/10' : 'border-gray-200'} border-b`}>
          <div className="w-14 h-14 bg-brand-primary/10 border border-brand-primary/30 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(26,255,162,0.2)] mb-3 cursor-pointer transform hover:scale-105 transition-transform">
            <Eye className="text-brand-primary w-7 h-7" />
          </div>
          <h1 className={`text-2xl font-black tracking-tight text-center ${theme === 'dark' ? 'text-brand-primary neon-text' : 'text-gray-900'}`}>BaseerFlow</h1>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto w-full p-3 space-y-1 custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all w-full text-sm ${
                  isActive
                    ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/30 shadow-[0_0_10px_rgba(26,255,162,0.1)]'
                    : theme === 'dark' ? 'text-text-muted hover:text-brand-primary hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}>
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className={`p-3 ${theme === 'dark' ? 'border-white/5' : 'border-gray-200'} border-t space-y-1`}>
          {/* Theme Toggle */}
          <button onClick={toggleTheme} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl w-full transition-colors text-sm ${theme === 'dark' ? 'text-text-muted hover:text-white hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100'}`}>
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span className="font-medium">{theme === 'dark' ? (lang === 'ar' ? 'الوضع النهاري' : 'Light Mode') : (lang === 'ar' ? 'الوضع الليلي' : 'Dark Mode')}</span>
          </button>
          {/* Lang Toggle */}
          <button onClick={toggleLang} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl w-full transition-colors text-sm ${theme === 'dark' ? 'text-text-muted hover:text-white hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Languages className="w-5 h-5" />
            <span className="font-medium">{lang === 'ar' ? 'English' : 'عربي'}</span>
          </button>
          {/* Logout */}
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 rounded-xl w-full text-red-400 hover:bg-red-400/10 transition-colors text-sm">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">{lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <div className={`h-14 ${theme === 'dark' ? 'glass-panel border-b-0 border-brand-primary/10' : 'bg-white/80 border-gray-200'} backdrop-blur-md border-b flex items-center px-6 justify-between shrink-0`}>
          <div className="flex items-center gap-3">
            <button 
              className={`md:hidden p-1.5 rounded-lg ${theme === 'dark' ? 'text-white hover:bg-white/10' : 'text-gray-900 hover:bg-gray-100'}`}
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-brand-primary/70' : 'text-gray-500'} hidden sm:block`}>
              {menuItems.find(i => location.pathname === i.path || (i.path !== '/' && location.pathname.startsWith(i.path)))?.name || ''}
            </span>
          </div>
          {/* User */}
          <div className={`flex items-center gap-3 ${theme === 'dark' ? 'bg-brand-primary/5 hover:bg-brand-primary/10 border-brand-primary/20' : 'bg-gray-100 border-gray-200'} px-3 py-1.5 rounded-full border cursor-pointer`}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full border border-brand-primary/50 object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-brand-primary/20 border border-brand-primary/50 flex items-center justify-center text-brand-primary font-bold text-xs">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} hidden sm:block`}>{user?.name || (lang === 'ar' ? 'مستخدم' : 'User')}</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto relative">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
