import { useState, useEffect } from 'react';
import { Network, BrainCircuit, Bot, Folders, Plus, Trash2, ArrowLeft, Download, UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import toast from 'react-hot-toast';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await client.get('/api/projects/');
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    const name = prompt('اسم المشروع الجديد:');
    if (!name) return;
    try {
      const res = await client.post('/api/projects/', { name });
      navigate(`/editor/${res.data.id}`);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إنشاء المشروع');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('هل أنت متأكد من حذف هذا المشروع نهائياً؟')) return;
    try {
      await client.delete(`/api/projects/${id}`);
      toast.success('تم حذف المشروع');
      loadProjects();
    } catch (err) {
      toast.error('فشل الحذف');
    }
  };

  const handleExportProject = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await client.get(`/api/projects/${id}/export`);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `project_${name}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      toast.success('تم التصدير بنجاح');
    } catch (err) {
      toast.error('فشل التصدير');
    }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event: any) => {
        try {
          const projectData = JSON.parse(event.target.result);
          const res = await client.post('/api/projects/import', projectData);
          toast.success('تم الاستيراد بنجاح!');
          navigate(`/editor/${res.data.id}`);
        } catch (err) {
          toast.error('فشل الاستيراد - تأكد من ملف JSON');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const stats = [
    { label: 'مشاريع نشطة', value: projects.length, icon: Folders, color: 'text-brand-primary' },
    { label: 'وكلاء ذكاء اصطناعي', value: projects.reduce((acc: number, p: any) => acc + (Array.isArray(p.nodes) ? p.nodes.length : 0), 0), icon: Bot, color: 'text-[#22D3EE]' },
    { label: 'مترابطات (Edges)', value: projects.reduce((acc: number, p: any) => acc + (Array.isArray(p.edges) ? p.edges.length : 0), 0), icon: Network, color: 'text-[#FBBF24]' },
    { label: 'نماذج مدربة', value: projects.reduce((acc: number, p: any) => acc + (Array.isArray(p.nodes) ? p.nodes.filter((n: any) => n.type === 'ml' || n.data_json?.type === 'ml').length : 0), 0) || '—', icon: BrainCircuit, color: 'text-[#38BDF8]' },
  ];

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="text-center py-10 animation-fade-in-up">
        <h1 className="text-5xl font-black text-brand-primary neon-text mb-4 tracking-tight">
          مرحباً بك في BaseerFlow
        </h1>
        <p className="text-text-muted text-lg max-w-2xl mx-auto font-light">
          صمم، درب، وأطلق وكلاء الذكاء الاصطناعي بسهولة فائقة بدون كتابة سطر كود واحد.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card rounded-[2rem] p-6 relative overflow-hidden group transition duration-300">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-current opacity-10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 ${stat.color}`} />
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-text-muted text-sm font-semibold mb-2">{stat.label}</p>
                <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
              </div>
              <div className={`w-14 h-14 rounded-2xl bg-[#020B18]/50 border border-current flex items-center justify-center shadow-[0_0_15px_currentColor] opacity-80 ${stat.color}`}>
                <stat.icon size={26} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Projects */}
      <div className="pt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Folders className="text-brand-primary" size={24} />
            مشاريعك الحالية
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={handleImport}
              className="flex items-center gap-2 btn-neon px-5 py-2.5"
            >
              <UploadCloud size={18} />
              استيراد
            </button>
            <button 
              onClick={handleCreateProject}
              className="flex items-center gap-2 btn-neon-solid px-6 py-3"
            >
              <Plus size={18} />
              مشروع جديد
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-text-muted">جاري تحميل المشاريع...</div>
        ) : projects.length === 0 ? (
          <div className="glass-panel border-dashed border-brand-primary/20 rounded-[2rem] p-16 text-center text-text-muted flex flex-col items-center justify-center gap-4">
            <Bot size={48} className="opacity-50" />
            <p>لا توجد مشاريع حتى الآن.</p>
            <button onClick={handleCreateProject} className="text-brand-primary hover:underline font-bold mt-2">أنشئ مشروعك الأول</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((p: any) => (
               <div 
                  key={p.id}
                  onClick={() => navigate(`/editor/${p.id}`)}
                  className="glass-card rounded-[2rem] p-6 cursor-pointer group hover:-translate-y-1 transition-all duration-300 relative"
               >
                  <div className="absolute top-4 left-4 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button 
                      onClick={(e) => handleExportProject(p.id, p.name, e)}
                      className="p-2 text-text-muted hover:text-brand-primary rounded-lg hover:bg-brand-primary/10"
                      title="تصدير (JSON)"
                    >
                      <Download size={16} />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(p.id, e)}
                      className="p-2 text-text-muted hover:text-red-400 rounded-lg hover:bg-red-400/10"
                      title="حذف المشروع"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-5 border border-brand-primary/30 shadow-[0_0_15px_rgba(26,255,162,0.15)] group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(26,255,162,0.3)] transition duration-300">
                    <Network size={26} className="neon-text" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{p.name || 'بدون اسم'}</h3>
                  <p className="text-text-muted text-sm line-clamp-2">{p.description || 'لا يوجد وصف للمشروع'}</p>
                  
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-text-muted">
                    <span>آخر تعديل: {new Date(p.updated_at).toLocaleDateString('ar-EG')}</span>
                    <span className="flex items-center gap-1 group-hover:text-brand-primary transition">
                      فتح <ArrowLeft size={12} />
                    </span>
                  </div>
               </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
