import { useState, useEffect } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Cpu, Network, Bot, Folders } from 'lucide-react';
import client from '../../api/client';
import { useApp } from '../../context/AppContext';

const COLORS = ['#1AFFA2', '#22D3EE', '#FBBF24', '#F87171', '#8B5CF6', '#EC4899'];

export const Analytics = () => {
  const { lang } = useApp();
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    client.get('/api/projects/').then(r => setProjects(r.data)).catch(() => {});
  }, []);

  // ── Derive real stats from projects data ──
  const projectCount = projects.length;
  const totalNodes = projects.reduce((acc, p) => acc + (Array.isArray(p.nodes) ? p.nodes.length : 0), 0);
  const totalEdges = projects.reduce((acc, p) => acc + (Array.isArray(p.edges) ? p.edges.length : 0), 0);

  // Count node types from all projects
  const nodeTypeCount: Record<string, number> = {};
  projects.forEach(p => {
    if (Array.isArray(p.nodes)) {
      p.nodes.forEach((n: any) => {
        const type = n.data_json?.type || n.type || 'agent';
        nodeTypeCount[type] = (nodeTypeCount[type] || 0) + 1;
      });
    }
  });

  // Node type distribution for Pie chart
  const typeLabels: Record<string, string> = {
    agent: lang === 'ar' ? 'وكيل ذكي' : 'AI Agent',
    integration: lang === 'ar' ? 'تكامل' : 'Integration',
    ml: lang === 'ar' ? 'تعلم آلي' : 'ML Model',
    mcp: 'MCP',
    tool: lang === 'ar' ? 'أداة' : 'Tool',
  };

  const usageData = Object.entries(nodeTypeCount).map(([type, count]) => ({
    name: typeLabels[type] || type,
    value: count,
  }));

  // Projects timeline (sorted by creation date)
  const projectTimeline = projects
    .filter(p => p.created_at)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((p, i) => ({
      name: p.name?.substring(0, 12) || `#${i + 1}`,
      nodes: Array.isArray(p.nodes) ? p.nodes.length : 0,
      edges: Array.isArray(p.edges) ? p.edges.length : 0,
    }));

  const stats = [
    { label: lang === 'ar' ? 'إجمالي المشاريع' : 'Total Projects', value: projectCount, icon: Folders, color: 'text-brand-primary' },
    { label: lang === 'ar' ? 'عدد الوكلاء' : 'Total Agents', value: totalNodes, icon: Bot, color: 'text-[#22D3EE]' },
    { label: lang === 'ar' ? 'عدد الروابط' : 'Total Edges', value: totalEdges, icon: Network, color: 'text-[#FBBF24]' },
    { label: lang === 'ar' ? 'أنواع العقد' : 'Node Types', value: Object.keys(nodeTypeCount).length, icon: Cpu, color: 'text-[#EC4899]' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="text-center py-6 animation-fade-in-up">
        <h1 className="text-5xl font-black text-brand-primary neon-text mb-4">
          {lang === 'ar' ? '📈 لوحة الإحصائيات' : '📈 Analytics Dashboard'}
        </h1>
        <p className="text-text-muted font-light text-lg">
          {lang === 'ar' ? 'نظرة شاملة على مشاريعك ووكلائك' : 'Overview of your projects and agents'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="glass-card rounded-[2rem] p-6 flex items-center gap-4">
            <div className={`w-16 h-16 rounded-[1.5rem] bg-[#020B18]/50 border border-current shadow-[0_0_15px_currentColor] flex items-center justify-center opacity-80 ${s.color}`}>
              <s.icon size={30} />
            </div>
            <div>
              <p className="text-text-muted text-sm mb-1">{s.label}</p>
              <h3 className="text-3xl font-black text-white leading-none">{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects Comparison Chart */}
        <div className="lg:col-span-2 glass-card rounded-[2rem] p-6">
          <h3 className="text-lg font-bold text-brand-primary neon-text mb-6">
            {lang === 'ar' ? '📊 مقارنة المشاريع (عقد / روابط)' : '📊 Projects Comparison (Nodes / Edges)'}
          </h3>
          {projectTimeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                <XAxis dataKey="name" stroke="#888ea8" fontSize={11} />
                <YAxis stroke="#888ea8" fontSize={12} />
                <Tooltip contentStyle={{ background: '#131313', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                <Bar dataKey="nodes" fill="#1AFFA2" radius={[8, 8, 0, 0]} name={lang === 'ar' ? 'عقد' : 'Nodes'} />
                <Bar dataKey="edges" fill="#22D3EE" radius={[8, 8, 0, 0]} name={lang === 'ar' ? 'روابط' : 'Edges'} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-text-muted opacity-50">
              <p>{lang === 'ar' ? 'أنشئ مشاريع لرؤية الإحصائيات' : 'Create projects to see analytics'}</p>
            </div>
          )}
        </div>

        {/* Node Type Pie */}
        <div className="glass-card rounded-[2rem] p-6">
          <h3 className="text-lg font-bold text-brand-primary neon-text mb-6">
            {lang === 'ar' ? '🥧 توزيع أنواع العقد' : '🥧 Node Type Distribution'}
          </h3>
          {usageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={usageData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} dataKey="value" labelLine={false}
                  label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                  {usageData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#131313', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-text-muted opacity-50">
              <p>{lang === 'ar' ? 'لا توجد بيانات بعد' : 'No data yet'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Projects Table */}
      {projects.length > 0 && (
        <div className="glass-card rounded-[2rem] p-6 overflow-hidden">
          <h3 className="text-lg font-bold text-brand-primary neon-text mb-6">
            {lang === 'ar' ? '📋 تفاصيل المشاريع' : '📋 Projects Details'}
          </h3>
          <div className="overflow-x-auto rounded-xl border border-brand-primary/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5">
                  <th className="px-4 py-3 text-text-muted font-bold text-right">{lang === 'ar' ? 'المشروع' : 'Project'}</th>
                  <th className="px-4 py-3 text-text-muted font-bold text-center">{lang === 'ar' ? 'عقد' : 'Nodes'}</th>
                  <th className="px-4 py-3 text-text-muted font-bold text-center">{lang === 'ar' ? 'روابط' : 'Edges'}</th>
                  <th className="px-4 py-3 text-text-muted font-bold text-right">{lang === 'ar' ? 'تاريخ الإنشاء' : 'Created'}</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p, i) => (
                  <tr key={p.id || i} className="border-t border-white/5 hover:bg-white/5 transition">
                    <td className="px-4 py-3 text-white font-medium">{p.name || `Project ${i + 1}`}</td>
                    <td className="px-4 py-3 text-brand-primary text-center font-bold">{Array.isArray(p.nodes) ? p.nodes.length : 0}</td>
                    <td className="px-4 py-3 text-[#22D3EE] text-center font-bold">{Array.isArray(p.edges) ? p.edges.length : 0}</td>
                    <td className="px-4 py-3 text-text-muted">{p.created_at ? new Date(p.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
