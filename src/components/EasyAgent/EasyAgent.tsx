import { useState } from 'react';
import { Sparkles, BrainCircuit, PenTool, Search, Bot, UploadCloud } from 'lucide-react';
import client from '../../api/client';
import ReactMarkdown from 'react-markdown';

export const EasyAgent = () => {
  const [selectedTask, setSelectedTask] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  
  const tasks = [
    { id: 'data', icon: <UploadCloud />, title: 'تحليل بيانات', desc: 'ارفع ملف وهحلّلهولك' },
    { id: 'ml', icon: <BrainCircuit />, title: 'تدريب ML', desc: 'درّب نموذج ذكاء اصطناعي' },
    { id: 'write', icon: <PenTool />, title: 'كتابة محتوى', desc: 'هكتبلك أي محتوى تحتاجه' },
    { id: 'search', icon: <Search />, title: 'بحث وتحليل', desc: 'هبحثلك عن أي موضوع' },
    { id: 'team', icon: <Bot />, title: 'بناء فريق AI', desc: 'هبنيلك فريق روبوتات' },
  ];

  const handleRun = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult('');
    
    try {
      const res = await client.post('/api/chat/message', {
        message: `Task Type: ${selectedTask || 'General'}\n\nUser Request: ${input}\n\nAct as a highly intelligent assistant responding in clear Arabic markdown.`
      });
      setResult(res.data.reply);
    } catch (err) {
      console.error(err);
      setResult('حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.');
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10" dir="rtl">
      
      <div className="text-center">
        <h1 className="text-5xl font-black text-brand-primary neon-text mb-4 inline-block">
          🪄 المساعد الذكي
        </h1>
        <p className="text-lg text-text-muted">اكتب اللي عايزه بأي طريقة — وسيبني أشتغل!</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {tasks.map(t => (
          <div 
            key={t.id}
            onClick={() => setSelectedTask(t.title)}
            className={`cursor-pointer p-4 rounded-[1.5rem] border transition-all flex flex-col items-center text-center gap-3
              ${selectedTask === t.title 
                ? 'bg-brand-primary/10 border-brand-primary shadow-[0_0_15px_rgba(26,255,162,0.2)] scale-105' 
                : 'glass-card hover:-translate-y-1'}`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedTask === t.title ? 'bg-brand-primary shadow-[0_0_15px_rgba(26,255,162,0.4)] text-[#020B18]' : 'bg-brand-primary/5 text-brand-primary'}`}>
              {t.icon}
            </div>
            <div>
              <h3 className={`font-bold text-sm ${selectedTask === t.title ? 'text-brand-primary' : 'text-white'}`}>{t.title}</h3>
              <p className="text-xs text-text-muted mt-1">{t.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <textarea
          className="w-full bg-brand-primary/5 border border-brand-primary/20 backdrop-blur-md rounded-[2rem] p-6 text-white text-lg focus:border-brand-primary focus:shadow-[0_0_15px_rgba(26,255,162,0.2)] outline-none transition resize-none shadow-inner"
          rows={4}
          placeholder="إيه اللي عايزني أعمله لك النهاردة؟"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        
        <button
          onClick={handleRun}
          disabled={loading || !input.trim()}
          className="w-full md:w-1/3 mx-auto flex items-center justify-center py-4 btn-neon-solid disabled:opacity-50 text-lg shadow-[0_0_20px_rgba(26,255,162,0.3)]"
        >
          {loading ? 'جاري المعالجة والتفكير...' : '🚀 شغّلني!'}
        </button>
      </div>

      {result && (
        <div className="glass-panel p-8 rounded-[2rem] shadow-[0_0_30px_rgba(26,255,162,0.1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-brand-primary shadow-[0_0_20px_rgba(26,255,162,0.5)]" />
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Sparkles className="text-brand-primary" />
            النتيجة
          </h2>
          <div className="prose prose-invert prose-p:text-text-muted max-w-none">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </div>
      )}

    </div>
  );
};
