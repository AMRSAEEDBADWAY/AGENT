import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, AlignLeft, Activity } from 'lucide-react';
import client from '../../api/client';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

export const Chat = () => {
  const { id: initialProjectId } = useParams();
  const navigate = useNavigate();
  const [projectId, setProjectId] = useState(initialProjectId || '');
  const [projects, setProjects] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (projectId) {
      loadHistory();
      navigate(`/chat/${projectId}`, { replace: true });
    } else {
      setMessages([]);
    }
  }, [projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadProjects = async () => {
    try {
      const res = await client.get('/api/projects/');
      setProjects(res.data);
      if (!projectId && res.data.length > 0) {
        setProjectId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadHistory = async () => {
    if (!projectId) return;
    try {
      const res = await client.get(`/api/chat/history/${projectId}`);
      const hist = [];
      for (const msg of res.data) {
        hist.push({ role: 'user', text: msg.user_message });
        hist.push({ role: 'agent', text: msg.agent_reply });
      }
      setMessages(hist);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !projectId) return;

    const userText = input;
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInput('');
    setLoading(true);

    try {
      // First try to run the full workflow if requested, else just chat
      // For now, we hit the generic chat endpoint with the project ID
      const res = await client.post('/api/chat/message', {
        message: userText,
        project_id: projectId
      });
      setMessages(prev => [...prev, { role: 'agent', text: res.data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'agent', text: 'عذراً، حدث خطأ أثناء الاتصال بالخادم.' }]);
    }

    setLoading(false);
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] glass-panel rounded-[2rem] overflow-hidden shadow-2xl relative z-10" dir="rtl">
      
      {/* Sidebar: Projects Sidebar */}
      <div className="w-80 border-l border-brand-primary/10 flex flex-col bg-bg-card/30">
        <div className="p-6 border-b border-brand-primary/10 bg-brand-primary/5">
          <h2 className="text-xl font-bold flex items-center gap-3 text-white">
            <AlignLeft className="text-brand-primary" />
            المحادثات
          </h2>
          <p className="text-sm text-text-muted mt-2">اختر المشروع للتحدث مع الوكلاء الخاصين به</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => setProjectId(p.id)}
              className={`w-full text-right p-4 rounded-xl transition-all duration-300 border flex items-center gap-3 ${
                projectId === p.id 
                  ? 'bg-brand-primary/10 border-brand-primary/50 text-brand-primary shadow-[0_0_10px_rgba(26,255,162,0.1)]' 
                  : 'border-transparent text-text-muted hover:bg-white/5 hover:text-white'
              }`}
            >
              <Activity size={18} className={projectId === p.id ? 'animate-pulse' : ''} />
              <div className="font-bold truncate">{p.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        {projectId && (
          <div className="h-16 border-b border-brand-primary/10 flex items-center px-6 backdrop-blur-md sticky top-0 z-10 bg-brand-primary/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white shadow-lg shadow-brand-primary/30">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white leading-tight">وكلاء المشروع</h3>
                <div className="text-xs text-text-muted flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  متصل وجاهز للعمل
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {!projectId ? (
            <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50">
              <Bot size={64} className="mb-4" />
              <p className="text-lg">الرجاء اختيار مشروع من القائمة الجانبية لبدء المحادثة.</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50">
               <p>ابدأ المحادثة الآن! يمكنك إعطاء أوامر للوكلاء لتنفيذها.</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[70%] flex gap-4 ${msg.role === 'user' ? 'flex-row' : 'flex-row-reverse'}`}>
                  
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center shadow-[0_0_10px_rgba(26,255,162,0.2)] ${
                    msg.role === 'user' 
                      ? 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30' 
                      : 'bg-brand-primary text-[#020B18]'
                  }`}>
                    {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                  </div>

                  {/* Bubble */}
                  <div className={`p-4 rounded-[1.5rem] ${
                    msg.role === 'user' 
                      ? 'bg-brand-primary text-[#020B18] shadow-[0_0_15px_rgba(26,255,162,0.3)] rounded-tr-[4px]' 
                      : 'glass-panel text-white rounded-tl-[4px]'
                  }`}>
                     <div className={`prose max-w-none ${msg.role === 'user' ? 'text-[#020B18] prose-p:text-[#020B18]' : 'prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-brand-primary/20'}`}>
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                     </div>
                  </div>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-end">
              <div className="flex gap-4 flex-row-reverse">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white shadow-lg animate-pulse">
                  <Bot size={20} />
                </div>
                <div className="p-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-tl-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-primary animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-brand-primary animate-bounce delay-100" />
                  <span className="w-2 h-2 rounded-full bg-brand-primary animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t border-brand-primary/10">
          <div className="relative flex items-center">
            <textarea
              className="w-full bg-brand-primary/5 border border-brand-primary/20 backdrop-blur-md rounded-[2rem] py-4 pl-16 pr-6 text-white focus:border-brand-primary focus:shadow-[0_0_15px_rgba(26,255,162,0.2)] outline-none transition resize-none custom-scrollbar"
              rows={2}
              placeholder="اكتب رسالتك للمساعد الذكي..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={!projectId || loading}
            />
            <button
              onClick={handleSend}
              disabled={!projectId || loading || !input.trim()}
              className="absolute left-4 p-3 bg-brand-primary hover:bg-brand-primary/80 disabled:opacity-50 text-[#020B18] rounded-full transition shadow-[0_0_15px_rgba(26,255,162,0.3)] block top-1/2 -translate-y-1/2"
            >
              <Send size={20} className={document.dir === 'rtl' ? 'rotate-180 text-[#020B18]' : 'text-[#020B18]'} />
            </button>
          </div>
          <div className="text-center mt-3 text-xs text-text-muted">
            Shift + Enter لسطر جديد. Enter للإرسال.
          </div>
        </div>

      </div>
    </div>
  );
};
