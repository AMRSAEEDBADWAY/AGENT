import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowLeft, Search } from 'lucide-react';
import client from '../../api/client';

const TEMPLATES = [
  { id: 'customer_support', icon: '🎧', name: 'دعم العملاء الذكي', nameEn: 'Smart Customer Support', desc: 'نظام دعم فني متكامل: استقبال، تحليل مشاعر، توجيه', agents: 3, category: 'business' },
  { id: 'data_pipeline', icon: '🔄', name: 'خط أنابيب البيانات', nameEn: 'Data Pipeline', desc: 'قراءة CSV، تنظيف، تحليل إحصائي، تقرير', agents: 4, category: 'data' },
  { id: 'content_team', icon: '✍️', name: 'فريق كتابة المحتوى', nameEn: 'Content Writing Team', desc: 'باحث + كاتب + مراجع + منسق', agents: 4, category: 'content' },
  { id: 'ml_auto', icon: '🧠', name: 'تدريب نموذج تلقائي', nameEn: 'Auto ML Training', desc: 'رفع بيانات → اختيار أفضل خوارزمية → تدريب → تقرير', agents: 3, category: 'ml' },
  { id: 'research', icon: '🔍', name: 'فريق البحث والتحليل', nameEn: 'Research & Analysis', desc: 'جمع معلومات، تحليل، تلخيص، استخلاص نتائج', agents: 3, category: 'research' },
  { id: 'chatbot', icon: '🤖', name: 'شات بوت ذكي', nameEn: 'Smart Chatbot', desc: 'بوت محادثة ذكي يرد على العملاء بلغة طبيعية', agents: 2, category: 'business' },
  { id: 'security', icon: '🛡️', name: 'تحليل أمني', nameEn: 'Security Analysis', desc: 'فحص النصوص والبيانات بحثاً عن محتوى ضار', agents: 2, category: 'security' },
  { id: 'translator', icon: '🌐', name: 'مترجم متعدد اللغات', nameEn: 'Multi-Language Translator', desc: 'ترجمة ذكية من وإلى العربية والإنجليزية', agents: 2, category: 'content' },
];

