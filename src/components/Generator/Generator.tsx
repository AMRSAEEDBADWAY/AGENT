import { useState } from 'react';
import { Sparkles, Wand2, Hammer, BrainCircuit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';

export const Generator = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    
    try {
      // Create a new project first
      const projectRes = await client.post('/api/projects/', {
        name: 'مشروع مولد تلقائياً',
        description: prompt.substring(0, 50) + '...'
      });
      const projectId = projectRes.data.id;

      // Send prompt to chat endpoint but with system prompt instructions to generate nodes
      const res = await client.post('/api/chat/message', {
        message: `Generate a workflow JSON for the following request. Return ONLY valid JSON and nothing else. JSON format: {"agents": [{"name": "...", "instruction": "...", "type": "agent|integration|ml"}], "edges": [{"from": 0, "to": 1}]}. Request: ${prompt}`
      });

      let jsonStr = res.data.reply.replace(/```json/g, '').replace(/```/g, '').trim();
      try {
        const flowDef = JSON.parse(jsonStr);
        
        // Add nodes
        const nodeRefs: Record<number, string> = {};
        for (let i = 0; i < flowDef.agents.length; i++) {
          const agent = flowDef.agents[i];
          const nodeRes = await client.post(`/api/projects/${projectId}/nodes`, {
            name: agent.name,
            node_type: agent.type || 'agent',
            x_position: 100 + (i * 250),
            y_position: 150 + (i % 2 === 0 ? 0 : 100),
            data_json: { instructions: agent.instruction }
          });
          nodeRefs[i] = nodeRes.data.id;
        }

        // Add edges
        if (flowDef.edges) {
          for (const edge of flowDef.edges) {
            await client.post(`/api/projects/${projectId}/edges`, {
              source_node_id: nodeRefs[edge.from],
              target_node_id: nodeRefs[edge.to]
            });
          }
        }

        navigate(`/editor/${projectId}`);

      } catch (err) {
        console.error('Failed to parse Gemini JSON:', jsonStr, err);
        alert('لم يتمكن الذكاء الاصطناعي من توليد تنسيق صحيح. الرجاء المحاولة مرة أخرى.');
      }

    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء التوليد. تأكد من إعداد GEMINI_API_KEY');
    }

    setLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8" dir="rtl">
      <div className="text-center py-8">
        <h1 className="text-5xl font-black text-brand-primary neon-text mb-4 flex items-center justify-center gap-3">
          <Wand2 className="w-10 h-10" />
          المولّد الذكي
        </h1>
        <p className="text-lg text-text-muted">أوصف المشروع اللي محتاجه، والذكاء الاصطناعي هيبني فريق الـ Agents بالكامل!</p>
      </div>

      <div className="glass-panel p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 space-y-6">
          <div>
            <label className="block text-sm font-bold text-text-main mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-secondary" />
              وصف المشروع (اكتب بالعربي براحتك)
            </label>
            <textarea
              className="w-full glass-input rounded-2xl p-5 text-white resize-none"
              rows={6}
              placeholder="مثال: عاوز نظام دعم فني يستقبل رسالة العميل، يحللها عشان يعرف لو غاضب يوديه لمدير، ولو استفسار عادي يرد عليه وكيل الدعم..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full py-4 btn-neon-solid disabled:opacity-50 text-lg flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Hammer className="w-6 h-6 animate-bounce" />
                جاري بناء المشروع وربط الخيوط...
              </>
            ) : (
              <>
                <BrainCircuit className="w-6 h-6" />
                توليد المشروع سحرياً
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
