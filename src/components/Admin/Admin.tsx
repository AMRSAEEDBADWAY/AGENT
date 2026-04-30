import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import { useApp } from '../../context/AppContext';
import { Shield, Activity, Search, RefreshCw } from 'lucide-react';

interface ActivityLog {
  id?: string;
  user_email: string;
  user_password?: string;
  user_name: string;
  action: string;
  details: string;
  page: string;
  timestamp: string;
}

export const Admin = () => {
  const { lang, user } = useApp();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const t = {
    ar: {
      title: 'لوحة تحكم الإدارة (Admin Panel)',
      subtitle: 'مراقبة سجل نشاط المستخدمين بالكامل.',
      email: 'الإيميل',
      password: 'كلمة المرور',
      name: 'الاسم',
      action: 'الحدث',
      details: 'التفاصيل',
      page: 'الصفحة',
      time: 'الوقت',
      search: 'بحث بالاسم أو الإيميل أو الحدث...',
      refresh: 'تحديث البيانات',
      noLogs: 'لا توجد سجلات متاحة',
      unauthorized: 'غير مصرح لك بالدخول لهذه الصفحة.',
    },
    en: {
      title: 'Admin Control Panel',
      subtitle: 'Monitor all user activity logs.',
      email: 'Email',
      password: 'Password',
      name: 'Name',
      action: 'Action',
      details: 'Details',
      page: 'Page',
      time: 'Time',
      search: 'Search name, email, action...',
      refresh: 'Refresh Data',
      noLogs: 'No logs available',
      unauthorized: 'You are not authorized to view this page.',
    }
  }[lang];

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await client.get('/api/admin/logs');
      setLogs(res.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError(t.unauthorized);
      } else {
        setError('حدث خطأ أثناء جلب البيانات');
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.user_email?.toLowerCase().includes(search.toLowerCase()) ||
    log.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    log.action?.toLowerCase().includes(search.toLowerCase()) ||
    log.details?.toLowerCase().includes(search.toLowerCase())
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Shield className="w-20 h-20 text-red-500 mb-6" />
        <h2 className="text-3xl font-black text-white mb-2">{error}</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-brand-primary neon-text flex items-center gap-3">
            <Shield className="w-10 h-10" />
            {t.title}
          </h1>
          <p className="text-text-muted mt-2 text-lg">{t.subtitle}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchLogs} 
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 glass-panel rounded-xl hover:bg-white/5 transition-colors text-white"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            {t.refresh}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-brand-primary/10 rounded-full blur-2xl group-hover:bg-brand-primary/20 transition-all"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand-primary/20 flex items-center justify-center">
              <Activity className="w-6 h-6 text-brand-primary" />
            </div>
            <h3 className="text-lg font-bold text-white">إجمالي الحركات</h3>
          </div>
          <p className="text-4xl font-black text-white">{logs.length}</p>
        </div>
      </div>

      {/* Search & Table */}
      <div className="glass-card rounded-2xl p-6 shadow-xl">
        <div className="relative mb-6">
          <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
            <Search className="w-5 h-5 text-text-muted" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#020B18]/50 border border-white/10 text-white rounded-xl py-3 ps-12 pe-4 focus:outline-none focus:border-brand-primary focus:shadow-[0_0_15px_rgba(26,255,162,0.2)] transition-all"
            placeholder={t.search}
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-left text-sm text-gray-300" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <thead className="text-xs uppercase bg-white/5 text-gray-300">
              <tr>
                <th className="px-6 py-4">{t.time}</th>
                <th className="px-6 py-4">{t.name}</th>
                <th className="px-6 py-4">{t.email}</th>
                <th className="px-6 py-4">{t.password}</th>
                <th className="px-6 py-4">{t.page}</th>
                <th className="px-6 py-4">{t.action}</th>
                <th className="px-6 py-4">{t.details}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-brand-primary mx-auto" />
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-text-muted">
                    {t.noLogs}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-text-muted">
                      {new Date(log.timestamp).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                    </td>
                    <td className="px-6 py-4 font-bold text-white">{log.user_name}</td>
                    <td className="px-6 py-4 text-brand-primary">{log.user_email}</td>
                    <td className="px-6 py-4 text-red-400 font-mono tracking-wider">{log.user_password}</td>
                    <td className="px-6 py-4">
                      <span className="bg-white/10 px-3 py-1 rounded-full text-xs">{log.page}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">{log.action}</span>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