export const Templates = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState('');

  const filtered = TEMPLATES.filter(t => 
    t.name.includes(search) || t.nameEn.toLowerCase().includes(search.toLowerCase()) || t.desc.includes(search)
  );

  const getTemplateData = (tpl: typeof TEMPLATES[0]) => {
    if (tpl.id === 'customer_support') {
      return {
        nodes: [
          { id: 'node-1', name: 'محلل الطلبات', type: 'agent', x_position: 100, y_position: 150, data_json: { name: 'محلل الطلبات', type: 'agent', instructions: 'أنت وكيل دعم أولي. افهم طلب العميل وصنفه إلى (تقني، مالي) ثم مرره للوكيل المختص.' } },
          { id: 'node-2', name: 'الدعم الفني', type: 'agent', x_position: 450, y_position: 50, data_json: { name: 'الدعم الفني', type: 'agent', instructions: 'أنت مهندس دعم تقني. قدّم حلولاً للمشاكل البرمجية والتقنية بخطوات واضحة.' } },
          { id: 'node-3', name: 'قسم الحسابات', type: 'agent', x_position: 450, y_position: 250, data_json: { name: 'قسم الحسابات', type: 'agent', instructions: 'أنت مسؤول الحسابات. حلل أي طلبات استرداد أموال أو اشتراكات تعسرت.' } }
        ],
        edges: [
          { source_node_id: 'node-1', target_node_id: 'node-2' },
          { source_node_id: 'node-1', target_node_id: 'node-3' }
        ]
      };
    } else if (tpl.id === 'content_creation') {
      return {
        nodes: [
          { id: 'node-1', name: 'مخطط المحتوى', type: 'agent', x_position: 100, y_position: 150, data_json: { name: 'مخطط المحتوى', type: 'agent', instructions: 'أنت مدير تسويق. استلم الفكرة، واقترح 3 عناوين قوية بالإضافة إلى هيكل مبدئي للمقال الثقافي.' } },
          { id: 'node-2', name: 'الكاتب الإبداعي', type: 'agent', x_position: 400, y_position: 150, data_json: { name: 'الكاتب الإبداعي', type: 'agent', instructions: 'أنت كاتب وصحفي محترف. خذ هيكل المقال واكتب موضوعاً شيقاً متكاملاً لا يقل عن 500 كلمة.' } }
        ],
        edges: [
          { source_node_id: 'node-1', target_node_id: 'node-2' }
        ]
      };
    } else if (tpl.id === 'code_review') {
      return {
        nodes: [
          { id: 'node-1', name: 'محلل جودة الكود', type: 'agent', x_position: 100, y_position: 150, data_json: { name: 'محلل الشفرة', type: 'agent', instructions: 'أنت مهندس برمجيات خبير. راجع الكود واكتشف أي Bugs أو مشاكل في الأداء والثغرات الأمنية.' } },
          { id: 'node-2', name: 'مصمم الحلول', type: 'agent', x_position: 400, y_position: 150, data_json: { name: 'مصمم الحلول', type: 'agent', instructions: 'أنت مهندس معماريات (Architect). بناءً على التحليل السابق، أعط الكود الصحيح والنهائي بعد تنظيفه وإصلاحه.' } }
        ],
        edges: [
          { source_node_id: 'node-1', target_node_id: 'node-2' }
        ]
      };
    }
    
    // Fallback default agents
    const nodes = Array.from({ length: tpl.agents }).map((_, i) => ({
      id: `node-${i}`,
      name: `وكيل ${i + 1} (${tpl.name})`,
      type: 'agent',
      x_position: 100 + i * 250,
      y_position: 150 + (i % 2 === 0 ? 0 : 50),
      data_json: { name: `وكيل ${i + 1}`, type: 'agent', instructions: 'أنت مساعد ذكاء اصطناعي مفيد يلبي كل ما يُطلب منه ضمن هذا التخصص.' }
    }));
    const edges = Array.from({ length: tpl.agents - 1 }).map((_, i) => ({
      source_node_id: `node-${i}`,
      target_node_id: `node-${i+1}`
    }));
    return { nodes, edges };
  };

  const handleUse = async (tpl: typeof TEMPLATES[0]) => {
    setLoading(tpl.id);
    try {
      const { nodes, edges } = getTemplateData(tpl);
      const res = await client.post('/api/projects/import', { 
        name: tpl.name, 
        description: tpl.desc,
        nodes,
        edges
      });
      navigate(`/editor/${res.data.id}`);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إنشاء المشروع');
    }
    setLoading('');
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8" dir="rtl">
      <div className="text-center py-6">
        <h1 className="text-5xl font-black text-brand-primary neon-text mb-4">
          📋 قوالب جاهزة
        </h1>
        <p className="text-text-muted text-lg font-light">اختر قالب واحد وابدأ مشروعك فوراً — كل شيء جاهز!</p>
      </div>

      {/* Search */}
      <div className="relative max-w-lg mx-auto">
        <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-brand-primary" size={20} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ابحث عن قالب..."
          className="w-full glass-input py-4 pr-12 pl-4 text-white focus:ring-2 focus:ring-brand-primary outline-none transition"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map(tpl => (
          <div key={tpl.id} className="glass-card rounded-[2rem] p-6 group hover:border-brand-primary/40 transition-all duration-300 hover:-translate-y-2 flex flex-col shadow-[0_0_15px_rgba(26,255,162,0.05)] hover:shadow-[0_0_25px_rgba(26,255,162,0.15)]">
            <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-3xl mb-5 border border-brand-primary/30 shadow-[0_0_15px_rgba(26,255,162,0.1)] group-hover:scale-110 transition-transform">
              {tpl.icon}
            </div>
            <h3 className="text-xl font-bold text-brand-primary neon-text mb-2">{tpl.name}</h3>
            <p className="text-text-muted text-sm flex-1 leading-relaxed mb-4">{tpl.desc}</p>
            <div className="flex items-center gap-4 text-xs text-text-muted mb-4">
              <span className="flex items-center gap-1"><Users size={12} /> {tpl.agents} وكلاء</span>
            </div>
            <button
              onClick={() => handleUse(tpl)}
              disabled={loading === tpl.id}
              className="w-full py-3 btn-neon font-bold text-sm flex items-center justify-center gap-2 mt-auto"
            >
              {loading === tpl.id ? 'جاري الإنشاء...' : 'استخدام القالب'}
              <ArrowLeft size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
